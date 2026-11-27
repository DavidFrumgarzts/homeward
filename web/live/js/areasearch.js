// Areas to avoid at night for the city she's in, from the researchAreas function (backend/functions: Wikivoyage's
// "Stay safe" and UK government travel advice, read by the free AI, every area backed by an exact quote, found on
// OpenStreetMap, cached for everyone). Saved on this phone per city, so routes and the map use them with no signal.
import { firebase, signedIn, SDK } from "../../js/firebase.js";
import { needsAreaResearch } from "../../js/arearesearch.js";

const key = (city) => `beacon.areas.${String(city).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };

export const researchedAreas = (city) => (city ? read(key(city))?.areas || [] : []);
export const areaState = { researching: false };

async function callable() {
  const fb = await firebase();
  if (!fb?.appCheck || !(await signedIn())) return null;
  const { getFunctions, httpsCallable } = await import(`${SDK}/firebase-functions.js`);
  return httpsCallable(getFunctions(fb.app, "us-central1"), "researchAreas", { timeout: 200000 });
}

// Once per city every 14 days, online. onChange() redraws; the map listens for "beacon-areas".
export async function researchAreas(city, country, onChange = () => {}) {
  if (!city || !country || areaState.researching) return;
  const k = key(city), saved = read(k);
  if (!needsAreaResearch(saved, Date.now(), navigator.onLine)) return;
  areaState.researching = true; onChange();
  write(k, { ...(saved || { savedAt: 0, areas: [] }), triedAt: Date.now() });
  try {
    const call = await callable();
    const res = call && (await call({ city, country }).catch(() => null));
    if (res?.data?.areas) write(k, { savedAt: Date.now(), areas: res.data.areas });
  } finally { areaState.researching = false; onChange(); dispatchEvent(new Event("beacon-areas")); }
}
