const CACHE_NAME = 'gabinete-lm-shell-v11';
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
        const patchResponse = await fetch('./aniversarios-fix-v1.js?v=2004', { cache: 'no-store' });
        const patch = await patchResponse.text();
        const override = `
/* GABINETE LM — OVERRIDE FINAL DE SINCRONIZAÇÃO v4 */
(function(){
'use strict';
window.GabineteDB=window.GabineteDB||{};
if(window.GabineteDB.resgatarTudo) window.GabineteDB.sincronizarResgate=window.GabineteDB.resgatarTudo;
function instalarSyncFinal(){
  const b=document.getElementById('btnSyncGabinete');
  if(!b||b.dataset.syncFinal==='1')return;
  b.dataset.syncFinal='1';
  b.onclick=async function(){
    if(b.dataset.busy==='1')return;
    b.dataset.busy='1';b.disabled=true;b.textContent='⏳ Sincronizando...';
    try{
      let d={people:[]};
      try{d=JSON.parse(localStorage.getItem('gabineteDigitalDemo')||'{"people":[]}')}catch(e){}
      d.people=Array.isArray(d.people)?d.people:[];
      let n=0;d.people.forEach(p=>{if(Array.isArray(p.demandas))n+=p.demandas.length;else if(p.demanda)n++});
      let t=document.getElementById('gabineteToast');
      if(!t){t=document.createElement('div');t.id='gabineteToast';t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;padding:14px 18px;border-radius:12px;font:700 14px Arial;white-space:pre-line;max-width:92%;box-shadow:0 8px 30px #0006';document.body.appendChild(t)}
      t.textContent='📦 LOCAL DESTE APARELHO\\n👥 '+d.people.length+' cidadão(ãos)\\n📋 '+n+' demanda(s)\\n\\nEnviando...';t.style.display='block';
      if(window.GabineteDB.resgatarTudo){
        const r=await window.GabineteDB.resgatarTudo();
        if(window.GabineteDB.atualizarAgora)await window.GabineteDB.atualizarAgora();
        t.textContent='✅ SINCRONIZAÇÃO CONCLUÍDA\\n\\n📦 Local: '+r.people+' cidadãos / '+r.demandas+' demandas\\n☁️ Enviados: '+r.pc+' cidadãos / '+r.dc+' demandas'+(r.pf||r.df?'\\n⚠️ Erros: '+r.pf+' cidadãos / '+r.df+' demandas':'');
      }else throw Error('Módulo de sincronização não carregado');
    }catch(e){console.error('[Gabinete LM] Sync final:',e);let t=document.getElementById('gabineteToast');if(t)t.textContent='❌ Não foi possível concluir a sincronização.\\n\\nOs dados locais foram preservados.';}
    finally{b.dataset.busy='0';b.disabled=false;b.textContent='🔄 Sincronizar agora'}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalarSyncFinal,{once:true});else instalarSyncFinal();
setTimeout(instalarSyncFinal,500);setTimeout(instalarSyncFinal,1500);setTimeout(instalarSyncFinal,3000);
})();`;
        const headers = new Headers(response.headers);
        headers.set('content-type','application/javascript; charset=utf-8');
        return new Response(original+'\n;\n'+patch+'\n;\n'+override,{status:response.status,statusText:response.statusText,headers});
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
