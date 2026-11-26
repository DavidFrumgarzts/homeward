import { describe, it, expect } from "vitest";
import { SAMPLE_BOOKING, bookingPrompt, readBooking, hospitalWarning, gmailQuery, plainText } from "../js/booking.js";

describe("booking", () => {
  it("the sample is a made-up camp near Sam, Jaisalmer, with no real business named", () => {
    expect(SAMPLE_BOOKING).toMatch(/Sam/);
    expect(SAMPLE_BOOKING).toMatch(/Jaisalmer/);
    expect(SAMPLE_BOOKING).toMatch(/sample/i);
  });

  it("asks the AI for the booking as JSON", () => {
    const p = bookingPrompt("Your stay at X");
    expect(p).toContain('"hotel"');
    expect(p).toContain("Your stay at X");
  });

  it("reads the AI's answer, and refuses one without a hotel or a city", () => {
    const b = readBooking('```json\n{"hotel": "Desert Camp", "address": "Sam Sand Dunes Road", "city": "Sam", "country": "India", "checkIn": "2026-12-03", "checkOut": "2026-12-07"}\n```');
    expect(b).toEqual({ hotel: "Desert Camp", address: "Sam Sand Dunes Road", city: "Sam", country: "India", checkIn: "2026-12-03", checkOut: "2026-12-07" });
    expect(readBooking('{"hotel": "X", "city": ""}')).toBeNull();
    expect(readBooking("I can't tell")).toBeNull();
  });

  it("warns when no hospital is within a 30-minute drive", () => {
    expect(hospitalWarning(null)).toEqual({ warn: true, text: "No hospital found within 60 km. Save the ambulance number and plan how you'd get help." });
    const far = hospitalWarning({ name: "Jawahar Hospital", minutes: 52 });
    expect(far.warn).toBe(true);
    expect(far.text).toBe("No hospital within a 30-min drive. Nearest: Jawahar Hospital, 52 min by car.");
    const near = hospitalWarning({ name: "SMS Hospital", minutes: 12 });
    expect(near).toEqual({ warn: false, text: "Nearest hospital: SMS Hospital, 12 min by car." });
  });

  it("searches Gmail only for recent hotel bookings", () => {
    expect(gmailQuery).toContain("newer_than:6m");
    expect(gmailQuery).toMatch(/hotel/);
  });

  it("turns an HTML email into plain text", () => {
    expect(plainText("<p>Check-in: <b>3 Dec</b></p><style>x{}</style>")).toBe("Check-in: 3 Dec");
  });
});

import { readBookingPlain, SAMPLE_BOOKING as SB } from "../js/booking.js";
describe("booking review fixes", () => {
  it("says when hospitals couldn't be checked, instead of 'no hospital'", () => {
    expect(hospitalWarning(undefined, { failed: true })).toEqual({ warn: false, unknown: true, text: "Couldn't check hospitals right now. Beacon tries again when you're online." });
    expect(hospitalWarning(null, { found: 12 })).toEqual({ warn: false, unknown: true, text: "12 hospitals within 60 km. Drive times couldn't be checked right now." });
  });
  it("reads the sample and simple pasted bookings without AI", () => {
    expect(readBookingPlain(SB)).toMatchObject({ hotel: "Thar Stars Desert Camp (sample)", city: "Jaisalmer", country: "India" });
    expect(readBookingPlain("Your stay at Hotel Lisboa Plaza\nTravessa do Salitre 7, Lisbon, Portugal\nCheck-in: 2026-12-03")).toMatchObject({ hotel: "Hotel Lisboa Plaza", city: "Lisbon", country: "Portugal" });
    expect(readBookingPlain("hello")).toBeNull();
  });
});
