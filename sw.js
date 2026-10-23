const VERSION = 'v9';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/data.js', 'js/store.js', 'js/weather.js', 'js/firebase-config.js', 'js/brief-view.js', 'js/gunwharf.js', 'planner/', 'planner/index.html', 'planner/planner.js', 'planner/planner.css', 'planner/engine.js', 'planner/store.js', 'morning/', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Stale-while-revalidate for the shell and the Firebase SDK. Weather and Firestore traffic is left alone.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/');
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !sdk && !font) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(req, { ignoreSearch: sameOrigin });
    const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
  }));
});
