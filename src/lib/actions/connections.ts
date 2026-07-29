"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  connectionRequestedEmail,
  connectionAcceptedForStudentEmail,
  connectionAcceptedForMentorEmail,
  connectionDeclinedEmail,
  connectionEndedEmail,
} from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import {
  nextConnectionStatus,
  InvalidConnectionTransitionError,
} from "@/lib/connectionState";
import { ROLES, CONNECTION_STATUS, MAX_CONNECTION_REQUESTS_PER_DAY } from "@/lib/constants";
import { connectionRequestSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | void;

export async function requestConnectionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.activeMembership?.role !== ROLES.STUDENT) {
    return { error: "Only students can reach out to friends." };
  }

  const parsed = connectionRequestSchema.safeParse({
    mentorId: formData.get("mentorId"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { mentorId, message } = parsed.data;

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorId },
    include: { user: { include: { memberships: true } } },
  });
  if (!mentorProfile || !mentorProfile.openToMentor) {
    return { error: "That friend isn't available right now." };
  }
  const sharesChurch = mentorProfile.user.memberships.some((mm) =>
    user.memberships.some((um) => um.churchId === mm.churchId),
  );
  if (!sharesChurch) {
    return { error: "You can only connect with friends at a church you belong to." };
  }
  if (await isBlockedPair(user.id, mentorId)) {
    return { error: "You can't connect with this friend." };
  }

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const recentRequestCount = await prisma.mentorConnection.count({
    where: { studentId: user.id, lastRequestedAt: { gte: since } },
  });
  if (recentRequestCount >= MAX_CONNECTION_REQUESTS_PER_DAY) {
    return { error: "You've reached the daily limit for connection requests. Try again tomorrow." };
  }

  const existing = await prisma.mentorConnection.findUnique({
    where: { studentId_mentorId: { studentId: user.id, mentorId } },
  });

  if (existing) {
    if (existing.status === CONNECTION_STATUS.PENDING) {
      return { error: "You already have a pending request with this friend." };
    }
    if (existing.status === CONNECTION_STATUS.ACCEPTED) {
      return { error: "You're already connected with this friend." };
    }
    if (existing.status === CONNECTION_STATUS.ENDED) {
      return {
        error: "This connection has ended and can't be restarted. Contact your church leader if you'd like to reconnect.",
      };
    }
    try {
      nextConnectionStatus(existing.status as never, "RE_REQUEST");
    } catch (err) {
      if (err instanceof InvalidConnectionTransitionError) {
        return { error: err.message };
      }
      throw err;
    }
    await prisma.mentorConnection.update({
      where: { id: existing.id },
      data: {
        status: CONNECTION_STATUS.PENDING,
        message: message || null,
        lastRequestedAt: new Date(),
        respondedAt: null,
      },
    });
  } else {
    await prisma.mentorConnection.create({
      data: {
        studentId: user.id,
        mentorId,
        message: message || null,
      },
    });
  }

  const requestEmail = connectionRequestedEmail({ studentName: user.name, message });
  await sendEmail({
    to: mentorProfile.user.email,
    subject: requestEmail.subject,
    body: requestEmail.text,
    html: requestEmail.html,
  });

  revalidatePath("/student/mentors");
  revalidatePath("/volunteer/dashboard");
}

/** Withdraws a still-pending request before the other side has responded —
 * distinct from endConnectionAction (which only applies to an ACCEPTED
 * connection). Deletes the row outright rather than adding a new terminal
 * status, so the mentor's dashboard simply stops showing it, same as if
 * it had never been sent. */
export async function cancelConnectionRequestAction(connectionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const connection = await prisma.mentorConnection.findUnique({ where: { id: connectionId } });
  if (!connection) {
    return { error: "That request no longer exists." };
  }
  if (connection.studentId !== user.id) {
    return { error: "Only the person who sent the request can cancel it." };
  }
  if (connection.status !== CONNECTION_STATUS.PENDING) {
    return { error: "Only a pending request can be cancelled." };
  }

  await prisma.mentorConnection.delete({ where: { id: connectionId } });

  revalidatePath("/volunteer/dashboard");
  revalidatePath("/student/mentors");
}

async function requireConnectionParticipant(connectionId: string) {
  const user = await requireUser();
  const connection = await prisma.mentorConnection.findUnique({
    where: { id: connectionId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      mentor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!connection) {
    throw new Error("Connection not found.");
  }
  if (connection.studentId !== user.id && connection.mentorId !== user.id) {
    throw new Error("You don't have access to this connection.");
  }
  return { user, connection };
}

export async function respondToConnectionAction(
  connectionId: string,
  action: "ACCEPT" | "DECLINE",
): Promise<ActionResult> {
  const { user, connection } = await requireConnectionParticipant(connectionId);
  if (connection.mentorId !== user.id) {
    return { error: "Only the friend can respond to this request." };
  }

  let nextStatus;
  try {
    nextStatus = nextConnectionStatus(connection.status as never, action);
  } catch (err) {
    if (err instanceof InvalidConnectionTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.mentorConnection.update({
    where: { id: connectionId },
    data: { status: nextStatus, respondedAt: new Date() },
  });

  if (action === "ACCEPT") {
    // Contact info reveal happens only here — see the non-negotiable safety
    // rule in PLAN.md section 8. Do not surface either email anywhere else.
    const forStudent = connectionAcceptedForStudentEmail({
      mentorName: connection.mentor.name,
      mentorEmail: connection.mentor.email,
    });
    const forMentor = connectionAcceptedForMentorEmail({
      studentName: connection.student.name,
      studentEmail: connection.student.email,
    });
    await Promise.all([
      sendEmail({
        to: connection.student.email,
        subject: forStudent.subject,
        body: forStudent.text,
        html: forStudent.html,
      }),
      sendEmail({
        to: connection.mentor.email,
        subject: forMentor.subject,
        body: forMentor.text,
        html: forMentor.html,
      }),
    ]);
  } else {
    const declinedEmail = connectionDeclinedEmail({ mentorName: connection.mentor.name });
    await sendEmail({
      to: connection.student.email,
      subject: declinedEmail.subject,
      body: declinedEmail.text,
      html: declinedEmail.html,
    });
  }

  revalidatePath("/volunteer/dashboard");
  revalidatePath("/student/mentors");
}

export async function endConnectionAction(connectionId: string): Promise<ActionResult> {
  const { user, connection } = await requireConnectionParticipant(connectionId);

  let nextStatus;
  try {
    nextStatus = nextConnectionStatus(connection.status as never, "END");
  } catch (err) {
    if (err instanceof InvalidConnectionTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.mentorConnection.update({
    where: { id: connectionId },
    data: { status: nextStatus },
  });

  const other = connection.studentId === user.id ? connection.mentor : connection.student;
  const endedEmail = connectionEndedEmail({ otherName: user.name });
  await sendEmail({ to: other.email, subject: endedEmail.subject, body: endedEmail.text, html: endedEmail.html });

  revalidatePath("/volunteer/dashboard");
  revalidatePath("/student/mentors");
}
