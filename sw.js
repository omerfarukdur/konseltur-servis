// Konseltur Service Worker v3 - Auto Update
const CACHE_NAME = 'konseltur-v3';
let alarmTimers = [];

self.addEventListener('install', function(e){
  self.skipWaiting(); // Hemen aktif ol
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      // Eski cache'leri sil
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return clients.claim(); })
  );
});

// Ana uygulamadan mesaj al
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if(!e.data || e.data.type !== 'SCHEDULE_ALARMS') return;
  alarmTimers.forEach(function(t){ clearTimeout(t); });
  alarmTimers = [];
  var alarms = e.data.alarms || [];
  var now = Date.now();
  alarms.forEach(function(alarm){
    var delay = alarm.time - now;
    if(delay < 0 || delay > 7*24*60*60*1000) return;
    var t = setTimeout(function(){
      self.registration.showNotification('Konseltur Alarm', {
        body: alarm.text,
        icon: '/konseltur-servis/icon-192.png',
        badge: '/konseltur-servis/icon-192.png',
        tag: 'alarm-' + alarm.dateKey + '-' + alarm.idx,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300]
      });
    }, delay);
    alarmTimers.push(t);
  });
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for(var i=0;i<list.length;i++){
        if(list[i].url.indexOf('konseltur')>=0 && 'focus' in list[i]) return list[i].focus();
      }
      if(clients.openWindow) return clients.openWindow('https://omerfarukdur.github.io/konseltur-servis/');
    })
  );
});

// Network first — cache sadece yedek
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  // HTML dosyasını her zaman ağdan al (güncelleme için)
  if(e.request.url.endsWith('.html') || e.request.url.includes('index.html')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(r){
      if(r && r.status===200){
        var rc = r.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request, rc); });
      }
      return r;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
