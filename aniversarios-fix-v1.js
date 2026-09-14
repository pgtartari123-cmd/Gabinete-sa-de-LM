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