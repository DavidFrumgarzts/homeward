// Which city you're in, and the scams saved for it.
// New York comes with 32 researched scams built in. In any city, while you're online, Beacon asks Gemini
// (with Google Search) once a day for more, and saves them in this browser so the scan works with no signal.
// City names come from OpenStreetMap's Nominatim (only when you've moved far, and saved after that).
import { ny } from "./nypack.js";
import { askAiWithSearch } from "../../js/ai.js";
import { researchPrompt, readResearch, needsResearch, mergeScams } from "../../js/cityscams.js";
import { meters } from "./places.js";

const NYC = { lat: 40.758, lng: -73.9855 };
const CITY_KEY = "beacon.city", scamKey = (name) => `beacon.scams.${name.toLowerCase()}`;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full */ } };

export const city = { name: "New York", country: "United States", researching: false };

export function scamsHere() {
  const researched = read(scamKey(city.name))?.scams || [];
  return city.name === "New York" ? mergeScams(ny.scams, researched) : researched;
}
export const savedAt = () => read(scamKey(city.name))?.savedAt || 0;

// Works out the city at `at` ({lat, lng}); calls onChange when it or its scams change.
export async function arriveAt(at, onChange) {
  const last = read(CITY_KEY);
  if (meters(at, NYC) < 50000) Object.assign(city, { name: "New York", country: "United States" });
  else if (last && meters(last.at, at) < 20000) Object.assign(city, { name: last.name, country: last.country });
  else if (navigator.onLine) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=${at.lat}&lon=${at.lng}`, { signal: AbortSignal.timeout(10000) });
      const a = (await res.json()).address || {};
      const name = a.city || a.town || a.municipality || a.county || a.state;
      if (name) { Object.assign(city, { name, country: a.country || "" }); write(CITY_KEY, { at, name, country: city.country }); }
    } catch { /* keep the last city */ }
  }
  onChange();
  research(onChange);
}

// Once a day per city, while online: search the web for scams reported here and save them.
export async function research(onChange) {
  const key = scamKey(city.name), saved = read(key);
  if (city.researching || !needsResearch(saved, Date.now(), navigator.onLine)) return;
  city.researching = true; onChange();
  write(key, { ...(saved || { savedAt: 0, scams: [] }), triedAt: Date.now() });
  const text = await askAiWithSearch(researchPrompt(city.name, city.country, new Date().toISOString().slice(0, 10)));
  const found = readResearch(text);
  if (found.length) write(key, { savedAt: Date.now(), scams: mergeScams(found, saved?.scams || []) });
  city.researching = false; onChange();
}
