import { describe, it, expect } from "vitest";
import { tags } from "@/lib/tags";

describe("tags", () => {
  it("splits and trims comma-separated values", () => {
    expect(tags("Cooking, Hiking,  Photography")).toEqual(["Cooking", "Hiking", "Photography"]);
  });

  it("drops empty segments from stray commas", () => {
    expect(tags("Cooking,,Hiking,")).toEqual(["Cooking", "Hiking"]);
  });

  it("returns an empty array for null, undefined, or empty string", () => {
    expect(tags(null)).toEqual([]);
    expect(tags(undefined)).toEqual([]);
    expect(tags("")).toEqual([]);
  });

  it("returns a single tag for a value with no commas, however long", () => {
    // This is the actual failure mode a free-text sentence hits when typed
    // into a comma-tag field — documented here, not silently "fixed" by
    // truncating, since the real fix is a separate bio field for prose.
    const sentence = "I have been working as an electrical engineer for 5 years.";
    expect(tags(sentence)).toEqual([sentence]);
  });
});
