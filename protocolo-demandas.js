/* GABINETE DIGITAL — protocolos automáticos das demandas */
(function(){'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession';
const read=()=>{try{return JSON.parse(localStorage.getItem(DB)||'{"people":[]}')}catch(e){return{people:[]}}};
const write=d=>localStorage.setItem(DB,JSON.stringify(d));
const cfg=()=>{try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch(e){return null}};
const ses=()=>{try{return JSON.parse(localStorage.getItem(SES)||'null')}catch(e){return null}};
async function atualizarProtocolos(){
  try{
    const c=cfg(),s=ses(); if(!c?.url||!c?.anonKey||!s?.access_token)return;
    const r=await fetch(String(c.url).replace(/\/+$/,'')+'/rest/v1/demandas?select=id,protocolo,data_abertura',{headers:{apikey:c.anonKey,Authorization:'Bearer '+s.access_token}});
    if(!r.ok)return; const rows=await r.json(); const map=new Map((rows||[]).map(x=>[x.id,x]));
    const d=read(); let mudou=false;
    (d.people||[]).forEach(p=>(p.demandas||[]).forEach(x=>{const r=map.get(x.id);if(r&&(x.protocolo!==r.protocolo||x.dataAbertura!==r.data_abertura)){x.protocolo=r.protocolo||'';x.dataAbertura=r.data_abertura||'';mudou=true;}}));
    if(mudou){write(d);window.renderDemandas?.();window.render?.();}
  }catch(e){console.warn('Protocolos:',e)}
}
function style(){if(document.getElementById('protocoloDemStyle'))return;const s=document.createElement('style');s.id='protocoloDemStyle';s.textContent='.gd-protocolo{display:inline-block;margin-top:7px;padding:5px 9px;border-radius:8px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:800}.card .gd-protocolo{margin:8px 0 2px}.gd-abertura{color:#64748b;font-size:12px;margin-left:7px}';document.head.appendChild(s)}
function decorar(){
  const db=read();
  document.querySelectorAll('#listaDemandas .card').forEach(card=>{
    if(card.querySelector('.gd-protocolo'))return;
    const h=card.querySelector('h3'); if(!h)return;
    const pn=[...card.querySelectorAll('p')].find(x=>x.textContent.includes('Pessoa:')); if(!pn)return;
    const nome=pn.textContent.replace('Pessoa:','').trim(),titulo=h.textContent.trim();
    const p=(db.people||[]).find(x=>x.nome===nome); const dem=p?.demandas?.find(x=>x.demanda===titulo); if(!dem)return;
    const el=document.createElement('div');el.className='gd-protocolo';el.textContent='Protocolo: '+(dem.protocolo||'gerando...');h.insertAdjacentElement('afterend',el);
  });
  const modal=document.querySelector('#gestaoDemModal .gd-head');
  if(modal&&!modal.querySelector('.gd-protocolo')){
    const h=modal.querySelector('h2'); if(h){const nome=modal.querySelector('p')?.textContent?.split('•')[0]?.trim();const p=(db.people||[]).find(x=>x.nome===nome);const dem=p?.demandas?.find(x=>x.demanda===h.textContent.trim());if(dem){const el=document.createElement('div');el.className='gd-protocolo';el.textContent='Protocolo: '+(dem.protocolo||'gerando...');h.insertAdjacentElement('afterend',el)}}
  }
}
const oldSync=window.GabineteDB?.sincronizar;if(oldSync){window.GabineteDB.sincronizar=async function(){const r=await oldSync();setTimeout(atualizarProtocolos,500);return r}};
const oldRender=window.renderDemandas; if(oldRender)window.renderDemandas=function(){oldRender();setTimeout(decorar,30)};
document.addEventListener('DOMContentLoaded',()=>{style();setTimeout(atualizarProtocolos,1200);setTimeout(decorar,1600);setInterval(()=>{atualizarProtocolos();decorar()},3000)});
})();
