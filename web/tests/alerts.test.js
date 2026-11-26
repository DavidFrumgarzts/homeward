import { describe, it, expect } from "vitest";
import { entered, stoppedMinutes, shouldTextStill } from "../js/alerts.js";

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
