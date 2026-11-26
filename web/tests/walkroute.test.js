import { describe, it, expect } from "vitest";
import { buildGraph, route, walkable, pack, unpack, directionTo, markDanger } from "../js/walkroute.js";

// A rectangle of streets: A (bottom-left) to B (top-right).
// Short way: up the left side (service road, 200 m) then along the top (service, 300 m).
// Long way: along the bottom (primary, lit, 300 m) then up the right side (primary, lit, 220 m), a little longer.
const P = (lat, lon) => ({ lat, lon });
const A = P(26.9, 75.8), TL = P(26.9018, 75.8), TR = P(26.9018, 75.803), BR = P(26.9, 75.803), B = TR;
const BR2 = P(26.8998, 75.8031); // the bottom-right corner bulges out a little, so the primary way is longer
const ways = [
  { tags: { highway: "service", name: "Back Lane" }, geometry: [A, TL] },
  { tags: { highway: "service", name: "Back Lane" }, geometry: [TL, TR] },
  { tags: { highway: "primary", lit: "yes", name: "MI Road" }, geometry: [A, BR2] },
  { tags: { highway: "primary", lit: "yes", name: "Station Road" }, geometry: [BR2, BR, TR] },
  { tags: { highway: "motorway", name: "Expressway" }, geometry: [A, TR] },
];
const from = [A.lat, A.lon], to = [B.lat, B.lon];

describe("router", () => {
  it("fastest takes the short back lanes, safe takes the lit main roads", () => {
    const g = buildGraph(ways);
    const fast = route(g, from, to, "fastest"), safe = route(g, from, to, "safe");
    expect(fast.metres).toBeLessThan(safe.metres);
    expect(fast.steps.map((s) => s.name)).toContain("Back Lane");
    expect(safe.steps.map((s) => s.name)).toEqual(expect.arrayContaining(["MI Road", "Station Road"]));
  });

  it("goes around an area to avoid, and says when the fastest way crosses it", () => {
    const overMain = [[26.8995, 75.8025], [26.8995, 75.8035], [26.902, 75.8035], [26.902, 75.8025]];
    const g = buildGraph(ways, [overMain]);
    const safe = route(g, from, to, "safe");
    expect(safe.steps.map((s) => s.name)).toContain("Back Lane");
    expect(safe.dangerMetres).toBe(0);
    const g2 = buildGraph(ways, [[[26.9005, 75.7995], [26.9005, 75.8005], [26.9013, 75.8005], [26.9013, 75.7995]]]); // over the back lane
    expect(route(g2, from, to, "fastest").dangerMetres).toBeGreaterThan(0);
  });

  it("re-marks areas without downloading streets again", () => {
    const g = buildGraph(ways);
    markDanger(g, [[[26.8995, 75.8025], [26.8995, 75.8035], [26.902, 75.8035], [26.902, 75.8025]]]);
    expect(route(g, from, to, "safe").steps.map((s) => s.name)).toContain("Back Lane");
  });

  it("never walks on motorways or where foot access is forbidden", () => {
    expect(walkable({ highway: "motorway" })).toBe(false);
    expect(walkable({ highway: "footway", foot: "no" })).toBe(false);
    expect(walkable({ highway: "residential" })).toBe(true);
    expect(route(buildGraph(ways), from, to, "fastest").steps.map((s) => s.name)).not.toContain("Expressway");
  });

  it("a saved graph routes the same as the original", () => {
    const g = buildGraph(ways);
    expect(route(unpack(pack(g)), from, to, "safe").metres).toBe(route(g, from, to, "safe").metres);
  });

  it("returns null when the two points aren't connected", () => {
    const g = buildGraph([{ tags: { highway: "residential" }, geometry: [P(26.9, 75.8), P(26.901, 75.8)] }, { tags: { highway: "residential" }, geometry: [P(26.95, 75.85), P(26.951, 75.85)] }]);
    expect(route(g, [26.9, 75.8], [26.951, 75.85])).toBeNull();
  });

  it("gives direction and distance when there's no route", () => {
    const d = directionTo([26.9, 75.8], [26.91, 75.8]);
    expect(d.compass).toBe("N");
    expect(Math.abs(d.metres - 1112)).toBeLessThanOrEqual(5);
    expect(directionTo([26.9, 75.8], [26.9, 75.81]).compass).toBe("E");
  });
});
