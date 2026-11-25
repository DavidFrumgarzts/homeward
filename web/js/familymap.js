// The real-street map in the family view: her trail as a blue line, where the SOS started (small blue dot)
// and her latest position (green dot, like the "you" dot in the app).
// Uses MapLibre GL JS from a CDN with standard OpenStreetMap tiles, viewed normally (nothing is saved or
// downloaded in bulk), and the OpenStreetMap credit always showing, as their tile policy asks.
// If the map library cannot load, createFamilyMap returns null and the page shows a map link instead.
const CDN = "https://unpkg.com/maplibre-gl@5.24.1/dist";
const STYLE = {
  version: 8,
  sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' } },
  // Softened toward the drawn Lapa map: mostly grey, a little lighter, so the blue trail and green dot stand out.
  layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.75, "raster-contrast": -0.15, "raster-brightness-min": 0.12 } }],
};

let library = null;
function loadLibrary() {
  library ??= new Promise((resolve, reject) => {
    const css = Object.assign(document.createElement("link"), { rel: "stylesheet", href: `${CDN}/maplibre-gl.css` });
    const js = Object.assign(document.createElement("script"), { src: `${CDN}/maplibre-gl.js`, onload: () => resolve(window.maplibregl), onerror: reject });
    document.head.append(css, js);
  }).catch(() => { library = null; return null; });
  return library;
}

const dot = (className) => Object.assign(document.createElement("div"), { className });

// Returns { show(points), remove() } or null. points is the trail, oldest first, as [lng, lat] pairs.
export async function createFamilyMap(container) {
  const gl = await loadLibrary();
  if (!gl || !container.isConnected) return null;
  let map;
  try { map = new gl.Map({ container, style: STYLE, center: [0, 20], zoom: 1, attributionControl: false }); } catch { return null; }
  map.addControl(new gl.AttributionControl({ compact: false }));
  map.addControl(new gl.NavigationControl({ showCompass: false }), "top-right");
  const ready = new Promise((resolve) => map.on("load", () => {
    map.addSource("trail", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
    map.addLayer({ id: "trail", type: "line", source: "trail", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#2F6BFF", "line-width": 5 } });
    resolve();
  }));
  const start = new gl.Marker({ element: dot("fam-dot start") }), latest = new gl.Marker({ element: dot("fam-dot latest") });
  let shown = 0, touched = false;
  map.on("dragstart", () => { touched = true; });

  return {
    show(points) {
      if (points.length === shown) return;
      // The line needs the map's style to be loaded; the dots and the camera do not, so they move at once.
      ready.then(() => map.getSource("trail").setData({ type: "Feature", geometry: { type: "LineString", coordinates: points } }));
      if (!points.length) { start.remove(); latest.remove(); shown = 0; return; }
      start.setLngLat(points[0]).addTo(map);
      latest.setLngLat(points.at(-1)).addTo(map);
      // First data: show the whole trail. Later: follow her, unless the reader has moved the map themselves.
      if (!shown) {
        const lngs = points.map((p) => p[0]), lats = points.map((p) => p[1]);
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, maxZoom: 16, animate: false });
      } else if (!touched) map.easeTo({ center: points.at(-1) });
      shown = points.length;
    },
    remove() { map.remove(); },
  };
}
