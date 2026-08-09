// Sweet Spot service worker — cache-first app shell for offline play.
// Bump CACHE whenever any cached asset changes, to force clients to re-fetch.
const CACHE = 'sweet-spot-v1';

const ASSETS = [
  './',
  'index.html',
  'sweet-spot.html',
  'manifest.json',
  // self-hosted fonts (offline-safe)
  'assets/fonts/archivo-black-latin.woff2',
  'assets/fonts/space-mono-400-latin.woff2',
  'assets/fonts/space-mono-700-latin.woff2',
  // music: menu track + game track (served files, not embedded)
  'assets/menu.mp3',
  'assets/game.mp3',
  // icons
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Shardfall lives at /shardfall/ and ships its own service worker. This one's scope is the
  // whole repo path, so without this guard it would answer Shardfall's requests — and its
  // offline navigation fallback would serve Sweet Spot's HTML for a Shardfall URL.
  if (new URL(req.url).pathname.includes('/shardfall/')) return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // runtime-cache successful same-origin GETs (covers range-less audio, etc.)
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        // navigation fallback so the app opens offline
        if (req.mode === 'navigate') return caches.match('sweet-spot.html');
      });
    })
  );
});
