"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
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

  await sendEmail({
    to: user.email,
    subject:
      result.status === RSVP_STATUS.CONFIRMED
        ? `You're confirmed: ${event.title}`
        : `You're on the waitlist: ${event.title}`,
    body:
      result.status === RSVP_STATUS.CONFIRMED
        ? `You're confirmed for ${event.title} on ${event.startsAt.toLocaleString()}.`
        : `${event.title} is currently full. You're on the waitlist and will be notified automatically if a spot opens up.`,
  });

  revalidatePath(`/events/${eventId}`);
}

export async function cancelRsvpAction(eventId: string): Promise<ActionResult> {
  const user = await requireUser();

  const promoted = await prisma.$transaction(async (tx) => {
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
    await sendEmail({
      to: promoted.user.email,
      subject: `A spot opened up: ${event?.title ?? "your event"}`,
      body: `A spot just opened up and you've been moved from the waitlist to confirmed for ${
        event?.title ?? "the event"
      }.`,
    });
  }

  revalidatePath(`/events/${eventId}`);
}
