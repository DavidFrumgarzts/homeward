// The phone-frame demo's pure helpers (web/phone/links.js).
import { expect, test } from "vitest";
import { deviceLink, fitScale, frameSrc } from "../phone/links.js";

test("sms: links give the numbers and the message", () => {
  expect(deviceLink("sms:+15550001,+447700900?&body=Ana%20needs%20help%0AWhere%3A%20x")).toEqual({ kind: "sms", to: ["+15550001", "+447700900"], body: "Ana needs help\nWhere: x" });
  expect(deviceLink("sms:+15550001&body=Hi")).toEqual({ kind: "sms", to: ["+15550001"], body: "Hi" });
  expect(deviceLink("sms:?&body=Hi")).toEqual({ kind: "sms", to: [], body: "Hi" });
});
test("tel: links give the number; other links are not stopped", () => {
  expect(deviceLink("tel:190")).toEqual({ kind: "tel", to: ["190"], body: "" });
  expect(deviceLink("TEL:+91 112")).toEqual({ kind: "tel", to: ["+91 112"], body: "" });
  for (const href of ["#", "https://maps.google.com/?q=1,2", "/demo", "", null]) expect(deviceLink(href)).toBeNull();
});
test("the frame address always says frame=phone", () => {
  expect(frameSrc("/live/")).toBe("/live/?frame=phone");
  expect(frameSrc("/live/", { at: "26.9157,75.8069" })).toBe("/live/?frame=phone&at=26.9157,75.8069");
  expect(frameSrc("/", { at: "-22.9095,-43.18421", reset: true })).toBe("/?frame=phone&at=-22.9095,-43.18421&reset");
  expect(frameSrc("/demo", { reset: true })).toBe("/demo?frame=phone&reset");
});
test("the phone shrinks to fit and never grows", () => {
  expect(fitScale(2000, 2000, 428, 900)).toBe(1);
  expect(fitScale(1000, 450, 428, 900)).toBe(0.5);
  expect(fitScale(1000, 700, 428, 900)).toBe(0.77);
  expect(fitScale(0, 0, 428, 900)).toBe(1);
});
