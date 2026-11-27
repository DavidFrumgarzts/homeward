import { describe, it, expect } from "vitest";
import { areaPrompt, readAreas, ringFrom, areaKm2, needsAreaResearch } from "../js/arearesearch.js";

const answer = (areas) => "Here you go:\n```json\n" + JSON.stringify({ areas }) + "\n```";
const good = {
  name: "Rua dos Inválidos, Lapa", place: "Rua dos Inválidos", why: "Phone robberies of tourists after the bars close.",
  fromHour: 23, toHour: 5,
  sources: [{ url: "https://safetravel.govt.nz/brazil", type: "official" }, { url: "https://www.reddit.com/r/rio/comments/abc", type: "traveler" }],
};

describe("asking for areas", () => {
  it("asks for specific places, sources, night hours, and no areas named for who lives there", () => {
    const p = areaPrompt("Jaipur", "India", "2026-11-27");
    expect(p).toMatch(/Jaipur, India/);
    expect(p).toMatch(/at least 2/i);
    expect(p).toMatch(/religion|ethnicity/i);
    expect(p).toMatch(/"areas"/);
  });
});

describe("reading the answer", () => {
  it("keeps an area with 2 sources from different sites, marked official when one is official or news", () => {
    const [a] = readAreas(answer([good]));
    expect(a).toMatchObject({ name: "Rua dos Inválidos, Lapa", place: "Rua dos Inválidos", fromHour: 23, toHour: 5, official: true });
    expect(a.sources.map((s) => s.site)).toEqual(["safetravel.govt.nz", "reddit.com"]);
  });
  it("drops areas with fewer than 2 different sites", () => {
    const twoReddit = { ...good, sources: [{ url: "https://reddit.com/a", type: "traveler" }, { url: "https://www.reddit.com/b", type: "traveler" }] };
    expect(readAreas(answer([twoReddit]))).toEqual([]);
    expect(readAreas(answer([{ ...good, sources: [good.sources[0]] }]))).toEqual([]);
  });
  it("only travelers' posts: kept, but not official (no automatic alert)", () => {
    const s = [{ url: "https://reddit.com/a", type: "traveler" }, { url: "https://tripadvisor.com/b", type: "traveler" }];
    expect(readAreas(answer([{ ...good, sources: s }]))[0].official).toBe(false);
  });
  it("with search results known, keeps only sources from sites the search really found", () => {
    expect(readAreas(answer([good]), ["safetravel.govt.nz"])).toEqual([]);
    expect(readAreas(answer([good]), ["safetravel.govt.nz", "reddit.com"])).toHaveLength(1);
  });
  it("never keeps an area described by who lives there", () => {
    expect(readAreas(answer([{ ...good, name: "The Muslim quarter" }]))).toEqual([]);
    expect(readAreas(answer([{ ...good, why: "A poor immigrant neighbourhood" }]))).toEqual([]);
  });
  it("cleans hours, caps the list, ignores junk", () => {
    const [a] = readAreas(answer([{ ...good, fromHour: "late", toHour: 99 }]));
    expect([a.fromHour, a.toHour]).toEqual([21, 5]);
    expect(readAreas(answer(Array.from({ length: 12 }, (_, i) => ({ ...good, name: `Street ${i}` }))))).toHaveLength(8);
    expect(readAreas("no json here")).toEqual([]);
    expect(readAreas(answer([{ ...good, sources: [{ url: "http://a.com" }, { url: "javascript:x" }] }]))).toEqual([]);
  });
});

describe("turning a map result into an area", () => {
  it("a neighbourhood polygon: its outline, at most 40 points", () => {
    const pts = Array.from({ length: 100 }, (_, i) => [75.80 + 0.003 * Math.cos(i / 16), 26.92 + 0.003 * Math.sin(i / 16)]);
    const r = ringFrom({ type: "Polygon", coordinates: [pts] });
    expect(r.length).toBeLessThanOrEqual(40);
    expect(r[0][0]).toBeCloseTo(26.92 + 0.003 * Math.sin(0), 5);
  });
  it("a street: a band about 40 m either side of it", () => {
    const r = ringFrom({ type: "LineString", coordinates: [[75.80, 26.92], [75.81, 26.92]] });
    expect(r).toHaveLength(4);
    const lats = r.map((p) => p[0]);
    expect((Math.max(...lats) - Math.min(...lats)) * 111320).toBeGreaterThan(70);
    expect((Math.max(...lats) - Math.min(...lats)) * 111320).toBeLessThan(90);
  });
  it("a single point: a square about 300 m wide", () => {
    const r = ringFrom({ type: "Point", coordinates: [75.80, 26.92] });
    expect(areaKm2(r)).toBeGreaterThan(0.07);
    expect(areaKm2(r)).toBeLessThan(0.11);
  });
  it("whole districts are too big to flag", () => {
    const big = [[75.7, 26.8], [75.9, 26.8], [75.9, 27.0], [75.7, 27.0], [75.7, 26.8]];
    expect(ringFrom({ type: "Polygon", coordinates: [big] })).toBeNull();
  });
});

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
