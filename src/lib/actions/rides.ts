"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { rideClaimedForStudentEmail, rideClaimedForVolunteerEmail } from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import { nextRideStatus, InvalidRideTransitionError } from "@/lib/rideState";
import { ROLES, RIDE_REQUEST_TYPE } from "@/lib/constants";
import { rideRequestSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | { ok: true } | void;

/**
 * All three ride surfaces. /admin/rides — the church leader's read-only
 * oversight board — was previously left out, so every claim, completion, and
 * cancellation left it showing stale statuses.
 */
function revalidateRideSurfaces(): void {
  revalidatePath("/student/rides");
  revalidatePath("/volunteer/rides");
  revalidatePath("/admin/rides");
  revalidatePath("/volunteer/dashboard");
}

export async function createRideRequestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.STUDENT) {
    return { error: "Only students can request a ride." };
  }

  const parsed = rideRequestSchema.safeParse({
    destination: formData.get("destination"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes"),
    prefersGroupRide: formData.get("prefersGroupRide") === "on",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Choose a valid date." };
  }

  await prisma.rideRequest.create({
    data: {
      destination: data.destination,
      date,
      time: data.time,
      notes: data.notes || null,
      prefersGroupRide: data.prefersGroupRide,
      churchId: user.activeMembership.churchId,
      studentId: user.id,
    },
  });

  revalidateRideSurfaces();
  return { ok: true };
}

/**
 * A ride to visit a church someone found on /discover, for the first
 * time — distinct from createRideRequestAction, which requires the
 * requester to already be a STUDENT member of the destination church.
 * Here `churchId` is the destination but the requester may have no
 * relationship to it at all (they haven't visited yet); any logged-in
 * user can ask. Routes to that church's volunteers the same way a
 * GENERAL ride does (listOpenRideRequestsForChurch filters by churchId
 * regardless of type), so no separate rides-board query is needed.
 */
export async function createFirstVisitRideRequestAction(
  churchId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    return { error: "That church no longer exists." };
  }

  const parsed = rideRequestSchema.safeParse({
    destination: formData.get("destination"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes"),
    prefersGroupRide: formData.get("prefersGroupRide") === "on",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Choose a valid date." };
  }

  await prisma.rideRequest.create({
    data: {
      destination: data.destination,
      date,
      time: data.time,
      notes: data.notes || null,
      prefersGroupRide: data.prefersGroupRide,
      churchId,
      studentId: user.id,
      type: RIDE_REQUEST_TYPE.FIRST_VISIT,
    },
  });

  revalidateRideSurfaces();
  revalidatePath(`/churches/${churchId}`);
  return { ok: true };
}

async function requireRideParticipant(rideId: string) {
  const user = await requireUser();
  const ride = await prisma.rideRequest.findUnique({
    where: { id: rideId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      volunteer: { select: { id: true, name: true, email: true } },
    },
  });
  if (!ride) {
    throw new Error("Ride request not found.");
  }
  return { user, ride };
}

/** Claims an OPEN ride request — any volunteer at the same church can claim
 * any open request; only reveals contact info to each other once claimed
 * (PLAN.md's contact-reveal safety rule, applied here for the same reason
 * it applies to mentor connections). A church leader can claim one too —
 * previously CHURCH_ADMIN was flatly rejected here, and /admin/rides was a
 * pure read-only board with nothing to do when nobody had claimed a
 * request yet. Full "suggest a specific volunteer" workflow is a bigger,
 * separate feature; this is the minimal fix for "the leader had no way to
 * respond." */
export async function claimRideRequestAction(rideId: string): Promise<ActionResult> {
  const { user, ride } = await requireRideParticipant(rideId);
  if (
    !user.activeMembership ||
    (user.activeMembership.role !== ROLES.VOLUNTEER && user.activeMembership.role !== ROLES.CHURCH_ADMIN)
  ) {
    return { error: "Only volunteers or church leaders can claim a ride." };
  }
  if (ride.churchId !== user.activeMembership.churchId) {
    return { error: "This ride request isn't at your church." };
  }
  // Claiming reveals both parties' email addresses to each other below, so a
  // blocked pair must never get here (safety rules 1 and 2). The board query
  // already hides these rows; this is the server-side backstop, matching how
  // rsvpToEventAction and requestConnectionAction both re-check on the action.
  if (await isBlockedPair(user.id, ride.studentId)) {
    return { error: "You can't claim this ride request." };
  }

  let nextStatus;
  try {
    nextStatus = nextRideStatus(ride.status, "CLAIM");
  } catch (err) {
    if (err instanceof InvalidRideTransitionError) {
      return { error: "Someone already claimed this ride." };
    }
    throw err;
  }

  await prisma.rideRequest.update({
    where: { id: rideId },
    data: { status: nextStatus, volunteerId: user.id },
  });

  // Contact info reveal happens only here — do not surface either email
  // anywhere else (see PLAN.md's safety rule and rideState.ts).
  const forStudent = rideClaimedForStudentEmail({
    volunteerName: user.name,
    volunteerEmail: user.email,
    destination: ride.destination,
  });
  const forVolunteer = rideClaimedForVolunteerEmail({
    studentName: ride.student.name,
    studentEmail: ride.student.email,
    destination: ride.destination,
  });
  await Promise.all([
    sendEmail({
      to: ride.student.email,
      subject: forStudent.subject,
      body: forStudent.text,
      html: forStudent.html,
    }),
    sendEmail({
      to: user.email,
      subject: forVolunteer.subject,
      body: forVolunteer.text,
      html: forVolunteer.html,
    }),
  ]);

  revalidateRideSurfaces();
}

/** Marks a claimed ride as completed — either participant can do this. */
export async function completeRideRequestAction(rideId: string): Promise<ActionResult> {
  const { user, ride } = await requireRideParticipant(rideId);
  if (ride.studentId !== user.id && ride.volunteerId !== user.id) {
    return { error: "You don't have access to this ride request." };
  }

  let nextStatus;
  try {
    nextStatus = nextRideStatus(ride.status, "COMPLETE");
  } catch (err) {
    if (err instanceof InvalidRideTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.rideRequest.update({ where: { id: rideId }, data: { status: nextStatus } });

  revalidateRideSurfaces();
}

/** Cancels a ride request — only the student who made it can cancel,
 * whether it's still OPEN or already CLAIMED. */
export async function cancelRideRequestAction(rideId: string): Promise<ActionResult> {
  const { user, ride } = await requireRideParticipant(rideId);
  if (ride.studentId !== user.id) {
    return { error: "Only the student who requested this ride can cancel it." };
  }

  let nextStatus;
  try {
    nextStatus = nextRideStatus(ride.status, "CANCEL");
  } catch (err) {
    if (err instanceof InvalidRideTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  await prisma.rideRequest.update({
    where: { id: rideId },
    data: { status: nextStatus },
  });

  revalidateRideSurfaces();
}
