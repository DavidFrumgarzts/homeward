// Keeps a copy of Beacon New York on the phone, so it opens with no signal.
// Map tiles are NOT saved here (the tile providers don't allow bulk saving). Places to get help are saved by places.js.
const CACHE = "beacon-ny-v2";
const FILES = ["./", "index.html", "ny.css", "manifest.webmanifest", "js/app.js", "js/nypack.js", "js/places.js", "js/city.js", "js/scan.js",
  "../styles.css", "../js/store.js", "../js/ai.js", "../js/scan.js", "../js/scams.js", "../js/cityscams.js", "../js/sos.js", "../js/pack.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Network first (so updates show up), the saved copy when offline. Tiles and Overpass are never cached here.
self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (e.request.method !== "GET" || url.includes("tile.openstreetmap.org") || url.includes("overpass") || url.includes("nominatim")) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
