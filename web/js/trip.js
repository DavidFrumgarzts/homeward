// Pure helpers for planning a trip and for the saved routes: no network, no storage. Tested in tests/trip.test.js.

// The box of streets to save for a trip: both points with a margin (metres) on every side. [south, west, north, east]
export function boxFor(a, b, marginM = 700) {
  const dLat = marginM / 111320 + 0.0005, midLat = (a[0] + b[0]) / 2;
  const dLng = marginM / (111320 * Math.cos((midLat * Math.PI) / 180)) + 0.0005;
  return [Math.min(a[0], b[0]) - dLat, Math.min(a[1], b[1]) - dLng, Math.max(a[0], b[0]) + dLat, Math.max(a[1], b[1]) + dLng];
}

// "Tonight I'm going to Bar Palladio, then back to my hotel." -> "Bar Palladio". Used when there's no AI.
export function placeFromPlan(text) {
  const m = String(text).match(/\b(?:going to|go to|heading to|visit(?:ing)?)\s+(.+?)(?:\s*,|\s+then\b|\s+and then\b|[.!?]|$)/i);
  const place = m?.[1]?.trim();
  return place ? place : null;
}

export function placePrompt(text) {
  return `From this travel plan, name the one place she is going to (not her hotel or home). Reply with JSON only: {"place": "..."}. If no place is named, reply {"place": ""}.
Plan: ${text}`;
}

export function readPlace(aiText) {
  const m = String(aiText || "").match(/\{[\s\S]*\}/);
  try { const p = m && JSON.parse(m[0]).place; return typeof p === "string" && p.trim() ? p.trim() : null; } catch { return null; }
}

// Safe places blink yellow on the map from 9 p.m. until 6 a.m. (the phone's own hour).
export const nightRings = (hour) => hour >= 21 || hour < 6;

// "AIIMS Jodhpur, 3 h 40 by car"
export function driveText({ name, minutes }) {
  const h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
  const t = h ? `${h} h${m ? ` ${m}` : ""}` : `${m} min`;
  return `${name}, ${t} by car`;
}

// Live turn-by-turn driving in Google Maps (a link, allowed by Google's terms; no Google route is drawn or kept).
export function googleMapsLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${from[0]},${from[1]}&destination=${to[0]},${to[1]}&travelmode=driving`;
}

// "Jaipur Municipal Corporation" -> "Jaipur": OpenStreetMap often names the council, not the city.
export function cleanCity(name) {
  return String(name || "")
    .replace(/\s+(Municipal Corporation|Municipal Council|Municipality|Metropolitan (Municipality|Area|City)|City Council|Nagar Nigam)$/i, "")
    .replace(/^(Município de|Município do|Municipio de|Municipality of|City of)\s+/i, "")
    .trim();
}
