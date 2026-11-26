// Which city you're in, its emergency numbers, and the scams saved for it.
// The city comes from your GPS position: OpenStreetMap's Nominatim names it (only when you've moved far;
// the last one is saved, so it still shows with no signal). Until the phone says where you are, the city is unknown.
// New York has 32 researched scams built in, used only when you're in New York. In every city, while you're
// online, Beacon asks Gemini once a day for scams travelers report there (with Google Search when the
// project allows it, otherwise from what the model knows) and saves them so the scan works with no signal.
import { ny } from "./nypack.js";
import { askAi, askAiWithSearch } from "../../js/ai.js";
import { researchPrompt, memoryPrompt, readResearch, needsResearch, mergeScams } from "../../js/cityscams.js";
import { numbersFor } from "../../js/emergency.js";
import { meters } from "./places.js";
import { cleanCity } from "../../js/trip.js";

const NYC = { lat: 40.758, lng: -73.9855 };
const CITY_KEY = "beacon.city", scamKey = (name) => `beacon.scams.${name.toLowerCase()}`;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full */ } };

// name "" = not known yet. countryCode is OpenStreetMap's two-letter code ("us", "pt").
const last = read(CITY_KEY);
export const city = { name: last?.name || "", country: last?.country || "", countryCode: last?.countryCode || "", at: last?.at || null, researching: false };

export const inNewYork = () => city.name === "New York";
export const numbers = () => numbersFor(city.countryCode);

export function scamsHere() {
  if (!city.name) return [];
  const researched = read(scamKey(city.name))?.scams || [];
  return inNewYork() ? mergeScams(ny.scams, researched) : researched;
}
export const savedAt = () => (city.name ? read(scamKey(city.name))?.savedAt || 0 : 0);
export const fromMemory = () => scamsHere().some((s) => s.fromMemory);

// Works out the city at `at` ({lat, lng}); calls onChange when it or its scams change.
export async function arriveAt(at, onChange) {
  const saved = read(CITY_KEY);
  if (saved?.name && meters(saved.at, at) < 20000) Object.assign(city, saved);
  else if (navigator.onLine) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=${at.lat}&lon=${at.lng}`, { signal: AbortSignal.timeout(10000) });
      const a = (await res.json()).address || {};
      let name = cleanCity(a.city || a.town || a.village || a.municipality || a.county || a.state || "");
      if (meters(at, NYC) < 50000 && a.country_code === "us") name = "New York"; // all five boroughs share New York's pack
      if (name) {
        Object.assign(city, { name, country: a.country || "", countryCode: a.country_code || "", at });
        write(CITY_KEY, { name, country: city.country, countryCode: city.countryCode, at });
      }
    } catch { /* offline or busy: keep the last city */ }
  }
  onChange();
  research(onChange);
}

// Once a day per city, while online: look up scams reported here and save them.
export async function research(onChange) {
  if (!city.name) return;
  const key = scamKey(city.name), saved = read(key);
  if (city.researching || !needsResearch(saved, Date.now(), navigator.onLine)) return;
  city.researching = true; onChange();
  write(key, { ...(saved || { savedAt: 0, scams: [] }), triedAt: Date.now() });
  let found = readResearch(await askAiWithSearch(researchPrompt(city.name, city.country, new Date().toISOString().slice(0, 10))));
  // No search (the free plan has no quota for it): ask what the model knows. Marked "not checked".
  if (!found.length) found = readResearch((await askAi(memoryPrompt(city.name, city.country)))?.text, { fromMemory: true });
  if (found.length) write(key, { savedAt: Date.now(), scams: mergeScams(found, saved?.scams || []) });
  city.researching = false; onChange();
}
