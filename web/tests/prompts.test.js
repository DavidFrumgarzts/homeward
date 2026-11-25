// The prompts Beacon web sends must be the same text Android and iOS send (shared/prompts/).
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { ASK_BEACON, SOS_SENTENCE, fill, sosSentencePrompt } from "../js/prompts.js";
import { prompt as askPrompt } from "../js/ask.js";
import { pack, START } from "../js/pack.js";

const sharedPrompt = (name) => readFileSync(new URL(`../../shared/prompts/${name}`, import.meta.url), "utf8").trimEnd();

describe("the templates are the shared ones", () => {
  test("SOS sentence", () => expect(SOS_SENTENCE).toBe(sharedPrompt("sos-sentence.txt")));
  test("Ask Beacon", () => expect(ASK_BEACON).toBe(sharedPrompt("ask-beacon.txt")));
});

describe("the SOS sentence prompt", () => {
  test("uses her name and never asks the model for numbers, places or links", () => {
    const text = sosSentencePrompt({ name: "Noa", pronoun: "UseName" }, "being followed, grey hoodie");
    expect(text).toContain("Write in the third person about Noa. Use the name each time");
    expect(text).toContain('Note from Noa: "being followed, grey hoodie"');
    expect(text).not.toMatch(/190|maps\.google|Follow live|\{/);
  });
  test("a pronoun she chose is passed on; no name falls back to a neutral one", () => {
    expect(sosSentencePrompt({ name: "Noa", pronoun: "She" }, "lost")).toContain('Use "she" and "her" after the first mention.');
    expect(sosSentencePrompt({ name: " " }, "lost")).toContain("about Your contact.");
  });
  test("her own words cannot fill a placeholder, and money signs survive", () => {
    const text = sosSentencePrompt({ name: "Noa" }, "he said {name} owes $& $1");
    expect(text).toContain('Note from Noa: "he said {name} owes $& $1"');
    expect(fill("{a} {b}", { a: "{b}", b: "x" })).toBe("x x"); // which is why her words always go in last
  });
});

describe("the Ask Beacon prompt", () => {
  const text = askPrompt("What's the police number?", [["one", "1"], ["two", "2"], ["three", "3"]], START, 1);
  test("hands the model the saved facts and leaves no placeholder unfilled", () => {
    expect(text).toContain(`Police: ${pack.police}. Ambulance: ${pack.ambulance}. Embassy: ${pack.embassy.name}, ${pack.embassy.phone}.`);
    expect(text).toContain("- Rua dos Inválidos: ");
    expect(text).toContain("(risky right now)"); // 1am is inside its risky hours
    expect(text).toContain("- 5º DP police station (police), ");
    expect(text).toContain("- Help! = Socorro!");
    expect(text).toContain("QUESTION: What's the police number?");
    expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
  });
  test("keeps only the last two exchanges of the chat", () => {
    expect(text).toContain("Traveler: three\nBeacon: 3");
    expect(text).not.toContain("Traveler: one");
  });
});
