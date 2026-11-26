// Beacon's own walking router (web/js/router.js is the page router, a different thing). Streets from OpenStreetMap -> a graph -> the cheapest path.
// "Cheapest" = metres x a factor per street: main and lit streets cost less (busier at night), alleys and paths
// more, and anything inside an area to avoid costs a lot. Runs in the browser, so it works with no signal once
// the streets are saved.

const R = 6371000, rad = (d) => (d * Math.PI) / 180;
export function meters(a, b) {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Streets you can't or shouldn't walk on.
const NO_WALK = /^(motorway|motorway_link|trunk_link|construction|proposed|raceway|bus_guideway|abandoned|platform|corridor|elevator)$/;
export function walkable(tags) {
  if (!tags.highway || NO_WALK.test(tags.highway)) return false;
  if (["no", "private"].includes(tags.foot) || (["no", "private"].includes(tags.access) && !["yes", "designated", "permissive"].includes(tags.foot))) return false;
  return true;
}

// How safe a street feels at night, as a cost factor (lower = preferred).
const BUSY = { primary: 0.8, secondary: 0.85, tertiary: 0.9, primary_link: 0.85, secondary_link: 0.9, tertiary_link: 0.9, trunk: 0.9, pedestrian: 0.85, residential: 1.15, living_street: 1.1, unclassified: 1.15, service: 1.6, footway: 1.4, path: 2.2, track: 2.5, steps: 1.8, cycleway: 1.5, alley: 2.5 };
export function safetyFactor(tags) {
  let f = BUSY[tags.service === "alley" ? "alley" : tags.highway] ?? 1.2;
  if (tags.lit === "yes" || tags.lit === "24/7" || tags.lit === "automatic") f *= 0.8;
  if (tags.lit === "no") f *= 1.5;
  if (tags.tunnel === "yes" || tags.tunnel === "building_passage") f *= 1.5; // underpasses: quiet after dark
  return f;
}

// "Quiet after dark" (OpenStreetMap tags, not crime data): bit 1 unlit footpath, 2 underpass, 4 path through a park.
// Shown as an amber note on the route only; never a red zone, never a reason to text anyone.
const FOOT = /^(footway|path|track|steps|cycleway|bridleway)$/;
export function quietBits(tags, inPark = false) {
  let q = 0;
  if (FOOT.test(tags.highway) && (tags.lit === "no" || (/^(path|track)$/.test(tags.highway) && tags.lit !== "yes"))) q |= 1;
  if (tags.tunnel === "yes" && FOOT.test(tags.highway)) q |= 2;
  if (inPark && FOOT.test(tags.highway) && tags.lit !== "yes") q |= 4;
  return q;
}
// Parks (and big lawns) from the same Overpass reply: closed ways only. -> [ring]
function parksOf(ways) {
  const out = [];
  for (const w of ways) {
    const t = w.tags || {}, g = w.geometry;
    if (!g || g.length < 4 || !(t.leisure === "park" || t.landuse === "grass")) continue;
    const ring = g.map((p) => [p.lat, p.lon]);
    if (t.landuse === "grass" && areaM2(ring) < 10000) continue;
    out.push(ring);
  }
  return out;
}
function areaM2(ring) {
  const k = 111320 * Math.cos(rad(ring[0][0]));
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][1] * k) * (ring[i][0] * 110540) - (ring[i][1] * k) * (ring[j][0] * 110540);
  return Math.abs(a / 2);
}

// Point-in-polygon (ray casting). poly = [[lat, lng], ...].
export function inside(p, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ai, bi] = poly[i], [aj, bj] = poly[j];
    if ((bi > p[1]) !== (bj > p[1]) && p[0] < ((aj - ai) * (p[1] - bi)) / (bj - bi) + ai) hit = !hit;
  }
  return hit;
}

// Overpass "out geom" ways -> { nodes: [[lat,lng]], edges: [[to, metres, factor, nameIndex, danger, quiet]] per node, names }
export function buildGraph(ways, avoid = []) {
  const id = new Map(), nodes = [], adj = [], names = [""], nameIx = new Map([["", 0]]);
  const parks = parksOf(ways);
  const key = (p) => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
  const node = (p) => { const k = key(p); if (!id.has(k)) { id.set(k, nodes.length); nodes.push([p.lat, p.lon]); adj.push([]); } return id.get(k); };
  for (const w of ways) {
    if (!w.geometry || !walkable(w.tags || {})) continue;
    const t = w.tags, nm = t.name || t.ref || "";
    if (!nameIx.has(nm)) { nameIx.set(nm, names.length); names.push(nm); }
    const n = nameIx.get(nm);
    for (let i = 1; i < w.geometry.length; i++) {
      const a = node(w.geometry[i - 1]), b = node(w.geometry[i]), len = meters(nodes[a], nodes[b]);
      const mid = [(nodes[a][0] + nodes[b][0]) / 2, (nodes[a][1] + nodes[b][1]) / 2];
      const danger = avoid.some((poly) => inside(mid, poly)) ? 1 : 0;
      const q = quietBits(t, parks.length > 0 && parks.some((poly) => inside(mid, poly))), f = safetyFactor(t) * (q & 4 ? 1.3 : 1);
      adj[a].push([b, len, f, n, danger, q]); adj[b].push([a, len, f, n, danger, q]);
    }
  }
  return { nodes, adj, names };
}

// Marks which edges are inside an area to avoid (after the areas change, without re-downloading streets).
export function markDanger(g, avoid) {
  for (let a = 0; a < g.adj.length; a++) for (const e of g.adj[a]) {
    const b = e[0], mid = [(g.nodes[a][0] + g.nodes[b][0]) / 2, (g.nodes[a][1] + g.nodes[b][1]) / 2];
    e[4] = avoid.some((poly) => inside(mid, poly)) ? 1 : 0;
  }
}

export function nearestNode(g, p) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < g.nodes.length; i++) { if (!g.adj[i].length) continue; const d = meters(p, g.nodes[i]); if (d < bd) { bd = d; best = i; } }
  return { i: best, m: bd };
}

// Binary-heap Dijkstra. mode "fastest" = plain metres; "safe" = metres x safety factor x 25 inside areas to avoid.
export function route(g, from, to, mode = "safe") {
  const s = nearestNode(g, from).i, t = nearestNode(g, to).i;
  if (s < 0 || t < 0) return null;
  const dist = new Float64Array(g.nodes.length).fill(Infinity), prev = new Int32Array(g.nodes.length).fill(-1), via = new Int32Array(g.nodes.length).fill(-1);
  const heap = [[0, s]]; dist[s] = 0;
  const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d, a] = pop();
    if (d > dist[a]) continue;
    if (a === t) break;
    for (let k = 0; k < g.adj[a].length; k++) {
      const [b, len, f, , danger] = g.adj[a][k];
      const c = mode === "fastest" ? len : len * f * (danger ? 25 : 1);
      if (d + c < dist[b]) { dist[b] = d + c; prev[b] = a; via[b] = k; push([d + c, b]); }
    }
  }
  if (dist[t] === Infinity) return null;
  const path = [], edges = [];
  for (let v = t; v !== -1; v = prev[v]) { path.push(g.nodes[v]); if (prev[v] !== -1) edges.push(g.adj[prev[v]][via[v]]); }
  path.reverse(); edges.reverse();
  const metres = edges.reduce((s, e) => s + e[1], 0), inDanger = edges.filter((e) => e[4]).reduce((s, e) => s + e[1], 0);
  const quiet = (bit) => Math.round(edges.filter((e) => (e[5] || 0) & bit).reduce((s, e) => s + e[1], 0));
  return { path, metres: Math.round(metres), minutes: Math.round(metres / 80), dangerMetres: Math.round(inDanger), steps: steps(g, edges),
    quiet: { unlit: quiet(1), underpass: quiet(2), park: quiet(4) } };
}

// Walking distance (metres, plain) from `from` to every node up to maxM; Infinity beyond. For "within a 30-minute walk".
export function walkDistances(g, from, maxM = 2400) {
  const s = nearestNode(g, from).i, dist = new Float64Array(g.nodes.length).fill(Infinity);
  if (s < 0) return dist;
  dist[s] = 0;
  const heap = [[0, s]];
  const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d, a] = pop();
    if (d > dist[a]) continue;
    for (const [b, len] of g.adj[a]) if (d + len < dist[b] && d + len <= maxM) { dist[b] = d + len; push([d + len, b]); }
  }
  return dist;
}

// "MI Road 600 m, then Station Road 300 m" from the street names along the path.
function steps(g, edges) {
  const out = [];
  for (const e of edges) { const n = g.names[e[3]] || "unnamed street"; if (out.length && out[out.length - 1].name === n) out[out.length - 1].m += e[1]; else out.push({ name: n, m: e[1] }); }
  return out.filter((s) => s.m > 40).map((s) => ({ name: s.name, m: Math.round(s.m) }));
}

// Compact form for saving on the phone (and size check): nodes rounded, edges once per pair.
export function pack(g) {
  const e = [];
  for (let a = 0; a < g.adj.length; a++) for (const [b, len, f, n, d, q = 0] of g.adj[a]) if (a < b) e.push(a, b, Math.round(len * 10), Math.round(f * 100), n, d, q); // length in tenths of a metre
  return JSON.stringify({ v: 2, n: g.nodes.map(([a, b]) => [+a.toFixed(6), +b.toFixed(6)]), e, names: g.names });
}
export function unpack(s) {
  const { v, n, e, names } = JSON.parse(s), adj = n.map(() => []), k = v === 2 ? 7 : 6; // v1 (no quiet field) saved before 2026-11-26
  for (let i = 0; i < e.length; i += k) { const [a, b, len, f, nm, d, q = 0] = e.slice(i, i + k); adj[a].push([b, len / 10, f / 100, nm, d, q]); adj[b].push([a, len / 10, f / 100, nm, d, q]); }
  return { nodes: n, adj, names };
}

// With no route (outside the saved streets): how far, and which way, in eight compass points.
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function directionTo(from, to) {
  const y = Math.sin(rad(to[1] - from[1])) * Math.cos(rad(to[0]));
  const x = Math.cos(rad(from[0])) * Math.sin(rad(to[0])) - Math.sin(rad(from[0])) * Math.cos(rad(to[0])) * Math.cos(rad(to[1] - from[1]));
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return { metres: Math.round(meters(from, to)), compass: COMPASS[Math.round(bearing / 45) % 8] };
}
