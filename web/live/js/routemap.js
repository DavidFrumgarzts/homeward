// What Beacon adds on top of the street map: areas to avoid, the saved route (and the fastest one, dashed),
// her hotel, and after 9 p.m. blinking yellow rings on nearby places open 24 hours. Leaflet only, no network.
import { nightRings } from "../../js/trip.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// areas: [{name, ring, origin, why?, source?}]; way: {route, fastest} from wayBack(); home: [lat,lng] | null;
// places: [{lat,lng,open24h,kind,name}] already near her.
export function drawExtras(map, { areas = [], way = null, home = null, homeLabel = "Your hotel", places = [], at = null, hour = new Date().getHours() }) {
  drawAreas(map, areas);
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

// Red zones as in David's map (DESIGN.md): a soft rounded patch (#F4C3BC; a wide round-joined edge in the same
// color rounds the corners) under the routes, "RED ZONE" in #B4282D at its top. Tap: why, and where it comes from.
// Returns the layer group, so app.js can redraw just the zones when she moves.
export function drawAreas(map, areas) {
  if (!map.getPane("zones")) {
    map.createPane("zones").style.zIndex = 390; // under the routes (overlay pane, 400)
    // Zoomed out, the labels would pile up: patches only (live.css .zones-far).
    const far = () => map.getContainer().classList.toggle("zones-far", map.getZoom() < 15);
    map.on("zoomend", far); map.whenReady(far);
  }
  const group = L.layerGroup().addTo(map);
  for (const a of areas) {
    const tip = `<b>${esc(a.name)}</b>${a.why ? `<br>${esc(a.why)}` : ""}<br><span class="zone-src">${esc(a.origin === "Police data" ? `Police data, ${a.period || "last 12 months"}` : a.origin)}${
      /^https:\/\//.test(a.source || "") ? ` · <a href="${esc(a.source)}" target="_blank" rel="noopener">Source</a>` : ""}${
      (a.sources || []).map((s) => ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.site)}</a>`).join("")}</span>`;
    // Police zones are one square per busy cell: filled as one shape (nonzero), see-through as a whole (live.css),
    // so where squares meet there's no seam.
    const rings = a.rings || [a.ring];
    L.polygon(rings, { pane: "zones", className: "zone-patch", color: "#F4C3BC", weight: 12, opacity: 1, lineJoin: "round", fillColor: "#F4C3BC", fillOpacity: 1, fillRule: "nonzero" })
      .bindPopup(tip, { className: "zone-pop", maxWidth: 240 }).addTo(group);
    const pts = rings.flat(), topPt = pts.reduce((t, p) => (p[0] > t[0] ? p : t), pts[0]);
    const mid = rings.filter((r) => r.some((p) => p[0] === topPt[0])).flat(), lng = mid.reduce((s, p) => s + p[1], 0) / mid.length;
    L.marker([topPt[0], lng], { icon: L.divIcon({ className: "zone-label", html: "RED ZONE", iconSize: [64, 12], iconAnchor: [32, -4] }), interactive: false, keyboard: false, zIndexOffset: -1000 }).addTo(group);
  }
  return group;
}
