/* GABINETE LM — COMPATIBILIDADE iPHONE / SAFARI v1 */
(function(){'use strict';
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS)return;
window.__GabineteIOS=true;
try{
  document.documentElement.classList.add('gabinete-ios');
  const metas=[['apple-mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','default'],['apple-mobile-web-app-title','Gabinete Lene Martins']];
  metas.forEach(([n,c])=>{let m=document.querySelector(`meta[name="${n}"]`);if(!m){m=document.createElement('meta');m.name=n;document.head.appendChild(m)}m.content=c});
}catch(e){}
function mostrarErro(e){
  if(document.getElementById('iosCompatError'))return;
  const box=document.createElement('div');box.id='iosCompatError';box.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;background:#fff;border:2px solid #e91e63;border-radius:16px;padding:16px;box-shadow:0 12px 40px #0004;font:14px Arial;color:#111827';
  box.innerHTML='<strong style="color:#e91e63">Gabinete LM</strong><p style="margin:8px 0">O Safari encontrou uma falha ao carregar o sistema. Seus dados locais não foram apagados.</p><button type="button" style="padding:10px 14px;border:0;border-radius:10px;background:#e91e63;color:#fff;font-weight:700">Recarregar sistema</button>';
  box.querySelector('button').onclick=()=>location.reload();document.body.appendChild(box);
}
window.addEventListener('error',e=>{if(e?.error)console.warn('[Gabinete iPhone]',e.error);});
window.addEventListener('unhandledrejection',e=>{console.warn('[Gabinete iPhone] promessa rejeitada',e.reason);});
function garantirLogin(){
  try{
    const at=localStorage.getItem('gabineteAccessToken'),ses=localStorage.getItem('gabineteSupabaseSession');
    if(!at||!ses){if(typeof window.abrirLoginGabinete==='function'&&!document.getElementById('authModal'))window.abrirLoginGabinete();}
  }catch(e){console.warn('[Gabinete iPhone] localStorage indisponível',e);mostrarErro(e)}
}
function atualizarSW(){try{if(navigator.serviceWorker){navigator.serviceWorker.getRegistration().then(r=>{if(r)r.update()}).catch(()=>{})}}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(garantirLogin,1200);setTimeout(atualizarSW,500)});else{setTimeout(garantirLogin,1200);setTimeout(atualizarSW,500)}
})();