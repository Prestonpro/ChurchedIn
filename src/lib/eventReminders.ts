// A once-a-day cron (see vercel.json) rather than hourly, since Vercel's
// Hobby tier only guarantees daily cron frequency — a narrow "exactly 24h
// out" window would miss events depending on what time of day the cron
// happens to run relative to each event's own start time. 12–36 hours
// covers every event happening "tomorrow" regardless of either clock,
// at the cost of a reminder sometimes landing more like 12 or 36 hours
// out instead of a precise 24.
const REMINDER_WINDOW_MIN_HOURS = 12;
const REMINDER_WINDOW_MAX_HOURS = 36;

/** Pure and DB-free on purpose, unlike sendDueEventReminders in
 * eventReminderJob.ts — so the boundary math (the part actually worth
 * pinning down with tests) is directly unit-testable. */
export function isWithinReminderWindow(startsAt: Date, now: Date): boolean {
  const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil >= REMINDER_WINDOW_MIN_HOURS && hoursUntil <= REMINDER_WINDOW_MAX_HOURS;
}

export function reminderWindowBounds(now: Date): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() + REMINDER_WINDOW_MIN_HOURS * 60 * 60 * 1000),
    to: new Date(now.getTime() + REMINDER_WINDOW_MAX_HOURS * 60 * 60 * 1000),
  };
}
