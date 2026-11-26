import { describe, it, expect } from "vitest";
import { activeAt, areasFor, TEAM_AREAS } from "../js/areas.js";

const ring = [[26.9, 75.8], [26.9, 75.81], [26.91, 75.81], [26.91, 75.8]];
const list = [
  { id: "a", city: "Jaipur", name: "Checked area", ring, fromHour: 22, toHour: 5, why: "x", source: "https://example.org", reviewed: true },
  { id: "b", city: "Jaipur", name: "Not reviewed yet", ring, fromHour: 22, toHour: 5, why: "x", source: "https://example.org", reviewed: false },
  { id: "c", city: "Rio de Janeiro", name: "Other city", ring, fromHour: 0, toHour: 24, why: "x", source: "https://example.org", reviewed: true },
];

describe("dangerous areas", () => {
  it("knows when an area applies, including past midnight", () => {
    const night = { fromHour: 22, toHour: 5 };
    expect(activeAt(night, 23)).toBe(true);
    expect(activeAt(night, 4)).toBe(true);
    expect(activeAt(night, 12)).toBe(false);
    expect(activeAt({ fromHour: 0, toHour: 24 }, 12)).toBe(true);
  });

  it("returns only reviewed areas for the city, at the right hour", () => {
    expect(areasFor("Jaipur", 23, [], list).map((a) => a.name)).toEqual(["Checked area"]);
    expect(areasFor("Jaipur", 12, [], list)).toEqual([]);
    expect(areasFor("jaipur", 23, [], list)[0].origin).toBe("Beacon's list");
  });

  it("always includes the areas she marked herself", () => {
    const mine = [{ name: "Marked by you", ring }];
    const got = areasFor("Lisbon", 12, mine, list);
    expect(got).toHaveLength(1);
    expect(got[0].origin).toBe("Marked by you");
  });

  it("ships nothing that David hasn't reviewed", () => {
    for (const a of TEAM_AREAS) {
      expect(a.source).toMatch(/^https:\/\//);
      expect(a.ring.length).toBeGreaterThanOrEqual(3);
    }
    expect(areasFor("Jaipur", 23).every((a) => TEAM_AREAS.find((t) => t.name === a.name)?.reviewed)).toBe(true);
  });
});

describe("areas for routing a whole evening", () => {
  it("with no hour, returns every reviewed area of the city, whatever its hours", () => {
    expect(areasFor("Jaipur", null, [], list).map((a) => a.name)).toEqual(["Checked area"]);
  });
});
