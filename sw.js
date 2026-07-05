/* Service worker Cheile Braniștei — network-first, cache fallback.
   Site-ul rămâne mereu proaspăt; cache-ul intră în joc doar offline. */
const CACHE = 'cb-v1';
const CORE = ['/', '/main.js', '/logo.webp', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Notificari push (admin): afiseaza notificarea primita de la backend
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.titlu || 'Cheile Braniștei', {
      body: data.corp || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/admin.html' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || '/admin.html'));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API-ul (Railway) și CDN-urile nu se cache-uiesc — doar fișierele proprii, doar GET
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
