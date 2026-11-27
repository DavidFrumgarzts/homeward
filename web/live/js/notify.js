// Alerts her trusted people by itself (no tap): SOS, walked into an area marked dangerous, stopped on the way
// back. Sent as free push notifications by the alertFamily function (backend/functions/index.js) to the people who
// opened her check-in link and turned on "Get alerts on this phone".
// With no signal the alert waits on this phone and goes as soon as there's a connection (checked every
// minute and when the phone comes back online). She sees every alert that went out.
import { firebase, signedIn, SDK } from "../../js/firebase.js";
import { store } from "../../js/store.js";
import { paused } from "./answering.js";

const QUEUE = "beacon.alertQueue", LOG = "beacon.alertLog";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
export const alertsSent = () => read(LOG);
const WHAT = { sos: "SOS", danger: "Walked into an area marked dangerous", still: "Hasn't moved for 5 minutes" };
// Phone-frame demo (web/phone/, ?frame=phone): nothing is sent; the demo page shows what would have gone.
const TEST_MODE = new URLSearchParams(location.search).get("frame") === "phone";

let call = null;
async function callable() {
  if (call) return call;
  const fb = await firebase();
  if (!fb || !(await signedIn())) return null;
  const { getFunctions, httpsCallable } = await import(`${SDK}/firebase-functions.js`);
  return (call = httpsCallable(getFunctions(fb.app, "us-central1"), "alertFamily", { timeout: 20000 }));
}

let flushing = null;
// Sends what's waiting. Alerts that can't go yet stay queued.
export function flush() {
  flushing ??= (async () => {
    try {
      if (!navigator.onLine) return;
      if (TEST_MODE) {
        await null; // stay async, so `flushing` is cleared after it is set
        for (const item of read(QUEUE)) {
          if (parent !== window) parent.postMessage({ beaconPhone: true, kind: "alert", what: WHAT[item.kind], names: store.contacts.map((c) => c.name), fields: item.data }, location.origin);
          log(item, "test mode: not sent");
        }
        return write(QUEUE, []);
      }
      const send = await callable();
      if (!send) return;
      for (const item of read(QUEUE)) {
        let gone = false;
        if (Date.now() - item.at > 24 * 3600000) { log(item, "not sent: no connection for a day"); gone = true; }
        else {
          try { const r = await send({ kind: item.kind, tripId: item.tripId, ...item.data }); gone = true; log(item, r.data.sent ? `sent to ${r.data.sent}` : "nobody has alerts on yet", r.data.sent); }
          catch (e) {
            const code = String(e?.code || "");
            // Refused for good (bad request, not her trip, daily cap): drop it and say so. Anything else: later.
            if (/invalid-argument|resource-exhausted|permission-denied/.test(code)) { gone = true; log(item, code.includes("resource") ? "not sent: too many alerts today" : "not sent"); }
          }
        }
        if (gone) write(QUEUE, read(QUEUE).filter((q) => q.id !== item.id));
      }
    } finally { flushing = null; }
  })();
  return flushing;
}
function log(item, status, count = 0) {
  write(LOG, [{ what: WHAT[item.kind], at: item.at, status, count, sentAt: Date.now() }, ...alertsSent()].slice(0, 30));
}

// kind: "sos" | "danger" | "still"; data: fields for backend/functions/texts.js. Danger and stopped respect "Pause".
// Returns {status: "sent" | "waiting" (no signal yet) | "nobody" (no link sent yet), count}.
export async function sendAlert(kind, data = {}) {
  const trip = store.trip;
  if (!trip?.tripId || !store.contacts.length) return { status: "nobody", count: 0 };
  if (kind !== "sos" && paused()) return { status: "nobody", count: 0 };
  const item = { id: crypto.randomUUID(), kind, at: Date.now(), tripId: trip.tripId, data: { ...data, name: store.name || "" } };
  write(QUEUE, [...read(QUEUE), item]);
  await flush();
  if (read(QUEUE).some((q) => q.id === item.id)) return { status: "waiting", count: 0 };
  const done = alertsSent()[0];
  return { status: "sent", count: done?.count || 0 };
}

setInterval(() => { if (read(QUEUE).length) flush(); }, 60000);
addEventListener("online", () => flush());
if (read(QUEUE).length) flush();
