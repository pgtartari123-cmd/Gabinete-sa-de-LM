/* GABINETE LM — mensagem padrão de felicitações
   A data exibida é sempre a data de nascimento original cadastrada.
*/
(function(){
'use strict';
function fmtNascimento(v){
  v=String(v||'').trim();
  if(!v)return 'Não informado';
  let m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m)return `${m[3]}/${m[2]}/${m[1]}`;
  m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if(m)return `${m[1]}/${m[2]}/${m[3]}`;
  return v;
}
function proximaData(p){
  const v=String(p.nascimento||'').trim();
  let d,mo,m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if(m){d=+m[1];mo=+m[2]}else{m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m){d=+m[3];mo=+m[2]}}
  if(!d||!mo)return null;
  const now=new Date();
  let dt=new Date(now.getFullYear(),mo-1,d);
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(dt<today)dt.setFullYear(dt.getFullYear()+1);
  return dt;
}
function mensagem(nome){
  return `Olá, ${nome}! 🎉\n\nEu, Vereadora Lene Martins, quero parabenizar você pelo seu aniversário! Desejo muita saúde, paz, felicidade e muitas bênçãos em sua vida. Que Deus continue iluminando seus caminhos e conceda muitos anos de vida!\n\nUm grande abraço,\nVereadora Lene Martins 💗`;
}
window.renderBirthdays=function(){
  const c=document.getElementById('listaAniversarios');
  if(!c)return;
  const b=(typeof db!=='undefined'?db.people:[]).map(p=>({person:p,date:proximaData(p)})).filter(x=>x.date).sort((a,b)=>a.date-b.date);
  c.innerHTML=b.map(x=>{
    const nome=String(x.person.nome||'').trim();
    const tel=String(x.person.telefone||'').replace(/\D/g,'');
    const msg=mensagem(nome);
    const url=tel?'https://wa.me/'+tel+'?text='+encodeURIComponent(msg):'';
    return `<div class="card"><h3>🎂 ${typeof esc==='function'?esc(nome):nome}</h3><p>Aniversário: ${fmtNascimento(x.person.nascimento)}</p>${tel?`<button type="button" onclick="window.open('${url}','_blank')">Enviar felicitações pelo WhatsApp</button>`:''}</div>`;
  }).join('')||'<div class="card vazio"><h3>Nenhum aniversário cadastrado</h3><p>Cadastre a data de nascimento dos cidadãos para aparecerem aqui.</p></div>';
};
if(document.readyState!=='loading')window.renderBirthdays();else document.addEventListener('DOMContentLoaded',()=>window.renderBirthdays());
})();

/* GABINETE LM — sincronização manual segura
   Não apaga dados locais. Envia os cadastros deste aparelho e depois atualiza a tela.
*/
(function(){
'use strict';
function instalar(){
  if(document.getElementById('btnSyncGabinete'))return;
  const b=document.createElement('button');
  b.id='btnSyncGabinete';
  b.type='button';
  b.textContent='🔄 Sincronizar agora';
  b.style.cssText='position:fixed;right:14px;bottom:18px;z-index:2147483646;border:0;border-radius:999px;padding:12px 16px;background:#e91e63;color:#fff;font:700 14px Arial;box-shadow:0 5px 18px #0003;cursor:pointer';
  b.onclick=async()=>{
    if(b.dataset.busy==='1')return;
    b.dataset.busy='1';b.disabled=true;b.textContent='⏳ Sincronizando...';
    try{
      if(window.GabineteDB?.sincronizarResgate)await window.GabineteDB.sincronizarResgate();
      if(window.GabineteDB?.sincronizar)await window.GabineteDB.sincronizar();
      if(window.GabineteDB?.atualizarAgora)await window.GabineteDB.atualizarAgora();
    }catch(e){console.error('[Gabinete LM] Sincronização manual:',e);alert('Não foi possível concluir a sincronização. Os dados locais foram preservados.');}
    finally{b.dataset.busy='0';b.disabled=false;b.textContent='🔄 Sincronizar agora';}
  };
  document.body.appendChild(b);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();

/* GABINETE LM — resgate robusto de demandas v2
   Envia cada demanda separadamente para evitar que uma linha com problema bloqueie as demais.
   Nunca apaga dados locais.
*/
(function(){
'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession',AT='gabineteAccessToken';
const get=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const token=()=>localStorage.getItem(AT)||get(SES)?.access_token||'';
const cfg=()=>get(CFG);
const base=()=>String(cfg()?.url||'').replace(/\/+$/,'');
const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
const valid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
const date=v=>{v=String(v||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:null};
function read(){try{const d=JSON.parse(localStorage.getItem(DB)||'{"people":[]}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[]}}}
async function request(path,opts={}){const c=cfg();if(!c?.url||!c?.anonKey)throw Error('Supabase não configurado.');const h=Object.assign({apikey:c.anonKey,'Content-Type':'application/json',Authorization:'Bearer '+token()},opts.headers||{});let r=await fetch(base()+path,Object.assign({},opts,{headers:h}));if(r.status===401){const s=get(SES),rt=s?.refresh_token;if(!rt)throw Error('Sessão expirada. Entre novamente.');const rr=await fetch(base()+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})});const j=await rr.json().catch(()=>({}));if(!rr.ok||!j.access_token)throw Error('Sessão expirada. Entre novamente.');localStorage.setItem(SES,JSON.stringify(Object.assign({},s,j)));localStorage.setItem(AT,j.access_token);h.Authorization='Bearer '+j.access_token;r=await fetch(base()+path,Object.assign({},opts,{headers:h}))}if(!r.ok){const t=await r.text();throw Error('HTTP '+r.status+': '+t)}return r}
function norm(p){if(!Array.isArray(p.demandas))p.demandas=[];if(p.demanda&&!p.demandas.length)p.demandas.push({id:valid(p.demandaId)?p.demandaId:uid(),demanda:p.demanda,tipoDemanda:p.tipoDemanda||p.tipo||'Outro',procedimento:p.procedimento||'',status:p.status||'Pendente',observacoes:p.observacoes||'',prioridade:p.prioridade||'Normal',responsavel:p.responsavel||'',prazo:p.prazo||'',encaminhamento:p.encaminhamento||'',retorno:p.retorno||'',protocolo:p.protocolo||'',secretaria:p.secretaria||'',anexos:Array.isArray(p.anexos)?p.anexos:[],dataAbertura:p.dataAbertura||'',dataSaida:p.dataSaida||'',destinoEnvio:p.destinoEnvio||'',atualizadoEm:p.atualizadoEm||p.criadoEm||new Date().toISOString(),criadoEm:p.criadoEm||new Date().toISOString()});p.demandas.forEach(d=>{if(!valid(d.id))d.id=uid();d.status=['Pendente','Em andamento','Concluído'].includes(d.status)?d.status:'Pendente';d.prioridade=['Baixa','Normal','Alta','Urgente'].includes(d.prioridade)?d.prioridade:'Normal';d.atualizadoEm=d.atualizadoEm||d.criadoEm||p.atualizadoEm||new Date().toISOString()});return p}
async function resgatarDemandas(){const d=read(),rows=[];d.people.forEach(p=>{norm(p);p.demandas.forEach(x=>rows.push({id:x.id,cidadao_id:p.id,descricao:x.demanda||'',tipo:x.tipoDemanda||x.tipo||'Outro',procedimento:x.procedimento||null,status:['Pendente','Em andamento','Concluído'].includes(x.status)?x.status:'Pendente',observacoes:x.observacoes||null,prioridade:['Baixa','Normal','Alta','Urgente'].includes(x.prioridade)?x.prioridade:'Normal',responsavel:x.responsavel||null,prazo:date(x.prazo),encaminhamento:x.encaminhamento||null,retorno:x.retorno||null,secretaria:x.secretaria||null,anexos:Array.isArray(x.anexos)?x.anexos:[],atualizado_em:x.atualizadoEm||x.criadoEm||null,concluido_em:x.concluidoEm||null,protocolo:x.protocolo||null,destino_envio:x.destinoEnvio||p.destinoEnvio||null,data_saida:date(x.dataSaida||p.dataSaida)}))});let ok=0,fail=0;for(const row of rows){try{await request('/rest/v1/demandas?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([row])});ok++}catch(e){fail++;console.error('[Gabinete LM] Demanda não enviada',row,e)}}if(window.GabineteDB?.atualizarAgora)await window.GabineteDB.atualizarAgora();const msg=`Demandas resgatadas: ${ok} enviada(s)${fail?` e ${fail} com erro`:''}.`;let t=document.getElementById('gabineteToast');if(t)t.textContent='✓ '+msg;else alert(msg);return{ok,fail,total:rows.length}}
window.GabineteDB=window.GabineteDB||{};window.GabineteDB.resgatarDemandas=resgatarDemandas;
const old=window.GabineteDB.sincronizarResgate;
window.GabineteDB.sincronizarResgate=async function(){if(old)await old();return resgatarDemandas()};
})();