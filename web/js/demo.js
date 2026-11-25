// /demo: the family view with no phones. It replays the made-up incident in fixtures/demo-incident.json
// (a copy of shared/fixtures/, same shape as the Firestore documents) on a fast clock, so you can watch
// the alert arrive, the dot move along Av. Mem de Sá, and the SOS end. Nothing is read from or written
// to Firebase. demoStateAt is pure and tested in tests/timeline.test.js.

export const DEMO_SPEED = 12; // the 11-minute walk plays in about a minute

// What the family view shows `elapsedMillis` into the replay. Times are shifted so that the moment
// being replayed is "now": "last seen 2 min ago" then means two minutes of the recorded night.
export function demoStateAt(fixture, elapsedMillis, nowMillis, speed = DEMO_SPEED) {
  const { incident, updates } = fixture;
  const storyNow = incident.startedAtMillis + elapsedMillis * speed;
  const shift = nowMillis - storyNow;
  const move = (t) => (t == null ? null : t + shift);
  const seen = updates.filter((u) => u.createdAtMillis <= storyNow)
    .map((u) => ({ ...u, createdAtMillis: move(u.createdAtMillis), takenAtMillis: move(u.takenAtMillis) }));
  const ended = seen.some((u) => u.kind === "ended");
  const length = (incident.resolvedAtMillis ?? updates.at(-1).createdAtMillis) - incident.startedAtMillis;
  return {
    status: seen.length ? "ready" : "no-incident", demo: true,
    progress: Math.min(1, (elapsedMillis * speed) / length), done: ended,
    incident: { ...incident, phase: ended ? "Resolved" : "SosActive", startedAtMillis: move(incident.startedAtMillis),
      alertSentAtMillis: move(incident.alertSentAtMillis), resolvedAtMillis: ended ? move(incident.resolvedAtMillis) : null, updatedAtMillis: nowMillis },
    updates: seen,
  };
}

// Feeds the family screen. Returns { stop, replay }.
export function watchDemo(onState) {
  let timer = null, began = 0, fixture = null, stopped = false;
  const tick = () => {
    const state = demoStateAt(fixture, Date.now() - began, Date.now());
    onState(state);
    if (state.done) clearInterval(timer);
  };
  const replay = () => { if (!fixture) return; clearInterval(timer); began = Date.now() + 1500; timer = setInterval(tick, 500); tick(); };
  onState({ status: "loading", demo: true });
  fetch("/fixtures/demo-incident.json").then((reply) => reply.json()).then((data) => { if (stopped) return; fixture = data; replay(); })
    .catch(() => onState({ status: "offline", demo: true }));
  return { stop: () => { stopped = true; clearInterval(timer); }, replay };
}
