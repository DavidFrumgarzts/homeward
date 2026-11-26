import { test } from "vitest";
import assert from "node:assert/strict";
import { numbersFor } from "../js/emergency.js";

test("the US and Canada use 911 for everything", () => {
  for (const cc of ["us", "US", "ca"]) assert.deepEqual(numbersFor(cc), { police: "911", ambulance: "911", known: true });
});

test("countries with their own police and ambulance numbers", () => {
  assert.deepEqual(numbersFor("br"), { police: "190", ambulance: "192", known: true });
  assert.deepEqual(numbersFor("jp"), { police: "110", ambulance: "119", known: true });
  assert.deepEqual(numbersFor("gb"), { police: "999", ambulance: "999", known: true });
  assert.deepEqual(numbersFor("il"), { police: "100", ambulance: "101", known: true });
});

test("every EU country uses 112", () => {
  for (const cc of ["pt", "fr", "de", "ro", "es", "it"]) assert.equal(numbersFor(cc).police, "112");
});

test("an unknown or missing country falls back to 112, marked as not known", () => {
  assert.deepEqual(numbersFor("zz"), { police: "112", ambulance: "112", known: false });
  assert.deepEqual(numbersFor(""), { police: "112", ambulance: "112", known: false });
  assert.deepEqual(numbersFor(undefined), { police: "112", ambulance: "112", known: false });
});

test("India: police 112, ambulance 108", () => {
  assert.deepEqual(numbersFor("in"), { police: "112", ambulance: "108", known: true });
});
