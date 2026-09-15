/* GABINETE LM — ROTEAMENTO RETROATIVO v3
   Atualiza demandas antigas confirmadas pelo gabinete.
   Não apaga nem duplica registros. Preserva dados já preenchidos quando não há
   uma correção explicitamente definida abaixo.
*/
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const DEST_SAUDE='Secretaria de Saúde (Concórdia)';
const ATUALIZACOES={
  'marcenilde':{demanda:'Tomografia coluna cervical e coluna lombar',tipo:'Saúde',destino:DEST_SAUDE},
  'edvan':{demanda:'Tomografia lombo-sacra',tipo:'Saúde',destino:DEST_SAUDE},
  'victor':{demanda:'Tomografia das mastoides',tipo:'Saúde',destino:DEST_SAUDE},
  'tenivaldo':{demanda:'Tomografia coluna cervical',tipo:'Saúde',destino:DEST_SAUDE},
  'leigiel':{demanda:'Tomografia lombo-sacra e cervical',tipo:'Saúde',destino:DEST_SAUDE},
  'legiel':{demanda:'Tomografia lombo-sacra e cervical',tipo:'Saúde',destino:DEST_SAUDE},
  'joel':{demanda:'Tomografia lombo-sacra',tipo:'Saúde',destino:DEST_SAUDE},
  'tainara':{demanda:'Endoscopia digestivo alta',tipo:'Saúde',destino:DEST_SAUDE}
};
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(_){return{people:[],agenda:[]}}};
const norm=v=>String(v??'').trim();
const key=v=>norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
function legado(p){for(const k of ['destinoEnvio','enviadoPara','destino','encaminhadoPara','enviado_para','destino_envio','responsavelDestino','destinatario']){const v=norm(p?.[k]);if(v)return v}return ''}
function destinoAutomatico(d,p){const texto=[d?.demanda,d?.descricao,d?.procedimento,d?.tipoDemanda,d?.tipo,p?.demanda,p?.procedimento].map(norm).join(' ').toLowerCase();if(/\btomografia\b/.test(texto)||/\bendoscopia\b/.test(texto))return DEST_SAUDE;return ''}
function aplicarAtualizacao(p,u){
  let mudou=false;
  let ds=Array.isArray(p.demandas)?p.demandas:[];
  if(!ds.length){
    const id=(crypto?.randomUUID?crypto.randomUUID():Date.now().toString());
    ds=[{id,demanda:u.demanda,tipoDemanda:u.tipo,tipo:u.tipo,procedimento:'',status:p.status||'Pendente',destinoEnvio:u.destino,criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()}];
    p.demandas=ds;mudou=true;
  }else{
    // Atualiza a demanda principal/mais recente que estava sem informação.
    let alvo=ds[ds.length-1];
    const semInfo=x=>!norm(x.demanda||x.descricao)&&!norm(x.procedimento);
    const vazio=ds.find(semInfo); if(vazio)alvo=vazio;
    if(norm(alvo.demanda)!==u.demanda){alvo.demanda=u.demanda;mudou=true}
    if(norm(alvo.descricao)!==u.demanda){alvo.descricao=u.demanda;mudou=true}
    if(norm(alvo.tipoDemanda)!==u.tipo){alvo.tipoDemanda=u.tipo;mudou=true}
    if(norm(alvo.tipo)!==u.tipo){alvo.tipo=u.tipo;mudou=true}
    if(norm(alvo.destinoEnvio)!==u.destino){alvo.destinoEnvio=u.destino;mudou=true}
    alvo.atualizadoEm=new Date().toISOString();
  }
  const last=p.demandas[p.demandas.length-1];
  if(norm(p.demanda)!==u.demanda){p.demanda=u.demanda;mudou=true}
  if(norm(p.tipoDemanda)!==u.tipo){p.tipoDemanda=u.tipo;mudou=true}
  if(norm(p.tipo)!==u.tipo){p.tipo=u.tipo;mudou=true}
  if(norm(p.destinoEnvio)!==u.destino){p.destinoEnvio=u.destino;mudou=true}
  if(mudou)p.atualizadoEm=new Date().toISOString();
  return mudou;
}
function corrigir(){
  const d=read();let mudou=false,atualizados=[];
  d.people.forEach(p=>{
    const u=ATUALIZACOES[key(p.nome)];
    if(u&&aplicarAtualizacao(p,u)){mudou=true;atualizados.push(p.nome)}
    else{
      const ds=Array.isArray(p.demandas)?p.demandas:[];
      const pessoaDest=legado(p);
      ds.forEach(x=>{if(!norm(x.destinoEnvio)){const auto=destinoAutomatico(x,p);if(auto||pessoaDest){x.destinoEnvio=auto||pessoaDest;mudou=true}}});
    }
  });
  if(mudou){localStorage.setItem(KEY,JSON.stringify(d));window.render?.();window.renderDemandas?.();window.atualizarPainel?.();setTimeout(()=>window.GabineteDB?.sincronizar?.(),60)}
  return {mudou,atualizados,total:d.people.length};
}
window.GabineteLM_RoteamentoRetroativo={corrigir};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(corrigir,300));else setTimeout(corrigir,300);
// Uma execução periódica leve apenas para pegar dados locais recém-chegados de outro dispositivo.
setInterval(corrigir,5000);
})();
