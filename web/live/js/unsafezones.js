// Red zones from police data around her (js/crimedata.js reads the data, js/unsafe.js finds the clusters).
// Fetched while online, once per ~2 km square, and saved on the phone with the time (refreshed after 7 days)
// so they still show and still shape routes with no signal. Only the zones are saved, never the reports.
// No crime layer where there's no official adapter. These zones never text anyone (alerts.js textableAreas).
import { sourceFor, boxAround, nycUrls, parseNyc, ukUrls, lastMonths, parseUk, describe } from "../../js/crimedata.js";
import { hotspots, metresTo } from "../../js/unsafe.js";

const KEY = "beacon.redzones", WEEK = 7 * 86400000, MAX_SQUARES = 20;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full: zones just aren't saved */ } };
// Squares of 0.02° (about 2 km); the fetched box reaches 3.5 km around the square's middle, past a 30-minute walk.
const square = ([lat, lng]) => [Math.round(lat * 50) / 50, Math.round(lng * 50) / 50];
const keyOf = (sq) => sq.map((x) => x.toFixed(2)).join(",");
const getJson = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(45000) }); if (!r.ok) throw new Error(r.status); return r.json(); };

const busy = new Map();
// Makes sure the zones around `at` ([lat,lng]) are saved and fresh. Resolves to true when something new was saved.
export function loadZones(at, countryCode = "") {
  const src = sourceFor(at, countryCode), sq = square(at), k = keyOf(sq);
  if (!src || !navigator.onLine) return Promise.resolve(false);
  const have = read()[k];
  if (have && Date.now() - have.savedAt < WEEK) return Promise.resolve(false);
  if (!busy.has(k)) busy.set(k, fetchZones(src, sq).then((zones) => {
    if (!zones) return false;
    const all = read();
    all[k] = { savedAt: Date.now(), src, zones };
    const keys = Object.keys(all).sort((a, b) => all[b].savedAt - all[a].savedAt);
    for (const old of keys.slice(MAX_SQUARES)) delete all[old];
    write(all);
    return true;
  }).catch(() => false).finally(() => busy.delete(k)));
  return busy.get(k);
}

async function fetchZones(src, sq) {
  if (src === "nyc") {
    // The 12 months up to the newest report published (NYC publishes quarterly).
    const latest = (await getJson("https://data.cityofnewyork.us/resource/5uac-w243.json?$select=max(cmplnt_fr_dt)%20as%20d"))[0]?.d;
    const since = new Date(latest || Date.now()); since.setFullYear(since.getFullYear() - 1);
    const rows = (await Promise.all(nycUrls(boxAround(sq, 3.5), since).map(getJson))).flat();
    return hotspots(parseNyc(rows), describe("nyc"));
  }
  const latest = (await getJson("https://data.police.uk/api/crimes-street-dates"))[0]?.date;
  if (!latest) return null;
  // One request at a time: the API answers 429 to bursts (without CORS headers, so it shows as a network error).
  // A failed request is tried once more after a pause.
  const rows = [];
  for (const url of ukUrls(sq, lastMonths(latest, 3))) {
    rows.push(...await getJson(url).catch(async () => { await new Promise((r) => setTimeout(r, 2500)); return getJson(url); }));
  }
  return hotspots(parseUk(rows), describe("uk", { latest }));
}

// The saved zones near `at` (any age: with no signal old ones are better than none), from every square
// within 4 km. Where squares overlap, the busier of two overlapping zones is kept.
export function zonesAround(at, radiusM = 4000) {
  if (!at) return [];
  const all = read(), out = [];
  for (const { zones } of Object.values(all)) for (const z of zones || []) if (metresTo(at, z) <= radiusM) out.push(z);
  out.sort((a, b) => b.count - a.count);
  const kept = [];
  for (const z of out) if (!kept.some((k) => k.id === z.id || metresTo(z.center, k) === 0)) kept.push(z);
  return kept;
}
