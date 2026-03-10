// Service Worker — cache devre dışı, her zaman güncel versiyon
const CACHE_NAME = 'konseltur-v99';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Tüm eski cache'leri temizle
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache kullanma — her zaman network'ten al
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
