/* GABINETE DIGITAL — prioridade das demandas + sincronização complementar */
(function(){
'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession';
const read=()=>{try{const d=JSON.parse(localStorage.getItem(DB)||'{}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[]}}};
const save=d=>localStorage.setItem(DB,JSON.stringify(d));
const cfg=()=>{try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch(e){return null}};
const ses=()=>{try{return JSON.parse(localStorage.getItem(SES)||'null')}catch(e){return null}};
const base=()=>String(cfg()?.url||'').replace(/\/+$/,'');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
async function api(path,opt={}){const c=cfg(),s=ses();if(!c?.url||!c?.anonKey||!s?.access_token)throw Error('Sessão Supabase ausente');const h=Object.assign({apikey:c.anonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},opt.headers||{});const r=await fetch(base()+path,Object.assign({},opt,{headers:h}));if(!r.ok)throw Error('HTTP '+r.status+': '+await r.text());const t=await r.text();return t?JSON.parse(t):null}
async function hidratar(){
  const d=read(); if(!ses()?.access_token) return;
  const rows=await api('/rest/v1/demandas?select=id,cidadao_id,prioridade');
  const map={};(rows||[]).forEach(x=>map[x.id]=x.prioridade||'Normal');
  let changed=false;
  d.people.forEach(p=>(p.demandas||[]).forEach(x=>{const v=map[x.id];if(v&&x.prioridade!==v){x.prioridade=v;changed=true}}));
  if(changed){save(d);if(typeof render==='function')render();if(typeof renderDemandas==='function')renderDemandas()}
}
function adicionarPrioridadeNosCards(){
  document.querySelectorAll('#listaDemandas .card').forEach(card=>{
    if(card.querySelector('.prioridade-badge'))return;
    const h=card.querySelector('h3'); if(!h)return;
    const d=read(), texto=h.textContent.trim(); let achado=null;
    d.people.forEach(p=>(p.demandas||[]).forEach(x=>{if(!achado&&String(x.demanda||'').trim()===texto)achado={p,x}}));
    if(!achado)return;
    const b=document.createElement('span');b.className='prioridade-badge prioridade-'+String(achado.x.prioridade||'Normal').toLowerCase();b.textContent='Prioridade: '+(achado.x.prioridade||'Normal');b.style.cssText='display:inline-block;margin:7px 0 0;padding:6px 10px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700';card.insertBefore(b,card.querySelector('.acoes')||null);
  });
}
const oldR=window.render,oldD=window.renderDemandas;
window.render=function(){if(oldR)oldR();setTimeout(adicionarPrioridadeNosCards,0)};
window.renderDemandas=function(){if(oldD)oldD();setTimeout(adicionarPrioridadeNosCards,0)};
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{hidratar().catch(console.error);adicionarPrioridadeNosCards()},1500)});
setInterval(()=>{hidratar().catch(()=>{});adicionarPrioridadeNosCards()},15000);
})();
