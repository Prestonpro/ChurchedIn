"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { eventCancelledEmail } from "@/lib/emailTemplates";
import { ROLES, EVENT_STATUS, RSVP_STATUS } from "@/lib/constants";
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
    volunteerCap: formData.get("volunteerCap")
      ? Number(formData.get("volunteerCap"))
      : null,
    studentCap: formData.get("studentCap") ? Number(formData.get("studentCap")) : null,
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
      volunteerCap: data.volunteerCap,
      studentCap: data.studentCap,
      churchId: user.activeMembership.churchId,
      createdById: user.id,
    },
  });

  revalidatePath("/events");
  return { ok: true, eventId: event.id };
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
