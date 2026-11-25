import { describe, it, expect, beforeEach } from "vitest";
import { shortPhone, store } from "../js/store.js";

describe("shortPhone (contact cards, Figma screen 4)", () => {
  it("keeps the start and the last four digits", () => {
    expect(shortPhone("+972541233021")).toBe("+97254 ··· 3021");
    expect(shortPhone("+12035554417")).toBe("+1203 ··· 4417");
  });
  it("leaves short numbers whole", () => {
    expect(shortPhone("+3361234")).toBe("+3361234");
  });
});

describe("store.shareLocation (the \"Add my location to I'm OK\" switch)", () => {
  beforeEach(() => {
    const data = {};
    globalThis.localStorage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v), removeItem: (k) => delete data[k] };
  });
  it("is on until turned off", () => {
    expect(store.shareLocation).toBe(true);
    store.shareLocation = false;
    expect(store.shareLocation).toBe(false);
  });
});
