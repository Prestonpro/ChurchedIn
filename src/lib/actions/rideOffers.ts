"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  rideOfferSeatConfirmedEmail,
  rideOfferWaitlistedEmail,
  rideOfferSeatPromotedEmail,
  rideOfferCancelledEmail,
} from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import { decideRsvpStatus, pickPromotionCandidate } from "@/lib/rsvp";
import { ROLES, RSVP_STATUS } from "@/lib/constants";
import { rideOfferSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | { ok: true } | void;

function revalidateRideOfferSurfaces(): void {
  revalidatePath("/student/rides");
  revalidatePath("/volunteer/rides");
}

/**
 * Same advisory-lock approach as lockEventForRsvpMutation in
 * src/lib/actions/rsvps.ts, scoped to a rideOfferId instead of an eventId —
 * see that function's doc comment for why a Postgres advisory lock and not
 * `SELECT ... FOR UPDATE`. Must be the first statement in the transaction.
 */
async function lockRideOfferForClaimMutation(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  rideOfferId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${rideOfferId}))`;
}

export async function createRideOfferAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.VOLUNTEER) {
    return { error: "Only volunteers can offer a ride." };
  }

  const parsed = rideOfferSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Choose a valid date." };
  }

  await prisma.rideOffer.create({
    data: {
      date,
      time: data.time,
      capacity: data.capacity,
      notes: data.notes || null,
      churchId: user.activeMembership.churchId,
      volunteerId: user.id,
    },
  });

  revalidateRideOfferSurfaces();
  return { ok: true };
}

/** Cancels the whole offer — distinct from a single rider cancelling their
 * own claim. Every rider with a non-cancelled claim (confirmed or
 * waitlisted) gets notified, since a waitlisted rider was still counting on
 * this offer as an option. */
export async function cancelRideOfferAction(rideOfferId: string): Promise<ActionResult> {
  const user = await requireUser();
  const offer = await prisma.rideOffer.findUnique({
    where: { id: rideOfferId },
    include: {
      claims: {
        where: { status: { not: RSVP_STATUS.CANCELLED } },
        include: { student: { select: { email: true } } },
      },
    },
  });
  if (!offer) {
    return { error: "This ride offer no longer exists." };
  }
  if (offer.volunteerId !== user.id) {
    return { error: "Only the volunteer who offered this ride can cancel it." };
  }
  if (offer.cancelledAt) {
    return { error: "This ride offer is already cancelled." };
  }

  await prisma.$transaction([
    prisma.rideOffer.update({ where: { id: rideOfferId }, data: { cancelledAt: new Date() } }),
    prisma.rideOfferClaim.updateMany({
      where: { rideOfferId, status: { not: RSVP_STATUS.CANCELLED } },
      data: { status: RSVP_STATUS.CANCELLED },
    }),
  ]);

  const emailContent = rideOfferCancelledEmail({
    volunteerName: user.name,
    date: offer.date,
    time: offer.time,
  });
  await Promise.all(
    offer.claims.map((c) =>
      sendEmail({
        to: c.student.email,
        subject: emailContent.subject,
        body: emailContent.text,
        html: emailContent.html,
      }),
    ),
  );

  revalidateRideOfferSurfaces();
}

/** Claims a seat (or a waitlist spot, if full) — same capacity/waitlist
 * decision as event RSVPs, reusing decideRsvpStatus as-is. Open to any
 * church member, not just students — a mentor riding along is exactly the
 * point of showing who else is in the car (see listActiveRideOffersForChurch's
 * `riders`), so a volunteer can join as a passenger the same way a student
 * does, not just offer their own rides. */
export async function joinRideOfferAction(rideOfferId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership) {
    return { error: "Join a church before joining a ride." };
  }

  const offer = await prisma.rideOffer.findUnique({ where: { id: rideOfferId } });
  if (!offer || offer.cancelledAt) {
    return { error: "This ride offer isn't available." };
  }
  if (offer.volunteerId === user.id) {
    return { error: "You can't join your own ride offer." };
  }
  if (offer.churchId !== user.activeMembership.churchId) {
    return { error: "This ride offer isn't at your church." };
  }
  if (await isBlockedPair(user.id, offer.volunteerId)) {
    return { error: "You can't join this ride." };
  }

  const result = await prisma.$transaction(async (tx) => {
    await lockRideOfferForClaimMutation(tx, rideOfferId);

    const existing = await tx.rideOfferClaim.findUnique({
      where: { rideOfferId_studentId: { rideOfferId, studentId: user.id } },
    });
    if (existing && existing.status !== RSVP_STATUS.CANCELLED) {
      return { ok: false as const, error: "You're already on this ride." };
    }

    const confirmedCount = await tx.rideOfferClaim.count({
      where: { rideOfferId, status: RSVP_STATUS.CONFIRMED },
    });
    const status = decideRsvpStatus(confirmedCount, offer.capacity);

    if (existing) {
      await tx.rideOfferClaim.update({ where: { id: existing.id }, data: { status } });
    } else {
      await tx.rideOfferClaim.create({ data: { rideOfferId, studentId: user.id, status } });
    }
    return { ok: true as const, status };
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const volunteer = await prisma.user.findUnique({ where: { id: offer.volunteerId } });
  if (volunteer) {
    const emailContent =
      result.status === RSVP_STATUS.CONFIRMED
        ? rideOfferSeatConfirmedEmail({
            volunteerName: volunteer.name,
            volunteerEmail: volunteer.email,
            date: offer.date,
            time: offer.time,
          })
        : rideOfferWaitlistedEmail({ volunteerName: volunteer.name, date: offer.date, time: offer.time });
    await sendEmail({ to: user.email, subject: emailContent.subject, body: emailContent.text, html: emailContent.html });
  }

  revalidateRideOfferSurfaces();
}

/** A single rider cancelling their own claim — promotes the longest-waiting
 * waitlisted rider if the cancelled claim held a confirmed seat, same
 * pattern as cancelRsvpAction. */
export async function cancelRideOfferClaimAction(rideOfferId: string): Promise<ActionResult> {
  const user = await requireUser();

  const promoted = await prisma.$transaction(async (tx) => {
    await lockRideOfferForClaimMutation(tx, rideOfferId);

    const existing = await tx.rideOfferClaim.findUnique({
      where: { rideOfferId_studentId: { rideOfferId, studentId: user.id } },
    });
    if (!existing || existing.status === RSVP_STATUS.CANCELLED) {
      return null;
    }

    await tx.rideOfferClaim.update({ where: { id: existing.id }, data: { status: RSVP_STATUS.CANCELLED } });

    if (existing.status !== RSVP_STATUS.CONFIRMED) {
      return null;
    }

    const waitlisted = await tx.rideOfferClaim.findMany({
      where: { rideOfferId, status: RSVP_STATUS.WAITLISTED },
      include: { student: { select: { id: true, email: true } } },
    });
    const candidate = pickPromotionCandidate(waitlisted);
    if (!candidate) return null;

    await tx.rideOfferClaim.update({ where: { id: candidate.id }, data: { status: RSVP_STATUS.CONFIRMED } });
    return candidate;
  });

  if (promoted) {
    const offer = await prisma.rideOffer.findUnique({
      where: { id: rideOfferId },
      include: { volunteer: { select: { name: true, email: true } } },
    });
    if (offer) {
      const emailContent = rideOfferSeatPromotedEmail({
        volunteerName: offer.volunteer.name,
        volunteerEmail: offer.volunteer.email,
        date: offer.date,
        time: offer.time,
      });
      await sendEmail({
        to: promoted.student.email,
        subject: emailContent.subject,
        body: emailContent.text,
        html: emailContent.html,
      });
    }
  }

  revalidateRideOfferSurfaces();
}
