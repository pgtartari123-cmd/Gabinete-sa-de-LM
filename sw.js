const CACHE_NAME = 'gabinete-lm-shell-v8';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest?v=3002', './style.css?v=2002'];

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

  const isBanco = /\/banco-v6\.js$/i.test(url.pathname);
  const isAppCode = /\.(js|html)$/i.test(url.pathname);

  if (isBanco) {
    event.respondWith((async () => {
      try {
        const banco = await fetch(new Request(event.request, { cache: 'no-store' }));
        const original = await banco.text();
        const extraResp = await fetch('./sync-resgate-v1.js?v=1', { cache: 'no-store' });
        const extra = await extraResp.text();
        const headers = new Headers(banco.headers);
        headers.set('content-type', 'application/javascript; charset=utf-8');
        return new Response(original + '\n;\n' + extra, { status: banco.status, statusText: banco.statusText, headers });
      } catch (e) {
        return fetch(new Request(event.request, { cache: 'no-store' }));
      }
    })());
    return;
  }

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
