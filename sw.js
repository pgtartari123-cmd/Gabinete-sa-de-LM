const CACHE_NAME = 'gabinete-lm-shell-v4';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest?v=1008', './style.css?v=2001'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isAppCode = /\.(js|html)$/i.test(url.pathname);
  if (isAppCode) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
