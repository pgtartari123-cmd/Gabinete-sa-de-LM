const CACHE_NAME = 'gabinete-lm-shell-v13';
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
  if (isAppCode) {
    event.respondWith((async()=>{
      try {
        const response = await fetch(new Request(event.request, {cache:'no-store'}));
        if(!isAppJs)return response;
        const original = await response.text();
        const p1 = await fetch('./aniversarios-fix-v1.js?v=2005', {cache:'no-store'});
        const patch1 = await p1.text();
        const p2 = await fetch('./resgate-final-v5.js?v=5001', {cache:'no-store'});
        const patch2 = await p2.text();
        const override = `
/* GABINETE LM — RESGATE FINAL v5 */
(function(){
'use strict';
window.GabineteDB=window.GabineteDB||{};
if(window.GabineteDB.resgateFinalV5){
  window.GabineteDB.resgatarTudo=window.GabineteDB.resgateFinalV5;
  window.GabineteDB.resgatarDemandas=window.GabineteDB.resgateFinalV5;
  window.GabineteDB.sincronizarResgate=window.GabineteDB.resgateFinalV5;
}
})();`;
        const headers = new Headers(response.headers);
        headers.set('content-type','application/javascript; charset=utf-8');
        return new Response(original+'\n;\n'+patch1+'\n;\n'+patch2+'\n;\n'+override,{status:response.status,statusText:response.statusText,headers});
      } catch(e) {
        return fetch(new Request(event.request,{cache:'no-store'}));
      }
    })());
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
