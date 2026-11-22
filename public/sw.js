const CACHE_NAME = 'shoply-feed-v3';
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

// Web push: an order or a waiting buyer, shown even when the dashboard is closed. The payload is
// the small JSON the backend builds (services/sellerAlert.service.ts): title, body, url, tag.
self.addEventListener('push', (event) => {
  let message = { title: 'Shoply', body: '', url: '/home' };
  try {
    if (event.data) message = { ...message, ...event.data.json() };
  } catch {
    // A push with no readable body still deserves a notification — the dashboard has the detail.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // A newer notification with the same tag replaces the older one; renotify makes the
      // replacement buzz again instead of arriving silently.
      tag: message.tag,
      renotify: Boolean(message.tag),
      data: { url: message.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // The url comes from our own server, but a notification is not the place to trust that:
  // anything that is not a page on this site opens the home screen instead.
  let target = new URL('/home', self.location.origin);
  try {
    const requested = new URL(event.notification.data?.url ?? '/home', self.location.origin);
    if (requested.origin === self.location.origin) target = requested;
  } catch {
    // keep the home screen
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const open = windows.find((w) => 'focus' in w);
      if (!open) return self.clients.openWindow(target.href);
      await open.focus();
      try {
        await open.navigate(target.href);
      } catch {
        // navigate() is not available everywhere; the dashboard being focused is still the point.
      }
      return undefined;
    }),
  );
});
