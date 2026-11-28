import { test } from "node:test";
import assert from "node:assert/strict";
import { staySafe, plainText, extractPrompt, readAreas, ringFrom, areaKm2, slugOf } from "./areas.js";

const wiki = `Intro\n== See ==\nstuff\n== Stay safe ==\n{{warningbox|Avoid '''Complexo da Maré''' at night.|uk=https://www.gov.uk/x}}\nThe [[Lapa]] arches area: robberies after the bars close, especially on '''Rua dos Inválidos'''.\n===Scams===\nGem scam.\n== Go next ==\nmore`;
const sources = [
  { id: "S1", site: "en.wikivoyage.org", url: "https://en.wikivoyage.org/wiki/Rio", type: "traveler", text: plainText(staySafe(wiki)) },
  { id: "S2", site: "gov.uk", url: "https://www.gov.uk/foreign-travel-advice/brazil", type: "official", text: "Street crime is common in Lapa and Centro at night, especially around the Lapa arches." },
];
const answer = (areas) => "```json\n" + JSON.stringify({ areas }) + "\n```";
const lapa = { name: "Lapa arches", place: "Arcos da Lapa", why: "Robberies after the bars close.", fromHour: 22, toHour: 5,
  evidence: [{ source: "S1", quote: "robberies after the bars close" }, { source: "S2", quote: "around the Lapa arches" }] };

test("Wikivoyage: only the Stay safe section, as plain text", () => {
  const t = plainText(staySafe(wiki));
  assert.match(t, /Lapa arches area: robberies after the bars close, especially on Rua dos Inválidos/);
  assert.match(t, /Gem scam/);
  assert.doesNotMatch(t, /Go next|more$/);
  assert.doesNotMatch(t, /\[\[|'''|\{\{/);
});

test("the prompt carries the sources and asks for exact quotes", () => {
  const p = extractPrompt("Rio de Janeiro", "Brazil", sources);
  assert.match(p, /\[S1\] en\.wikivoyage\.org/);
  assert.match(p, /exact/i);
  assert.match(p, /religion|ethnicity/i);
});

test("keeps an area only when its quotes really appear in the sources", () => {
  const [a] = readAreas(answer([lapa]), sources);
  assert.equal(a.name, "Lapa arches");
  assert.equal(a.official, true);
  assert.deepEqual(a.sources.map((s) => s.site), ["en.wikivoyage.org", "gov.uk"]);
  const madeUp = { ...lapa, evidence: [{ source: "S1", quote: "muggings every night on this street" }] };
  assert.deepEqual(readAreas(answer([madeUp]), sources), []);
});

test("a travel guide alone: kept for the map and routes, not official", () => {
  const [a] = readAreas(answer([{ ...lapa, evidence: [{ source: "S1", quote: "Lapa arches area: robberies after the bars close" }] }]), sources);
  assert.equal(a.official, false);
});

test("never an area described by who lives there; hours cleaned; capped", () => {
  assert.deepEqual(readAreas(answer([{ ...lapa, name: "The migrant quarter" }]), sources), []);
  const [a] = readAreas(answer([{ ...lapa, fromHour: "x", toHour: 40 }]), sources);
  assert.deepEqual([a.fromHour, a.toHour], [21, 5]);
  assert.equal(readAreas(answer(Array.from({ length: 12 }, (_, i) => ({ ...lapa, name: `Lapa ${i}` }))), sources).length, 8);
  assert.deepEqual(readAreas("nothing", sources), []);
});

test("map shapes: street band, point square, no whole districts", () => {
  const street = ringFrom({ type: "LineString", coordinates: [[-43.18, -22.91], [-43.17, -22.91]] });
  assert.equal(street.length, 4);
  const sq = ringFrom({ type: "Point", coordinates: [-43.18, -22.91] });
  assert.ok(areaKm2(sq) > 0.07 && areaKm2(sq) < 0.11);
  assert.equal(ringFrom({ type: "Polygon", coordinates: [[[-43.4, -23.0], [-43.1, -23.0], [-43.1, -22.8], [-43.4, -22.8], [-43.4, -23.0]]] }), null);
});

test("city keys", () => { assert.equal(slugOf("Rio de Janeiro", "Brazil"), "rio-de-janeiro--brazil"); });

test("the quote must name the place", () => {
  const lagoon = { name: "Rodrigo de Freitas Lagoon", place: "Lagoa Rodrigo de Freitas", why: "Quiet at night.", evidence: [{ source: "S1", quote: "robberies after the bars close" }] };
  assert.deepEqual(readAreas(answer([lagoon]), sources), []);
});
