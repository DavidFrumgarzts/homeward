// Texts her trusted people by itself (no tap): SOS, walked into an area marked dangerous, stopped on the way
// back, and "you've been added". Sent as SMS by the sendText function (backend/functions/index.js, Twilio).
// With no signal the text waits on this phone and goes as soon as there's a connection (checked every
// minute and when the phone comes back online). She sees every text that went out.
import { firebase, signedIn, SDK } from "../../js/firebase.js";
import { store } from "../../js/store.js";
import { paused } from "./answering.js";

const QUEUE = "beacon.textQueue", LOG = "beacon.textLog";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
export const textsSent = () => read(LOG);
// Phone-frame demo (web/phone/, ?frame=phone): nothing is texted; the demo page shows what would have gone.
const TEST_MODE = new URLSearchParams(location.search).get("frame") === "phone";
const WHAT = { sos: "SOS", danger: "Walked into an area marked dangerous", still: "Hasn't moved for 5 minutes", invite: "Their check-in link" };

let call = null;
async function callable() {
  if (call) return call;
  const fb = await firebase();
  if (!fb || !(await signedIn())) return null;
  const { getFunctions, httpsCallable } = await import(`${SDK}/firebase-functions.js`);
  return (call = httpsCallable(getFunctions(fb.app, "us-central1"), "sendText", { timeout: 20000 }));
}

let flushing = null;
// Sends what's waiting. Returns when done; texts that can't go yet stay queued.
export function flush() {
  flushing ??= (async () => {
    try {
      if (!navigator.onLine) return;
      if (TEST_MODE) {
        await null; // stay async, so `flushing` is cleared after it is set
        for (const item of read(QUEUE)) {
          const { to, ...fields } = item.data;
          if (parent !== window) parent.postMessage({ beaconPhone: true, kind: "text", what: WHAT[item.kind], to, names: item.names, fields }, location.origin);
          log(item, "test mode: not sent");
        }
        return write(QUEUE, []);
      }
      const send = await callable();
      if (!send) return;
      for (const item of read(QUEUE)) {
        let gone = false;
        if (Date.now() - item.at > 24 * 3600000) { log(item, "not sent: no connection for a day"); write(QUEUE, read(QUEUE).filter((q) => q.id !== item.id)); continue; }
        try { await send({ kind: item.kind, ...item.data }); gone = true; log(item, "sent"); }
        catch (e) {
          const code = String(e?.code || "");
          // Refused for good (bad number, daily cap): drop it and say so. Anything else: try again later.
          if (/invalid-argument|resource-exhausted|permission-denied/.test(code)) { gone = true; log(item, code.includes("resource") ? "not sent: too many texts today" : "not sent"); }
        }
        if (gone) write(QUEUE, read(QUEUE).filter((q) => q.id !== item.id));
      }
    } finally { flushing = null; }
  })();
  return flushing;
}
function log(item, status) {
  write(LOG, [{ what: WHAT[item.kind], to: item.names, at: item.at, status, sentAt: Date.now() }, ...textsSent()].slice(0, 30));
  dispatchEvent(new CustomEvent("beacon-texts"));
}

// kind: "sos" | "danger" | "still" | "invite"; data: fields for backend/functions/texts.js (without `to`).
// Danger and stopped texts respect "Pause". Returns "sent" | "waiting" (no signal yet) | "nobody".
export async function sendText(kind, data = {}) {
  const people = store.contacts;
  if (!people.length) return "nobody";
  if (kind !== "sos" && kind !== "invite" && paused()) return "nobody";
  const item = { id: crypto.randomUUID(), kind, at: Date.now(), names: people.map((c) => c.name), data: { ...data, to: people.map((c) => c.phone).slice(0, 5), name: store.name || "" } };
  write(QUEUE, [...read(QUEUE), item]);
  await flush();
  return read(QUEUE).some((q) => q.id === item.id) ? "waiting" : "sent";
}

setInterval(() => { if (read(QUEUE).length) flush(); }, 60000);
addEventListener("online", () => flush());
if (read(QUEUE).length) flush();
