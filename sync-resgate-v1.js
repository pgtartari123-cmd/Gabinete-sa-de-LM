/* GABINETE LM — resgate de sincronização individual v2
   Resgate manual seguro: envia cidadãos E todas as demandas locais.
   Nunca apaga dados locais.
*/
(function(){
'use strict';
const DB='gabineteDigitalDemo', CFG='gabineteSupabaseConfig', SES='gabineteSupabaseSession', AT='gabineteAccessToken';
let running=false;
function getLocal(k){try{return localStorage.getItem(k)}catch(e){return null}}
function setLocal(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function readDB(){try{const d=JSON.parse(getLocal(DB)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(e){return{people:[],agenda:[]}}}
function writeDB(d){setLocal(DB,JSON.stringify(d))}
function cfg(){try{return JSON.parse(getLocal(CFG)||'null')}catch(e){return null}}
function session(){try{return JSON.parse(getLocal(SES)||'null')}catch(e){return null}}
function token(){return getLocal(AT)||session()?.access_token||''}
function base(){const c=cfg();return c?.url?String(c.url).replace(/\/+$/,''):''}
function uuid(){if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
function valid(v){return/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
function date(v){v=String(v||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:null}
function toast(msg){let e=document.getElementById('gabineteToast');if(!e){e=document.createElement('div');e.id='gabineteToast';e.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;padding:13px 16px;border-radius:10px;font:14px Arial;max-width:92%;box-shadow:0 8px 30px #0006';document.body.appendChild(e)}e.textContent=msg;e.style.display='block';clearTimeout(e._resgateTimer);e._resgateTimer=setTimeout(()=>e.style.display='none',7000)}
async function req(path,opt={}){const c=cfg(),t=token();if(!c?.url||!c?.anonKey||!t)throw Error('Sessão não disponível');const h=Object.assign({apikey:c.anonKey,'Content-Type':'application/json',Authorization:'Bearer '+t},opt.headers||{});const r=await fetch(base()+path,Object.assign({},opt,{headers:h}));if(!r.ok){const txt=await r.text();let j={};try{j=JSON.parse(txt)}catch(e){}throw Error('HTTP '+r.status+': '+(j.message||j.details||j.hint||j.error_description||txt))}if(r.status===204)return null;const txt=await r.text();return txt?JSON.parse(txt):null}
async function upsertMany(table,rows){if(!rows.length)return;await req('/rest/v1/'+table+'?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)})}
function getDemandas(p){
  let ds=Array.isArray(p.demandas)?p.demandas.slice():[];
  if(!ds.length&&p.demanda)ds=[{id:p.demandaId||uuid(),demanda:p.demanda,tipoDemanda:p.tipoDemanda||p.tipo||'Outro',tipo:p.tipoDemanda||p.tipo||'Outro',procedimento:p.procedimento||'',status:p.status||'Pendente',observacoes:p.observacoes||'',prioridade:p.prioridade||'Normal',responsavel:p.responsavel||'',prazo:p.prazo||'',encaminhamento:p.encaminhamento||'',retorno:p.retorno||'',protocolo:p.protocolo||'',secretaria:p.secretaria||'',anexos:Array.isArray(p.anexos)?p.anexos:[],dataAbertura:p.dataAbertura||'',dataSaida:p.dataSaida||p.data_saida||'',destinoEnvio:p.destinoEnvio||'',atualizadoEm:p.atualizadoEm||p.criadoEm||new Date().toISOString(),criadoEm:p.criadoEm||new Date().toISOString()}];
  return ds.map(d=>{if(!valid(d.id))d.id=uuid();return d});
}
async function sync(){
  if(running)return;running=true;
  try{
    const d=readDB();
    if(!d.people.length){toast('Nenhum cadastro local para enviar.');return}
    let okP=0,failP=0,okD=0,failD=0,errors=[];
    const rows=[];
    for(const p of d.people){
      if(!valid(p.id))p.id=uuid();
      rows.push({id:p.id,nome:p.nome||'',nome_mae:p.mae||p.nomeMae||null,data_nascimento:date(p.nascimento),cpf:p.cpf||null,cartao_sus:p.sus||null,telefone:p.telefone||null,bairro:p.bairro||null,endereco:p.endereco||null,cep:p.cep||null,observacoes:p.observacoes||null,apelido:p.apelido||null,ponto_referencia:p.pontoReferencia||p.ponto_referencia||null,cidade_origem:p.cidadeOrigem||p.cidade_origem||null,nacionalidade:p.nacionalidade||null,raca_cor:p.racaCor||p.raca_cor||null,criado_em:p.criadoEm||null,atualizado_em:p.atualizadoEm||p.criadoEm||null});
    }
    try{await upsertMany('cidadaos',rows);okP=rows.length}catch(e){errors.push('Cidadãos: '+e.message);failP=rows.length}
    const demandas=[];
    for(const p of d.people){
      if(!valid(p.id))continue;
      for(const x of getDemandas(p)){
        demandas.push({id:x.id,cidadao_id:p.id,descricao:x.demanda||'',tipo:x.tipoDemanda||x.tipo||'Outro',procedimento:x.procedimento||null,status:['Pendente','Em andamento','Concluído'].includes(x.status)?x.status:'Pendente',observacoes:x.observacoes||null,prioridade:['Baixa','Normal','Alta','Urgente'].includes(x.prioridade)?x.prioridade:'Normal',responsavel:x.responsavel||null,prazo:date(x.prazo),encaminhamento:x.encaminhamento||null,retorno:x.retorno||null,secretaria:x.secretaria||null,anexos:Array.isArray(x.anexos)?x.anexos:[],atualizado_em:x.atualizadoEm||x.criadoEm||new Date().toISOString(),concluido_em:x.concluidoEm||null,protocolo:x.protocolo||null,destino_envio:x.destinoEnvio||p.destinoEnvio||null,data_saida:date(x.dataSaida||p.dataSaida)});
      }
    }
    for(const x of demandas){try{await upsertMany('demandas',[x]);okD++}catch(e){failD++;errors.push('Demanda '+x.id+': '+e.message)}}
    writeDB(d);
    if(errors.length)console.error('[Gabinete LM] Falhas no resgate:',errors);
    if(failP||failD)toast('⚠️ Resgate parcial: '+okP+' cidadãos e '+okD+' demandas enviados. '+(failP+failD)+' falharam. Dados locais preservados.');
    else toast('✓ Resgate concluído: '+okP+' cidadãos e '+okD+' demandas enviados.');
  }catch(e){console.error('[Gabinete LM] Resgate:',e);toast('⚠️ Resgate não concluído: '+e.message)}
  finally{running=false}
}
window.GabineteDB=window.GabineteDB||{};window.GabineteDB.sincronizarResgate=sync;
})();