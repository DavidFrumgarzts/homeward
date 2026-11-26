// Trips saved for no signal. While she's online, "Tonight I'm going to X" saves the streets around her
// hotel and X, the areas to avoid, and both routes. With no signal, the way back is worked out from the saved
// streets only (no network). Streets and places: © OpenStreetMap contributors (ODbL).
import { buildGraph, markDanger, route, pack, unpack, directionTo } from "../../js/walkroute.js";
import { boxFor } from "../../js/trip.js";
import { areasFor } from "../../js/areas.js";
import { OVERPASS } from "./places.js";

const TRIP = "beacon.trip", GRAPH = "beacon.trip.graph", MINE = "beacon.myAreas";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); return true; } catch { return false; } };

export const savedTrip = () => read(TRIP);
export const myAreas = () => read(MINE) || [];
const ringsNow = (city) => areasFor(city, new Date().getHours(), myAreas());
// Routes are walked later than they're planned, so they avoid every area of the night, whatever its hours.
const ringsAllNight = (city) => areasFor(city, null, myAreas());
let graph = null;
const savedGraph = () => (graph ??= (() => { const s = localStorage.getItem(GRAPH); try { return s ? unpack(s) : null; } catch { return null; } })());

// Finds a named place near `near` ([lat,lng]) with OpenStreetMap's Nominatim. Returns {name, at} or null.
export async function findPlace(name, near, city = "") {
  const d = 0.25, vb = `${near[1] - d},${near[0] + d},${near[1] + d},${near[0] - d}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&viewbox=${vb}&q=${encodeURIComponent(city ? `${name}, ${city}` : name)}`;
  try {
    const hit = (await (await fetch(url, { signal: AbortSignal.timeout(10000) })).json())[0];
    return hit ? { name: hit.name || name, at: [+hit.lat, +hit.lon] } : null;
  } catch { return null; }
}

async function streets(box) {
  const q = `[out:json][timeout:60];way["highway"](${box.join(",")});out geom tags;`;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(70000) });
      if (r.ok) return (await r.json()).elements;
    } catch { /* busy: try the next server */ }
  }
  return null;
}

// Saves a trip: home = her hotel if known, else where she is now. onStep(text) reports progress in plain words.
// Returns the saved trip, or {error: "place" | "streets" | "route" | "storage"}.
export async function planTrip({ from, hotel, place, city }, onStep = () => {}) {
  const home = hotel || from;
  onStep(`Saving the streets between ${hotel ? "your hotel" : "here"} and ${place.name}…`);
  const ways = await streets(boxFor(home, place.at));
  if (!ways) return { error: "streets" };
  const g = buildGraph(ways, ringsAllNight(city).map((a) => a.ring));
  const there = route(g, home, place.at, "safe"), back = route(g, place.at, home, "safe");
  if (!there || !back) return { error: "route" };
  const trip = { place, home, homeIsHotel: !!hotel, city, there, back, fastestBack: route(g, place.at, home, "fastest"), savedAt: Date.now() };
  if (!write(GRAPH, pack(g)) || !write(TRIP, trip)) return { error: "storage" };
  graph = g;
  return trip;
}

// The way back from `at`, using only what's saved: {route, fastest}, {arrived} within 60 m,
// {direction, partial:true} off the saved streets, or null when no trip is saved.
export function wayBack(at) {
  const trip = savedTrip(), g = savedGraph();
  if (!trip) return null;
  if (directionTo(at, trip.home).metres < 60) return { arrived: true, trip };
  const safe = g && route(g, at, trip.home, "safe");
  // Off the saved streets (more than ~150 m from any of them): direction and distance only.
  if (!safe || safe.path.length < 2 || nearestStreetM(g, at) > 150) return { direction: directionTo(at, trip.home), partial: true, trip };
  return { route: safe, fastest: route(g, at, trip.home, "fastest"), trip };
}
function nearestStreetM(g, at) {
  let best = Infinity;
  for (const n of g.nodes) { const d = Math.hypot((n[0] - at[0]) * 111320, (n[1] - at[1]) * 111320 * Math.cos((at[0] * Math.PI) / 180)); if (d < best) best = d; }
  return best;
}

// She marks an area (ring of [lat,lng]); the saved routes are worked out again around it.
export function addMyArea(ring) {
  const mine = [...myAreas(), { name: "Marked by you", ring }];
  write(MINE, mine);
  const trip = savedTrip(), g = savedGraph();
  if (trip && g) {
    markDanger(g, ringsAllNight(trip.city).map((a) => a.ring));
    const updated = { ...trip, there: route(g, trip.home, trip.place.at, "safe") || trip.there, back: route(g, trip.place.at, trip.home, "safe") || trip.back, fastestBack: route(g, trip.place.at, trip.home, "fastest") };
    write(GRAPH, pack(g)); write(TRIP, updated);
  }
  return mine;
}
export const areasNow = (city) => ringsNow(city);
