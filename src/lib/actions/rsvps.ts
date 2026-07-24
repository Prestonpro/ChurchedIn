"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { rsvpConfirmedEmail, rsvpWaitlistedEmail, waitlistPromotedEmail } from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import { decideRsvpStatus, pickPromotionCandidate } from "@/lib/rsvp";
import { ROLES, RSVP_ROLE, RSVP_STATUS, EVENT_STATUS, type RsvpRole } from "@/lib/constants";

export type ActionResult = { error: string } | void;

function roleBucketFor(membershipRole: string): RsvpRole | null {
  if (membershipRole === ROLES.STUDENT) return RSVP_ROLE.ATTENDEE;
  if (membershipRole === ROLES.VOLUNTEER || membershipRole === ROLES.CHURCH_ADMIN) {
    return RSVP_ROLE.HELPER;
  }
  return null;
}

/**
 * Takes a Postgres advisory lock scoped to this event for the duration of
 * the enclosing transaction, so two concurrent RSVP/cancel calls for the
 * *same event* can never interleave — whichever transaction acquires the
 * lock first fully commits before the other's reads run. Without this, a
 * capacity-count read or waitlist-search can run against another
 * transaction's not-yet-committed write and miss it entirely (correct READ
 * COMMITTED behavior, but wrong for this use case).
 *
 * Deliberately a session-scoped Postgres lock (advisory, via hashtext on
 * the event id), not `SELECT ... FOR UPDATE` on the Event row — verified
 * directly against this database that row-level FOR UPDATE locks do not
 * reliably block a second concurrent transaction, while
 * pg_advisory_xact_lock does. `_xact_` variant auto-releases on commit or
 * rollback, so there's no risk of a stuck lock outliving the transaction.
 * Must be the first statement in the transaction, before any other read.
 */
async function lockEventForRsvpMutation(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  eventId: string,
): Promise<void> {
  // $executeRaw, not $queryRaw — pg_advisory_xact_lock returns `void`, which
  // the driver adapter can't deserialize as a query result column; $executeRaw
  // doesn't attempt to, since we don't need a return value here anyway.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${eventId}))`;
}

export async function rsvpToEventAction(eventId: string): Promise<ActionResult> {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== EVENT_STATUS.PUBLISHED) {
    return { error: "This event isn't available." };
  }
  const membership = user.memberships.find((m) => m.churchId === event.churchId);
  if (!membership) {
    return { error: "You need to be a member of this event's church to RSVP." };
  }
  const role = roleBucketFor(membership.role);
  if (!role) {
    return { error: "Your role can't RSVP to events." };
  }

  if (await isBlockedPair(user.id, event.createdById)) {
    return { error: "You can't RSVP to this event." };
  }

  const cap = role === RSVP_ROLE.HELPER ? event.volunteerCap : event.studentCap;

  const result = await prisma.$transaction(async (tx) => {
    await lockEventForRsvpMutation(tx, eventId);

    const existing = await tx.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && existing.status !== RSVP_STATUS.CANCELLED) {
      return { ok: false as const, error: "You've already RSVPed to this event." };
    }

    const confirmedCount = await tx.eventRsvp.count({
      where: { eventId, role, status: RSVP_STATUS.CONFIRMED },
    });
    const status = decideRsvpStatus(confirmedCount, cap);

    if (existing) {
      await tx.eventRsvp.update({ where: { id: existing.id }, data: { role, status } });
    } else {
      await tx.eventRsvp.create({ data: { eventId, userId: user.id, role, status } });
    }
    return { ok: true as const, status };
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const emailContent =
    result.status === RSVP_STATUS.CONFIRMED
      ? rsvpConfirmedEmail({ eventTitle: event.title, eventId, startsAt: event.startsAt })
      : rsvpWaitlistedEmail({ eventTitle: event.title, eventId });
  await sendEmail({ to: user.email, subject: emailContent.subject, body: emailContent.text, html: emailContent.html });

  revalidatePath(`/events/${eventId}`);
}

export async function cancelRsvpAction(eventId: string): Promise<ActionResult> {
  const user = await requireUser();

  const promoted = await prisma.$transaction(async (tx) => {
    await lockEventForRsvpMutation(tx, eventId);

    const existing = await tx.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (!existing || existing.status === RSVP_STATUS.CANCELLED) {
      return null;
    }

    await tx.eventRsvp.update({ where: { id: existing.id }, data: { status: RSVP_STATUS.CANCELLED } });

    if (existing.status !== RSVP_STATUS.CONFIRMED) {
      return null;
    }

    const waitlisted = await tx.eventRsvp.findMany({
      where: { eventId, role: existing.role, status: RSVP_STATUS.WAITLISTED },
      include: { user: { select: { id: true, email: true } } },
    });
    const candidate = pickPromotionCandidate(waitlisted);
    if (!candidate) return null;

    await tx.eventRsvp.update({
      where: { id: candidate.id },
      data: { status: RSVP_STATUS.CONFIRMED },
    });
    return candidate;
  });

  if (promoted) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const emailContent = waitlistPromotedEmail({ eventTitle: event?.title ?? "your event", eventId });
    await sendEmail({
      to: promoted.user.email,
      subject: emailContent.subject,
      body: emailContent.text,
      html: emailContent.html,
    });
  }

  revalidatePath(`/events/${eventId}`);
}
