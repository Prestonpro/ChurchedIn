import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { eventReminderEmail } from "@/lib/emailTemplates";
import { reminderWindowBounds } from "@/lib/eventReminders";
import { EVENT_STATUS, RSVP_STATUS } from "@/lib/constants";

/**
 * Sends "see you tomorrow" reminders for every CONFIRMED RSVP on a
 * PUBLISHED event landing in the reminder window (see eventReminders.ts)
 * that hasn't had one yet. Per-RSVP tracking (not per-event) means a late
 * RSVP already inside the window still gets reminded once, and re-running
 * this (a retried cron invocation, or a manual call while testing) never
 * double-sends — the `reminderSentAt: null` filter is the only guard
 * needed, no separate idempotency key.
 */
export async function sendDueEventReminders(now: Date = new Date()): Promise<{ sent: number; events: number }> {
  const { from, to } = reminderWindowBounds(now);

  const events = await prisma.event.findMany({
    where: { status: EVENT_STATUS.PUBLISHED, startsAt: { gte: from, lte: to } },
    include: {
      rsvps: {
        where: { status: RSVP_STATUS.CONFIRMED, reminderSentAt: null },
        include: { user: { select: { email: true } } },
      },
    },
  });

  let sent = 0;
  for (const event of events) {
    for (const rsvp of event.rsvps) {
      const email = eventReminderEmail({
        eventTitle: event.title,
        eventId: event.id,
        startsAt: event.startsAt,
        location: event.location,
      });
      await sendEmail({ to: rsvp.user.email, subject: email.subject, body: email.text, html: email.html });
      await prisma.eventRsvp.update({ where: { id: rsvp.id }, data: { reminderSentAt: now } });
      sent += 1;
    }
  }

  return { sent, events: events.filter((e) => e.rsvps.length > 0).length };
}
