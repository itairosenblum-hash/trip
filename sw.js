const CACHE = "austria-trip-v23";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png?v=5",
  "./icon-512.png?v=5",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigations (so trip updates show up), cache-first fallback for offline.
// `cache:"no-store"` on the fetch makes sure we bypass the browser's own HTTP cache too,
// not just the service-worker cache — otherwise a page could still get served a stale
// disk-cached response even though this handler is "network-first".
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isSameOrigin = new URL(e.request.url).origin === self.location.origin;
  if (!isSameOrigin) return;

  e.respondWith(
    fetch(e.request, { cache: "no-store" })
      .then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
