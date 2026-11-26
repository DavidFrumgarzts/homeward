import { describe, it, expect } from "vitest";
import { boxFor, placeFromPlan, readPlace, placePrompt, nightRings, driveText, googleMapsLink } from "../js/trip.js";
import { meters } from "../js/walkroute.js";

describe("trip planning", () => {
  it("the street box holds both points with at least 700 m to spare", () => {
    const a = [26.9157, 75.8069], b = [26.8975, 75.8160];
    const [s, w, n, e] = boxFor(a, b);
    for (const p of [a, b]) {
      expect(meters(p, [s, p[1]])).toBeGreaterThanOrEqual(700);
      expect(meters(p, [n, p[1]])).toBeGreaterThanOrEqual(700);
      expect(meters(p, [p[0], w])).toBeGreaterThanOrEqual(700);
      expect(meters(p, [p[0], e])).toBeGreaterThanOrEqual(700);
    }
  });

  it("finds the place in a plan without AI", () => {
    expect(placeFromPlan("Tonight I'm going to Bar Palladio, then back to my hotel.")).toBe("Bar Palladio");
    expect(placeFromPlan("I want to visit Hawa Mahal tomorrow")).toBe("Hawa Mahal tomorrow");
    expect(placeFromPlan("going to the City Palace then dinner")).toBe("the City Palace");
    expect(placeFromPlan("hi")).toBeNull();
  });

  it("reads the AI's answer, with or without a code fence", () => {
    expect(readPlace('```json\n{"place": "Bar Palladio"}\n```')).toBe("Bar Palladio");
    expect(readPlace('{"place": ""}')).toBeNull();
    expect(readPlace("no idea")).toBeNull();
    expect(placePrompt("x")).toContain('{"place"');
  });

  it("lights up safe places from 9 p.m. to 6 a.m.", () => {
    expect(nightRings(21)).toBe(true);
    expect(nightRings(2)).toBe(true);
    expect(nightRings(6)).toBe(false);
    expect(nightRings(20)).toBe(false);
  });

  it("says drive times the way people do", () => {
    expect(driveText({ name: "AIIMS Jodhpur", minutes: 220 })).toBe("AIIMS Jodhpur, 3 h 40 by car");
    expect(driveText({ name: "SMS Hospital", minutes: 12 })).toBe("SMS Hospital, 12 min by car");
    expect(driveText({ name: "X", minutes: 60 })).toBe("X, 1 h by car");
  });

  it("hands a drive to Google Maps", () => {
    const url = googleMapsLink([26.9, 75.8], [26.2, 73.0]);
    expect(url).toContain("travelmode=driving");
    expect(url).toContain("origin=26.9,75.8");
    expect(url).toContain("destination=26.2,73");
  });
});

import { cleanCity } from "../js/trip.js";
describe("city names", () => {
  it("drops the council part of official names", () => {
    expect(cleanCity("Jaipur Municipal Corporation")).toBe("Jaipur");
    expect(cleanCity("Greater Mumbai Municipal Corporation")).toBe("Greater Mumbai");
    expect(cleanCity("Município do Rio de Janeiro")).toBe("Rio de Janeiro");
    expect(cleanCity("Lisbon")).toBe("Lisbon");
  });
});

import { isPlanning, isEmergency } from "../js/trip.js";
describe("planning vs asking for help", () => {
  it("only plans a trip on clear planning words", () => {
    expect(isPlanning("Tonight I'm going to Bar Palladio, then back to my hotel.")).toBe(true);
    expect(isPlanning("I'm heading to Hawa Mahal later")).toBe(true);
    expect(isPlanning("Where should I go to get help?")).toBe(false);
    expect(isPlanning("I want to go to a hospital")).toBe(false);
  });
  it("puts emergencies first", () => {
    expect(isEmergency("I'm going to the hospital, I feel sick")).toBe(true);
    expect(isEmergency("Tonight I'm going to Bar Palladio")).toBe(false);
  });
});
