/* GABINETE LM — mensagem padrão de felicitações
   A data exibida é sempre a data de nascimento original cadastrada.
*/
(function(){
'use strict';
function fmtNascimento(v){v=String(v||'').trim();if(!v)return 'Não informado';let m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return `${m[3]}/${m[2]}/${m[1]}`;m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);if(m)return `${m[1]}/${m[2]}/${m[3]}`;return v}
function proximaData(p){const v=String(p.nascimento||'').trim();let d,mo,m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);if(m){d=+m[1];mo=+m[2]}else{m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m){d=+m[3];mo=+m[2]}}if(!d||!mo)return null;const now=new Date();let dt=new Date(now.getFullYear(),mo-1,d);const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());if(dt<today)dt.setFullYear(dt.getFullYear()+1);return dt}
function mensagem(nome){return `Olá, ${nome}! 🎉\n\nEu, Vereadora Lene Martins, quero parabenizar você pelo seu aniversário! Desejo muita saúde, paz, felicidade e muitas bênçãos em sua vida. Que Deus continue iluminando seus caminhos e conceda muitos anos de vida!\n\nUm grande abraço,\nVereadora Lene Martins 💗`}
window.renderBirthdays=function(){const c=document.getElementById('listaAniversarios');if(!c)return;const b=(typeof db!=='undefined'?db.people:[]).map(p=>({person:p,date:proximaData(p)})).filter(x=>x.date).sort((a,b)=>a.date-b.date);c.innerHTML=b.map(x=>{const nome=String(x.person.nome||'').trim(),tel=String(x.person.telefone||'').replace(/\D/g,''),msg=mensagem(nome),url=tel?'https://wa.me/'+tel+'?text='+encodeURIComponent(msg):'';return `<div class="card"><h3>🎂 ${typeof esc==='function'?esc(nome):nome}</h3><p>Aniversário: ${fmtNascimento(x.person.nascimento)}</p>${tel?`<button type="button" onclick="window.open('${url}','_blank')">Enviar felicitações pelo WhatsApp</button>`:''}</div>`}).join('')||'<div class="card vazio"><h3>Nenhum aniversário cadastrado</h3><p>Cadastre a data de nascimento dos cidadãos para aparecerem aqui.</p></div>'};
if(document.readyState!=='loading')window.renderBirthdays();else document.addEventListener('DOMContentLoaded',()=>window.renderBirthdays());
})();

/* GABINETE LM — RESGATE MANUAL SEGURO v3
   Primeiro garante os cidadãos no Supabase; depois envia cada demanda separadamente.
   Nunca apaga, limpa ou substitui o armazenamento local.
*/
(function(){
'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession',AT='gabineteAccessToken';
const get=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const read=()=>{try{const d=JSON.parse(localStorage.getItem(DB)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[],agenda:[]}}};
const token=()=>localStorage.getItem(AT)||get(SES)?.access_token||'';
const cfg=()=>get(CFG);
const base=()=>String(cfg()?.url||'').replace(/\/+$/,'');
const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
const valid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
const date=v=>{v=String(v||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:null};
async function request(path,opts={}){const c=cfg();if(!c?.url||!c?.anonKey)throw Error('Supabase não configurado.');const h=Object.assign({apikey:c.anonKey,'Content-Type':'application/json',Authorization:'Bearer '+token()},opts.headers||{});let r=await fetch(base()+path,Object.assign({},opts,{headers:h}));if(r.status===401){const s=get(SES),rt=s?.refresh_token;if(!rt)throw Error('Sessão expirada. Entre novamente.');const rr=await fetch(base()+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})});const j=await rr.json().catch(()=>({}));if(!rr.ok||!j.access_token)throw Error('Sessão expirada. Entre novamente.');localStorage.setItem(SES,JSON.stringify(Object.assign({},s,j)));localStorage.setItem(AT,j.access_token);h.Authorization='Bearer '+j.access_token;r=await fetch(base()+path,Object.assign({},opts,{headers:h}))}if(!r.ok){const t=await r.text();throw Error('HTTP '+r.status+': '+t)}return r}
function norm(p){if(!valid(p.id))p.id=uid();if(!Array.isArray(p.demandas))p.demandas=[];if(p.demanda&&!p.demandas.length)p.demandas.push({id:valid(p.demandaId)?p.demandaId:uid(),demanda:p.demanda,tipoDemanda:p.tipoDemanda||p.tipo||'Outro',procedimento:p.procedimento||'',status:p.status||'Pendente',observacoes:p.observacoes||'',prioridade:p.prioridade||'Normal',responsavel:p.responsavel||'',prazo:p.prazo||'',encaminhamento:p.encaminhamento||'',retorno:p.retorno||'',protocolo:p.protocolo||'',secretaria:p.secretaria||'',anexos:Array.isArray(p.anexos)?p.anexos:[],dataSaida:p.dataSaida||'',destinoEnvio:p.destinoEnvio||'',atualizadoEm:p.atualizadoEm||p.criadoEm||new Date().toISOString(),criadoEm:p.criadoEm||new Date().toISOString()});p.demandas.forEach(x=>{if(!valid(x.id))x.id=uid();x.status=['Pendente','Em andamento','Concluído'].includes(x.status)?x.status:'Pendente';x.prioridade=['Baixa','Normal','Alta','Urgente'].includes(x.prioridade)?x.prioridade:'Normal';x.atualizadoEm=x.atualizadoEm||x.criadoEm||p.atualizadoEm||new Date().toISOString()});return p}
function personRow(p){return {id:p.id,nome:p.nome||'',nome_mae:p.nomeMae||p.nome_mae||'',nascimento:date(p.nascimento),naturalidade:p.naturalidade||null,estado_origem:p.estadoOrigem||p.estado_origem||null,telefone:p.telefone||null,cpf:p.cpf||null,sus:p.sus||p.cartaoSus||p.cartao_sus||null,endereco:p.endereco||null,bairro:p.bairro||null,cep:p.cep||null,raca_cor:p.racaCor||p.raca_cor||null,nacionalidade:p.nacionalidade||null,sexo:p.sexo||null,observacoes:p.observacoes||null,atualizado_em:p.atualizadoEm||p.criadoEm||new Date().toISOString()}}
function demandRow(p,x){return {id:x.id,cidadao_id:p.id,descricao:x.demanda||'',tipo:x.tipoDemanda||x.tipo||'Outro',procedimento:x.procedimento||null,status:['Pendente','Em andamento','Concluído'].includes(x.status)?x.status:'Pendente',observacoes:x.observacoes||null,prioridade:['Baixa','Normal','Alta','Urgente'].includes(x.prioridade)?x.prioridade:'Normal',responsavel:x.responsavel||null,prazo:date(x.prazo),encaminhamento:x.encaminhamento||null,retorno:x.retorno||null,secretaria:x.secretaria||null,anexos:Array.isArray(x.anexos)?x.anexos:[],atualizado_em:x.atualizadoEm||x.criadoEm||null,concluido_em:x.concluidoEm||null,protocolo:x.protocolo||null,destino_envio:x.destinoEnvio||p.destinoEnvio||null,data_saida:date(x.dataSaida||p.dataSaida)}}
async function resgatarDemandas(){const d=read();d.people.forEach(norm);localStorage.setItem(DB,JSON.stringify(d));const people=d.people,rows=[];let pc=0,pf=0,dc=0,df=0;for(const p of people){try{await request('/rest/v1/cidadaos?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([personRow(p)])});pc++}catch(e){pf++;console.error('[Gabinete LM] Cidadão não enviado',p,e)}}for(const p of people){for(const x of (p.demandas||[])){const row=demandRow(p,x);rows.push(row);try{await request('/rest/v1/demandas?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([row])});dc++}catch(e){df++;console.error('[Gabinete LM] Demanda não enviada',row,e)}}}const msg=`📦 Local: ${people.length} cidadão(ãos) / ${rows.length} demanda(s)\n☁️ Enviados: ${pc} cidadãos / ${dc} demandas${pf||df?`\n⚠️ Erros: ${pf} cidadãos / ${df} demandas`:''}`;const t=document.getElementById('gabineteToast');if(t)t.textContent=msg;else alert(msg);return{people:people.length,demandas:rows.length,pc,pf,dc,df}}
window.GabineteDB=window.GabineteDB||{};window.GabineteDB.resgatarTudo=resgatarDemandas;window.GabineteDB.resgatarDemandas=resgatarDemandas;
})();

/* Botão manual de diagnóstico — substitui o comportamento antigo sem apagar nada. */
(function(){
'use strict';
function localData(){try{const d=JSON.parse(localStorage.getItem('gabineteDigitalDemo')||'{"people":[]}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[]}}}
function toast(msg){const t=document.getElementById('gabineteToast');if(t){t.textContent=msg;t.style.display='block';}else alert(msg)}
function instalar(){
  const b=document.getElementById('btnSyncGabinete');
  if(!b||b.dataset.v4==='1')return;
  b.dataset.v4='1';
  b.onclick=async()=>{
    if(b.dataset.busy==='1')return;
    b.dataset.busy='1';b.disabled=true;b.textContent='⏳ Enviando dados...';
    try{
      const d=localData();
      let totalDem=0;
      d.people.forEach(p=>{if(Array.isArray(p.demandas))totalDem+=p.demandas.length;else if(p.demanda)totalDem++});
      toast(`📦 LOCAL DESTE APARELHO\n👥 ${d.people.length} cidadão(ãos)\n📋 ${totalDem} demanda(s)\n\nEnviando...`);
      const r=window.GabineteDB?.resgatarTudo?await window.GabineteDB.resgatarTudo():null;
      if(window.GabineteDB?.sincronizar)await window.GabineteDB.sincronizar();
      if(window.GabineteDB?.atualizarAgora)await window.GabineteDB.atualizarAgora();
      if(r)toast(`✅ SINCRONIZAÇÃO CONCLUÍDA\n\n📦 Local: ${r.people} cidadãos / ${r.demandas} demandas\n☁️ Enviados: ${r.pc} cidadãos / ${r.dc} demandas${r.pf||r.df?`\n⚠️ Erros: ${r.pf} cidadãos / ${r.df} demandas`:''}`);
    }catch(e){console.error('[Gabinete LM] diagnóstico:',e);toast('❌ Não foi possível concluir.\n\nOs dados locais foram preservados. Veja o console para o erro.');}
    finally{b.dataset.busy='0';b.disabled=false;b.textContent='🔄 Sincronizar agora'}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
setTimeout(instalar,1000);setTimeout(instalar,3000);
})();