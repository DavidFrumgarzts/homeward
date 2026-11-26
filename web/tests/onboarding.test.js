import { describe, it, expect } from "vitest";
import { STEPS, nextStep, skipTo } from "../js/onboarding.js";

describe("onboarding order", () => {
  it("follows the Figma story, ending on the city getting ready", () => {
    expect(STEPS).toEqual(["night", "booking", "location", "nosignal", "people", "late", "scan", "ready"]);
    expect(nextStep("night", { contacts: 0 })).toBe("booking");
    expect(nextStep("ready", { contacts: 1 })).toBeNull();
  });
  it("can't go past the trusted-people step without at least one person", () => {
    expect(nextStep("people", { contacts: 0 })).toBe("people");
    expect(nextStep("people", { contacts: 1 })).toBe("late");
  });
  it("Skip jumps to the trusted-people step, and after it to the next screen", () => {
    expect(skipTo("night")).toBe("people");
    expect(skipTo("location")).toBe("people");
    expect(skipTo("late")).toBe("scan");
    expect(skipTo("scan")).toBe("ready");
  });
});
