const CACHE_NAME = 'shoply-feed-v2';
const APP_SHELL = ['/', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Content-hashed static assets are immutable — cache-first is instant and
  // correct. Everything else (navigations, the cross-origin API) stays
  // network-first so the seller never sees data older than their last visit.
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache same-origin, successful responses — never a 500 (which
        // would then be served forever offline) and never a cross-origin
        // opaque response (the seller API is on a different origin).
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // caches.match() can resolve to undefined, and respondWith(undefined)
          // throws — fall back to the shell for an uncached offline navigation
          // instead of a raw network error.
          if (event.request.mode === 'navigate') return caches.match('/');
          return undefined;
        }),
      ),
  );
});
