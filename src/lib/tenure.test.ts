import { describe, it, expect } from "vitest";
import { formatTenure } from "@/lib/tenure";

const NOW = new Date("2026-08-01T00:00:00.000Z");

describe("formatTenure", () => {
  it("reads as new for someone who joined today", () => {
    expect(formatTenure(new Date("2026-08-01T00:00:00.000Z"), NOW)).toBe("New here");
  });

  it("reads as new right up to the 30-day boundary", () => {
    expect(formatTenure(new Date("2026-07-03T00:00:00.000Z"), NOW)).toBe("New here"); // 29 days
    expect(formatTenure(new Date("2026-07-02T00:00:00.000Z"), NOW)).toBe("Member for 1 month"); // 30 days
  });

  it("rounds down to whole months, minimum 1", () => {
    expect(formatTenure(new Date("2026-07-01T00:00:00.000Z"), NOW)).toBe("Member for 1 month"); // 31 days
    expect(formatTenure(new Date("2026-05-01T00:00:00.000Z"), NOW)).toBe("Member for 3 months"); // 92 days
  });

  it("uses singular/plural correctly for months", () => {
    expect(formatTenure(new Date("2026-06-03T00:00:00.000Z"), NOW)).toBe("Member for 1 month"); // 59 days
    expect(formatTenure(new Date("2026-06-02T00:00:00.000Z"), NOW)).toBe("Member for 2 months"); // 60 days
  });

  it("switches to years at exactly 365 days, not before", () => {
    expect(formatTenure(new Date("2025-08-02T00:00:00.000Z"), NOW)).toBe("Member for 12 months"); // 364 days
    expect(formatTenure(new Date("2025-08-01T00:00:00.000Z"), NOW)).toBe("Member for 1 year"); // 365 days
  });

  it("uses singular/plural for years", () => {
    expect(formatTenure(new Date("2024-08-01T00:00:00.000Z"), NOW)).toBe("Member for 2 years"); // 730 days
  });
});
