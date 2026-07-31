"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { rsvpConfirmedEmail, rsvpWaitlistedEmail, waitlistPromotedEmail } from "@/lib/emailTemplates";
import { isBlockedPairWithAny } from "@/lib/queries";
import { decideRsvpStatus, pickPromotionCandidate } from "@/lib/rsvp";
import { ROLES, RSVP_ROLE, RSVP_STATUS, EVENT_STATUS, type RsvpRole } from "@/lib/constants";

export type ActionResult = { error: string } | void;

/**
 * Every surface that renders RSVP-derived data, and so goes stale the moment an
 * RSVP changes: the feed's attendee avatars and both capacity bars, the
 * calendar's "my RSVPs only" filter, the map's pin colors, and the "upcoming
 * gatherings" counts on the student and volunteer dashboards. Previously only
 * the event's own detail page was revalidated, so RSVPing and hitting Back
 * showed the old avatar row and capacity bar.
 */
function revalidateRsvpSurfaces(eventId: string): void {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/events/calendar");
  revalidatePath("/events/map");
  revalidatePath("/student/dashboard");
  revalidatePath("/volunteer/dashboard");
}

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

/**
 * The `_prev, _formData` tail is what CLAUDE.md requires of any action bound
 * into `useActionState` — RsvpControls does exactly that, so React invokes this
 * as `(eventId, prevState, formData)` and the signature should say so rather
 * than quietly relying on JS discarding the extra arguments. Both are optional
 * because the event map (EventMapClient) calls this programmatically from a
 * click handler with only the id.
 */
export async function rsvpToEventAction(
  eventId: string,
  _prev?: ActionResult,
  _formData?: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { cohosts: { select: { userId: true } } },
  });
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

  // Co-hosts get the same visibility over the RSVP list as the creator does
  // (see EventCohost's doc comment), so a block against a co-host has to count
  // here too — checking only the creator let a blocked pair end up on a
  // gathering the blocked party co-runs and can see the attendee list for.
  const hostIds = [event.createdById, ...event.cohosts.map((c) => c.userId)];
  if (await isBlockedPairWithAny(user.id, hostIds)) {
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

  revalidateRsvpSurfaces(eventId);
}

/** Same bound-into-`useActionState` shape as rsvpToEventAction above. */
export async function cancelRsvpAction(
  eventId: string,
  _prev?: ActionResult,
  _formData?: FormData,
): Promise<ActionResult> {
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

  revalidateRsvpSurfaces(eventId);
}
