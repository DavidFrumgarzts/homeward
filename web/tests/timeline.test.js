// The family view's pure logic: ages, the trail, the list of what happened, and the demo replay.
import { describe, expect, test } from "vitest";
import { ageText, latestFix, timelineItems, trail } from "../js/timeline.js";
import { demoStateAt, DEMO_SPEED } from "../js/demo.js";
import { shared } from "./vectors.js";

const demo = shared("fixtures/demo-incident.json");
const MIN = 60_000;

describe("how old a position is", () => {
  test("in plain words", () => {
    expect(ageText(0, 20_000)).toBe("just now");
    expect(ageText(0, 4 * MIN)).toBe("4 min ago");
    expect(ageText(0, 125 * MIN)).toBe("2 h 5 min ago");
    expect(ageText(0, 120 * MIN)).toBe("2 h ago");
    expect(ageText(0, 26 * 60 * MIN)).toBe("1 day ago");
    expect(ageText(5 * MIN, 0)).toBe("just now"); // a clock that is slightly off never shows a negative age
  });
});

describe("the demo incident", () => {
  test("latest position is the newest update that has one", () => {
    const fix = latestFix(demo.updates), last = demo.updates.at(-1);
    expect([fix.lat, fix.lng]).toEqual([last.lat, last.lng]);
    expect(fix.atMillis).toBe(last.takenAtMillis);
    expect(latestFix([])).toBeNull();
    expect(latestFix([{ kind: "alert", lat: null, lng: null, createdAtMillis: 1 }])).toBeNull();
  });
  test("the trail is oldest first, as [lng, lat]", () => {
    const line = trail([...demo.updates].reverse());
    expect(line).toHaveLength(demo.updates.length);
    expect(line[0]).toEqual([demo.updates[0].lng, demo.updates[0].lat]);
  });
  test("what happened, newest first: SOS, updates, the end", () => {
    const items = timelineItems(demo.incident, demo.updates);
    expect(items.map((i) => i.kind)).toEqual(["ended", "update", "update", "update", "update", "alert"]);
    expect(items.at(-1).title).toBe("Noa sent an SOS");
    expect(items.at(-1).detail).toBe('"A man is following me near the bars"');
    expect(items[0].title).toBe("Noa says the SOS is over");
  });
  test("an alert Beacon raised by itself says so, and claims nothing else", () => {
    const [item] = timelineItems({ ...demo.incident, userConfirmed: false }, [demo.updates[0]]);
    expect(item.title).toBe("Noa did not answer a safety check");
    expect(item.detail).toContain("does not know what is happening");
  });
  test("points recorded with no signal are mentioned", () => {
    const [item] = timelineItems(demo.incident, [{ ...demo.updates[1], pointsHeld: 3 }]);
    expect(item.detail).toBe("3 location points were recorded while the phone had no signal.");
  });
});

describe("the demo replay", () => {
  const now = 1_800_000_000_000, length = demo.incident.resolvedAtMillis - demo.incident.startedAtMillis;
  test("nothing has arrived before the first alert", () => {
    expect(demoStateAt(demo, 0, now).status).toBe("no-incident");
  });
  test("part way through it is active, shows only what has happened, and the newest thing is recent", () => {
    const state = demoStateAt(demo, (6 * MIN) / DEMO_SPEED, now);
    expect(state.status).toBe("ready");
    expect(state.demo).toBe(true);
    expect(state.incident.phase).toBe("SosActive");
    expect(state.incident.resolvedAtMillis).toBeNull();
    expect(state.updates.map((u) => u.kind)).toEqual(["alert", "update", "update"]);
    expect(now - state.updates.at(-1).createdAtMillis).toBeLessThan(2 * MIN);
    expect(state.updates.every((u) => u.createdAtMillis <= now)).toBe(true);
    expect(state.done).toBe(false);
  });
  test("at the end it is resolved and stops", () => {
    const state = demoStateAt(demo, length / DEMO_SPEED + 1000, now);
    expect(state.incident.phase).toBe("Resolved");
    expect(state.updates).toHaveLength(demo.updates.length);
    expect(state.done).toBe(true);
    expect(state.progress).toBe(1);
  });
});
