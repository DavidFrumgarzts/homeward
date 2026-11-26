// What Beacon adds on top of the street map: areas to avoid, the saved route (and the fastest one, dashed),
// her hotel, and after 9 p.m. blinking yellow rings on nearby places open 24 hours. Leaflet only, no network.
import { nightRings } from "../../js/trip.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// areas: [{name, ring, origin, why?, source?}]; way: {route, fastest} from wayBack(); home: [lat,lng] | null;
// places: [{lat,lng,open24h,kind,name}] already near her.
export function drawExtras(map, { areas = [], way = null, home = null, homeLabel = "Your hotel", places = [], at = null, hour = new Date().getHours() }) {
  for (const a of areas) {
    L.polygon(a.ring, { color: "#E5484D", weight: 1.5, fillColor: "#E5484D", fillOpacity: 0.15 })
      .bindTooltip(`${esc(a.name)} · ${esc(a.origin)}${a.why ? `<br>${esc(a.why)}` : ""}`).addTo(map);
  }
  if (way?.fastest) L.polyline(way.fastest.path, { color: "#5E6880", weight: 4, opacity: 0.8, dashArray: "6 7" }).addTo(map);
  if (way?.route) L.polyline(way.route.path, { color: "#2F6BFF", weight: 6, opacity: 0.95 }).addTo(map);
  if (home) L.marker(home, { icon: L.divIcon({ className: "hotel-pin", html: "<span>🛏</span>", iconSize: [26, 26] }) }).bindTooltip(esc(homeLabel)).addTo(map);
  if (nightRings(hour) && at) {
    for (const p of places) {
      if (!p.open24h || Math.hypot((p.lat - at.lat) * 111, (p.lng - at.lng) * 111 * Math.cos((at.lat * Math.PI) / 180)) > 1.5) continue;
      L.circleMarker([p.lat, p.lng], { radius: 18, className: "night-ring" }).addTo(map);
    }
  }
}
