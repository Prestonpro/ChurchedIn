import { describe, it, expect } from "vitest";
import { eventPinStatus } from "@/lib/eventMapStatus";

const base = {
  confirmedAttendees: 0,
  studentCap: null as number | null,
  confirmedHelpers: 0,
  volunteerCap: null as number | null,
  hasMyRsvp: false,
};

describe("eventPinStatus", () => {
  it("is 'rsvped' whenever the viewer has RSVP'd, regardless of capacity", () => {
    expect(eventPinStatus({ ...base, hasMyRsvp: true, confirmedAttendees: 10, studentCap: 10 })).toBe(
      "rsvped",
    );
  });

  it("is 'available' when both caps are uncapped", () => {
    expect(eventPinStatus(base)).toBe("available");
  });

  it("is 'available' below 80% of the tighter cap", () => {
    expect(eventPinStatus({ ...base, confirmedAttendees: 5, studentCap: 10 })).toBe("available");
  });

  it("is 'almost-full' at or above 80% of a cap", () => {
    expect(eventPinStatus({ ...base, confirmedAttendees: 8, studentCap: 10 })).toBe("almost-full");
  });

  it("is 'full' at or above 100% of a cap", () => {
    expect(eventPinStatus({ ...base, confirmedAttendees: 10, studentCap: 10 })).toBe("full");
  });

  it("uses whichever bucket (student or volunteer) is more constrained", () => {
    expect(
      eventPinStatus({ ...base, confirmedAttendees: 1, studentCap: 10, confirmedHelpers: 5, volunteerCap: 5 }),
    ).toBe("full");
  });

  it("treats a cap of 0 as 'not counted', not 'always full'", () => {
    // studentCap: 0 means "not accepting attendees" — shouldn't make the
    // whole event read as full when volunteers can still freely RSVP.
    expect(eventPinStatus({ ...base, studentCap: 0, volunteerCap: null })).toBe("available");
  });
});
