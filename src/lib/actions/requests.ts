"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  requestMentorRequestedEmail,
  requestAcceptedForRequesterEmail,
  requestAcceptedForClaimerEmail,
  requestDeclinedEmail,
  requestCancelledEmail,
  requestClaimedForRequesterEmail,
  requestClaimedForClaimerEmail,
} from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import { nextRequestStatus, InvalidRequestTransitionError } from "@/lib/requestState";
import { ROLES, REQUEST_CATEGORY, REQUEST_STATUS, MAX_TARGETED_REQUESTS_PER_DAY } from "@/lib/constants";
import { helpRequestSchema, requestMentorSchema, meetingPlanSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | { ok: true } | void;

/**
 * All Requests surfaces. Mirrors rides.ts's revalidateRideSurfaces — every
 * create/claim/respond/complete/cancel touches all of these.
 */
function revalidateRequestSurfaces(): void {
  revalidatePath("/student/requests");
  revalidatePath("/volunteer/dashboard");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/requests");
}

/** Creates a blind, untargeted request (Furniture/Food/Housing/Other, and
 * Mentorship too if posted without picking someone) — OPEN, no claimerId,
 * any eligible church member can claim it later. Modeled on
 * createRideRequestAction: no email is sent here, since there's no specific
 * person yet to notify — see claimRequestAction for the contact reveal. */
export async function createRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership) {
    return { error: "Join a church before posting a request." };
  }

  const parsed = helpRequestSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { category, title, description } = parsed.data;

  await prisma.helpRequest.create({
    data: {
      category,
      title,
      description: description || null,
      status: REQUEST_STATUS.OPEN,
      churchId: user.activeMembership.churchId,
      requesterId: user.id,
    },
  });

  revalidateRequestSurfaces();
  return { ok: true };
}

/** The Mentorship directory's targeted pick — creates a PENDING request
 * aimed at a specific opted-in volunteer, awaiting their accept/decline.
 * Replaces requestConnectionAction. Rate-limited the same way mentor
 * connection requests were: MAX_TARGETED_REQUESTS_PER_DAY targeted picks
 * per rolling 24h window, since only this flow singles out a specific
 * person the way the old anti-harassment control was guarding against. */
export async function requestMentorAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (user.activeMembership?.role !== ROLES.STUDENT) {
    return { error: "Only students can reach out to mentors." };
  }

  const parsed = requestMentorSchema.safeParse({
    claimerId: formData.get("claimerId"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { claimerId, message } = parsed.data;

  const volunteer = await prisma.user.findUnique({
    where: { id: claimerId },
    include: { memberships: true },
  });
  if (!volunteer || !volunteer.openToMentorship) {
    return { error: "That mentor isn't available right now." };
  }
  const sharesChurch = volunteer.memberships.some((vm) =>
    user.memberships.some((um) => um.churchId === vm.churchId),
  );
  if (!sharesChurch) {
    return { error: "You can only connect with mentors at a church you belong to." };
  }
  if (await isBlockedPair(user.id, claimerId)) {
    return { error: "You can't connect with this mentor." };
  }

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const recentRequestCount = await prisma.helpRequest.count({
    where: {
      requesterId: user.id,
      category: REQUEST_CATEGORY.MENTORSHIP,
      status: REQUEST_STATUS.PENDING,
      createdAt: { gte: since },
    },
  });
  if (recentRequestCount >= MAX_TARGETED_REQUESTS_PER_DAY) {
    return { error: "You've reached the daily limit for mentor requests. Try again tomorrow." };
  }

  const existing = await prisma.helpRequest.findFirst({
    where: { requesterId: user.id, claimerId, category: REQUEST_CATEGORY.MENTORSHIP },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    if (existing.status === REQUEST_STATUS.PENDING) {
      return { error: "You already have a pending request with this mentor." };
    }
    if (existing.status === REQUEST_STATUS.CLAIMED) {
      return { error: "You're already connected with this mentor." };
    }
    // DECLINED/COMPLETED/CANCELLED are all terminal for that row — a
    // re-request creates a brand new HelpRequest rather than reviving the
    // old one, unlike the old MentorConnection's DECLINED -> PENDING
    // transition. See requestState.ts's doc comment.
  }

  await prisma.helpRequest.create({
    data: {
      category: REQUEST_CATEGORY.MENTORSHIP,
      title: "Mentorship",
      description: message || null,
      status: REQUEST_STATUS.PENDING,
      churchId: user.activeMembership.churchId,
      requesterId: user.id,
      claimerId,
    },
  });

  const requestEmail = requestMentorRequestedEmail({ requesterName: user.name, message });
  await sendEmail({
    to: volunteer.email,
    subject: requestEmail.subject,
    body: requestEmail.text,
    html: requestEmail.html,
  });

  revalidateRequestSurfaces();
  return { ok: true };
}

async function requireRequestParticipant(requestId: string) {
  const user = await requireUser();
  const request = await prisma.helpRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      claimer: { select: { id: true, name: true, email: true } },
    },
  });
  if (!request) {
    throw new Error("Request not found.");
  }
  return { user, request };
}

/** Claims an OPEN, untargeted request — any eligible church member can
 * claim any open request at their church; only reveals contact info to each
 * other once claimed (CLAUDE.md §1), same as rides. Modeled directly on
 * claimRideRequestAction, including its blocked-pair re-check. */
export async function claimRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request } = await requireRequestParticipant(requestId);
  if (!user.activeMembership) {
    return { error: "Join a church before claiming a request." };
  }
  if (request.churchId !== user.activeMembership.churchId) {
    return { error: "This request isn't at your church." };
  }
  if (request.requesterId === user.id) {
    return { error: "You can't claim your own request." };
  }
  // Claiming reveals both parties' email addresses to each other below, so a
  // blocked pair must never get here (safety rules 1 and 2) — same
  // server-side backstop claimRideRequestAction applies.
  if (await isBlockedPair(user.id, request.requesterId)) {
    return { error: "You can't claim this request." };
  }

  let nextStatus;
  try {
    nextStatus = nextRequestStatus(request.status, "CLAIM");
  } catch (err) {
    if (err instanceof InvalidRequestTransitionError) {
      return { error: "Someone already claimed this request." };
    }
    throw err;
  }

  await prisma.helpRequest.update({
    where: { id: requestId },
    data: { status: nextStatus, claimerId: user.id, respondedAt: new Date() },
  });

  // Contact info reveal happens only here — do not surface either email
  // anywhere else (see CLAUDE.md §1 and requestState.ts).
  const forRequester = requestClaimedForRequesterEmail({
    claimerName: user.name,
    claimerEmail: user.email,
    title: request.title,
  });
  const forClaimer = requestClaimedForClaimerEmail({
    requesterName: request.requester.name,
    requesterEmail: request.requester.email,
    title: request.title,
  });
  await Promise.all([
    sendEmail({
      to: request.requester.email,
      subject: forRequester.subject,
      body: forRequester.text,
      html: forRequester.html,
    }),
    sendEmail({ to: user.email, subject: forClaimer.subject, body: forClaimer.text, html: forClaimer.html }),
  ]);

  revalidateRequestSurfaces();
}

/** Accepts or declines a targeted (PENDING) Mentorship pick — only the
 * targeted claimer can respond. Replaces respondToConnectionAction. */
export async function respondToRequestAction(
  requestId: string,
  action: "ACCEPT" | "DECLINE",
): Promise<ActionResult> {
  const { user, request } = await requireRequestParticipant(requestId);
  if (request.claimerId !== user.id) {
    return { error: "Only the targeted mentor can respond to this request." };
  }
  if (!request.claimer) {
    return { error: "Request not found." };
  }

  let nextStatus;
  try {
    nextStatus = nextRequestStatus(request.status, action);
  } catch (err) {
    if (err instanceof InvalidRequestTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.helpRequest.update({
    where: { id: requestId },
    data: { status: nextStatus, respondedAt: new Date() },
  });

  if (action === "ACCEPT") {
    // Contact info reveal happens only here — see CLAUDE.md §1. Do not
    // surface either email anywhere else.
    const forRequester = requestAcceptedForRequesterEmail({
      claimerName: request.claimer.name,
      claimerEmail: request.claimer.email,
    });
    const forClaimer = requestAcceptedForClaimerEmail({
      requesterName: request.requester.name,
      requesterEmail: request.requester.email,
    });
    await Promise.all([
      sendEmail({
        to: request.requester.email,
        subject: forRequester.subject,
        body: forRequester.text,
        html: forRequester.html,
      }),
      sendEmail({
        to: request.claimer.email,
        subject: forClaimer.subject,
        body: forClaimer.text,
        html: forClaimer.html,
      }),
    ]);
  } else {
    const declinedEmail = requestDeclinedEmail({ claimerName: request.claimer.name });
    await sendEmail({
      to: request.requester.email,
      subject: declinedEmail.subject,
      body: declinedEmail.text,
      html: declinedEmail.html,
    });
  }

  revalidateRequestSurfaces();
}

/** Sets or updates the recurring-meeting note on a CLAIMED request — either
 * party can do this, no separate approve step. Ported as-is from
 * setMeetingPlanAction, rekeyed onto HelpRequest. */
export async function setMeetingPlanAction(
  requestId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { request } = await requireRequestParticipant(requestId);
  if (request.status !== REQUEST_STATUS.CLAIMED) {
    return { error: "Only a claimed request can have a recurring meeting." };
  }

  const parsed = meetingPlanSchema.safeParse({
    frequency: formData.get("frequency"),
    dayOfWeek: formData.get("dayOfWeek"),
    time: formData.get("time"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { frequency, dayOfWeek: dayOfWeekRaw, time, notes } = parsed.data;

  let dayOfWeek: number | null = null;
  if (dayOfWeekRaw) {
    const n = Number(dayOfWeekRaw);
    if (!Number.isInteger(n) || n < 0 || n > 6) {
      return { error: "Choose a valid day of the week." };
    }
    dayOfWeek = n;
  }

  await prisma.requestMeetingPlan.upsert({
    where: { requestId },
    create: { requestId, frequency, dayOfWeek, time: time || null, notes: notes || null },
    update: { frequency, dayOfWeek, time: time || null, notes: notes || null },
  });

  revalidateRequestSurfaces();
  return { ok: true };
}

/** Removes the recurring-meeting note entirely. Either participant can
 * clear it. */
export async function clearMeetingPlanAction(requestId: string): Promise<ActionResult> {
  await requireRequestParticipant(requestId);
  await prisma.requestMeetingPlan.deleteMany({ where: { requestId } });
  revalidateRequestSurfaces();
}

/** Marks a claimed request as completed — either participant can do this.
 * Modeled on completeRideRequestAction. */
export async function completeRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request } = await requireRequestParticipant(requestId);
  if (request.requesterId !== user.id && request.claimerId !== user.id) {
    return { error: "You don't have access to this request." };
  }

  let nextStatus;
  try {
    nextStatus = nextRequestStatus(request.status, "COMPLETE");
  } catch (err) {
    if (err instanceof InvalidRequestTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.helpRequest.update({ where: { id: requestId }, data: { status: nextStatus } });

  revalidateRequestSurfaces();
}

/** Cancels a request — the requester can cancel at any still-open stage
 * (PENDING/OPEN/CLAIMED); once CLAIMED, the claimer can cancel too, same as
 * withdrawing from a ride. Modeled on cancelRideRequestAction, extended
 * with the notify-the-other-party step a claimed pairing needs. A targeted
 * PENDING request can only be cancelled by the requester who sent it — the
 * claimer's response to a PENDING pick goes through
 * respondToRequestAction's ACCEPT/DECLINE, not this. */
export async function cancelRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request } = await requireRequestParticipant(requestId);
  const isRequester = request.requesterId === user.id;
  const isClaimer = request.claimerId === user.id;
  if (!isRequester && !isClaimer) {
    return { error: "You don't have access to this request." };
  }
  if (request.status === REQUEST_STATUS.PENDING && !isRequester) {
    return { error: "Only the person who sent the request can cancel it." };
  }

  let nextStatus;
  try {
    nextStatus = nextRequestStatus(request.status, "CANCEL");
  } catch (err) {
    if (err instanceof InvalidRequestTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.helpRequest.update({ where: { id: requestId }, data: { status: nextStatus } });

  if (request.status === REQUEST_STATUS.CLAIMED) {
    const other = isRequester ? request.claimer : request.requester;
    if (other) {
      const cancelledEmail = requestCancelledEmail({ otherName: user.name, title: request.title });
      await sendEmail({
        to: other.email,
        subject: cancelledEmail.subject,
        body: cancelledEmail.text,
        html: cancelledEmail.html,
      });
    }
  }

  revalidateRequestSurfaces();
}
