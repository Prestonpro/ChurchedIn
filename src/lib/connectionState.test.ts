import { describe, it, expect } from "vitest";
import {
  nextConnectionStatus,
  contactInfoVisible,
  InvalidConnectionTransitionError,
} from "@/lib/connectionState";
import { CONNECTION_STATUS } from "@/lib/constants";

describe("nextConnectionStatus", () => {
  it("allows PENDING -> ACCEPTED", () => {
    expect(nextConnectionStatus(CONNECTION_STATUS.PENDING, "ACCEPT")).toBe(
      CONNECTION_STATUS.ACCEPTED,
    );
  });

  it("allows PENDING -> DECLINED", () => {
    expect(nextConnectionStatus(CONNECTION_STATUS.PENDING, "DECLINE")).toBe(
      CONNECTION_STATUS.DECLINED,
    );
  });

  it("allows DECLINED -> PENDING via re-request", () => {
    expect(nextConnectionStatus(CONNECTION_STATUS.DECLINED, "RE_REQUEST")).toBe(
      CONNECTION_STATUS.PENDING,
    );
  });

  it("allows ACCEPTED -> ENDED", () => {
    expect(nextConnectionStatus(CONNECTION_STATUS.ACCEPTED, "END")).toBe(
      CONNECTION_STATUS.ENDED,
    );
  });

  it("rejects double-accepting an already-accepted connection", () => {
    expect(() => nextConnectionStatus(CONNECTION_STATUS.ACCEPTED, "ACCEPT")).toThrow(
      InvalidConnectionTransitionError,
    );
  });

  it("rejects re-requesting a connection that was never declined", () => {
    expect(() => nextConnectionStatus(CONNECTION_STATUS.PENDING, "RE_REQUEST")).toThrow(
      InvalidConnectionTransitionError,
    );
  });

  it("rejects any transition out of ENDED", () => {
    expect(() => nextConnectionStatus(CONNECTION_STATUS.ENDED, "RE_REQUEST")).toThrow(
      InvalidConnectionTransitionError,
    );
    expect(() => nextConnectionStatus(CONNECTION_STATUS.ENDED, "ACCEPT")).toThrow(
      InvalidConnectionTransitionError,
    );
  });

  it("rejects ending a connection that was only ever declined, never accepted", () => {
    expect(() => nextConnectionStatus(CONNECTION_STATUS.DECLINED, "END")).toThrow(
      InvalidConnectionTransitionError,
    );
  });
});

describe("contactInfoVisible", () => {
  it("is true only for ACCEPTED", () => {
    expect(contactInfoVisible(CONNECTION_STATUS.ACCEPTED)).toBe(true);
    expect(contactInfoVisible(CONNECTION_STATUS.PENDING)).toBe(false);
    expect(contactInfoVisible(CONNECTION_STATUS.DECLINED)).toBe(false);
    expect(contactInfoVisible(CONNECTION_STATUS.ENDED)).toBe(false);
  });
});
