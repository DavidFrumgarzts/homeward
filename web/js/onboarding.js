// The order of the first-launch screens (Figma "Onboarding v3"), as pure logic. Screens are drawn in live/js/onboard.js.
// Each screen shows Beacon solving a problem, then asks for one permission. SOS needs at least one trusted person,
// so nothing (not even Skip) goes past "people" without one.
export const STEPS = ["night", "booking", "location", "nosignal", "people", "late", "scan", "ready"];

export function nextStep(step, { contacts }) {
  if (step === "people" && !contacts) return "people";
  const i = STEPS.indexOf(step);
  return i < 0 || i === STEPS.length - 1 ? null : STEPS[i + 1];
}

export function skipTo(step) {
  const i = STEPS.indexOf(step), people = STEPS.indexOf("people");
  return i < people ? "people" : STEPS[Math.min(i + 1, STEPS.length - 1)];
}
