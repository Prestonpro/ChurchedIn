import { REQUEST_STATUS, type RequestStatus } from "@/lib/constants";

export type RequestAction = "CLAIM" | "ACCEPT" | "DECLINE" | "COMPLETE" | "CANCEL";

/**
 * The HelpRequest state machine — replaces connectionState.ts and folds in
 * rideState.ts's shape. One machine covers both UX flows:
 *   - Blind claim (Furniture/Food/Housing/Other, and untargeted Mentorship):
 *     OPEN --CLAIM--> CLAIMED, same as the old ride machine.
 *   - Targeted pick (Mentorship directory): PENDING --ACCEPT--> CLAIMED,
 *     PENDING --DECLINE--> DECLINED, same as the old connection machine.
 * Unlike the old connection machine, DECLINED has no RE_REQUEST transition —
 * a re-request creates a brand new HelpRequest row (targeting someone else
 * or resubmitting), so DECLINED is terminal here. See
 * MAX_TARGETED_REQUESTS_PER_DAY in constants.ts for the rate limit this
 * implies.
 */
const TRANSITIONS: Record<RequestStatus, Partial<Record<RequestAction, RequestStatus>>> = {
  [REQUEST_STATUS.PENDING]: {
    ACCEPT: REQUEST_STATUS.CLAIMED,
    DECLINE: REQUEST_STATUS.DECLINED,
    CANCEL: REQUEST_STATUS.CANCELLED,
  },
  [REQUEST_STATUS.OPEN]: {
    CLAIM: REQUEST_STATUS.CLAIMED,
    CANCEL: REQUEST_STATUS.CANCELLED,
  },
  [REQUEST_STATUS.CLAIMED]: {
    COMPLETE: REQUEST_STATUS.COMPLETED,
    CANCEL: REQUEST_STATUS.CANCELLED,
  },
  [REQUEST_STATUS.DECLINED]: {},
  [REQUEST_STATUS.COMPLETED]: {},
  [REQUEST_STATUS.CANCELLED]: {},
};

export class InvalidRequestTransitionError extends Error {
  constructor(current: RequestStatus, action: RequestAction) {
    super(`Cannot ${action} a request in status ${current}`);
    this.name = "InvalidRequestTransitionError";
  }
}

export function nextRequestStatus(current: RequestStatus, action: RequestAction): RequestStatus {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new InvalidRequestTransitionError(current, action);
  }
  return next;
}

/**
 * Only once a request is CLAIMED do the requester and claimer see each
 * other's contact info — same non-negotiable safety rule as rides and
 * mentor connections (CLAUDE.md, Non-Negotiable Safety Rules §1).
 *
 * COMPLETED and CANCELLED both need `respondedAt` as a second signal,
 * because unlike rides (which can only reach CANCELLED from OPEN or
 * CLAIMED), a HelpRequest can reach CANCELLED straight from PENDING — a
 * requester withdrawing a targeted pick the claimer never responded to.
 * That row already has `claimerId` set despite never being CLAIMED, so
 * checking status alone would wrongly reveal that pairing's contact info.
 * `respondedAt` is only ever set by the ACCEPT/CLAIM transition, so its
 * presence means the request genuinely passed through CLAIMED at some
 * point before ending — safe to keep visible so that pair can still look
 * back and report if something went wrong.
 */
export function requestContactVisible(
  status: RequestStatus,
  respondedAt: Date | null | undefined,
): boolean {
  if (status === REQUEST_STATUS.CLAIMED) return true;
  if (status === REQUEST_STATUS.COMPLETED || status === REQUEST_STATUS.CANCELLED) {
    return respondedAt != null;
  }
  return false;
}
