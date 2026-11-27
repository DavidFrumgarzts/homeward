import { describe, it, expect } from "vitest";
import { entered, stoppedMinutes, shouldTextStill, dangerTexts, textableAreas } from "../js/alerts.js";
import { areasFor } from "../js/areas.js";
import { hotspots, inZone } from "../js/unsafe.js";

const ring = [[26.9262, 75.8118], [26.9262, 75.8142], [26.938, 75.817], [26.938, 75.814]];
const area = { id: "jaipur-nahargarh-road", name: "Nahargarh Fort road", ring };
const T = 1_800_000_000_000, MIN = 60000;

describe("walked into a dangerous area", () => {
  it("reports an area only on the way in, not while she stays inside", () => {
    const a = entered([26.93, 75.814], [area], new Set());
    expect(a.entered.map((x) => x.name)).toEqual(["Nahargarh Fort road"]);
    expect(entered([26.931, 75.8141], [area], a.inside).entered).toEqual([]);
  });
  it("leaving and coming back counts again", () => {
    const out = entered([26.95, 75.85], [area], new Set(["jaipur-nahargarh-road"]));
    expect(out.inside.size).toBe(0);
    expect(entered([26.93, 75.814], [area], out.inside).entered).toHaveLength(1);
  });
});

describe("hasn't moved", () => {
  const p = (min, dLat = 0) => ({ lat: 26.92 + dLat, lng: 75.79, t: T - min * MIN });
  it("counts the minutes she's stayed within 40 m", () => {
    expect(stoppedMinutes([p(20, 0.01), p(6), p(4), p(2), p(0)], T)).toBe(6);
  });
  it("0 when she's moving", () => { expect(stoppedMinutes([p(4, 0.002), p(2, 0.001), p(0)], T)).toBe(0); });
  it("0 when the last position is old (GPS stopped), so no false alarm", () => {
    expect(stoppedMinutes([p(20), p(15), p(10)], T)).toBe(0);
  });
});

describe("when to text that she stopped", () => {
  const trip = { home: [26.90, 75.78], place: { at: [26.95, 75.82] }, savedAt: T - 3 * 3600000 };
  const at = [26.92, 75.79];
  it("on the way back, stopped 5+ minutes, not texted for this stop yet", () => {
    expect(shouldTextStill({ trip, at, minutes: 6, now: T, textedThisStop: false })).toBe(true);
    expect(shouldTextStill({ trip, at, minutes: 6, now: T, textedThisStop: true })).toBe(false);
    expect(shouldTextStill({ trip, at, minutes: 3, now: T, textedThisStop: false })).toBe(false);
  });
  it("not at the place she went to, not at home, not without a recent trip", () => {
    expect(shouldTextStill({ trip, at: [26.9501, 75.8201], minutes: 30, now: T })).toBe(false);
    expect(shouldTextStill({ trip, at: [26.9001, 75.7801], minutes: 30, now: T })).toBe(false);
    expect(shouldTextStill({ trip: null, at, minutes: 30, now: T })).toBe(false);
    expect(shouldTextStill({ trip: { ...trip, savedAt: T - 20 * 3600000 }, at, minutes: 30, now: T })).toBe(false);
  });
});

// The automatic "danger" text costs money (Twilio) and alarms her family: only David's reviewed list and her own
// marks may send it. Red zones from police data and OpenStreetMap notes never do.
describe("who can trigger the automatic danger text", () => {
  const at = [26.93, 75.814];
  const police = hotspots(Array.from({ length: 30 }, (_, i) => ({ lat: 26.93 + (i % 5) * 0.0001, lng: 75.814 + Math.floor(i / 5) * 0.0001, kind: "robbery" })),
    { origin: "Police data", period: "last 12 months", night: true })[0];
  const team = { ...area, origin: "Beacon's list" }, mine = { name: "Marked by you", ring, origin: "Marked by you" };
  it("the police-data zone really is where she is (so the test means something)", () => {
    expect(inZone(at, police)).toBe(true);
  });
  it("walking into a police-data zone texts no one", () => {
    expect(dangerTexts(at, [police], new Set(), {}, T).text).toEqual([]);
    expect(dangerTexts(at, [{ ...area, origin: "Quiet after dark" }], new Set(), {}, T).text).toEqual([]);
    expect(dangerTexts(at, [{ ...area }], new Set(), {}, T).text).toEqual([]); // no origin: not allowed either
  });
  it("Beacon's list and her own marks do, once an hour per area", () => {
    const last = {};
    expect(dangerTexts(at, [police, team], new Set(), last, T).text.map((a) => a.origin)).toEqual(["Beacon's list"]);
    expect(dangerTexts(at, [team], new Set(), last, T + 10 * MIN).text).toEqual([]);
    expect(dangerTexts(at, [team], new Set(), last, T + 61 * MIN).text).toHaveLength(1);
    expect(dangerTexts(at, [mine], new Set(), {}, T).text).toHaveLength(1);
  });
  it("Beacon's list still needs David's review", () => {
    const list = [{ id: "x", city: "Jaipur", name: "Unreviewed", ring, fromHour: 0, toHour: 24, reviewed: false }];
    expect(textableAreas(areasFor("Jaipur", null, [], list))).toEqual([]);
    expect(textableAreas(areasFor("Jaipur", null, [], [{ ...list[0], reviewed: true }]))).toHaveLength(1);
  });
});

describe("researched areas and the automatic alert", () => {
  const ring = [[26.92, 75.80], [26.92, 75.81], [26.93, 75.81], [26.93, 75.80]];
  it("alert only when an official or news source reports it; travelers' posts alone only colour the map", () => {
    const official = { name: "A", ring, origin: "Reported online", official: true };
    const posts = { name: "B", ring, origin: "Reported online", official: false };
    expect(textableAreas([official, posts]).map((a) => a.name)).toEqual(["A"]);
  });
});
