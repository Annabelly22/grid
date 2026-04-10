// GRID Service Worker — offline caching + push notifications
const CACHE = 'grid-v2';
const PRECACHE = ['/', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return; // Never cache API
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    })).catch(() => caches.match('/'))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) { if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus(); }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  try {
    const { title, body, tag } = e.data.json();
    e.waitUntil(
      self.registration.showNotification(title, {
        body, tag: tag || 'grid', icon: '/icon.png', badge: '/icon.png',
        renotify: true,
      })
    );
  } catch {}
});
