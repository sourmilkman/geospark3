const CACHE_NAME = 'geospark3-v0.6.5';
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
  './data/world_globe.json',
  './data/europe_map.json',
  './splash_smol.jpg',
  './assets/menu/main_historian.png',
  './assets/menu/main_backpacker.png',
  './assets/menu/main_pilot.png',
  './assets/travel/plane.webp',
  './assets/stamps/europe.webp',
  './assets/stamps/south-america.webp',
  './assets/stamps/asia.webp',
  './assets/stamps/us-states.webp',
  './assets/stamps/africa.webp',
  './assets/stamps/global-master.webp',
  './icon-192.png',
  './icon-512.png'
];
const DATA_FILES = ['europe', 'south_america', 'asia', 'us_states', 'africa', 'global'];

// Flags are cached individually so one failure never blocks the rest.
async function cacheFlags(cache) {
  const lists = await Promise.all(DATA_FILES.map(file =>
    fetch(`./data/${file}.json`).then(response => response.json()).catch(() => [])
  ));
  const urls = lists.flat().map(item => `./assets/flags/${item.cc}.webp`);
  await Promise.all(urls.map(url => cache.add(url).catch(() => {})));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).then(() => cacheFlags(cache)))
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
  // Let the browser stream music itself: media uses range requests, and caching partial responses breaks playback.
  if (event.request.headers.has('range') || event.request.url.includes('/assets/music/')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});
