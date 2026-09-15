/* GABINETE LM — ROTEAMENTO RETROATIVO v1
   Corrige cadastros antigos que já possuem "Enviado para" no cadastro,
   mas ficaram sem o destino dentro da demanda. Não apaga nem duplica registros.
*/
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const DESTS=['Carlos Vinicius','Cilene Couto','Secretaria de Saúde (Concórdia)','Outro'];
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(_){return{people:[],agenda:[]}}};
const norm=v=>String(v??'').trim();
function legado(p){
  const keys=['destinoEnvio','enviadoPara','destino','encaminhadoPara','enviado_para','destino_envio','responsavelDestino','destinatario'];
  for(const k of keys){const v=norm(p?.[k]);if(v)return v}
  return '';
}
function corrigir(){
  const d=read(); let mudou=false, corrigidos=0;
  d.people.forEach(p=>{
    const pessoaDest=legado(p);
    const ds=Array.isArray(p.demandas)?p.demandas:[];
    // Se o destino já estiver na demanda, ele é preservado.
    // Se estiver apenas no cadastro antigo, espelhamos para a demanda.
    ds.forEach(x=>{
      if(!norm(x.destinoEnvio) && pessoaDest){x.destinoEnvio=pessoaDest;mudou=true;corrigidos++}
    });
    // Cadastros antigos que têm somente os campos planos continuam compatíveis.
    if(pessoaDest && !norm(p.destinoEnvio)){p.destinoEnvio=pessoaDest;mudou=true}
    // Se não havia destino no cadastro, mas as demandas já têm, não alteramos as demandas.
    if(!norm(p.destinoEnvio) && ds.length){
      const primeiro=ds.find(x=>norm(x.destinoEnvio));
      if(primeiro){p.destinoEnvio=norm(primeiro.destinoEnvio);mudou=true}
    }
  });
  if(mudou){localStorage.setItem(KEY,JSON.stringify(d));
    window.render?.();window.renderDemandas?.();window.atualizarPainel?.();
    setTimeout(()=>window.GabineteDB?.sincronizar?.(),60);
  }
  return {mudou,corrigidos,total:d.people.length};
}
window.GabineteLM_RoteamentoRetroativo={corrigir};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(corrigir,250));else setTimeout(corrigir,250);
setInterval(corrigir,4000);
})();
