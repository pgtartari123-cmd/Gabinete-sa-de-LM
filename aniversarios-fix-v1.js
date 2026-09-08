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