// Service worker של הלובי (מסך הטיולים). לכל טיול בתיקייה משלו יש sw.js נפרד עם קידומת מטמון משלו.
const PREFIX = "trips-lobby-";
const CACHE = PREFIX + "v3";
// המטמון של האתר הישן (לפני המעבר לתיקייה) — מנקים אותו פעם אחת.
const LEGACY = "austria-trip-";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./og-image.png",
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
      Promise.all(
        keys
          .filter((k) => (k.startsWith(PREFIX) && k !== CACHE) || k.startsWith(LEGACY))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first עם no-store, ומטמון כגיבוי לאופליין — כמו באתר של אוסטריה.
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
