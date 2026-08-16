/* PikFinder service worker — minimal, safe offline shell.
   - Precaches the app shell so the site opens offline / installs as a PWA.
   - Never caches /api/ (search, AI, etc. must stay fresh).
   - Static assets (Vite hashes filenames) are cache-first; navigations are
     network-first with an offline fallback to the cached shell. */
const CACHE = 'pikfinder-shell-v1';
const SHELL = ['/', '/index.html', '/favicon.svg', '/pwa-icon-192.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // only same-origin
  if (url.pathname.startsWith('/api/')) return;       // never cache API

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
