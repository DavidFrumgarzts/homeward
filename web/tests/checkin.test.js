import { describe, it, expect } from "vitest";
import { makeKeys, seal, unseal } from "../js/seal.js";
import { answerText, answerPrompt, waitingText } from "../js/checkin.js";

describe("sealed answers", () => {
  it("only the asker's key opens the answer", async () => {
    const mom = await makeKeys(), dad = await makeKeys();
    const sealed = await seal(mom.publicJwk, "Julia is walking back on MI Road.");
    expect(JSON.stringify(sealed)).not.toContain("Julia");
    expect(await unseal(mom.privateJwk, sealed)).toBe("Julia is walking back on MI Road.");
    await expect(unseal(dad.privateJwk, sealed)).rejects.toThrow();
  });
});

describe("check-in answers", () => {
  const facts = { name: "Julia", near: "MI Road, Jaipur", minutesAgo: 2, plan: { place: "Bar Palladio", minutesLeft: 6, home: "her hotel" }, inDanger: false, walkedKm: 1.2 };

  it("says where she is, her plan, and that she's not in a dangerous area", () => {
    const t = answerText(facts);
    expect(t).toContain("Julia");
    expect(t).toContain("MI Road, Jaipur");
    expect(t).toContain("6 min from her hotel");
    expect(t).toContain("Not in a dangerous area");
  });

  it("says plainly when she is in a dangerous area, and how old the position is", () => {
    const t = answerText({ ...facts, inDanger: true, minutesAgo: 25, plan: null });
    expect(t).toContain("In an area to avoid at night");
    expect(t).toContain("25 min ago");
  });

  it("never guesses where she is", () => {
    expect(answerText({ name: "Julia", near: null, minutesAgo: null })).toContain("Beacon doesn't know where Julia is right now");
  });

  it("gives the AI only the facts", () => {
    const p = answerPrompt(facts);
    expect(p).toContain("MI Road, Jaipur");
    expect(p).toMatch(/only the facts/i);
  });

  it("tells the asker it keeps trying", () => {
    const at = new Date(2026, 10, 25, 21, 10).getTime();
    expect(waitingText("Julia", at)).toBe("Waiting for Julia's phone · checking every minute · last answer at 21:10");
    expect(waitingText("Julia", null)).toBe("Waiting for Julia's phone · checking every minute");
  });
});

import { decide } from "../js/checkin.js";
describe("which questions get a location", () => {
  const now = 1_000_000_000;
  it("answers a fresh question once", () => {
    expect(decide({ askedAtMillis: now - 1000, viewerUid: "mom" }, { now, lastByViewer: {} })).toBe("answer");
  });
  it("doesn't send a location twice within 5 minutes to the same person", () => {
    expect(decide({ askedAtMillis: now - 1000, viewerUid: "mom" }, { now, lastByViewer: { mom: now - 60_000 } })).toBe("too-often");
    expect(decide({ askedAtMillis: now - 1000, viewerUid: "mom" }, { now, lastByViewer: { mom: now - 6 * 60_000 } })).toBe("answer");
  });
  it("doesn't answer questions older than an hour with today's location", () => {
    expect(decide({ askedAtMillis: now - 2 * 3600_000, viewerUid: "mom" }, { now, lastByViewer: {} })).toBe("too-old");
  });
});
