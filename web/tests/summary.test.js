// The "What's happening and what should I do?" panel: the fixed wording used when there is no AI,
// and the check that decides whether an AI answer may be shown.
import { describe, expect, test } from "vitest";
import { safeToShow, summaryPrompt, summaryTemplate } from "../js/summary.js";
import { shared } from "./vectors.js";

const demo = shared("fixtures/demo-incident.json");
const active = { ...demo.incident, phase: "SosActive", resolvedAtMillis: null };
const CRIME = /kidnap|abduct|assault|attack|robb|mugg|murder|crime|criminal|hostage/i;

describe("the fixed wording", () => {
  test("an active SOS: what is known, then what to do, with the pack's numbers", () => {
    const text = summaryTemplate(active, demo.updates.slice(0, 2));
    expect(text).toContain("Noa sent an SOS from the Beacon app");
    expect(text).toContain('Noa wrote: "A man is following me near the bars"');
    expect(text).toContain("1. Call Noa now.");
    expect(text).toContain("the police in Rio de Janeiro on 190");
    expect(text).toContain("U.S. Consulate General Rio de Janeiro on +55 21 3823-2000");
    expect(text).toContain("3. Keep this page open.");
  });
  test("it never claims a crime, in any state", () => {
    const auto = { ...active, userConfirmed: false, description: "", triggerReasons: ["left planned route"] };
    for (const text of [summaryTemplate(active, demo.updates), summaryTemplate(demo.incident, demo.updates), summaryTemplate(auto, []), summaryTemplate({ ...active, description: "" }, [])]) {
      expect(text).not.toMatch(CRIME);
    }
  });
  test("an alert Beacon raised by itself says it does not know what is happening", () => {
    const text = summaryTemplate({ ...active, userConfirmed: false, description: "", triggerReasons: ["left planned route"] }, []);
    expect(text).toContain("did not answer a safety check");
    expect(text).toContain("does not know what is happening");
    expect(text).toContain("No location has arrived yet.");
  });
  test("an ended SOS tells them to check in, not to call the police first", () => {
    const text = summaryTemplate(demo.incident, demo.updates);
    expect(text).toContain("ended the SOS");
    expect(text).toContain("1. Call or message Noa to check in.");
    expect(text).not.toContain("Call Noa now");
  });
  test("with no numbers saved it still gives a next step", () => {
    expect(summaryTemplate({ ...active, emergency: {} }, [])).toContain("call the local police");
  });
});

describe("the prompt", () => {
  test("gives the model only facts from the incident, and the rules", () => {
    const prompt = summaryPrompt(active, demo.updates);
    expect(prompt).toContain("Use ONLY the facts below");
    expect(prompt).toContain("Do not say that a crime happened");
    expect(prompt).toContain("- Police in Rio de Janeiro: 190.");
    expect(prompt).toContain('- Noa wrote: "A man is following me near the bars".');
    expect(prompt).not.toMatch(/-22\.\d+/); // exact coordinates stay on the map, not in the prompt
  });
});

describe("checking an AI answer before showing it", () => {
  const good = "Noa sent an SOS and wrote that a man is following her. Her last location is on the map.\nWhat to do:\n1. Call Noa now.\n2. If there is no answer, call the police on 190.";
  test("a faithful answer passes", () => expect(safeToShow(good, active, demo.updates)).toBe(true));
  test("empty, tiny or rambling answers fail", () => {
    expect(safeToShow("", active, demo.updates)).toBe(false);
    expect(safeToShow("Call her.", active, demo.updates)).toBe(false);
    expect(safeToShow("x".repeat(901), active, demo.updates)).toBe(false);
  });
  test("an answer that names a crime she did not write fails", () => {
    expect(safeToShow(good.replace("is following her", "is trying to kidnap her"), active, demo.updates)).toBe(false);
    expect(safeToShow(`${good} This may be an assault.`, active, demo.updates)).toBe(false);
  });
  test("her own words may be repeated", () => {
    const robbed = { ...active, description: "I was robbed near the bar" };
    expect(safeToShow("Noa wrote that she was robbed near the bar. Her last location is on the map.\nWhat to do:\n1. Call Noa now.", robbed, demo.updates)).toBe(true);
  });
  test("a phone number that is not in the facts fails", () => {
    expect(safeToShow(good.replace("190", "911"), active, demo.updates)).toBe(false);
    expect(safeToShow(`${good}\n3. Or call +55 21 3823-2000.`, active, demo.updates)).toBe(true);
    expect(safeToShow(`${good}\n3. Or call +55 21 9999-0000.`, active, demo.updates)).toBe(false);
  });
});
