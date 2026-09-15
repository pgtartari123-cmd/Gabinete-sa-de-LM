const CACHE_NAME = 'gabinete-lm-shell-v18';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest?v=3005', './style.css?v=2002'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url); if (url.origin !== self.location.origin) return;
  const isAppCode = /\.(js|html)$/i.test(url.pathname), isAppJs=/\/app\.js$/i.test(url.pathname), isAniversarios=/\/aniversarios-fix-v1\.js$/i.test(url.pathname);
  if (isAppCode) { event.respondWith((async()=>{ try {
    const response=await fetch(new Request(event.request,{cache:'no-store'})), original=await response.text();
    const p2=await (await fetch('./resgate-final-v5.js?v=5004',{cache:'no-store'})).text();
    const p3=await (await fetch('./dados-integridade-v1.js?v=1002',{cache:'no-store'})).text();
    const p4=await (await fetch('./demanda-visual-fix-v1.js?v=1003',{cache:'no-store'})).text();
    const p5=await (await fetch('./origem-cidadao-fix-v1.js?v=1001',{cache:'no-store'})).text();
    const p6=await (await fetch('./ios-compat-v1.js?v=1001',{cache:'no-store'})).text();
    const override=`\n(function(){'use strict';window.GabineteDB=window.GabineteDB||{};if(window.GabineteDB.resgateFinalV5){window.GabineteDB.resgatarTudo=window.GabineteDB.resgateFinalV5;window.GabineteDB.resgatarDemandas=window.GabineteDB.resgateFinalV5;window.GabineteDB.sincronizarResgate=window.GabineteDB.resgateFinalV5;}})();`;
    const p1=isAppJs?await (await fetch('./aniversarios-fix-v1.js?v=2006',{cache:'no-store'})).text():'';
    const finalCode=isAppJs?original+'\n;\n'+p1+'\n;\n'+p2+'\n;\n'+p3+'\n;\n'+p4+'\n;\n'+p5+'\n;\n'+p6+'\n;\n'+override:isAniversarios?original+'\n;\n'+p2+'\n;\n'+override:original;
    const headers=new Headers(response.headers); if(isAppJs||isAniversarios)headers.set('content-type','application/javascript; charset=utf-8');
    return new Response(finalCode,{status:response.status,statusText:response.statusText,headers});
  } catch(e){ return fetch(new Request(event.request,{cache:'no-store'})); } })()); return; }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});