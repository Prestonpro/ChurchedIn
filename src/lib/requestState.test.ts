import { describe, it, expect } from "vitest";
import {
  nextRequestStatus,
  requestContactVisible,
  InvalidRequestTransitionError,
} from "@/lib/requestState";
import { REQUEST_STATUS } from "@/lib/constants";

describe("nextRequestStatus", () => {
  it("allows the blind-claim flow: OPEN -> CLAIMED -> COMPLETED", () => {
    expect(nextRequestStatus(REQUEST_STATUS.OPEN, "CLAIM")).toBe(REQUEST_STATUS.CLAIMED);
    expect(nextRequestStatus(REQUEST_STATUS.CLAIMED, "COMPLETE")).toBe(REQUEST_STATUS.COMPLETED);
  });

  it("allows OPEN -> CANCELLED", () => {
    expect(nextRequestStatus(REQUEST_STATUS.OPEN, "CANCEL")).toBe(REQUEST_STATUS.CANCELLED);
  });

  it("allows the targeted-pick flow: PENDING -> CLAIMED via ACCEPT", () => {
    expect(nextRequestStatus(REQUEST_STATUS.PENDING, "ACCEPT")).toBe(REQUEST_STATUS.CLAIMED);
  });

  it("allows PENDING -> DECLINED", () => {
    expect(nextRequestStatus(REQUEST_STATUS.PENDING, "DECLINE")).toBe(REQUEST_STATUS.DECLINED);
  });

  it("allows PENDING -> CANCELLED (requester withdraws before a response)", () => {
    expect(nextRequestStatus(REQUEST_STATUS.PENDING, "CANCEL")).toBe(REQUEST_STATUS.CANCELLED);
  });

  it("allows CLAIMED -> CANCELLED", () => {
    expect(nextRequestStatus(REQUEST_STATUS.CLAIMED, "CANCEL")).toBe(REQUEST_STATUS.CANCELLED);
  });

  it("rejects claiming an already-claimed request", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.CLAIMED, "CLAIM")).toThrow(
      InvalidRequestTransitionError,
    );
  });

  it("rejects accepting/declining an untargeted OPEN request", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.OPEN, "ACCEPT")).toThrow(
      InvalidRequestTransitionError,
    );
    expect(() => nextRequestStatus(REQUEST_STATUS.OPEN, "DECLINE")).toThrow(
      InvalidRequestTransitionError,
    );
  });

  it("rejects completing a request that hasn't been claimed", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.OPEN, "COMPLETE")).toThrow(
      InvalidRequestTransitionError,
    );
    expect(() => nextRequestStatus(REQUEST_STATUS.PENDING, "COMPLETE")).toThrow(
      InvalidRequestTransitionError,
    );
  });

  it("rejects re-requesting a DECLINED request — that requires a new row, not a transition", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.DECLINED, "ACCEPT")).toThrow(
      InvalidRequestTransitionError,
    );
    expect(() => nextRequestStatus(REQUEST_STATUS.DECLINED, "CLAIM")).toThrow(
      InvalidRequestTransitionError,
    );
  });

  it("rejects any transition out of COMPLETED", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.COMPLETED, "CANCEL")).toThrow(
      InvalidRequestTransitionError,
    );
    expect(() => nextRequestStatus(REQUEST_STATUS.COMPLETED, "CLAIM")).toThrow(
      InvalidRequestTransitionError,
    );
  });

  it("rejects any transition out of CANCELLED", () => {
    expect(() => nextRequestStatus(REQUEST_STATUS.CANCELLED, "CLAIM")).toThrow(
      InvalidRequestTransitionError,
    );
  });
});

describe("requestContactVisible", () => {
  const RESPONDED_AT = new Date("2026-01-01T00:00:00Z");

  it("is true for CLAIMED regardless of respondedAt", () => {
    expect(requestContactVisible(REQUEST_STATUS.CLAIMED, null)).toBe(true);
    expect(requestContactVisible(REQUEST_STATUS.CLAIMED, RESPONDED_AT)).toBe(true);
  });

  it("is true for COMPLETED/CANCELLED only when the request was actually claimed first", () => {
    expect(requestContactVisible(REQUEST_STATUS.COMPLETED, RESPONDED_AT)).toBe(true);
    expect(requestContactVisible(REQUEST_STATUS.CANCELLED, RESPONDED_AT)).toBe(true);
  });

  it("is false for a CANCELLED request that never reached CLAIMED (e.g. a withdrawn PENDING pick)", () => {
    expect(requestContactVisible(REQUEST_STATUS.CANCELLED, null)).toBe(false);
  });

  it("is false for PENDING, OPEN, and DECLINED even with a respondedAt set", () => {
    expect(requestContactVisible(REQUEST_STATUS.PENDING, null)).toBe(false);
    expect(requestContactVisible(REQUEST_STATUS.OPEN, null)).toBe(false);
    expect(requestContactVisible(REQUEST_STATUS.DECLINED, RESPONDED_AT)).toBe(false);
  });
});
