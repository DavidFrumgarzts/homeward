// Areas to avoid at night, researched for the city she's in (David, 2026-11-27: "from reports, Citizen-style apps
// and the internet in general, whatever is free"). Gemini with Google Search reads official travel advice, news,
// police statements and travelers' posts (Reddit, forums, reviews) and names specific places with their sources.
// Pure logic here; live/js/areasearch.js asks, finds each place on the map (OpenStreetMap) and saves it on the phone.
// Safeguards, because this names real places:
//   - at least 2 different sites must report it, and the map lists them;
//   - with search results known, only sites the search really returned count (no made-up links);
//   - never an area described by who lives there (religion, ethnicity, caste, migrants, poverty): only reported
//     incidents such as robberies or scams;
//   - no whole districts (more than 1.5 km²);
//   - only areas with an official or news source may alert her people by themselves (alerts.js); travelers'
//     posts alone only colour the map and steer the route.
// (Citizen has no free API, and X needs a paid xAI key: not used.)

const MAX_AREAS = 8, MAX_KM2 = 1.5, DAY = 864e5;
const IDENTITY = /\b(muslim|hindu|jewish|christian|sikh|buddhist|islamic|ethnic|caste|dalit|immigrants?|migrants?|refugees?|roma|gypsy|gypsies|tribal|poor|poverty|slums?)\b/i;
const TYPES = ["official", "news", "police", "traveler"];

export function areaPrompt(city, country, date) {
  return `Today is ${date}. A traveler is in ${city}, ${country}. Search official travel advice (government travel advisories, embassies), local news, police statements, and travelers' reports (Reddit, travel forums, reviews) for SPECIFIC places in ${city} that travelers are warned about at night: a street, a square, a station or bus stand area, a park, a bridge, or a small named neighbourhood. Not whole districts or the whole city.
Only include a place if at least 2 different websites report a concrete problem there (robbery, pickpocketing, assault, scams, drink spiking, an isolated road). Never describe or choose a place by who lives there (religion, ethnicity, caste, migrants, poverty): only by what was reported.
For each place give the name travelers use, a search string that finds it on a map, what happens there in one short sentence, the hours it applies (0-23, can run past midnight), and the sources with their real URLs and type: official (government, embassy), police, news, or traveler.
Return ONLY JSON, at most ${MAX_AREAS} places, or {"areas":[]} if you find none:
{"areas":[{"name":"","place":"","why":"","fromHour":21,"toHour":5,"sources":[{"url":"https://...","type":"official|police|news|traveler"}]}]}`;
}

const jsonIn = (text) => {
  const t = String(text || ""), a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
};
const str = (x, max) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
const hour = (h, d) => (Number.isInteger(h) && h >= 0 && h <= 24 ? h : d);
export const siteOf = (url) => { try { const u = new URL(url); return u.protocol === "https:" ? u.hostname.replace(/^www\./, "").toLowerCase() : null; } catch { return null; } };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// The model's answer -> [{id, name, place, why, fromHour, toHour, sources: [{url, site, type}], official}].
// grounded: sites Google Search actually returned for this answer (empty = unknown, then the model's links count).
export function readAreas(text, grounded = []) {
  const list = jsonIn(text)?.areas;
  if (!Array.isArray(list)) return [];
  const real = grounded.map((g) => String(g).replace(/^www\./, "").toLowerCase());
  const found = (site) => !real.length || real.some((g) => site === g || site.endsWith(`.${g}`) || g.endsWith(`.${site}`));
  const out = [];
  for (const a of list) {
    const name = str(a?.name, 80), place = str(a?.place, 120) || name, why = str(a?.why, 200);
    if (!name || IDENTITY.test(`${name} ${why}`)) continue;
    const seen = new Set(), sources = [];
    for (const s of Array.isArray(a.sources) ? a.sources : []) {
      const site = siteOf(s?.url);
      if (!site || seen.has(site) || !found(site)) continue;
      seen.add(site); sources.push({ url: s.url, site, type: TYPES.includes(s.type) ? s.type : "traveler" });
    }
    if (sources.length < 2) continue;
    out.push({ id: slug(name), name, place, why, fromHour: hour(a.fromHour, 21), toHour: hour(a.toHour, 5), sources,
      official: sources.some((s) => s.type !== "traveler") });
    if (out.length === MAX_AREAS) break;
  }
  return out;
}

// Area of a ring of [lat, lng] in km² (flat-earth, fine for a few km).
export function areaKm2(ring) {
  const lat0 = ring[0][0], kx = 111.32 * Math.cos((lat0 * Math.PI) / 180), ky = 110.54;
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][1] * kx) * (ring[i][0] * ky) - (ring[i][1] * kx) * (ring[j][0] * ky);
  return Math.abs(s / 2);
}

// A map result's shape (GeoJSON from OpenStreetMap, [lng, lat]) -> a ring of [lat, lng], or null if it's too big.
// Polygon: its outline (at most 40 points). Street: a band 40 m either side. Point: a ~300 m square.
export function ringFrom(geo) {
  let ring = null;
  const thin = (pts) => { const step = Math.ceil(pts.length / 40); return pts.filter((_, i) => i % step === 0).slice(0, 40); };
  if (geo?.type === "Polygon") ring = thin(geo.coordinates[0].map(([x, y]) => [y, x]));
  else if (geo?.type === "MultiPolygon") {
    const rings = geo.coordinates.map((p) => p[0].map(([x, y]) => [y, x]));
    ring = thin(rings.reduce((a, b) => (areaKm2(b) > areaKm2(a) ? b : a)));
  } else if (geo?.type === "LineString" || geo?.type === "MultiLineString") {
    const line = (geo.type === "LineString" ? geo.coordinates : geo.coordinates.flat()).map(([x, y]) => [y, x]);
    ring = band(thin(line), 40);
  } else if (geo?.type === "Point") {
    const [x, y] = geo.coordinates, dy = 150 / 110540, dx = 150 / (111320 * Math.cos((y * Math.PI) / 180));
    ring = [[y - dy, x - dx], [y - dy, x + dx], [y + dy, x + dx], [y + dy, x - dx]];
  }
  if (!ring || ring.length < 3 || areaKm2(ring) > MAX_KM2) return null;
  return ring.map(([a, b]) => [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6]);
}
function band(line, m) {
  if (line.length < 2) return null;
  const kx = 111320 * Math.cos((line[0][0] * Math.PI) / 180), ky = 110540, left = [], right = [];
  for (let i = 0; i < line.length; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    const dx = (b[1] - a[1]) * kx, dy = (b[0] - a[0]) * ky, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // left normal, in metres
    left.push([line[i][0] + (ny * m) / ky, line[i][1] + (nx * m) / kx]);
    right.push([line[i][0] - (ny * m) / ky, line[i][1] - (nx * m) / kx]);
  }
  return [...left, ...right.reverse()];
}

// Research again every 14 days per city, online only; after a failed try, wait an hour.
export function needsAreaResearch(saved, now, online) {
  if (!online) return false;
  if (saved?.triedAt && now - saved.triedAt < 3600_000) return false;
  return !saved?.savedAt || now - saved.savedAt > 14 * DAY;
}
