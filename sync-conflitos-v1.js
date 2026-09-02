/* Gabinete LM — marca alterações locais com timestamp real antes da sincronização. */
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const originalSet=Storage.prototype.setItem;
const rawGet=Storage.prototype.getItem;
let shadow='';
function now(){return new Date().toISOString()}
function stamp(value){
  let next;
  try{next=JSON.parse(value||'{"people":[],"agenda":[]}')}catch(e){return value}
  if(!Array.isArray(next.people))next.people=[];
  if(!Array.isArray(next.agenda))next.agenda=[];
  let prev=null;
  try{prev=JSON.parse(shadow||rawGet.call(localStorage,KEY)||'null')}catch(e){prev=null}
  const pp=new Map((prev?.people||[]).map(p=>[String(p.id),p]));
  next.people.forEach(p=>{
    const old=pp.get(String(p.id));
    const copy={...p};
    delete copy.atualizadoEm;
    const oldCopy=old?{...old}:null;
    if(oldCopy)delete oldCopy.atualizadoEm;
    if(!old || JSON.stringify(copy)!==JSON.stringify(oldCopy))p.atualizadoEm=now();
    else p.atualizadoEm=p.atualizadoEm||old.atualizadoEm||p.criadoEm||now();
    if(Array.isArray(p.demandas)){
      const oldDs=new Map((old?.demandas||[]).map(d=>[String(d.id),d]));
      p.demandas=p.demandas.map(d=>{
        const od=oldDs.get(String(d.id));
        const dc={...d}; delete dc.atualizadoEm;
        const odc=od?{...od}:null; if(odc)delete odc.atualizadoEm;
        if(!od||JSON.stringify(dc)!==JSON.stringify(odc))d.atualizadoEm=now();
        else d.atualizadoEm=d.atualizadoEm||od.atualizadoEm||d.criadoEm||p.atualizadoEm||now();
        return d;
      });
    }
  });
  const aa=new Map((prev?.agenda||[]).map(a=>[String(a.id),a]));
  next.agenda.forEach(a=>{
    const old=aa.get(String(a.id));
    const copy={...a}; delete copy.atualizadoEm;
    const oldCopy=old?{...old}:null; if(oldCopy)delete oldCopy.atualizadoEm;
    if(!old || JSON.stringify(copy)!==JSON.stringify(oldCopy))a.atualizadoEm=now();
    else a.atualizadoEm=a.atualizadoEm||old.atualizadoEm||a.criadoEm||now();
  });
  shadow=JSON.stringify(next);
  return shadow;
}
Storage.prototype.setItem=function(k,v){
  if(this===localStorage&&k===KEY)v=stamp(v);
  return originalSet.call(this,k,v);
};
try{shadow=rawGet.call(localStorage,KEY)||''}catch(e){}

/* Proteção de produção: se o banco remoto estiver explicitamente vazio,
   não deixa um cache antigo do navegador ressuscitar dados apagados. */
(async function(){
  try{
    const cfg=JSON.parse(rawGet.call(localStorage,'gabineteSupabaseConfig')||'null');
    const ses=JSON.parse(rawGet.call(localStorage,'gabineteSupabaseSession')||'null');
    const token=rawGet.call(localStorage,'gabineteAccessToken')||ses?.access_token||'';
    if(!cfg?.url||!cfg?.anonKey||!token)return;
    const base=String(cfg.url).replace(/\/+$/,'');
    const headers={apikey:cfg.anonKey,Authorization:'Bearer '+token};
    const qs='select=id&limit=1';
    const [c,d,a]=await Promise.all([
      fetch(base+'/rest/v1/cidadaos?'+qs,{headers}),
      fetch(base+'/rest/v1/demandas?'+qs,{headers}),
      fetch(base+'/rest/v1/agenda?'+qs,{headers})
    ]);
    if(!c.ok||!d.ok||!a.ok)return;
    const [cr,dr,ar]=await Promise.all([c.json(),d.json(),a.json()]);
    if(Array.isArray(cr)&&Array.isArray(dr)&&Array.isArray(ar)&&!cr.length&&!dr.length&&!ar.length){
      const local=JSON.parse(rawGet.call(localStorage,KEY)||'{"people":[],"agenda":[]}');
      if((local.people||[]).length||(local.agenda||[]).length){
        rawRemove();
      }
    }
  }catch(e){console.warn('Cache local não validado:',e)}
})();
})();