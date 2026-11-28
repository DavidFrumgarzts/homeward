// Areas to avoid at night for a city, from free sources (David, 2026-11-27: "whatever is free"): Wikivoyage's
// "Stay safe" sections (written by travelers, often linking official advice) and the UK government's travel advice.
// Citizen has no free API, Reddit blocks automated reads, X and Google Search grounding cost money: not used.
// The free Gemini key only picks places out of these texts. Safeguards, because this names real places:
//   - every area needs an exact quote that really appears in a fetched source (checked here, word for word);
//   - never an area described by who lives there (religion, ethnicity, caste, migrants, poverty);
//   - no whole districts (more than 1.5 km² on the map);
//   - only areas an official source names may alert her people by themselves ("official"); a travel guide alone
//     colours the map and steers the route.
// Pure logic; index.js (researchAreas) fetches, asks, finds the places on OpenStreetMap and caches per city.

export const MAX_AREAS = 8;
const MAX_KM2 = 1.5;
const IDENTITY = /\b(muslim|hindu|jewish|christian|sikh|buddhist|islamic|ethnic|caste|dalit|immigrants?|migrants?|refugees?|roma|gypsy|gypsies|tribal|poor|poverty|slums?)\b/i;

export const slugOf = (city, country) => `${city}--${country}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

// The "Stay safe" section of a Wikivoyage page's wikitext ("" if none).
export function staySafe(wikitext) {
  const m = String(wikitext || "").match(/\n==\s*Stay safe\s*==\s*\n([\s\S]*?)(?=\n==[^=]|$)/i);
  return m ? m[1] : "";
}
// Wikitext or HTML -> plain sentences.
export function plainText(s) {
  return String(s || "")
    .replace(/\{\{warningbox\|([^|}]*)[^}]*\}\}/gi, "$1 ")
    .replace(/\{\{[^{}]*\}\}/g, " ").replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, " ")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1").replace(/\[https?:\/\/\S+ ([^\]]*)\]/g, "$1")
    .replace(/'{2,}/g, "").replace(/<[^>]+>/g, " ").replace(/^=+\s*|\s*=+$/gm, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
}

// sources: [{id, site, url, type: "official"|"traveler", text}]
export function extractPrompt(city, country, sources) {
  const blocks = sources.map((s) => `[${s.id}] ${s.site} (${s.type === "official" ? "official government advice" : "travel guide written by travelers"})\n${s.text.slice(0, 9000)}`).join("\n\n");
  return `Below are safety texts about ${city}, ${country}. Find SPECIFIC places in ${city} that these texts warn travelers about, especially at night: a street, a square, a station or bus stand area, a park, a beach, a bridge, a road, or a small named neighbourhood. Not the whole city and not large regions.
Use ONLY these texts. For each place, copy one or two short exact quotes (3 to 25 words, copied character for character) from the text that names the place and the problem. Never choose or describe a place by who lives there (religion, ethnicity, caste, migrants, poverty); only by the reported problem (robbery, pickpocketing, assault, scams, armed violence, an isolated road).
Give a search string that finds the place on a map, what happens there in one short sentence, and the hours it applies (0-23; 21 to 5 if the text only says "at night"; 0 to 24 if always).
Return ONLY JSON, at most ${MAX_AREAS} places, or {"areas":[]} if the texts name no specific place:
{"areas":[{"name":"","place":"","why":"","fromHour":21,"toHour":5,"evidence":[{"source":"S1","quote":""}]}]}

${blocks}`;
}

const GENERIC = new Set(["street", "road", "area", "areas", "district", "station", "park", "beach", "square", "avenue", "market", "bridge", "neighbourhood", "neighborhood", "around", "near", "city", "centre", "center", "rua", "avenida", "praca", "lagoon", "lake"]);
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const str = (x, max) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
const hour = (h, d) => (Number.isInteger(h) && h >= 0 && h <= 24 ? h : d);
const slug = (s) => norm(s).replace(/ /g, "-").slice(0, 60);

// The model's answer -> [{id, name, place, why, fromHour, toHour, sources: [{url, site, type, quote}], official}].
export function readAreas(text, sources) {
  const t = String(text || ""), a = t.indexOf("{"), b = t.lastIndexOf("}");
  let list; try { list = JSON.parse(t.slice(a, b + 1)).areas; } catch { return []; }
  if (!Array.isArray(list)) return [];
  const byId = new Map(sources.map((s) => [s.id, { ...s, normText: norm(s.text) }]));
  const out = [];
  for (const x of list) {
    const name = str(x?.name, 80), place = str(x?.place, 120) || name, why = str(x?.why, 200);
    if (!name || IDENTITY.test(`${name} ${why}`)) continue;
    const used = new Map();
    for (const e of Array.isArray(x.evidence) ? x.evidence : []) {
      const s = byId.get(e?.source), q = norm(e?.quote);
      if (!s || used.has(s.site) || q.split(" ").length < 3 || !s.normText.includes(q)) continue;
      used.set(s.site, { url: s.url, site: s.site, type: s.type, quote: str(e.quote, 300) });
    }
    if (!used.size) continue;
    const srcs = [...used.values()];
    // At least one quote must name the place itself, not just say "at night, be careful".
    const words = norm(`${name} ${place}`).split(" ").filter((w) => w.length >= 4 && !GENERIC.has(w));
    if (!words.length || !srcs.some((s) => words.some((w) => ` ${norm(s.quote)} `.includes(` ${w} `)))) continue;
    out.push({ id: slug(name), name, place, why, fromHour: hour(x.fromHour, 21), toHour: hour(x.toHour, 5), sources: srcs, official: srcs.some((s) => s.type === "official") });
    if (out.length === MAX_AREAS) break;
  }
  return out;
}

export function areaKm2(ring) {
  const lat0 = ring[0][0], kx = 111.32 * Math.cos((lat0 * Math.PI) / 180), ky = 110.54;
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][1] * kx) * (ring[i][0] * ky) - (ring[i][1] * kx) * (ring[j][0] * ky);
  return Math.abs(s / 2);
}

// OpenStreetMap GeoJSON ([lng, lat]) -> ring of [lat, lng], or null when it's a whole district.
// Polygon: outline (max 40 points). Street: a band 40 m either side. Point: a ~300 m square.
export function ringFrom(geo) {
  let ring = null;
  const thin = (pts) => { const step = Math.ceil(pts.length / 40); return pts.filter((_, i) => i % step === 0).slice(0, 40); };
  if (geo?.type === "Polygon") ring = thin(geo.coordinates[0].map(([x, y]) => [y, x]));
  else if (geo?.type === "MultiPolygon") ring = thin(geo.coordinates.map((p) => p[0].map(([x, y]) => [y, x])).reduce((a, b) => (areaKm2(b) > areaKm2(a) ? b : a)));
  else if (geo?.type === "LineString" || geo?.type === "MultiLineString") ring = band(thin((geo.type === "LineString" ? geo.coordinates : geo.coordinates.flat()).map(([x, y]) => [y, x])), 40);
  else if (geo?.type === "Point") {
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
    const dx = (b[1] - a[1]) * kx, dy = (b[0] - a[0]) * ky, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    left.push([line[i][0] + (ny * m) / ky, line[i][1] + (nx * m) / kx]);
    right.push([line[i][0] - (ny * m) / ky, line[i][1] - (nx * m) / kx]);
  }
  return [...left, ...right.reverse()];
}
