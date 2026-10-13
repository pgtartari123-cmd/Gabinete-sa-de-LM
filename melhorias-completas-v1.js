/* Gabinete Lene Martins — melhorias integradas: cadastro eleitoral, agenda por responsável e impressão segura */
(function(){
'use strict';
var KEY='gabineteDigitalDemo';
function read(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(e){return{people:[],agenda:[]}}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function field(name,label,placeholder){var wrap=document.createElement('div');wrap.className='campo';var lab=document.createElement('label');lab.textContent=label;var input=document.createElement('input');input.name=name;input.placeholder=placeholder||'';input.autocomplete='off';wrap.appendChild(lab);wrap.appendChild(input);return wrap}
function addFields(){
 var form=document.getElementById('formCadastro');
 if(form&&!form.elements.zonaEleitoral){
  var zone=field('zonaEleitoral','Zona eleitoral','Ex.: 001');
  var section=field('secaoEleitoral','Seção eleitoral','Ex.: 0123');
  var cep=form.elements.cep;
  var anchor=cep&&cep.closest('.campo');
  if(anchor&&anchor.parentNode){anchor.insertAdjacentElement('afterend',section);anchor.insertAdjacentElement('afterend',zone)}
 }
 var agenda=document.getElementById('formAgenda');
 if(agenda&&!agenda.elements.responsavel){
  var wrap=document.createElement('div');wrap.className='campo';
  wrap.innerHTML='<label>Responsável pelo compromisso</label><select name="responsavel"><option value="">Não definido</option><option>Vereadora Lene Martins</option><option>Marido</option><option>Assessor</option><option>Equipe do gabinete</option><option>Outro</option></select>';
  var tipo=agenda.elements.tipo;
  if(tipo&&tipo.closest('.campo'))tipo.closest('.campo').insertAdjacentElement('afterend',wrap);
  else agenda.querySelector('.form-grid').appendChild(wrap);
 }
}
function addTab(){
 var nav=document.querySelector('.menu'),main=document.querySelector('main');
 if(nav&&!nav.querySelector('[data-melhoria-eleitoral]')){
  var b=document.createElement('button');b.type='button';b.setAttribute('data-melhoria-eleitoral','1');b.textContent='🗳️ Mapa eleitoral';b.onclick=function(){window.mostrarAba('mapaEleitoralGabinete')};nav.appendChild(b);
 }
 if(main&&!document.getElementById('mapaEleitoralGabinete')){
  var sec=document.createElement('section');sec.id='mapaEleitoralGabinete';sec.className='tab';
  sec.innerHTML='<div class="titulo-aba"><div><span class="eyebrow">ORGANIZAÇÃO TERRITORIAL</span><h2>Mapa eleitoral</h2></div><button type="button" class="btn-secundario" id="melPrintEleitoral">🖨️ Imprimir / PDF</button></div><div class="card" style="padding:14px;margin-bottom:14px"><p style="margin-top:0">Organize os cadastros por zona, seção e bairro usando os dados informados no cadastro. Os campos são opcionais e não consultam nem importam dados pessoais do TSE.</p><div class="filtros"><input id="melBuscaEleitoral" type="search" placeholder="🔎 Buscar nome ou telefone"><input id="melZonaEleitoral" type="search" placeholder="Zona eleitoral"><input id="melSecaoEleitoral" type="search" placeholder="Seção eleitoral"><input id="melBairroEleitoral" type="search" placeholder="Bairro / comunidade"></div><div id="melResumoEleitoral" aria-live="polite"></div></div><div id="melListaEleitoral"></div>';
  main.appendChild(sec);
 }
}
function renderMap(){
 var box=document.getElementById('melListaEleitoral');if(!box)return;
 var d=read(),q=(document.getElementById('melBuscaEleitoral').value||'').toLowerCase().trim(),z=(document.getElementById('melZonaEleitoral').value||'').trim(),s=(document.getElementById('melSecaoEleitoral').value||'').trim(),b=(document.getElementById('melBairroEleitoral').value||'').toLowerCase().trim();
 var rows=d.people.filter(function(p){return(!q||[p.nome,p.telefone,p.cpf].join(' ').toLowerCase().indexOf(q)>=0)&&(!z||String(p.zonaEleitoral||'').toLowerCase().indexOf(z.toLowerCase())>=0)&&(!s||String(p.secaoEleitoral||'').toLowerCase().indexOf(s.toLowerCase())>=0)&&(!b||String(p.bairro||'').toLowerCase().indexOf(b)>=0)});
 rows.sort(function(a,b){return String(a.zonaEleitoral||'').localeCompare(String(b.zonaEleitoral||''),'pt-BR',{numeric:true})||String(a.secaoEleitoral||'').localeCompare(String(b.secaoEleitoral||''),'pt-BR',{numeric:true})||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR')});
 var resumo=document.getElementById('melResumoEleitoral');if(resumo)resumo.innerHTML='<strong>'+rows.length+'</strong> cadastro(s) encontrados • '+rows.filter(function(p){return p.zonaEleitoral||p.secaoEleitoral}).length+' com informação eleitoral';
 box.innerHTML=rows.length?'<div class="card mel-eleitoral-print"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:9px">Nome</th><th style="text-align:left;padding:9px">Zona</th><th style="text-align:left;padding:9px">Seção</th><th style="text-align:left;padding:9px">Bairro</th><th style="text-align:left;padding:9px">Contato</th></tr></thead><tbody>'+rows.map(function(p){return'<tr><td style="padding:9px;border-top:1px solid #eee">'+esc(p.nome||'')+'</td><td style="padding:9px;border-top:1px solid #eee">'+esc(p.zonaEleitoral||'—')+'</td><td style="padding:9px;border-top:1px solid #eee">'+esc(p.secaoEleitoral||'—')+'</td><td style="padding:9px;border-top:1px solid #eee">'+esc(p.bairro||'—')+'</td><td style="padding:9px;border-top:1px solid #eee">'+esc(p.telefone||'—')+'</td></tr>'}).join('')+'</tbody></table></div></div>':'<div class="card vazio">Nenhum cadastro corresponde aos filtros. Preencha zona e seção no cadastro do cidadão quando essa informação estiver disponível.</div>';
}
function addStyles(){
 if(document.getElementById('melhoriaCompletaStyle'))return;
 var st=document.createElement('style');st.id='melhoriaCompletaStyle';st.textContent='#mapaEleitoralGabinete .filtros{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}#mapaEleitoralGabinete th{background:#fff7fb}@media(max-width:700px){#mapaEleitoralGabinete .filtros{grid-template-columns:1fr 1fr}}@media print{body.mel-print-eleitoral>*{display:none!important}body.mel-print-eleitoral #mapaEleitoralGabinete,body.mel-print-eleitoral #mapaEleitoralGabinete *{visibility:visible!important}body.mel-print-eleitoral #mapaEleitoralGabinete{display:block!important;position:absolute;left:0;top:0;width:100%;padding:10mm;box-sizing:border-box;background:#fff}body.mel-print-eleitoral #mapaEleitoralGabinete .titulo-aba button,body.mel-print-eleitoral #mapaEleitoralGabinete .card:not(.mel-eleitoral-print),body.mel-print-eleitoral #mapaEleitoralGabinete .filtros{display:none!important}body.mel-print-eleitoral #mapaEleitoralGabinete table{font-size:10pt}}';document.head.appendChild(st);
}
function hook(){
 addFields();addTab();addStyles();
 ['melBuscaEleitoral','melZonaEleitoral','melSecaoEleitoral','melBairroEleitoral'].forEach(function(id){var el=document.getElementById(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('input',renderMap)}});
 var print=document.getElementById('melPrintEleitoral');if(print&&!print.dataset.bound){print.dataset.bound='1';print.addEventListener('click',function(){renderMap();document.body.classList.add('mel-print-eleitoral');var cleanup=function(){document.body.classList.remove('mel-print-eleitoral');window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup);window.print()})}
 var old=window.renderAgenda;
 if(typeof old==='function'&&!window.__melAgendaOwnerHook){window.__melAgendaOwnerHook=true;window.renderAgenda=function(){old.apply(this,arguments);var d=read(),a=d.agenda.slice().sort(function(x,y){return(String(x.data||'')+String(x.hora||'')).localeCompare(String(y.data||'')+String(y.hora||''))});var cards=document.querySelectorAll('#listaAgenda>.card');cards.forEach(function(card,i){var item=a[i];if(!item||!item.responsavel||card.querySelector('.mel-responsavel'))return;var p=document.createElement('p');p.className='mel-responsavel';p.innerHTML='<strong>Responsável:</strong> '+esc(item.responsavel);var status=Array.from(card.querySelectorAll('p')).find(function(x){return x.textContent.indexOf('Status:')>=0});card.insertBefore(p,status||null)})}}
 var form=document.getElementById('formCadastro');if(form&&!form.dataset.melSubmitHook){form.dataset.melSubmitHook='1';form.addEventListener('submit',function(){setTimeout(renderMap,500)})}
 var ag=document.getElementById('formAgenda');if(ag&&!ag.dataset.melAgendaHook){ag.dataset.melAgendaHook='1';ag.addEventListener('submit',function(){setTimeout(function(){if(window.renderAgenda)window.renderAgenda()},100)})}
 renderMap();
}
document.addEventListener('DOMContentLoaded',function(){hook();setInterval(function(){addFields();addTab();if(document.getElementById('mapaEleitoralGabinete')&&!document.getElementById('melBuscaEleitoral').dataset.bound)hook()},1200)},{once:true});
})();
