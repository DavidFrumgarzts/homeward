// The street map under Beacon's own drawings, in David's map colors (light grey ground, white streets,
// green parks, blue water, grey building blocks, small capital street names): our own style (../map-style.json)
// drawn by MapLibre GL from OpenFreeMap's vector tiles (free, no key, no sign-up; credit always showing).
// Leaflet still draws everything on top (places, routes, areas, your dot); the open-source
// maplibre-gl-leaflet bridge puts the MapLibre map in Leaflet's tile layer.
// If WebGL, the libraries or OpenFreeMap don't work, the same map falls back to CARTO's Voyager pictures.
// Tiles are viewed normally, never saved here or in sw.js.
const GL = "https://unpkg.com/maplibre-gl@5.24.1/dist"; // same version as the family view (js/familymap.js)
const BRIDGE = "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js";
const STYLE = new URL("../map-style.json", import.meta.url).href;
const OFM_CREDIT = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const CARTO = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_CREDIT = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

let library = null, broken = false; // broken: the vector map failed once; use the pictures from then on
function webgl() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch { return false; }
}
const script = (src) => new Promise((resolve, reject) => document.head.append(Object.assign(document.createElement("script"), { src, onload: resolve, onerror: reject })));
// Resolves true once MapLibre GL and the bridge are loaded, false if they can't be (no WebGL, no connection).
export function loadVectorMap() {
  library ??= (async () => {
    if (!webgl() || !window.L) return false;
    document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: `${GL}/maplibre-gl.css` }));
    if (!window.maplibregl) await script(`${GL}/maplibre-gl.js`);
    if (!L.maplibreGL) await script(BRIDGE); // needs window.L and window.maplibregl
    return !!L.maplibreGL;
  })().catch(() => false);
  return library;
}

// Adds the base map to a Leaflet map. The vector map if it can, else (or if it fails while starting) CARTO's tiles.
export function addBaseMap(map) {
  let gone = false, ready = false, layer = null, timer = 0;
  map.once("unload", () => { gone = true; clearTimeout(timer); });
  const pictures = () => {
    clearTimeout(timer);
    if (gone || layer?.options.carto) return;
    if (layer) { try { map.removeLayer(layer); } catch { /* already gone */ } }
    layer = L.tileLayer(CARTO, { maxZoom: 20, subdomains: "abcd", attribution: CARTO_CREDIT, className: "carto", carto: true }).addTo(map);
  };
  const fail = () => { if (!ready) { broken = true; pictures(); } };
  loadVectorMap().then((ok) => {
    if (gone) return;
    if (!ok || broken) return pictures();
    try {
      layer = L.maplibreGL({ style: STYLE, attributionControl: { customAttribution: OFM_CREDIT } }).addTo(map);
      const gl = layer.getMaplibreMap();
      gl.once("load", () => { ready = true; clearTimeout(timer); map.getContainer().classList.add("vector-map"); });
      gl.on("error", fail); // the style, OpenFreeMap or the fonts didn't answer while starting
      gl.getCanvas().addEventListener("webglcontextlost", () => { ready = false; fail(); });
      timer = setTimeout(fail, 10000); // nothing after 10 s: the pictures instead
    } catch { fail(); }
  });
}
