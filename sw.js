const CACHE_NAME = 'geospark3-v0.5.5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/styles.css',
  './data/europe.json',
  './data/south_america.json',
  './data/asia.json',
  './data/us_states.json',
  './data/africa.json',
  './data/global.json',
  './splash_smol.jpg',
  './charSelection.png',
  './assets/menu/main_historian.png',
  './assets/menu/main_backpacker.png',
  './assets/menu/main_pilot.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});
