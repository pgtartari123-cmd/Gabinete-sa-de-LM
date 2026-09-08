/* GABINETE LM — correção da exibição de aniversários v1
   A data exibida é sempre a data de nascimento original cadastrada.
   O ano não é substituído pelo próximo ano.
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
window.renderBirthdays=function(){
  const c=document.getElementById('listaAniversarios');
  if(!c)return;
  const b=(typeof db!=='undefined'?db.people:[]).map(p=>({person:p,date:proximaData(p)})).filter(x=>x.date).sort((a,b)=>a.date-b.date);
  c.innerHTML=b.map(x=>`<div class="card"><h3>🎂 ${typeof esc==='function'?esc(x.person.nome):String(x.person.nome||'')}</h3><p>Aniversário: ${fmtNascimento(x.person.nascimento)}</p>${x.person.telefone?`<button type="button" onclick="wa('${typeof esc==='function'?esc(x.person.telefone):x.person.telefone}','Parabéns, ${typeof esc==='function'?esc(x.person.nome):String(x.person.nome||'')}! 🎉 Desejamos muita saúde, felicidade e um excelente novo ciclo!')">Enviar felicitações pelo WhatsApp</button>`:''}</div>`).join('')||'<div class="card vazio"><h3>Nenhum aniversário cadastrado</h3><p>Cadastre a data de nascimento dos cidadãos para aparecerem aqui.</p></div>';
};
if(document.readyState!=='loading')window.renderBirthdays();else document.addEventListener('DOMContentLoaded',()=>window.renderBirthdays());
})();