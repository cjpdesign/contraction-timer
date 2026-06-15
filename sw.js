/* Service worker for offline support.
 * Strategy: network-first for the page (so updates show when online),
 * cache-first for everything else (local assets + version-pinned CDN libs).
 * Bump CACHE to force a full re-cache of all assets. */
const CACHE = 'contraction-timer-v7';
const SHELL = ['./', './index.html', './script.js', './preact.js', './styles.css', './manifest.webmanifest', './favicon.png', './logo.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function put(req, res) {
  caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // The page itself: network-first, fall back to cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { put(req, res.clone()); return res; })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Assets (local + CDN): cache-first, populate the cache on first online load.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => { put(req, res.clone()); return res; })
    )
  );
});
