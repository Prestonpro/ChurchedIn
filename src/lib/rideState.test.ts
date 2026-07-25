import { describe, it, expect } from "vitest";
import { nextRideStatus, rideContactVisible, InvalidRideTransitionError } from "@/lib/rideState";
import { RIDE_STATUS } from "@/lib/constants";

describe("nextRideStatus", () => {
  it("allows OPEN -> CLAIMED", () => {
    expect(nextRideStatus(RIDE_STATUS.OPEN, "CLAIM")).toBe(RIDE_STATUS.CLAIMED);
  });

  it("allows OPEN -> CANCELLED", () => {
    expect(nextRideStatus(RIDE_STATUS.OPEN, "CANCEL")).toBe(RIDE_STATUS.CANCELLED);
  });

  it("allows CLAIMED -> COMPLETED", () => {
    expect(nextRideStatus(RIDE_STATUS.CLAIMED, "COMPLETE")).toBe(RIDE_STATUS.COMPLETED);
  });

  it("allows CLAIMED -> CANCELLED", () => {
    expect(nextRideStatus(RIDE_STATUS.CLAIMED, "CANCEL")).toBe(RIDE_STATUS.CANCELLED);
  });

  it("rejects claiming an already-claimed ride", () => {
    expect(() => nextRideStatus(RIDE_STATUS.CLAIMED, "CLAIM")).toThrow(InvalidRideTransitionError);
  });

  it("rejects completing a ride that hasn't been claimed", () => {
    expect(() => nextRideStatus(RIDE_STATUS.OPEN, "COMPLETE")).toThrow(InvalidRideTransitionError);
  });

  it("rejects any transition out of COMPLETED", () => {
    expect(() => nextRideStatus(RIDE_STATUS.COMPLETED, "CANCEL")).toThrow(InvalidRideTransitionError);
    expect(() => nextRideStatus(RIDE_STATUS.COMPLETED, "CLAIM")).toThrow(InvalidRideTransitionError);
  });

  it("rejects any transition out of CANCELLED", () => {
    expect(() => nextRideStatus(RIDE_STATUS.CANCELLED, "CLAIM")).toThrow(InvalidRideTransitionError);
  });
});

describe("rideContactVisible", () => {
  it("is true for CLAIMED and COMPLETED, false for OPEN and CANCELLED", () => {
    expect(rideContactVisible(RIDE_STATUS.CLAIMED)).toBe(true);
    expect(rideContactVisible(RIDE_STATUS.COMPLETED)).toBe(true);
    expect(rideContactVisible(RIDE_STATUS.OPEN)).toBe(false);
    expect(rideContactVisible(RIDE_STATUS.CANCELLED)).toBe(false);
  });
});
