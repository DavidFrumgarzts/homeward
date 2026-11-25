// The drive to the nearest hospital, saved for no signal. Hospitals from OpenStreetMap (Overpass), drive times and
// the road line from the free OpenStreetMap car router (FOSSGIS OSRM, at most one request a second).
// Not Google's Routes API: its terms forbid drawing its routes on our map or keeping them offline. For live
// turn-by-turn driving, the app links to Google Maps instead (googleMapsLink in js/trip.js).
import { OVERPASS, meters } from "./places.js";

const KEY = "beacon.hospitalDrive";
const OSRM = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export const savedHospitalDrive = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };

// Hospitals within `radiusM` of at ({lat,lng}), nearest first by air. [] when none or the servers are busy.
export async function hospitalsAround(at, radiusM = 60000) {
  const q = `[out:json][timeout:40];nwr["amenity"="hospital"](around:${radiusM},${at.lat},${at.lng});out center 300;`;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(45000) });
      if (!r.ok) continue;
      return (await r.json()).elements
        .map((e) => ({ name: e.tags?.name || e.tags?.["name:en"], lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon }))
        .filter((h) => h.name && h.lat != null)
        .map((h) => ({ ...h, airM: meters(at, h) }))
        .sort((a, b) => a.airM - b.airM);
    } catch { /* next server */ }
  }
  return [];
}

// Drives to the 3 nearest hospitals by air; keeps and saves the quickest: {name, at:[lat,lng], minutes, line, from}.
// null when none can be reached (no hospital, or the router is down).
export async function saveHospitalDrive(from, hospitals) {
  let best = null;
  for (const h of hospitals.slice(0, 3)) {
    try {
      const r = await fetch(`${OSRM}/${from.lng},${from.lat};${h.lng},${h.lat}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(15000) });
      const route = (await r.json()).routes?.[0];
      if (route && (!best || route.duration / 60 < best.minutes)) {
        best = { name: h.name, at: [h.lat, h.lng], minutes: Math.round(route.duration / 60), km: Math.round(route.distance / 100) / 10, line: route.geometry.coordinates.map(([x, y]) => [y, x]), from: [from.lat, from.lng] };
      }
    } catch { /* skip this one */ }
    await pause(1100);
  }
  if (best) try { localStorage.setItem(KEY, JSON.stringify({ ...best, savedAt: Date.now() })); } catch { /* full */ }
  return best;
}
