// The texts contacts receive must be word for word the same as the Android app's.
// Runs shared/test-vectors/message-templates.json and situation.json against the JavaScript port.
import { describe, expect, test } from "vitest";
import * as messages from "../js/messages.js";
import { pickSituation } from "../js/situation.js";
import { clockText } from "../js/timeline.js";
import { vectors } from "./vectors.js";

const run = {
  short: (i) => messages.short(i.point),
  mapsLink: (i) => messages.mapsLink(i.point),
  plainSentence: (i) => messages.plainSentence(i.profile, i.description),
  alert: (i) => messages.alertText(i.profile, i.sentence, i.fix, i.fixTime, i.police, i.familyLink),
  autoAlert: (i) => messages.autoAlert(i.profile, i.checkTime, i.fix, i.fixTime, i.reasons, i.police, i.familyLink),
  update: (i) => messages.update(i.profile, i.fix, i.fixTime, i.pointsHeld),
  batteryLow: (i) => messages.batteryLow(i.profile, i.fix, i.fixTime),
  ended: (i) => messages.ended(i.profile, i.time),
};

describe("message templates (shared vectors)", () => {
  const cases = vectors("message-templates.json");
  test("there are cases, and every one names a function this port has", () => {
    expect(cases.length).toBeGreaterThan(10);
    expect(cases.filter((c) => !run[c.fn]).map((c) => c.fn)).toEqual([]);
  });
  test.each(cases.map((c) => [c.name, c]))("%s", (_, c) => expect(run[c.fn](c.input)).toBe(c.expected));
});

describe("situation from her words (shared vectors)", () => {
  const cases = vectors("situation.json").filter((c) => c.fn === "pick");
  test("there are cases", () => expect(cases.length).toBeGreaterThan(5));
  test.each(cases.map((c) => [c.name, c]))("%s", (_, c) => expect(pickSituation(c.input.description)).toBe(c.expected));
});

describe("clock text", () => {
  test("12-hour time with a plain space, the way the messages write it", () => {
    expect(clockText(new Date(2026, 10, 28, 1, 56).getTime())).toBe("1:56 AM");
    expect(clockText(new Date(2026, 10, 28, 0, 5).getTime())).toBe("12:05 AM");
    expect(clockText(new Date(2026, 10, 28, 12, 0).getTime())).toBe("12:00 PM");
    expect(clockText(new Date(2026, 10, 28, 23, 2).getTime())).toBe("11:02 PM");
  });
});
