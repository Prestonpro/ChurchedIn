import { RIDE_STATUS, type RideStatus } from "@/lib/constants";

export type RideAction = "CLAIM" | "COMPLETE" | "CANCEL";

/**
 * The ride-request state machine, kept as a pure function so it's directly
 * unit-testable — same shape as connectionState.ts's mentor-connection
 * machine. Simpler than that one: no decline/re-request dance, just OPEN
 * until a volunteer claims it.
 */
const TRANSITIONS: Record<RideStatus, Partial<Record<RideAction, RideStatus>>> = {
  [RIDE_STATUS.OPEN]: {
    CLAIM: RIDE_STATUS.CLAIMED,
    CANCEL: RIDE_STATUS.CANCELLED,
  },
  [RIDE_STATUS.CLAIMED]: {
    COMPLETE: RIDE_STATUS.COMPLETED,
    CANCEL: RIDE_STATUS.CANCELLED,
  },
  [RIDE_STATUS.COMPLETED]: {},
  [RIDE_STATUS.CANCELLED]: {},
};

export class InvalidRideTransitionError extends Error {
  constructor(current: RideStatus, action: RideAction) {
    super(`Cannot ${action} a ride request in status ${current}`);
    this.name = "InvalidRideTransitionError";
  }
}

export function nextRideStatus(current: RideStatus, action: RideAction): RideStatus {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new InvalidRideTransitionError(current, action);
  }
  return next;
}

/** Only once a ride is CLAIMED (or COMPLETED, since it was CLAIMED to get
 * there) do the student and volunteer see each other's contact info — same
 * non-negotiable safety rule as mentor connections (PLAN.md section 8). */
export function rideContactVisible(status: RideStatus): boolean {
  return status === RIDE_STATUS.CLAIMED || status === RIDE_STATUS.COMPLETED;
}
