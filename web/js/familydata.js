// The family view's live data: follows one family link in Firestore (layout in shared/schema/README.md).
// 1. Sign in anonymously. 2. Watch shares/{shareId}: it appears when her phone first gets a connection,
// and changes if she turns the link off. 3. Write "I opened this link" (trips/{tripId}/viewers/{me});
// the database rules check the link is real and still on. 4. Listen to the trip's incidents and the
// current incident's location updates. A contact can read that one trip's incidents and nothing else.
import { firestore, signedIn } from "./firebase.js";

export const validShareId = (id) => /^[0-9a-f]{32}$/.test(id);

// Calls onState with { status, incident, updates, fromCache }. status is one of:
//   "loading"      getting started
//   "bad-link"     the address is not a Beacon link
//   "waiting"      nothing from her phone yet (it may have no internet connection)
//   "no-incident"  the link is real, but no SOS has been saved under it
//   "ready"        there is an incident to show
//   "off"          she turned this link off
//   "offline"      this computer cannot reach Beacon's server
// Returns { stop }.
export function watchShare(shareId, onState) {
  const stops = [];
  let stopped = false;
  const stop = () => { stopped = true; stops.splice(0).forEach((end) => end()); };
  if (!validShareId(shareId)) { onState({ status: "bad-link" }); return { stop }; }
  onState({ status: "loading" });
  (async () => {
    const [fs, uid] = await Promise.all([firestore(), signedIn()]);
    if (stopped) return;
    if (!fs || !uid) return onState({ status: "offline" });
    let tripId = null, stopTrip = () => {};
    stops.push(() => stopTrip());
    stops.push(fs.f.onSnapshot(fs.f.doc(fs.db, "shares", shareId), (share) => {
      if (!share.exists() || share.data().revoked) {
        stopTrip(); tripId = null;
        return onState({ status: share.exists() ? "off" : "waiting" });
      }
      if (tripId === share.data().tripId) return;
      stopTrip(); tripId = share.data().tripId;
      stopTrip = watchTrip(fs, uid, shareId, tripId, onState);
    }, () => onState({ status: "offline" })));
  })();
  return { stop };
}

function watchTrip({ db, f }, uid, shareId, tripId, onState) {
  let stopIncidents = () => {}, stopUpdates = () => {}, stopped = false, current = null, updates = [];
  // "From cache" = this device is showing what it saved earlier and has not heard from the server.
  // Listening to metadata changes makes Firestore tell us when that stops being true.
  const live = { includeMetadataChanges: true };
  let incidentsCached = false, updatesCached = false;
  // The rules refuse us when the link is turned off; anything else is a connection problem.
  const failed = (error) => { if (!stopped) onState({ status: error?.code === "permission-denied" ? "off" : "offline" }); };
  const emit = () => { if (!stopped) onState(current ? { status: "ready", incident: current, updates, fromCache: incidentsCached || updatesCached } : { status: "no-incident" }); };

  f.setDoc(f.doc(db, "trips", tripId, "viewers", uid), { shareId, createdAtMillis: Date.now() }).then(() => {
    if (stopped) return;
    const latest = f.query(f.collection(db, "trips", tripId, "incidents"), f.orderBy("startedAtMillis", "desc"), f.limit(5));
    stopIncidents = f.onSnapshot(latest, live, (found) => {
      incidentsCached = found.metadata.fromCache;
      const all = found.docs.map((d) => ({ id: d.id, ...d.data() }));
      const next = all.find((incident) => incident.phase !== "Resolved") ?? all[0] ?? null; // an active one first, else the newest
      if (next?.id !== current?.id) {
        stopUpdates(); updates = [];
        if (next) {
          const inOrder = f.query(f.collection(db, "trips", tripId, "incidents", next.id, "updates"), f.orderBy("createdAtMillis"));
          stopUpdates = f.onSnapshot(inOrder, live, (got) => { updates = got.docs.map((d) => ({ id: d.id, ...d.data() })); updatesCached = got.metadata.fromCache; emit(); }, failed);
        }
      }
      current = next;
      emit();
    }, failed);
  }, failed);

  return () => { stopped = true; stopIncidents(); stopUpdates(); };
}
