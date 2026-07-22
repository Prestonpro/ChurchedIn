import { CONNECTION_STATUS, type ConnectionStatus } from "@/lib/constants";

export type ConnectionAction = "ACCEPT" | "DECLINE" | "RE_REQUEST" | "END";

/**
 * The mentor-connection state machine, kept as a pure function so it's
 * directly unit-testable. There is exactly one MentorConnection row per
 * student/mentor pair (unique constraint in the schema), so "re-requesting
 * after a decline" is a state transition on the existing row (DECLINED ->
 * PENDING), not a new row.
 */
const TRANSITIONS: Record<
  ConnectionStatus,
  Partial<Record<ConnectionAction, ConnectionStatus>>
> = {
  [CONNECTION_STATUS.PENDING]: {
    ACCEPT: CONNECTION_STATUS.ACCEPTED,
    DECLINE: CONNECTION_STATUS.DECLINED,
  },
  [CONNECTION_STATUS.ACCEPTED]: {
    END: CONNECTION_STATUS.ENDED,
  },
  [CONNECTION_STATUS.DECLINED]: {
    RE_REQUEST: CONNECTION_STATUS.PENDING,
  },
  [CONNECTION_STATUS.ENDED]: {},
};

export class InvalidConnectionTransitionError extends Error {
  constructor(current: ConnectionStatus, action: ConnectionAction) {
    super(`Cannot ${action} a connection in status ${current}`);
    this.name = "InvalidConnectionTransitionError";
  }
}

export function nextConnectionStatus(
  current: ConnectionStatus,
  action: ConnectionAction,
): ConnectionStatus {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new InvalidConnectionTransitionError(current, action);
  }
  return next;
}

/** Only an ACCEPTED connection reveals contact info — see the safety rule in PLAN.md section 8. */
export function contactInfoVisible(status: ConnectionStatus): boolean {
  return status === CONNECTION_STATUS.ACCEPTED;
}
