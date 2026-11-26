import { test } from "node:test";
import assert from "node:assert/strict";
import { buildText, LIMIT_PER_DAY } from "./texts.js";

const base = { to: ["+972501234567"], name: "Julia", lat: 26.91234, lng: 75.78765 };

test("SOS: her words, the map, sent as she wrote it", () => {
  const r = buildText("sos", { ...base, message: "Julia needs help in Jaipur: being followed. Call Julia now." });
  assert.deepEqual(r.to, ["+972501234567"]);
  assert.match(r.body, /^Julia needs help in Jaipur: being followed\. Call Julia now\./);
  assert.match(r.body, /https:\/\/maps\.google\.com\/\?q=26\.91234,75\.78765/);
});

test("danger: names the area, gives the map and the police number", () => {
  const r = buildText("danger", { ...base, place: "Nahargarh Fort road", police: "112" });
  assert.equal(r.body, "Beacon: Julia just walked into an area marked dangerous at night (Nahargarh Fort road). Where: https://maps.google.com/?q=26.91234,75.78765 Maybe call Julia. Police there: 112.");
});

test("still: hasn't moved for 5 minutes on the way back", () => {
  const r = buildText("still", { ...base, minutes: 5, police: "112" });
  assert.equal(r.body, "Beacon: Julia hasn't moved for 5 minutes on her way back. Where: https://maps.google.com/?q=26.91234,75.78765 Maybe call Julia. Police there: 112.");
});

test("invite: only Beacon's own family link", () => {
  const r = buildText("invite", { ...base, link: "https://homeward-6999c.web.app/f/0123abcd0123abcd0123abcd0123abcd" });
  assert.equal(r.body, "Julia added you to Beacon. Open this any time to see how Julia is: https://homeward-6999c.web.app/f/0123abcd0123abcd0123abcd0123abcd");
  assert.equal(buildText("invite", { ...base, link: "https://evil.example/f/x" }).error, "link");
});

test("refuses bad numbers, too many people, unknown kinds", () => {
  assert.equal(buildText("sos", { ...base, to: ["0501234567"], message: "x" }).error, "to");
  assert.equal(buildText("sos", { ...base, to: [1,2,3,4,5,6].map((i) => `+97250123456${i}`), message: "x" }).error, "to");
  assert.equal(buildText("spam", base).error, "kind");
  assert.equal(buildText("sos", { ...base, message: "" }).error, "message");
});

test("strips links and cuts long text so it can't be used for spam", () => {
  const r = buildText("sos", { ...base, message: "help http://spam.example go " + "a".repeat(900) });
  assert.doesNotMatch(r.body, /spam\.example/);
  assert.ok(r.body.length <= 600);
  const n = buildText("danger", { ...base, name: "Eve https://x.example".padEnd(80, "e"), place: "P", police: "112abc" });
  assert.doesNotMatch(n.body, /x\.example/);
  assert.match(n.body, /Police there: 112\./);
});

test("no position: says so instead of a broken link", () => {
  const r = buildText("still", { ...base, lat: null, lng: undefined, minutes: 5, police: "112" });
  assert.match(r.body, /Where: not known/);
});

test("a daily cap per traveler", () => { assert.equal(LIMIT_PER_DAY, 40); });
