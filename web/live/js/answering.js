// Answers "How is she?" from her trusted people, by itself (David's decision, 2026-11-25), while Beacon is open.
// The answer is built on this phone from what's saved here (last position, the last hour's trail, the saved
// trip, areas to avoid), written by the AI when it can, then locked for the asker only (js/seal.js).
// She sees every answer that went out and can pause. With no signal, Firestore keeps the answer on this phone
// and sends it when signal is back; the listener is checked every minute and restarted if it dropped.
import { firebase, firestore, signedIn } from "../../js/firebase.js";
import { store } from "../../js/store.js";
import { familyLink } from "../../js/incident.js";
import { seal } from "../../js/seal.js";
import { answerText, answerPrompt, decide } from "../../js/checkin.js";
import { inside } from "../../js/walkroute.js";
import { askAi } from "../../js/ai.js";

const LOG = "beacon.checkinLog", PAUSED = "beacon.checkinPaused", TRAIL = "beacon.trail", LAST_BY = "beacon.lastAnswerBy";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

export const answersSent = () => read(LOG, []);
export const paused = () => read(PAUSED, false);
export const setPaused = (on) => write(PAUSED, !!on);

// Where she's been: a point every 2 minutes or every 30 m, kept for 24 hours, on this phone only.
export function recordTrail(at) {
  const t = read(TRAIL, []), now = Date.now(), last = t[t.length - 1];
  const moved = last ? Math.hypot((at.lat - last.lat) * 111320, (at.lng - last.lng) * 111320 * Math.cos((at.lat * Math.PI) / 180)) : Infinity;
  if (last && now - last.t < 120000 && moved < 30) return;
  write(TRAIL, [...t.filter((p) => now - p.t < 86400000), { lat: at.lat, lng: at.lng, t: now }]);
}
export const trail = () => read(TRAIL, []);

// Her trip and one family link, created once (online). Returns the link, or null without Firebase / connection.
export async function checkinLink({ city, country }) {
  if (!(await firebase())) return null;
  const [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (!fs || !uid) return null;
  const trip = store.trip ?? { tripId: crypto.randomUUID(), shareId: hex(16), created: false };
  store.trip = trip;
  if (!trip.created) {
    const { db, f } = fs, now = Date.now(), batch = f.writeBatch(db);
    batch.set(f.doc(db, "trips", trip.tripId), { ownerUid: uid, travelerName: store.name || "", city: city || "", country: country || "", packId: null, platform: "web", createdAtMillis: now });
    batch.set(f.doc(db, "shares", trip.shareId), { tripId: trip.tripId, ownerUid: uid, contactLabel: "Trusted people", travelerName: store.name || "", createdAtMillis: now, revoked: false });
    try { await Promise.race([batch.commit(), new Promise((_, no) => setTimeout(() => no(new Error("slow")), 8000))]); store.trip = { ...trip, created: true }; }
    catch { /* kept on this phone; sent when online */ }
  }
  return familyLink(trip.shareId);
}

async function streetNear(at) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=en&lat=${at.lat}&lon=${at.lng}`, { signal: AbortSignal.timeout(8000) });
    const a = (await r.json()).address || {};
    return [a.road || a.pedestrian || a.neighbourhood || a.suburb, a.city || a.town || a.village].filter(Boolean).join(", ") || null;
  } catch { return null; }
}

// facts for js/checkin.js. ctx: { city, areas: [{ring}], wayBack: (at) => result | null }
async function facts(ctx) {
  const t = trail(), last = t[t.length - 1], now = Date.now();
  if (!last) return { name: store.name || "She", near: null, minutesAgo: null };
  const hour = t.filter((p) => now - p.t < 3600000);
  let walked = 0; for (let i = 1; i < hour.length; i++) walked += Math.hypot((hour[i].lat - hour[i - 1].lat) * 111.32, (hour[i].lng - hour[i - 1].lng) * 111.32 * Math.cos((last.lat * Math.PI) / 180));
  const w = ctx.wayBack?.([last.lat, last.lng]);
  return {
    name: store.name || "She", near: (await streetNear(last)) || ctx.city || "her last saved spot", minutesAgo: Math.round((now - last.t) / 60000),
    walkedKm: walked >= 0.2 ? Math.round(walked * 10) / 10 : 0,
    plan: w?.route && w.trip ? { place: w.trip.place.name, minutesLeft: w.route.minutes, home: w.trip.homeIsHotel ? "her hotel" : "where she started" } : null,
    inDanger: (ctx.areas || []).some((a) => inside([last.lat, last.lng], a.ring)),
    at: last,
  };
}

let stop = null, timer = null, starting = false;
// Starts answering while the page is open. getCtx() returns the current { city, areas, wayBack }.
export async function startAnswering(getCtx, onLog = () => {}) {
  const trip = store.trip;
  if (!trip || stop || starting) return;
  starting = true;
  const [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (!fs || !uid) { starting = false; return; }
  const { db, f } = fs;
  const bad = new Set(); // questions whose key can't be used: never retried
  const answer = async (snap) => {
    const q = snap.data();
    if (bad.has(snap.id)) return;
    let key; try { key = JSON.parse(q.askerKey); await crypto.subtle.importKey("jwk", key, { name: "ECDH", namedCurve: "P-256" }, false, []); } catch { bad.add(snap.id); return; }
    const lastBy = read(LAST_BY, {}), verdict = decide(q, { now: Date.now(), lastByViewer: lastBy });
    let text, at = null;
    if (paused()) text = `${store.name || "She"} has paused check-ins for now.`;
    else if (verdict === "too-old") text = `This question is more than an hour old. Ask again to see where ${store.name || "she"} is now.`;
    else if (verdict === "too-often") text = "You asked a few minutes ago. Beacon answers with a new location every 5 minutes.";
    else {
      write(LAST_BY, { ...lastBy, [q.viewerUid]: Date.now() });
      const fx = await facts(getCtx()); at = fx.at || null;
      text = (await askAi(answerPrompt(fx), { private: true }))?.text?.trim() || answerText(fx); // her location: on this phone only
    }
    const sealed = await seal(key, JSON.stringify({ text, at: at && { lat: at.lat, lng: at.lng, t: at.t } }));
    await f.updateDoc(snap.ref, { answer: sealed, answeredAtMillis: Date.now() }).catch(() => {});
    const log = [{ who: q.askerName || "Someone", askedAt: q.askedAtMillis, answeredAt: Date.now(), text }, ...answersSent()].slice(0, 30);
    write(LOG, log); onLog(log);
  };
  const handling = new Set();
  const listen = () => {
    stop?.();
    stop = f.onSnapshot(f.query(f.collection(db, "trips", trip.tripId, "checkins"), f.where("answer", "==", null)), (got) => {
      for (const d of got.docs) if (!handling.has(d.id)) { handling.add(d.id); answer(d).finally(() => handling.delete(d.id)); }
    }, () => { stop = null; }); // dropped (offline or refused): the minute check restarts it
  };
  // Only one open tab answers; another tab takes over when that one closes.
  if (navigator.locks) await new Promise((started) => navigator.locks.request("beacon-answering", () => { listen(); started(); return new Promise(() => {}); }));
  else listen();
  starting = false;
  timer ??= setInterval(() => { if (!stop && navigator.onLine) listen(); }, 60000);
  addEventListener("online", () => { if (!stop) listen(); });
}

// "Turn off their link": the old link stops working for everyone (the rules refuse it), and the next
// "Text them their check-in link" makes a new trip and link.
export async function turnOffLink() {
  const trip = store.trip, [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (trip?.created && fs && uid) await fs.f.updateDoc(fs.f.doc(fs.db, "shares", trip.shareId), { revoked: true }).catch(() => {});
  stop?.(); stop = null; store.trip = null;
}
