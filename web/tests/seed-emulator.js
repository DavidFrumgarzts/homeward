// Puts the made-up demo incident into the local Firestore EMULATOR (never the real project), as if a
// phone had sent it a few minutes ago, and prints a family link you can open.
//   1. from the repo root:  firebase emulators:start --only auth,firestore,hosting --project demo-beacon
//   2. from web/:           node tests/seed-emulator.js          (add "ended" to seed a finished SOS)
import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const demo = JSON.parse(readFileSync(new URL("../fixtures/demo-incident.json", import.meta.url), "utf8"));
const SHARE = "0123456789abcdef0123456789abcdef", ended = process.argv.includes("ended");
const updates = ended ? demo.updates : demo.updates.slice(0, 4);
// Shift the recorded night so its newest update happened 40 seconds ago.
const shift = Date.now() - 40_000 - updates.at(-1).createdAtMillis, move = (t) => (t == null ? null : t + shift);

const env = await initializeTestEnvironment({ projectId: "demo-beacon", firestore: { host: "127.0.0.1", port: 8080 } });
await env.clearFirestore();
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore(), { id, ...incident } = demo.incident;
  await setDoc(doc(db, "trips/demo-trip"), { ownerUid: "demo", travelerName: "Noa", city: "Rio de Janeiro", country: "Brazil", packId: null, platform: "android", createdAtMillis: Date.now() });
  await setDoc(doc(db, `shares/${SHARE}`), { ...demo.share, createdAtMillis: Date.now() });
  await setDoc(doc(db, `trips/demo-trip/incidents/${id}`), { ...incident, phase: ended ? "Resolved" : "SosActive", startedAtMillis: move(incident.startedAtMillis),
    alertSentAtMillis: move(incident.alertSentAtMillis), resolvedAtMillis: ended ? move(incident.resolvedAtMillis) : null, updatedAtMillis: Date.now() });
  for (const { id: updateId, ...update } of updates) {
    await setDoc(doc(db, `trips/demo-trip/incidents/${id}/updates/${updateId}`), { ...update, createdAtMillis: move(update.createdAtMillis), takenAtMillis: move(update.takenAtMillis) });
  }
});
await env.cleanup();
console.log(`Seeded ${updates.length} updates (${ended ? "ended" : "active"}). Open:\n  http://127.0.0.1:5005/f/${SHARE}?emu`);
