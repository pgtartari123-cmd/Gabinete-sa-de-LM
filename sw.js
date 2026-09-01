const CACHE_NAME = 'gabinete-lm-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './style.css?v=2001'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
