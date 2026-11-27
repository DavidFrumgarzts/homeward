// Researches areas to avoid at night for the city she's in (js/arearesearch.js has the rules), finds each one on
// the map with OpenStreetMap's Nominatim (one request a second), and saves them on this phone per city, so routes
// and the map use them with no signal. Places and shapes © OpenStreetMap contributors (ODbL).
import { askAiWithSearchSources } from "../../js/ai.js";
import { areaPrompt, readAreas, ringFrom, needsAreaResearch } from "../../js/arearesearch.js";

const key = (city) => `beacon.areas.${String(city).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export const researchedAreas = (city) => (city ? read(key(city))?.areas || [] : []);
export const areaState = { researching: false };

async function shapeOf(place, city, near) {
  const d = 0.2, vb = near ? `&viewbox=${near[1] - d},${near[0] + d},${near[1] + d},${near[0] - d}&bounded=1` : "";
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&polygon_geojson=1&polygon_threshold=0.0002&accept-language=en${vb}&q=${encodeURIComponent(`${place}, ${city}`)}`, { signal: AbortSignal.timeout(10000) });
    const hit = (await r.json())[0];
    return hit ? ringFrom(hit.geojson) || ringFrom({ type: "Point", coordinates: [+hit.lon, +hit.lat] }) : null;
  } catch { return null; }
}

// Once per city every 14 days, online. near: [lat, lng] of the city (keeps map lookups inside it). onChange() redraws.
export async function researchAreas(city, country, near, onChange = () => {}) {
  if (!city || areaState.researching) return;
  const k = key(city), saved = read(k);
  if (!needsAreaResearch(saved, Date.now(), navigator.onLine)) return;
  areaState.researching = true; onChange();
  write(k, { ...(saved || { savedAt: 0, areas: [] }), triedAt: Date.now() });
  try {
    const res = await askAiWithSearchSources(areaPrompt(city, country, new Date().toISOString().slice(0, 10)));
    const found = res ? readAreas(res.text, res.sites) : [];
    const areas = [];
    for (const a of found) {
      const ring = await shapeOf(a.place, city, near);
      if (ring) areas.push({ ...a, city, ring });
      await pause(1100);
    }
    if (res) write(k, { savedAt: Date.now(), areas });
  } finally { areaState.researching = false; onChange(); dispatchEvent(new Event("beacon-areas")); }
}
