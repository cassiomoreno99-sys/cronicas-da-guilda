const CACHE = "cronicas-da-guilda-standalone-v1-2";
const CORE = ["/", "/guild-favicon.svg", "/manifest.webmanifest", "/hero-portraits-v12.webp", "/ui/guild-night.webp", "/ui/battle-night.webp", "/enemies/wolf.webp", "/enemies/bandit.webp", "/enemies/skeleton.webp"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      if (new URL(event.request.url).origin === self.location.origin && response.ok) {
        void caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match("/")))
  );
});
