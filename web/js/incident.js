// The traveler's SOS in Firestore, so the people she texts can follow it on the family page.
// It writes the documents described in shared/schema/README.md: her trip and its family link (first
// time only), the incident, and its first update. Ids are made on this device, so the family link can
// go into the text message before anything has been sent anywhere.
// With no connection the writes stay on this device and go out later; the screen says which it is.
import { firebase, firestore, signedIn } from "./firebase.js";
import { store } from "./store.js";
import { pack } from "./pack.js";

const hex = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");

// The address family opens. Firebase Hosting serves /f/{id}; the plain local server needs ?f={id}.
export function familyLink(shareId, at = location) {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(at.hostname);
  return local ? `${at.origin}/?f=${shareId}` : `${at.origin}/f/${shareId}`;
}

// Ids for a new incident, or null when Firebase is not set up (then there is no family page and no link).
export async function prepareIncident() {
  if (!(await firebase())) return null;
  const trip = store.trip ?? { tripId: crypto.randomUUID(), shareId: hex(16), created: false };
  store.trip = trip;
  return { tripId: trip.tripId, shareId: trip.shareId, incidentId: crypto.randomUUID(), link: familyLink(trip.shareId) };
}

// details: { name, description, situation, message, fix } where fix is { lat, lng, takenAtMillis, accuracy } or null.
// Resolves to "synced" (the family page has it), "saved" (kept on this device until there is a
// connection), "failed" (the server refused it) or "off" (no Firebase). onSynced runs if it syncs later.
export function saveIncident(ids, details, onSynced = () => {}) {
  store.pending = { ids, details, startedAtMillis: Date.now() }; // survives a reload if nothing could be written yet
  return flushPending(onSynced);
}

// Also called when the page opens and when the connection comes back.
export async function flushPending(onSynced = () => {}) {
  const pending = store.pending;
  if (!pending) return "off";
  const [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (!fs) return "off";
  if (!uid) return "saved"; // first visit with no connection: nothing can be written yet
  const { db, f } = fs, { ids, details, startedAtMillis } = pending, now = Date.now(), batch = f.writeBatch(db);
  if (!store.trip?.created) {
    batch.set(f.doc(db, "trips", ids.tripId), { ownerUid: uid, travelerName: details.name || "", city: pack.city, country: pack.country, packId: null, platform: "web", createdAtMillis: now });
    batch.set(f.doc(db, "shares", ids.shareId), { tripId: ids.tripId, ownerUid: uid, contactLabel: "Trusted contacts", createdAtMillis: now, revoked: false });
  }
  batch.set(f.doc(db, "trips", ids.tripId, "incidents", ids.incidentId), {
    ownerUid: uid, tripId: ids.tripId, travelerName: details.name || "", city: pack.city, country: pack.country,
    phase: "SosActive", method: "SosButton", userConfirmed: true, description: details.description, situation: details.situation,
    triggerReasons: [], message: details.message,
    emergency: { police: pack.police, ambulance: pack.ambulance, embassyName: pack.embassy.name, embassyPhone: pack.embassy.phone },
    platform: "web", startedAtMillis, alertSentAtMillis: startedAtMillis, resolvedAtMillis: null, updatedAtMillis: now,
  });
  batch.set(f.doc(f.collection(db, "trips", ids.tripId, "incidents", ids.incidentId, "updates")), update(uid, "alert", details.fix, startedAtMillis));
  store.pending = null; // Firestore now holds the writes, on this device if need be
  const done = batch.commit().then(() => { store.trip = { ...store.trip, created: true }; onSynced(); return "synced"; });
  // With no connection commit() only finishes when it is back. She must not wait for that.
  return Promise.race([done, new Promise((resolve) => setTimeout(() => resolve("saved"), 2500))]).catch(() => "failed");
}

// Called when the traveler's app opens. If she has ever saved an SOS, starting Firestore lets it send
// anything still waiting on this device; then any SOS that could not be written at all is tried again.
export function resumeSync() {
  if (!store.trip && !store.pending) return;
  firestore().then(() => flushPending());
}

// "I'm safe now": marks the incident ended and adds the last update.
export async function endIncident(ids, fix) {
  const [fs, uid] = await Promise.all([firestore(), signedIn()]);
  if (!fs || !uid) return;
  const { db, f } = fs, now = Date.now(), batch = f.writeBatch(db);
  batch.update(f.doc(db, "trips", ids.tripId, "incidents", ids.incidentId), { phase: "Resolved", resolvedAtMillis: now, updatedAtMillis: now });
  batch.set(f.doc(f.collection(db, "trips", ids.tripId, "incidents", ids.incidentId, "updates")), update(uid, "ended", fix, now));
  batch.commit().catch(() => {}); // kept on this device and sent later if there is no connection
}

const update = (uid, kind, fix, now) => ({
  ownerUid: uid, kind, lat: fix?.lat ?? null, lng: fix?.lng ?? null, takenAtMillis: fix?.takenAtMillis ?? null,
  accuracyMeters: fix?.accuracy ?? null, batteryPercent: null, pointsHeld: 0, createdAtMillis: now,
});
