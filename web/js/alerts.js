// When Beacon texts her trusted people by itself (no tap): she walked into an area marked dangerous,
// or she hasn't moved for 5 minutes on her way back. Pure logic; live/js/notify.js sends.
import { meters, inside } from "./walkroute.js";

const key = (a) => a.id || a.name;

// at: [lat,lng]; areas: [{id?, name, ring}]; wasInside: Set of keys. -> {inside: Set, entered: [area]}
export function entered(at, areas, wasInside) {
  const now = areas.filter((a) => inside(at, a.ring));
  return { inside: new Set(now.map(key)), entered: now.filter((a) => !wasInside.has(key(a))) };
}

// Minutes she has stayed within radiusM of her last saved position. 0 when that position is
// older than 4 minutes (the GPS stopped), so a phone left in a bag doesn't look like her standing still.
export function stoppedMinutes(trail, now, radiusM = 40) {
  const last = trail[trail.length - 1];
  if (!last || now - last.t > 4 * 60000) return 0;
  let since = last.t;
  for (let i = trail.length - 2; i >= 0; i--) {
    if (meters([trail[i].lat, trail[i].lng], [last.lat, last.lng]) > radiusM) break;
    since = trail[i].t;
  }
  return Math.floor((now - since) / 60000);
}

// Only on the way back of a trip saved in the last 12 hours, away from the place she went to and from home.
export function shouldTextStill({ trip, at, minutes, now, textedThisStop = false }) {
  if (!trip || textedThisStop || minutes < 5 || now - trip.savedAt > 12 * 3600000) return false;
  return meters(at, trip.place.at) > 150 && meters(at, trip.home) > 100;
}
