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

  // Batched per event rather than one-await-at-a-time. This runs as a Vercel
  // serverless function on a cron, and the previous shape cost one serial
  // round-trip to Resend *plus* one to Postgres per RSVP — a few hundred due
  // reminders would run out the function's time limit partway through the
  // batch. The template only depends on the event, so it's built once per event
  // instead of once per recipient, the sends go out together, and the
  // reminderSentAt stamps collapse into a single updateMany.
  let sent = 0;
  for (const event of events) {
    if (event.rsvps.length === 0) {
      continue;
    }
    const email = eventReminderEmail({
      eventTitle: event.title,
      eventId: event.id,
      startsAt: event.startsAt,
      location: event.location,
    });
    await Promise.all(
      event.rsvps.map((rsvp) =>
        sendEmail({ to: rsvp.user.email, subject: email.subject, body: email.text, html: email.html }),
      ),
    );
    // sendEmail never throws (it logs delivery failures), so reaching here means
    // every send was attempted — safe to stamp them all as reminded, which keeps
    // the "never double-send on a retried invocation" guarantee intact.
    await prisma.eventRsvp.updateMany({
      where: { id: { in: event.rsvps.map((r) => r.id) } },
      data: { reminderSentAt: now },
    });
    sent += event.rsvps.length;
  }

  return { sent, events: events.filter((e) => e.rsvps.length > 0).length };
}
