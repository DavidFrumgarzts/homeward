// Run: cd web && npx vitest run tests/cityscams.test.js
import { test } from "vitest";
import assert from "node:assert/strict";
import { matchPrompt, readMatch, verdictFor, researchPrompt, readResearch, needsResearch, mergeScams } from "../js/cityscams.js";

const pedicab = { id: "pedicab", title: "Pedicab per-minute pricing", kind: "Taxi", level: "Avoid", looksLike: ["bike rickshaw", "price per minute sign"],
  where: "Central Park South", whatHappens: "You get billed $440 for 12 minutes.", whatToDo: "Take a yellow taxi.", saferOption: "", sources: ["https://example.org/a"] };
const monk = { id: "fake-monk", title: "Fake monks", kind: "Other", level: "Careful", looksLike: ["man in orange robes"], where: "Times Square",
  whatHappens: "Gives you a bracelet, then asks for $20.", whatToDo: "Say no and keep walking.", sources: ["https://example.org/b"] };

test("the photo prompt lists every saved scam by id and names the city", () => {
  const p = matchPrompt("New York", [pedicab, monk]);
  assert.match(p, /New York/);
  assert.match(p, /pedicab: Pedicab per-minute pricing — looks like: bike rickshaw; price per minute sign/);
  assert.match(p, /fake-monk:/);
  assert.match(p, /"none"/);
});

test("a photo matched to an Avoid scam says Walk away, with no price asked", () => {
  const m = readMatch('Sure! {"match":"pedicab","seen":"a bike taxi on 59th St","kind":"Taxi"}', [pedicab, monk]);
  assert.equal(m.warning, pedicab);
  assert.equal(m.seen, "a bike taxi on 59th St");
  const v = verdictFor(m);
  assert.equal(v.verdict, "walk");
  assert.equal(v.why, pedicab.whatHappens);
  assert.equal(v.whatToDo, "Take a yellow taxi.");
});

test("a Careful scam says Be careful", () => {
  assert.equal(verdictFor(readMatch('{"match":"fake-monk","seen":"monk","kind":"Other"}', [pedicab, monk])).verdict, "careful");
});

test("no match, or an id that isn't saved, never says Looks fair", () => {
  for (const text of ['{"match":"none","seen":"a hot dog cart","kind":"Shop"}', '{"match":"made-up-id","seen":"x","kind":"Other"}']) {
    const v = verdictFor(readMatch(text, [pedicab, monk]));
    assert.equal(v.verdict, "unknown");
    assert.equal(v.warning, null);
  }
});

test("an answer that isn't JSON gives null, so the screen asks her to describe it", () => {
  assert.equal(readMatch("I can't see the image", [pedicab]), null);
  assert.equal(readMatch("", [pedicab]), null);
});

test("the research prompt asks for many scams with sources, for this city", () => {
  const p = researchPrompt("Lisbon", "Portugal", "2026-11-25");
  assert.match(p, /Lisbon, Portugal/);
  assert.match(p, /reddit/i);
  assert.match(p, /looksLike/);
  assert.match(p, /sources/);
  assert.match(p, /2026-11-25/);
});

test("research answers keep only complete scams with https sources, and fix up ids and levels", () => {
  const text = `Here you go: [
    {"id":"Tram 28 Pickpockets!","title":"Pickpockets on tram 28","kind":"Other","level":"avoid","looksLike":["crowded yellow tram"],"where":"Tram 28","whatHappens":"Wallets go missing.","whatToDo":"Keep your bag in front.","sources":["https://example.org/t","javascript:alert(1)"]},
    {"id":"no-sources","title":"No sources","kind":"Other","level":"Careful","looksLike":["x"],"whatToDo":"y","sources":[]},
    {"id":"no-look","title":"No looks","kind":"Other","level":"Careful","whatToDo":"y","sources":["https://example.org"]},
    {"id":"odd-kind","title":"Odd kind","kind":"Spaceship","level":"Whatever","looksLike":["a man"],"whatToDo":"Walk on.","sources":["https://example.org/o"]}
  ]`;
  const out = readResearch(text);
  assert.deepEqual(out.map((s) => s.id), ["tram-28-pickpockets", "odd-kind"]);
  assert.equal(out[0].level, "Avoid");
  assert.deepEqual(out[0].sources, ["https://example.org/t"]);
  assert.equal(out[1].kind, "Other");
  assert.equal(out[1].level, "Careful");
});

test("research answers that aren't a JSON list give an empty list", () => {
  assert.deepEqual(readResearch("Sorry, I couldn't search."), []);
  assert.deepEqual(readResearch('{"id":"x"}'), []);
});

test("research runs when online and nothing is saved, then waits a day; a failed try waits an hour", () => {
  const now = Date.UTC(2026, 10, 25, 12);
  const hour = 3600_000;
  assert.equal(needsResearch(null, now, true), true);
  assert.equal(needsResearch(null, now, false), false);
  assert.equal(needsResearch({ savedAt: now - 2 * hour, scams: [pedicab] }, now, true), false);
  assert.equal(needsResearch({ savedAt: now - 25 * hour, scams: [pedicab] }, now, true), true);
  assert.equal(needsResearch({ savedAt: 0, scams: [], triedAt: now - 30 * 60_000 }, now, true), false);
  assert.equal(needsResearch({ savedAt: 0, scams: [], triedAt: now - 2 * hour }, now, true), true);
});

test("researched scams are added to the built-in ones, without repeating an id or a title", () => {
  const fresh = [{ ...pedicab, title: "Pedicabs again" }, { ...monk, id: "monks-2", title: "fake monks" }, { ...monk, id: "new-one", title: "Card games" }];
  assert.deepEqual(mergeScams([pedicab, monk], fresh).map((s) => s.id), ["pedicab", "fake-monk", "new-one"]);
});
