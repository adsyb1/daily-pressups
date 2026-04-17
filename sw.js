const CACHE_NAME = 'pressups-v11';
const ASSETS = [
  '/daily-pressups/',
  '/daily-pressups/index.html',
  '/daily-pressups/manifest.json',
  '/daily-pressups/icon-192.png',
  '/daily-pressups/icon-512.png'
];

// Install — cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;

  // Never intercept Google auth / API traffic — must always hit the network
  const url = event.request.url;
  if (
    url.includes('accounts.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('apis.google.com') ||
    url.includes('gstatic.com')
  ) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Don't cache non-ok or opaque responses
        if (!response || response.status !== 200) return response;

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      // Offline fallback — return cached index for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/daily-pressups/index.html');
      }
    })
  );
});
