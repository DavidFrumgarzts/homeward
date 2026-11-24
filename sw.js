// Keeps a copy of Beacon's files on the device, so the page still opens with no signal.
const CACHE = "beacon-v1";
const FILES = ["./", "index.html", "styles.css", "js/app.js", "js/map.js", "js/cop.js", "js/ai.js", "js/ask.js", "js/sos.js", "js/pack.js", "js/store.js"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Try the network first (so updates show up), fall back to the saved copy when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
