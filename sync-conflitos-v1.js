/* GABINETE LM — proteção contra conflito de protocolo + filtro Supabase
   O banco-v6.js continua sendo o sincronizador central.
   Corrige a sintaxe do filtro IN usada pela sincronização sem apagar dados.
*/
(function(){'use strict';
  if(window.__gabineteProtocoloFixV2)return;
  window.__gabineteProtocoloFixV2=true;
  const originalFetch=window.fetch.bind(window);
  function corrigirFiltro(url){
    const u=String(url||'');
    return u.replace(/id\.in=\(/g,'id=in.(');
  }
  function preparar(url,opt){
    const nu=corrigirFiltro(url);
    if(nu===String(url||''))return{url,opt};
    return{url:nu,opt};
  }
  const isDemandUpsert=(url,opt)=>{
    const u=String(url||'');
    const method=String(opt?.method||'GET').toUpperCase();
    return method==='POST' && /\/rest\/v1\/demandas\?[^#]*on_conflict=id/i.test(u);
  };
  async function retryDemandas(url,opt,rows){
    const headers=Object.assign({},opt.headers||{});let ultimo=null;
    for(const row of rows){
      const r=await originalFetch(url,Object.assign({},opt,{headers,body:JSON.stringify([row])}));
      if(r.ok){ultimo=r;continue;}
      let texto='';try{texto=await r.clone().text()}catch(e){}
      const conflito=r.status===409&&/demandas_protocolo_unique|duplicate key value/i.test(texto);
      if(!conflito)return r;
      const semProtocolo=Object.assign({},row);delete semProtocolo.protocolo;
      const retry=await originalFetch(url,Object.assign({},opt,{headers,body:JSON.stringify([semProtocolo])}));
      if(!retry.ok)return retry;ultimo=retry;
    }
    return ultimo||new Response(null,{status:204});
  }
  window.fetch=async function(url,opt={}){
    const p=preparar(url,opt);url=p.url;opt=p.opt;
    if(!isDemandUpsert(url,opt))return originalFetch(url,opt);
    let rows;try{rows=JSON.parse(opt.body||'null')}catch(e){return originalFetch(url,opt)}
    if(!Array.isArray(rows)||rows.length<2)return originalFetch(url,opt);
    const primeira=await originalFetch(url,opt);if(primeira.ok)return primeira;
    let texto='';try{texto=await primeira.clone().text()}catch(e){}
    if(primeira.status!==409||!/demandas_protocolo_unique|duplicate key value/i.test(texto))return primeira;
    return retryDemandas(url,opt,rows);
  };
})();
