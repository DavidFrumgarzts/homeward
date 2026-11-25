// The web demo pack (js/pack.js, drawn on the map's own grid) must tell the same facts as
// shared/fixtures/rio-lapa-pack.json, which Android and iOS use. If this fails, fix both together.
import { describe, expect, test } from "vitest";
import { pack } from "../js/pack.js";
import { spotToGps } from "../js/map.js";
import { metersBetween } from "../js/timeline.js";
import { shared } from "./vectors.js";

const fixture = shared("fixtures/rio-lapa-pack.json");
const NEAR_METERS = 30;

describe("js/pack.js against the shared Rio pack", () => {
  test("city, country and numbers", () => {
    expect(pack.city).toBe(fixture.city);
    expect(pack.country).toBe(fixture.country);
    expect(pack.police).toBe(fixture.police);
    expect(pack.ambulance).toBe(fixture.ambulance);
    expect(pack.embassy).toEqual({ name: fixture.embassyName, phone: fixture.embassyPhone });
  });
  test("phrases, in the same order", () => {
    expect(pack.phrases).toEqual(fixture.localPhrases.map((p) => [p.english, p.local]));
  });
  test("the red zone: name, hours, reason, and where it sits", () => {
    const red = fixture.zones.find((z) => z.level === "Avoid"), z = pack.zone;
    expect(z.name).toBe(red.name);
    expect([z.fromHour, z.toHour]).toEqual([red.riskyFromHour, red.riskyToHour]);
    expect(red.reasons).toContain(z.reason);
    // The drawn zone is an oval; its edges must sit within 30 m of the fixture's box.
    const lats = red.polygon.map((p) => p[0]), lngs = red.polygon.map((p) => p[1]);
    const top = spotToGps({ x: z.cx, y: z.cy - z.ry }), bottom = spotToGps({ x: z.cx, y: z.cy + z.ry });
    const left = spotToGps({ x: z.cx - z.rx, y: z.cy }), right = spotToGps({ x: z.cx + z.rx, y: z.cy });
    expect(metersBetween(top, { lat: Math.max(...lats), lng: top.lng })).toBeLessThan(NEAR_METERS);
    expect(metersBetween(bottom, { lat: Math.min(...lats), lng: bottom.lng })).toBeLessThan(NEAR_METERS);
    expect(metersBetween(left, { lat: left.lat, lng: Math.min(...lngs) })).toBeLessThan(NEAR_METERS);
    expect(metersBetween(right, { lat: right.lat, lng: Math.max(...lngs) })).toBeLessThan(NEAR_METERS);
  });
  test("the busier street is the fixture's safer zone", () => {
    expect(fixture.zones.filter((z) => z.level === "Safer").map((z) => z.name)).toContain(pack.zone.saferStreet);
  });
  test("places: same names, kinds and hours, drawn within 30 m of the real spot", () => {
    expect(pack.places.map((p) => p.name)).toEqual(fixture.safePlaces.map((p) => p.name));
    pack.places.forEach((place, i) => {
      const real = fixture.safePlaces[i];
      expect(place.kind).toBe(real.kind);
      expect(place.open24h).toBe(real.open24h);
      expect(metersBetween(spotToGps(place), real)).toBeLessThan(NEAR_METERS);
    });
  });
});
