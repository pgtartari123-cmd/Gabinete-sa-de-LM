const CACHE_NAME = 'gabinete-lm-shell-v10';
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

  const isAppCode = /\.(js|html)$/i.test(url.pathname);
  const isAppJs = /\/app\.js$/i.test(url.pathname);

  if (isAppCode) {
    event.respondWith((async()=>{
      try {
        const response = await fetch(new Request(event.request, { cache: 'no-store' }));
        if(!isAppJs)return response;
        const original = await response.text();
        const patchResponse = await fetch('./aniversarios-fix-v1.js?v=1', { cache: 'no-store' });
        const patch = await patchResponse.text();
        const headers = new Headers(response.headers);
        headers.set('content-type','application/javascript; charset=utf-8');
        return new Response(original+'\n;\n'+patch,{status:response.status,statusText:response.statusText,headers});
      } catch(e) {
        return fetch(new Request(event.request, { cache: 'no-store' }));
      }
    })());
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
