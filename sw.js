// Konseltur PWA Service Worker
// Versiyon değiştirince eski cache temizlenir
const CACHE_NAME = 'konseltur-v3';

// Önbelleğe alınacak dosyalar
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

// Kurulum — dosyaları önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Ana dosyaları kesin önbelleğe al, CDN dosyaları başarısız olursa geç
      cache.add('./index.html').catch(()=>{});
      cache.add('./manifest.json').catch(()=>{});
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — önce cache, sonra network; cache'e kaydet
self.addEventListener('fetch', e => {
  // POST isteklerini atla
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Geçerli response'u cache'e kaydet
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline ve cache'de yok — ana sayfayı döndür
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
