// SAKINA PWA Service Worker (Network First)
const CACHE_NAME = 'sakina-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch from network first so changes are immediately live
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

