import { describe, it, expect } from "vitest";
import { isWithinReminderWindow, reminderWindowBounds } from "@/lib/eventReminders";

const NOW = new Date("2026-07-30T14:00:00Z");

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000);
}

describe("isWithinReminderWindow", () => {
  it("is true for an event exactly 24 hours out", () => {
    expect(isWithinReminderWindow(hoursFromNow(24), NOW)).toBe(true);
  });

  it("is true at the lower boundary (12 hours out)", () => {
    expect(isWithinReminderWindow(hoursFromNow(12), NOW)).toBe(true);
  });

  it("is true at the upper boundary (36 hours out)", () => {
    expect(isWithinReminderWindow(hoursFromNow(36), NOW)).toBe(true);
  });

  it("is false just under the lower boundary", () => {
    expect(isWithinReminderWindow(hoursFromNow(11.9), NOW)).toBe(false);
  });

  it("is false just over the upper boundary", () => {
    expect(isWithinReminderWindow(hoursFromNow(36.1), NOW)).toBe(false);
  });

  it("is false for an event happening in an hour (too soon)", () => {
    expect(isWithinReminderWindow(hoursFromNow(1), NOW)).toBe(false);
  });

  it("is false for an event that already happened", () => {
    expect(isWithinReminderWindow(hoursFromNow(-2), NOW)).toBe(false);
  });

  it("is false for an event a week out", () => {
    expect(isWithinReminderWindow(hoursFromNow(24 * 7), NOW)).toBe(false);
  });
});

describe("reminderWindowBounds", () => {
  it("returns a 24-hour-wide window starting 12 hours out", () => {
    const { from, to } = reminderWindowBounds(NOW);
    expect(from.getTime() - NOW.getTime()).toBe(12 * 60 * 60 * 1000);
    expect(to.getTime() - NOW.getTime()).toBe(36 * 60 * 60 * 1000);
  });
});
