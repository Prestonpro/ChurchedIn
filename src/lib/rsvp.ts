import { RSVP_STATUS, type RsvpStatus } from "@/lib/constants";

/**
 * Pure capacity decision, kept separate from the Prisma-backed server action
 * so it's directly unit-testable: given how many people are already
 * CONFIRMED in this role bucket (helper or attendee — capacities are
 * independent) and the cap for that bucket, what status should a new RSVP
 * get?
 */
export function decideRsvpStatus(confirmedCount: number, cap: number | null): RsvpStatus {
  if (cap === null) return RSVP_STATUS.CONFIRMED;
  return confirmedCount < cap ? RSVP_STATUS.CONFIRMED : RSVP_STATUS.WAITLISTED;
}

export type WaitlistCandidate = { id: string; createdAt: Date };

/**
 * Given the current waitlist for a role bucket, picks who gets promoted when
 * a CONFIRMED spot opens up: whoever has been waiting longest.
 */
export function pickPromotionCandidate<T extends WaitlistCandidate>(
  waitlisted: T[],
): T | null {
  if (waitlisted.length === 0) return null;
  return waitlisted.reduce((oldest, candidate) =>
    candidate.createdAt < oldest.createdAt ? candidate : oldest,
  );
}
