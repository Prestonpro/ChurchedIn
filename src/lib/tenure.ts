const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * A short, human "how long have they been here" string — one of the safety
 * signals interviewees read profiles for (alongside social links, shared
 * language, activity), so it needs to read at a glance, not as an exact
 * timestamp. Pure and unit-tested rather than folded into a component, same
 * reasoning as rsvp.ts/rideState.ts: the rounding rules are worth testing
 * without spinning up a page.
 */
export function formatTenure(since: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - since.getTime()) / DAY_MS);
  if (days < 30) return "New here";
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30));
    return `Member for ${months} ${months === 1 ? "month" : "months"}`;
  }
  const years = Math.floor(days / 365);
  return `Member for ${years} ${years === 1 ? "year" : "years"}`;
}
