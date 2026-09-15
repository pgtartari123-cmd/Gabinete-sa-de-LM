/* GABINETE LM — ROTEAMENTO RETROATIVO v2
   Corrige o destino de demandas antigas e aplica regras automáticas de encaminhamento.
   Regra: Tomografia e Endoscopia -> Secretaria de Saúde (Concórdia).
   Não apaga nem duplica registros e nunca sobrescreve um destino já informado.
*/
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const DEST_SAUDE='Secretaria de Saúde (Concórdia)';
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(_){return{people:[],agenda:[]}}};
const norm=v=>String(v??'').trim();
function legado(p){
  const keys=['destinoEnvio','enviadoPara','destino','encaminhadoPara','enviado_para','destino_envio','responsavelDestino','destinatario'];
  for(const k of keys){const v=norm(p?.[k]);if(v)return v}
  return '';
}
function destinoAutomatico(d,p){
  const texto=[d?.demanda,d?.descricao,d?.procedimento,d?.tipoDemanda,d?.tipo,p?.demanda,p?.procedimento].map(norm).join(' ').toLowerCase();
  if(/\btomografia\b/.test(texto)||/\bendoscopia\b/.test(texto))return DEST_SAUDE;
  return '';
}
function corrigir(){
  const d=read(); let mudou=false, corrigidos=0;
  d.people.forEach(p=>{
    const pessoaDest=legado(p);
    const ds=Array.isArray(p.demandas)?p.demandas:[];

    // Demandas estruturadas: preserva o destino já informado.
    ds.forEach(x=>{
      if(!norm(x.destinoEnvio)){
        const automatico=destinoAutomatico(x,p);
        const destino=automatico||pessoaDest;
        if(destino){x.destinoEnvio=destino;mudou=true;corrigidos++}
      }
    });

    // Compatibilidade com cadastros antigos que ainda guardam a demanda no próprio cidadão.
    const destinoPessoaAutomatico=destinoAutomatico(p,p);
    if(!norm(p.destinoEnvio)&&(destinoPessoaAutomatico||pessoaDest)){
      p.destinoEnvio=destinoPessoaAutomatico||pessoaDest;
      mudou=true;corrigidos++;
    }

    // Se a demanda já possui destino, replica para o campo legado do cidadão quando vazio.
    if(!norm(p.destinoEnvio)&&ds.length){
      const primeiro=ds.find(x=>norm(x.destinoEnvio));
      if(primeiro){p.destinoEnvio=norm(primeiro.destinoEnvio);mudou=true}
    }
  });

  if(mudou){
    localStorage.setItem(KEY,JSON.stringify(d));
    window.render?.();window.renderDemandas?.();window.atualizarPainel?.();
    setTimeout(()=>window.GabineteDB?.sincronizar?.(),60);
  }
  return {mudou,corrigidos,total:d.people.length};
}
window.GabineteLM_RoteamentoRetroativo={corrigir,destinoAutomatico};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(corrigir,250));else setTimeout(corrigir,250);
setInterval(corrigir,4000);
})();
