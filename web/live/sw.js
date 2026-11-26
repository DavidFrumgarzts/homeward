// Keeps a copy of Beacon (any city) on the phone, so it opens with no signal.
// Map tiles are NOT saved here (the tile providers don't allow bulk saving). Places to get help are saved by places.js.
const CACHE = "beacon-live-v4";
const FILES = ["./", "index.html", "live.css", "manifest.webmanifest", "js/app.js", "js/nypack.js", "js/places.js", "js/city.js", "js/scan.js", "js/trips.js", "js/drive.js", "js/bookingflow.js", "js/gmail.js", "js/routemap.js", "js/answering.js", "js/onboard.js", "img/onb-night.png", "img/onb-booking.png", "img/onb-way.png", "img/onb-nosignal.png", "img/onb-late.png", "img/onb-atm.jpg",
  "../styles.css", "../js/store.js", "../js/ai.js", "../js/scan.js", "../js/scams.js", "../js/cityscams.js", "../js/emergency.js", "../js/walkroute.js", "../js/areas.js", "../js/trip.js", "../js/booking.js", "../js/seal.js", "../js/checkin.js", "../js/incident.js", "../js/onboarding.js", "../js/sos.js", "../js/pack.js",
  "../js/firebase.js", "../js/messages.js", "../js/timeline.js", "../js/prompts.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("beacon-live") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// Network first (so updates show up), the saved copy when offline. Tiles and Overpass are never cached here.
self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (e.request.method !== "GET" || url.includes("basemaps.cartocdn.com") || url.includes("overpass") || url.includes("nominatim")) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
