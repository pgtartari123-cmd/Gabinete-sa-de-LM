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

/* GABINETE LM — RESGATE: usar UMA única rotina.
   O arquivo sync-resgate-v1.js contém a rotina definitiva que envia
   cidadãos e demandas com o mesmo mapeamento usado pelo banco principal.
   Este arquivo não faz outro POST e não sobrescreve o resgate com um
   mapeamento diferente de colunas.
*/
(function(){
'use strict';
function rotinaUnica(){
  const r=window.GabineteDB?.sincronizarResgate;
  if(typeof r!=='function'){
    const msg='Rotina de resgate ainda não carregada. Aguarde a página terminar de carregar e tente novamente.';
    const t=document.getElementById('gabineteToast');
    if(t){t.textContent='❌ '+msg;t.style.display='block';}else alert('❌ '+msg);
    return Promise.resolve(null);
  }
  return r();
}
window.GabineteDB=window.GabineteDB||{};
window.GabineteDB.resgatarTudo=rotinaUnica;
window.GabineteDB.resgatarDemandas=rotinaUnica;
})();

/* Botão manual de diagnóstico — usa a mesma rotina única e não apaga nada. */
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
    }catch(e){console.error('[Gabinete LM] diagnóstico:',e);toast('❌ Não foi possível concluir.\n\nOs dados locais foram preservados.');}
    finally{b.dataset.busy='0';b.disabled=false;b.textContent='🔄 Sincronizar agora'}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
setTimeout(instalar,1000);setTimeout(instalar,3000);
})();