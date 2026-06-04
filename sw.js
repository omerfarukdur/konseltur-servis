// Konseltur Service Worker - Arka Plan Alarm Sistemi
const CACHE = 'konseltur-v2';

// Zamanlanmış alarmlar
let scheduledAlarms = [];
let alarmTimers = [];

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// Ana uygulamadan mesaj al
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_ALARMS') {
    // Mevcut timer'ları temizle
    alarmTimers.forEach(t => clearTimeout(t));
    alarmTimers = [];
    scheduledAlarms = e.data.alarms || [];

    const now = Date.now();
    scheduledAlarms.forEach(alarm => {
      const delay = alarm.time - now;
      if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) { // max 7 gün
        const t = setTimeout(() => {
          self.registration.showNotification('⏰ Konseltur Alarm', {
            body: alarm.text,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'alarm-' + alarm.dateKey + '-' + alarm.idx,
            requireInteraction: true, // Kullanıcı kapatana kadar göster
            vibrate: [200, 100, 200, 100, 200],
            actions: [
              { action: 'dismiss', title: 'Kapat' }
            ]
          });
        }, delay);
        alarmTimers.push(t);
      }
    });
  }
});

// Bildirime tıklanınca uygulamayı aç
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes('konseltur') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/konseltur-servis/');
    })
  );
});

// Fetch - cache first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
