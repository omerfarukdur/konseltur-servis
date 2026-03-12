// Konseltur Service Worker — v2 (Auto-Update)
// Her yeni deployment'ta otomatik güncellenir
// Cache adı değişince eski cache silinir

const CACHE_VERSION = 'konseltur-v2-' + Date.now();
const STATIC_ASSETS = [
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
];

// Install: sadece ikonları cache'le, index.html'i cache'leME
self.addEventListener('install', event => {
  self.skipWaiting(); // Hemen aktif ol, bekleme
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: eski cache'leri sil
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim(); // Tüm sekmeleri hemen kontrol et
    })
  );
});

// Fetch: Network-First strateji
// Önce internetten çek, başarısız olursa cache'ten göster
self.addEventListener('fetch', event => {
  // index.html ve API istekleri: HER ZAMAN network'ten
  if (event.request.url.includes('index.html') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic') ||
      event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Statik dosyalar (ikonlar vs): cache'ten, yoksa network
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
