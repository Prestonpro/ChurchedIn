"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
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
  if (!user.emailVerified) {
    return { error: "Verify your email before contacting mentors." };
  }
  if (user.activeMembership?.role !== ROLES.STUDENT) {
    return { error: "Only students can send mentor connection requests." };
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
    return { error: "That mentor isn't available right now." };
  }
  const sharesChurch = mentorProfile.user.memberships.some((mm) =>
    user.memberships.some((um) => um.churchId === mm.churchId),
  );
  if (!sharesChurch) {
    return { error: "You can only connect with mentors at a church you belong to." };
  }
  if (await isBlockedPair(user.id, mentorId)) {
    return { error: "You can't connect with this mentor." };
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
      return { error: "You already have a pending request with this mentor." };
    }
    if (existing.status === CONNECTION_STATUS.ACCEPTED) {
      return { error: "You're already connected with this mentor." };
    }
    if (existing.status === CONNECTION_STATUS.ENDED) {
      return {
        error: "This connection has ended and can't be restarted. Contact your church admin if you'd like to reconnect.",
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

  await sendEmail({
    to: mentorProfile.user.email,
    subject: `${user.name} wants to connect`,
    body: `${user.name} sent you a mentorship connection request${
      message ? `:\n\n"${message}"` : "."
    }\n\nReview it from your dashboard.`,
  });

  revalidatePath("/student/mentors");
  revalidatePath("/volunteer/dashboard");
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
    return { error: "Only the mentor can respond to this request." };
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
    await Promise.all([
      sendEmail({
        to: connection.student.email,
        subject: `${connection.mentor.name} accepted your request`,
        body: `${connection.mentor.name} accepted your mentorship request. You can reach them at ${connection.mentor.email}.`,
      }),
      sendEmail({
        to: connection.mentor.email,
        subject: `You're connected with ${connection.student.name}`,
        body: `You accepted ${connection.student.name}'s request. You can reach them at ${connection.student.email}.`,
      }),
    ]);
  } else {
    await sendEmail({
      to: connection.student.email,
      subject: `Update on your mentor request`,
      body: `${connection.mentor.name} isn't able to connect right now.`,
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
  await sendEmail({
    to: other.email,
    subject: "A connection was ended",
    body: `${user.name} ended your mentorship connection.`,
  });

  revalidatePath("/volunteer/dashboard");
  revalidatePath("/student/mentors");
}
