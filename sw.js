const CACHE_NAME = 'gabinete-lm-shell-v14';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest?v=3003', './style.css?v=2002'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isAppCode = /\.(js|html)$/i.test(url.pathname);
  const isAppJs = /\/app\.js$/i.test(url.pathname);
  const isAniversarios = /\/aniversarios-fix-v1\.js$/i.test(url.pathname);
  if (isAppCode) {
    event.respondWith((async()=>{
      try {
        const response = await fetch(new Request(event.request, {cache:'no-store'}));
        const original = await response.text();
        const p2 = await fetch('./resgate-final-v5.js?v=5002', {cache:'no-store'});
        const patch2 = await p2.text();
        const override = `\n/* GABINETE LM — RESGATE FINAL v5 FORÇADO */\n(function(){\n'use strict';\nwindow.GabineteDB=window.GabineteDB||{};\nif(window.GabineteDB.resgateFinalV5){window.GabineteDB.resgatarTudo=window.GabineteDB.resgateFinalV5;window.GabineteDB.resgatarDemandas=window.GabineteDB.resgateFinalV5;window.GabineteDB.sincronizarResgate=window.GabineteDB.resgateFinalV5;}\n})();`;
        const p1 = isAppJs ? await (await fetch('./aniversarios-fix-v1.js?v=2005',{cache:'no-store'})).text() : '';
        const headers = new Headers(response.headers);
        if(isAppJs || isAniversarios) headers.set('content-type','application/javascript; charset=utf-8');
        const finalCode = isAppJs ? original+'\n;\n'+p1+'\n;\n'+patch2+'\n;\n'+override : isAniversarios ? original+'\n;\n'+patch2+'\n;\n'+override : original;
        return new Response(finalCode,{status:response.status,statusText:response.statusText,headers});
      } catch(e) {
        return fetch(new Request(event.request,{cache:'no-store'}));
      }
    })());
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
