const CACHE = 'grocery-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install — cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting(); // activate immediately
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control immediately
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  // Skip Google API calls entirely
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('accounts.google.com') ||
      e.request.url.includes('gsi/client')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Update cache with fresh response
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
