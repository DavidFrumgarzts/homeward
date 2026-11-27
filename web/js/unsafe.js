// Red zones from police data, and which of them to show. Pure logic; live/js/unsafezones.js fetches and caches.
// A zone is where official crime reports cluster, worked out by arithmetic (no AI picks areas: see areas.js).
// They're drawn and routed around at night, but never text anyone: only David's reviewed list and her own
// marks can do that (alerts.js textableAreas).
import { meters, inside, walkDistances } from "./walkroute.js";

export const CELL_M = 150, MIN_COUNT = 5, TOP_SHARE = 0.05, WALK_M = 2400, MAX_ZONES = 12; // 30 min at 80 m/min

const WORD = { robbery: ["robbery", "robberies"], assault: ["assault", "assaults"], theft: ["street theft", "street thefts"] };
const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

// incidents: [{lat, lng, kind, street?}] from crimedata.js. meta: describe() of the source.
// Bins into ~150 m cells; a cell is hot if it has at least MIN_COUNT reports AND is in the top 5% of the cells
// with any report in the fetched area (so a busy district isn't all red). Touching hot cells merge into one
// patch: one square ring per cell (`rings`), drawn as one shape with rounded corners (routemap.js).
// -> zones, busiest first.
export function hotspots(incidents, meta = {}, { cell = CELL_M, min = MIN_COUNT, top = TOP_SHARE } = {}) {
  if (!incidents.length) return [];
  const lat0 = incidents[0].lat, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540, lng0 = incidents[0].lng;
  const cells = new Map();
  for (const p of incidents) {
    const ix = Math.floor(((p.lng - lng0) * kx) / cell), iy = Math.floor(((p.lat - lat0) * ky) / cell), k = `${ix},${iy}`;
    const c = cells.get(k) || { ix, iy, n: 0, kinds: {}, streets: {} };
    c.n++; c.kinds[p.kind] = (c.kinds[p.kind] || 0) + 1;
    if (p.street) c.streets[p.street] = (c.streets[p.street] || 0) + 1;
    cells.set(k, c);
  }
  const counts = [...cells.values()].map((c) => c.n).sort((a, b) => b - a);
  const k = Math.ceil(counts.length * top);
  let cut = counts[k - 1];
  if (counts.filter((c) => c >= cut).length > 2 * k) cut++; // many cells tied at the cut: only the ones above it
  cut = Math.max(min, cut);
  const hot = new Map([...cells].filter(([, c]) => c.n >= cut));
  const seen = new Set(), zones = [];
  for (const [k0] of hot) {
    if (seen.has(k0)) continue;
    const group = [], stack = [k0]; seen.add(k0);
    while (stack.length) {
      const c = hot.get(stack.pop()); group.push(c);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const k = `${c.ix + dx},${c.iy + dy}`;
        if (hot.has(k) && !seen.has(k)) { seen.add(k); stack.push(k); }
      }
    }
    const toLL = (x, y) => [+(lat0 + y / ky).toFixed(6), +(lng0 + x / kx).toFixed(6)];
    const rings = group.map((c) => [[c.ix, c.iy], [c.ix + 1, c.iy], [c.ix + 1, c.iy + 1], [c.ix, c.iy + 1]].map(([x, y]) => toLL(x * cell, y * cell)));
    const n = group.reduce((s, c) => s + c.n, 0), kinds = {}, streets = {};
    for (const c of group) { for (const [k, v] of Object.entries(c.kinds)) kinds[k] = (kinds[k] || 0) + v; for (const [k, v] of Object.entries(c.streets)) streets[k] = (streets[k] || 0) + v; }
    const cx = group.reduce((s, c) => s + (c.ix + 0.5) * cell, 0) / group.length, cy = group.reduce((s, c) => s + (c.iy + 0.5) * cell, 0) / group.length;
    const center = toLL(cx, cy), street = Object.entries(streets).sort((a, b) => b[1] - a[1])[0]?.[0];
    zones.push(zone({ n, kinds, rings, center, street }, meta));
  }
  return zones.sort((a, b) => b.count - a.count).slice(0, MAX_ZONES);
}

function zone({ n, kinds, rings, center, street }, meta) {
  const night = meta.night !== false, period = meta.period || "last 12 months";
  const parts = ["robbery", "assault", "theft"].filter((k) => kinds[k]).map((k) => `${kinds[k]} ${WORD[k][kinds[k] === 1 ? 0 : 1]}`);
  return {
    id: `police-${center[0].toFixed(4)},${center[1].toFixed(4)}`,
    name: street ? `Around ${street}` : night ? "Busy for street crime at night" : "Busy for street crime",
    why: `${list(parts)} reported here${night ? " at night" : ""} in the ${period}.`,
    count: n, rings, center, origin: "Police data", period, source: meta.source || "", licence: meta.licence || "",
    fromHour: 18, toHour: 6, // drawn and routed around at night; the NYC data is night reports only, the UK data has no hours
  };
}

// A zone's rings: police zones have one per cell, Beacon's list and her marks have one `ring`.
export const ringsOf = (z) => z.rings || [z.ring];
export const inZone = (p, z) => ringsOf(z).some((r) => inside(p, r));

// Does the polyline [[lat,lng]] touch the zone? (a point inside, or a segment crossing an edge)
export function crosses(line, z) {
  if (!line?.length) return false;
  if (line.some((p) => inZone(p, z))) return true;
  const ccw = (a, b, c) => (c[0] - a[0]) * (b[1] - a[1]) > (b[0] - a[0]) * (c[1] - a[1]);
  const hit = (a, b, c, d) => ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  for (const ring of ringsOf(z)) for (let i = 1; i < line.length; i++) for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) if (hit(line[i - 1], line[i], ring[k], ring[j])) return true;
  return false;
}

// Straight-line metres from `at` to the zone (0 inside).
export function metresTo(at, zone) {
  if (inZone(at, zone)) return 0;
  return Math.min(...ringsOf(zone).flat().map((p) => meters(at, p)));
}

// Which zones to draw: within a 30-minute walk of her, or touching one of her planned routes (lines).
// With a street graph that covers her, walking distance counts; zones outside the graph fall back to
// straight-line distance (WALK_M).
export function zonesToShow(zones, at, { graph = null, lines = [] } = {}) {
  if (!at) return zones.filter((z) => lines.some((l) => crosses(l, z)));
  let dist = null;
  if (graph?.nodes?.length) {
    const d = walkDistances(graph, at, WALK_M);
    if (d.some((x) => x === 0) && nearM(graph, at) < 150) dist = d;
  }
  return zones.filter((z) => {
    if (lines.some((l) => crosses(l, z))) return true;
    if (dist) {
      let covered = false;
      for (let i = 0; i < graph.nodes.length; i++) {
        if (!inZone(graph.nodes[i], z)) continue;
        covered = true;
        if (dist[i] <= WALK_M) return true;
      }
      if (covered) return false; // the streets reach it, but more than 30 minutes away on foot
    }
    return metresTo(at, z) <= WALK_M;
  });
}
const nearM = (g, at) => g.nodes.reduce((m, n) => Math.min(m, meters(at, n)), Infinity);

// The police-data line for the route card, or "". safe/fastest: route objects with .path.
export function zoneLine(safe, fastest, zones) {
  const police = zones.filter((z) => z.origin === "Police data");
  if (!safe?.path || !police.length) return "";
  const on = police.filter((z) => crosses(safe.path, z));
  if (on.length) return `Passes a red zone from police data${/^Around /.test(on[0].name) ? ` (${on[0].name.slice(7)})` : ""}.`;
  const around = fastest?.path ? police.filter((z) => crosses(fastest.path, z)).length : 0;
  return around ? `Goes around ${around === 1 ? "a red zone" : `${around} red zones`} from police data.` : "";
}

// The amber "quiet after dark" note for a route (OpenStreetMap tags), or "". Ignores bits under 40 m.
export function quietNote(r) {
  const q = r?.quiet;
  if (!q) return "";
  const parts = [q.unlit >= 40 && "unlit footpath", q.underpass >= 40 && "an underpass", q.park >= 40 && "a path through a park"].filter(Boolean);
  return parts.length ? `Part of this route is ${list(parts)}, quiet after dark.` : "";
}
