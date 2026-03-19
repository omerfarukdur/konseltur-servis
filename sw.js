// Konseltur Servis Yönetimi — Service Worker
const CACHE_NAME = 'konseltur-v2';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  // Eski cache'leri temizle
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())  // Hemen kontrolü al
  );
});

self.addEventListener('fetch', e => {
  // Sadece GET istekleri cache'le
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Cache varsa dön, yoksa ağdan al
      return cached || fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});

// Güncelleme mesajı — HTML'den SKIP_WAITING isteklerini dinle
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
