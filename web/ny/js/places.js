// Real places to get help near you, from OpenStreetMap: police stations, hospitals and pharmacies.
// Fetched once while online (one Overpass query), then saved in this browser so they still show with no signal.
// Data © OpenStreetMap contributors (ODbL).

const KEY = "beacon.ny.places";
// Public Overpass servers are often busy; try them in turn.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

// Used when no server answers and nothing is saved yet: Manhattan police precincts and big emergency hospitals.
// Hand-made from public addresses; positions are approximate (within about a block).
export const STARTER = [
  ["NYPD Times Square Substation", "police", 40.7569, -73.9861], ["Midtown South Precinct", "police", 40.7540, -73.9952], ["Midtown North Precinct", "police", 40.7655, -73.9862],
  ["1st Precinct", "police", 40.7202, -74.0074], ["5th Precinct", "police", 40.7163, -73.9975], ["6th Precinct", "police", 40.7343, -74.0055],
  ["7th Precinct", "police", 40.7163, -73.9836], ["9th Precinct", "police", 40.7265, -73.9878], ["10th Precinct", "police", 40.7433, -73.9985],
  ["13th Precinct", "police", 40.7363, -73.9826], ["17th Precinct", "police", 40.7563, -73.9705], ["19th Precinct", "police", 40.7666, -73.9632],
  ["20th Precinct", "police", 40.7843, -73.9752], ["Central Park Precinct", "police", 40.7826, -73.9637], ["24th Precinct", "police", 40.7966, -73.9681],
  ["Mount Sinai West", "hospital", 40.7699, -73.9866], ["Bellevue Hospital", "hospital", 40.7392, -73.9754], ["NYU Langone Hospital", "hospital", 40.7421, -73.9739],
  ["Lenox Hill Hospital", "hospital", 40.7738, -73.9606], ["NewYork-Presbyterian / Weill Cornell", "hospital", 40.7648, -73.9540],
  ["Mount Sinai Hospital", "hospital", 40.7900, -73.9526], ["NewYork-Presbyterian Lower Manhattan", "hospital", 40.7104, -74.0052],
].map(([name, kind, lat, lng]) => ({ name, kind, lat, lng, hours: "", open24h: true, approximate: true }));

const KIND = { police: "police", hospital: "hospital", pharmacy: "pharmacy" };

// Distance in metres between two {lat, lng} points.
export function meters(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function saved() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}

// Places around `at` ({lat, lng}). Uses the saved list when it already covers this spot (within 1.5 km of where it was fetched).
export async function placesAround(at) {
  const cached = saved();
  if (cached && meters(cached.center, at) < 1500) return cached.places;
  const query = `[out:json][timeout:20];(nwr["amenity"~"^(police|hospital|pharmacy)$"](around:2500,${at.lat},${at.lng}););out center 300;`;
  try {
    let data = null;
    for (const url of OVERPASS) {
      try {
        const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(15000) });
        if (res.ok) { data = await res.json(); break; }
      } catch { /* try the next server */ }
    }
    if (!data) throw new Error("no server answered");
    const places = data.elements
      .map((e) => ({ name: e.tags?.name, kind: KIND[e.tags?.amenity], lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon, hours: e.tags?.opening_hours || "" }))
      .filter((p) => p.name && p.kind && p.lat != null)
      .map((p) => ({ ...p, open24h: p.kind !== "pharmacy" || /24\/7/.test(p.hours) }));
    try { localStorage.setItem(KEY, JSON.stringify({ center: at, savedAt: Date.now(), places })); } catch { /* storage full: keep going */ }
    return places;
  } catch {
    return cached?.places?.length ? cached.places : STARTER; // offline or servers busy: last saved list, else the starter list
  }
}

// The nearest open place to get help: police or hospital first (always open), else a 24-hour pharmacy.
export function nearest(places, at, kinds = ["police", "hospital", "pharmacy"]) {
  return places
    .filter((p) => kinds.includes(p.kind) && p.open24h)
    .map((p) => ({ ...p, meters: meters(at, p) }))
    .sort((a, b) => a.meters - b.meters)[0] || null;
}
