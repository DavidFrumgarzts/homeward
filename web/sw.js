// Keeps a copy of Beacon's own files on the device, so the page still opens with no signal.
// Only the files listed here are kept. Map tiles, fonts and Firebase always go to the network:
// the map provider does not allow saving tiles in bulk, and live data must not be served stale.
// tests/files.test.js fails if a file in js/ or fixtures/ is missing from this list.
const CACHE = "beacon-v4";
const FILES = ["/", "/index.html", "/styles.css",
  "/js/app.js", "/js/map.js", "/js/cop.js", "/js/ai.js", "/js/ask.js", "/js/sos.js", "/js/pack.js", "/js/store.js",
  "/js/firebase.js", "/js/messages.js", "/js/situation.js", "/js/incident.js", "/js/html.js", "/js/router.js", "/js/areas.js", "/js/trip.js",
  "/js/prompts.js", "/js/family.js", "/js/familydata.js", "/js/familymap.js", "/js/summary.js", "/js/timeline.js", "/js/demo.js",
  "/js/scan.js", "/js/scams.js", "/js/cityscams.js", "/js/emergency.js", "/js/router.js", "/js/areas.js", "/js/trip.js",
  "/fixtures/demo-incident.json", "/fixtures/rio-lapa-pack.json"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))).then(() => self.clients.claim())));
// Try the network first (so updates show up), fall back to the saved copy when offline.
// Any page address (/f/..., /demo) falls back to the saved app, which then draws the right screen.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/__/")) return;
  const listed = FILES.includes(url.pathname);
  e.respondWith(fetch(e.request).then((r) => { if (listed && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)).catch(() => {}); } return r; })
    .catch(() => caches.match(listed ? url.pathname : "/index.html").then((saved) => (saved && (listed || e.request.mode === "navigate") ? saved : Response.error()))));
});
