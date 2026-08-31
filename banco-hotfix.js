/* GABINETE DIGITAL — hotfix de sincronização Supabase */
(function(){
  'use strict';
  const DB='gabineteDigitalDemo', CFG='gabineteSupabaseConfig', SES='gabineteSupabaseSession', LOCK='__gabinete_hotfix_syncing__';
  const rawGet=Storage.prototype.getItem, rawSet=Storage.prototype.setItem, rawRemove=Storage.prototype.removeItem;
  let timer=null;
  const cfg=()=>{try{return JSON.parse(rawGet.call(localStorage,CFG)||'null')}catch(e){return null}};
  const ses=()=>{try{return JSON.parse(rawGet.call(localStorage,SES)||'null')}catch(e){return null}};
  const read=()=>{try{const d=JSON.parse(rawGet.call(localStorage,DB)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(e){return{people:[],agenda:[]}}};
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
  const valid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
  const dt=v=>{v=String(v||'').trim();if(!v)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:null};
  const st=(v,agenda)=>{const ok=agenda?['Pendente','Concluído']:['Pendente','Em andamento','Concluído'];return ok.includes(v)?v:'Pendente'};
  function toast(m){let e=document.getElementById('gabineteToast');if(!e){e=document.createElement('div');e.id='gabineteToast';e.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:999999;background:#111827;color:#fff;padding:13px 16px;border-radius:10px;font:14px Arial;max-width:92%;box-shadow:0 8px 30px #0006';document.body.appendChild(e)}e.textContent=m;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',5000)}
  async function api(path,opt={}){const c=cfg(),s=ses();if(!c?.url||!c?.anonKey||!s?.access_token)throw Error('Sessão Supabase ausente. Entre novamente no sistema.');const h=Object.assign({apikey:c.anonKey,'Content-Type':'application/json',Authorization:'Bearer '+s.access_token},opt.headers||{});let r=await fetch(String(c.url).replace(/\/+$/,'')+path,Object.assign({},opt,{headers:h}));if(!r.ok){const t=await r.text();let msg=t;try{const j=JSON.parse(t);msg=j.message||j.error_description||j.details||j.hint||t}catch(e){}throw Error('HTTP '+r.status+': '+msg)}return r.status===204?null:(()=>{return r.text().then(t=>t?JSON.parse(t):null)})();}
  async function upsert(table,rows){if(!rows.length)return;await api('/rest/v1/'+table+'?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)})}
  async function sync(){if(rawGet.call(localStorage,LOCK)==='1')return false;const d=read();rawSet.call(localStorage,LOCK,'1');try{
    const people=d.people.map(p=>{if(!valid(p.id))p.id=uuid();return{id:p.id,nome:p.nome||'',nome_mae:p.mae||null,data_nascimento:dt(p.nascimento),cpf:p.cpf||null,cartao_sus:p.sus||null,telefone:p.telefone||null,bairro:p.bairro||null,endereco:p.endereco||null,observacoes:p.observacoes||null}});
    const demandas=d.people.filter(p=>p.demanda).map(p=>{if(!valid(p.id))p.id=uuid();if(!valid(p.demandaId))p.demandaId=uuid();return{id:p.demandaId,cidadao_id:p.id,descricao:p.demanda,tipo:p.tipoDemanda||p.tipo||'Outro',procedimento:p.procedimento||null,status:st(p.status,false),observacoes:p.observacoes||null}});
    const agenda=d.agenda.map(a=>{if(!valid(a.id))a.id=uuid();return{id:a.id,assunto:a.assunto||'Compromisso',data:dt(a.data),hora:a.hora||null,tipo:a.tipo||'Outro',status:st(a.status,true),observacoes:a.observacoes||null}});
    await upsert('cidadaos',people); await upsert('demandas',demandas); await upsert('agenda',agenda);
    rawSet.call(localStorage,DB,JSON.stringify(d)); toast('✓ Sincronizado com o Supabase'); return true;
  }catch(e){console.error('[Gabinete Digital hotfix]',e);toast('Erro Supabase: '+(e.message||e));return false}finally{rawRemove.call(localStorage,LOCK)}}
  const previous=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage&&k===DB&&rawGet.call(localStorage,LOCK)!=='1'){
      rawSet.call(localStorage,LOCK,'1'); previous.call(this,k,v); rawRemove.call(localStorage,LOCK);
      clearTimeout(timer); timer=setTimeout(()=>sync(),900); return;
    }
    previous.call(this,k,v);
  };
  window.GabineteDB=window.GabineteDB||{};
  window.GabineteDB.sincronizar=sync;
  window.GabineteDB.hotfixVersion='3.1';
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>sync(),1800),{once:true});
})();
