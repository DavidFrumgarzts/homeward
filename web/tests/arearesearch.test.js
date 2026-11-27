import { describe, it, expect } from "vitest";
import { needsAreaResearch } from "../js/arearesearch.js";

// The research rules (quotes, identity words, shapes) are tested in backend/functions/areas.test.js.
describe("when to research again", () => {
  it("every 14 days per city, online only, and not again within an hour of a failed try", () => {
    const now = 1_800_000_000_000;
    expect(needsAreaResearch(null, now, true)).toBe(true);
    expect(needsAreaResearch(null, now, false)).toBe(false);
    expect(needsAreaResearch({ savedAt: now - 3 * 864e5 }, now, true)).toBe(false);
    expect(needsAreaResearch({ savedAt: now - 15 * 864e5 }, now, true)).toBe(true);
    expect(needsAreaResearch({ savedAt: 0, triedAt: now - 600000 }, now, true)).toBe(false);
  });
});
