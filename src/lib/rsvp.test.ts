import { describe, it, expect } from "vitest";
import { decideRsvpStatus, pickPromotionCandidate } from "@/lib/rsvp";
import { RSVP_STATUS } from "@/lib/constants";

describe("decideRsvpStatus", () => {
  it("confirms when the event is uncapped", () => {
    expect(decideRsvpStatus(9999, null)).toBe(RSVP_STATUS.CONFIRMED);
  });

  it("confirms when under capacity", () => {
    expect(decideRsvpStatus(2, 5)).toBe(RSVP_STATUS.CONFIRMED);
  });

  it("confirms the exact last available slot", () => {
    expect(decideRsvpStatus(4, 5)).toBe(RSVP_STATUS.CONFIRMED);
  });

  it("waitlists once capacity is reached", () => {
    expect(decideRsvpStatus(5, 5)).toBe(RSVP_STATUS.WAITLISTED);
  });

  it("waitlists when already over capacity", () => {
    expect(decideRsvpStatus(6, 5)).toBe(RSVP_STATUS.WAITLISTED);
  });

  it("waitlists a zero-capacity event immediately", () => {
    expect(decideRsvpStatus(0, 0)).toBe(RSVP_STATUS.WAITLISTED);
  });
});

describe("pickPromotionCandidate", () => {
  it("returns null when nobody is waitlisted", () => {
    expect(pickPromotionCandidate([])).toBeNull();
  });

  it("promotes whoever has waited longest, not insertion order", () => {
    const later = { id: "later", createdAt: new Date("2026-01-02") };
    const earliest = { id: "earliest", createdAt: new Date("2026-01-01") };
    const middle = { id: "middle", createdAt: new Date("2026-01-01T12:00:00Z") };

    // Deliberately not sorted, to prove the function doesn't rely on order.
    expect(pickPromotionCandidate([later, earliest, middle])?.id).toBe("earliest");
  });

  it("returns the only candidate when there's one", () => {
    const only = { id: "only", createdAt: new Date() };
    expect(pickPromotionCandidate([only])?.id).toBe("only");
  });
});
