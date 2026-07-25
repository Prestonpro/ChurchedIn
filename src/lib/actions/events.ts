"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { eventCancelledEmail, newEventNotificationEmail } from "@/lib/emailTemplates";
import {
  ROLES,
  EVENT_STATUS,
  RSVP_STATUS,
  EVENT_CATEGORY_LABELS,
  MAX_EVENT_NOTIFICATIONS_PER_DAY,
  type EventCategory,
} from "@/lib/constants";
import { eventSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | { ok: true; eventId: string } | void;

export async function createEventAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership) {
    return { error: "Join a church before creating an event." };
  }
  if (user.activeMembership.role === ROLES.STUDENT) {
    return { error: "Only volunteers and church leaders can create events." };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location"),
    isVirtual: formData.get("isVirtual") === "on",
    atChurch: formData.get("atChurch") === "on",
    volunteerCap: formData.get("volunteerCap")
      ? Number(formData.get("volunteerCap"))
      : null,
    studentCap: formData.get("studentCap") ? Number(formData.get("studentCap")) : null,
    address: formData.get("address"),
    locationLat: formData.get("locationLat") ? Number(formData.get("locationLat")) : null,
    locationLng: formData.get("locationLng") ? Number(formData.get("locationLng")) : null,
  };
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Enter valid start and end times." };
  }
  if (endsAt <= startsAt) {
    return { error: "End time must be after the start time." };
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      startsAt,
      endsAt,
      location: data.location,
      isVirtual: data.isVirtual,
      atChurch: data.atChurch,
      volunteerCap: data.volunteerCap,
      studentCap: data.studentCap,
      address: data.address || null,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      churchId: user.activeMembership.churchId,
      createdById: user.id,
    },
    include: { church: { select: { name: true } } },
  });

  revalidatePath("/events");
  await notifyChurchOfNewEvent(event);
  return { ok: true, eventId: event.id };
}

/**
 * Emails every member of the church about a newly published event —
 * "something's happening!" — rate-limited per church per rolling 24h
 * window (MAX_EVENT_NOTIFICATIONS_PER_DAY) so one volunteer creating a
 * string of events in a row doesn't spam every member's inbox. Counts
 * *other* events created in the window, not notification records, since
 * there's a 1:1 mapping between "event created" and "notification batch
 * sent" and that avoids a dedicated tracking table for an MVP feature.
 */
async function notifyChurchOfNewEvent(event: {
  id: string;
  title: string;
  description: string;
  category: string;
  startsAt: Date;
  churchId: string;
  createdById: string;
  church: { name: string };
}): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // pg_advisory_xact_lock serializes this count-then-decide per church so
  // concurrent event creations can't each see a stale (too-low) count and
  // all slip past the cap at once — the lock is held for the transaction's
  // lifetime and released automatically on commit.
  const shouldSend = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.churchId}))`;
    const priorEventCount = await tx.event.count({
      where: { churchId: event.churchId, createdAt: { gte: since }, id: { not: event.id } },
    });
    return priorEventCount < MAX_EVENT_NOTIFICATIONS_PER_DAY;
  });
  if (!shouldSend) {
    return;
  }

  const memberships = await prisma.membership.findMany({
    where: { churchId: event.churchId, userId: { not: event.createdById } },
    include: { user: { select: { email: true } } },
  });
  const notification = newEventNotificationEmail({
    churchName: event.church.name,
    eventTitle: event.title,
    eventId: event.id,
    categoryLabel: EVENT_CATEGORY_LABELS[event.category as EventCategory],
    startsAt: event.startsAt,
    description: event.description,
  });
  await Promise.all(
    memberships.map((m) =>
      sendEmail({
        to: m.user.email,
        subject: notification.subject,
        body: notification.text,
        html: notification.html,
      }),
    ),
  );
}

/**
 * Adds a volunteer as a co-host, immediately — no accept/decline step (MVP
 * scope per the redesign brief). Only the event's original creator can
 * invite co-hosts; the invitee must be a VOLUNTEER in the same church the
 * event belongs to, same trust boundary as who can create events at all.
 */
export async function inviteCohostAction(eventId: string, userId: string): Promise<ActionResult> {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Event not found." };
  }
  if (event.createdById !== user.id) {
    return { error: "Only the event's creator can invite a co-host." };
  }

  const invitee = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { where: { churchId: event.churchId } } },
  });
  const membership = invitee?.memberships[0];
  if (!invitee || !membership || membership.role !== ROLES.VOLUNTEER) {
    return { error: "That person isn't a volunteer at this church." };
  }
  if (userId === user.id) {
    return { error: "You're already the host." };
  }

  await prisma.eventCohost.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId },
    update: {},
  });

  revalidatePath(`/events/${eventId}`);
}

/** Removes a co-host — creator-only, same as inviting one. */
export async function removeCohostAction(eventId: string, userId: string): Promise<ActionResult> {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Event not found." };
  }
  if (event.createdById !== user.id) {
    return { error: "Only the event's creator can remove a co-host." };
  }

  await prisma.eventCohost.deleteMany({ where: { eventId, userId } });
  revalidatePath(`/events/${eventId}`);
}

export async function cancelEventAction(eventId: string): Promise<ActionResult> {
  const user = await requireUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { where: { status: { not: RSVP_STATUS.CANCELLED } }, include: { user: true } } },
  });
  if (!event) {
    return { error: "Event not found." };
  }

  const isCreator = event.createdById === user.id;
  const isAdmin =
    user.activeMembership?.role === ROLES.CHURCH_ADMIN &&
    user.activeMembership.churchId === event.churchId;
  if (!isCreator && !isAdmin) {
    return { error: "Only the event's creator or a church leader can cancel it." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { status: EVENT_STATUS.CANCELLED },
  });

  const cancelledEmail = eventCancelledEmail({ eventTitle: event.title, startsAt: event.startsAt });
  await Promise.all(
    event.rsvps.map((rsvp) =>
      sendEmail({
        to: rsvp.user.email,
        subject: cancelledEmail.subject,
        body: cancelledEmail.text,
        html: cancelledEmail.html,
      }),
    ),
  );

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}
