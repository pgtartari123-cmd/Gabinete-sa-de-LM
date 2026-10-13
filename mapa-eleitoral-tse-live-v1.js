/* Consulta integrada dos resultados oficiais do TSE — Gabinete Lene Martins.
   Busca os arquivos públicos JSON do TSE diretamente. Não modifica os cadastros.
*/
(function(){
'use strict';
const BASE='https://resultados.tse.jus.br';
const $=id=>document.getElementById(id);
const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UF=[['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
let elections=[],municipalities=[],lastResult=null;
async function getJSON(url){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const target=url+(url.includes('?')?'&':'?')+'_gabinete_t='+Date.now()+'_'+attempt;
   const r=await fetch(target,{cache:'no-store',headers:{Accept:'application/json'}});
   if(!r.ok)throw Error('TSE respondeu HTTP '+r.status);
   return await r.json();
  }catch(err){
   last=err;
   if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));
  }
 }
 throw Error((last?.message||'Falha na consulta')+' após 3 tentativas. O servidor público do TSE pode estar temporariamente indisponível. Tente novamente em alguns minutos.');
}
function allElections(config){const out=[];(config.pl||[]).forEach(pl=>(pl.e||[]).forEach(e=>out.push({...e,cycle:pl.c,pleito:pl.cd,pleitoDate:pl.dt})));return out}
function displayElection(e){return e.nm||('Eleição '+e.cd+' — turno '+e.t)}
function selectedElection(){return elections.find(e=>String(e.cd)===$('tseLiveEleicao')?.value)}
function relatedElections(e){return elections.filter(x=>x.cycle===e.cycle&&String(x.t)===String(e.t)&&/eleicao ordinaria/i.test(x.nm||''))}
function inject(){
 const section=$('mapaEleitoralGabinete');if(!section||$('tseLivePanel'))return;
 const panel=document.createElement('div');panel.id='tseLivePanel';panel.className='card';panel.style.cssText='padding:16px;margin:14px 0';
 panel.innerHTML='<h3>🔴 Consulta integrada ao TSE</h3><p>Consulta os arquivos oficiais publicados pelo Tribunal Superior Eleitoral. Escolha a eleição e o local, depois pesquise pelo cargo ou candidato. Os dados são carregados do TSE, não de uma planilha manual.</p><div class="form-grid">'+
 '<div class="campo"><label>Ano da eleição</label><select id="tseLiveAno"><option>Carregando…</option></select></div>'+
 '<div class="campo"><label>Eleição / turno</label><select id="tseLiveEleicao" disabled><option>Carregando…</option></select></div>'+
 '<div class="campo"><label>Estado</label><select id="tseLiveUF">'+UF.map(x=>'<option value="'+x[0].toLowerCase()+'" '+(x[0]==='PA'?'selected':'')+'>'+x[1]+' ('+x[0]+')</option>').join('')+'</select></div>'+
 '<div class="campo"><label>Pesquisar cidade</label><input id="tseLiveBuscaMunicipio" placeholder="Digite o nome do município" autocomplete="off"></div>'+ 
 '<div class="campo"><label>Município</label><select id="tseLiveMunicipio" disabled><option>Carregando…</option></select></div>'+
 '<div class="campo"><label>Zona eleitoral (opcional)</label><input id="tseLiveZona" inputmode="numeric" placeholder="Ex.: 015"></div>'+
 '<div class="campo"><label>Seção (opcional)</label><input id="tseLiveSecao" inputmode="numeric" placeholder="Ex.: 0209"></div>'+
 '<div class="campo"><label>Cargo</label><select id="tseLiveCargo" disabled><option>Selecione a eleição</option></select></div>'+
 '<div class="campo"><label>Nome ou número do candidato</label><input id="tseLiveCandidato" placeholder="Digite para filtrar"></div></div>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button type="button" id="tseLiveConsultar">🔎 Consultar votos oficiais</button><button type="button" id="tseLiveAbrirTSE" class="btn-secundario">Abrir portal oficial do TSE ↗</button></div>'+
 '<div id="tseLiveStatus" aria-live="polite" style="padding:8px 0"></div><div id="tseLiveResultado"></div><p style="font-size:12px;color:#666">Fonte: resultados.tse.jus.br. A consulta por município/zona usa a totalização oficial. A seção eleitoral é um nível diferente: quando informada, o sistema vai consultar o boletim de urna da seção se o arquivo oficial estiver disponível; não confunde votos da zona com votos de uma seção.</p>';
 section.insertBefore(panel,section.firstChild);
 $('tseLiveAno').addEventListener('change',()=>{renderElections();loadMunicipalities().then(loadOffices).catch(showError)});
 $('tseLiveEleicao').addEventListener('change',()=>{loadMunicipalities().then(loadOffices).catch(showError)});
 $('tseLiveUF').addEventListener('change',()=>loadMunicipalities().catch(showError));
 $('tseLiveBuscaMunicipio').addEventListener('input',filterMunicipalities);
 $('tseLiveConsultar').addEventListener('click',queryResults);
 $('tseLiveCandidato').addEventListener('input',()=>{if(lastResult)renderResult(lastResult)});
 $('tseLiveAbrirTSE').addEventListener('click',()=>window.open('https://resultados.tse.jus.br/oficial/app/index.html','_blank','noopener'));
 boot();
}
function setStatus(s){const e=$('tseLiveStatus');if(e)e.textContent=s}
function showError(e){setStatus('Não foi possível consultar o TSE: '+(e?.message||e)+'. Confira sua conexão e tente novamente.')}
async function boot(){
 try{
 setStatus('Conectando aos arquivos oficiais do TSE…');
 const cfg=await getJSON(BASE+'/oficial/comum/config/ele-c.json');
 elections=allElections(cfg).filter(e=>e.cycle&&e.cd&&e.nm);
 const years=[...new Set(elections.map(e=>String(e.cycle).replace('ele','')))].sort((a,b)=>Number(b)-Number(a));
 $('tseLiveAno').innerHTML=years.map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
 const defaultYear=years.includes('2026')?'2026':years[0];$('tseLiveAno').value=defaultYear;
 renderElections();await loadMunicipalities();await loadOffices();
 setStatus('Conexão com a configuração oficial do TSE concluída. Escolha os filtros e consulte.');
 }catch(e){showError(e)}
}
function renderElections(){
 const year=$('tseLiveAno').value;
 const list=elections.filter(e=>{
  if(String(e.cycle).replace('ele','')!==year)return false;
  const name=norm(e.nm||'');
  if(year==='2026')return /eleicao ordinaria/.test(name)&&(/federal/.test(name)||/estadual/.test(name)||/municipal/.test(name));
  return /eleicao ordinaria/.test(name);
 });
 $('tseLiveEleicao').innerHTML=list.map(e=>'<option value="'+esc(e.cd)+'">'+esc(displayElection(e))+'</option>').join('');
 $('tseLiveEleicao').disabled=!list.length;
 const preferred=list.find(e=>String(e.t)==='1'&&/eleicao ordinaria estadual/i.test(e.nm))||list.find(e=>String(e.t)==='1'&&/eleicao ordinaria municipal/i.test(e.nm))||list[0];
 if(preferred)$('tseLiveEleicao').value=String(preferred.cd);
}
async function loadMunicipalities(){
 const e=selectedElection();if(!e)return;
 const uf=$('tseLiveUF').value;
 $('tseLiveMunicipio').disabled=true;$('tseLiveMunicipio').innerHTML='<option>Carregando municípios do TSE…</option>';
 const code=String(e.cd).padStart(6,'0');
 const electionDir='e'+String(e.cd).padStart(6,'0');
 const data=await getJSON(BASE+'/oficial/'+e.cycle+'/'+e.cd+'/config/mun-'+electionDir+'-cm.json');
 municipalities=(data.abr||[]).find(a=>String(a.cd).toLowerCase()===uf)?.mu||[];
 const opts=municipalities.slice().sort((a,b)=>String(a.nm).localeCompare(String(b.nm),'pt-BR'));
 $('tseLiveMunicipio').innerHTML=opts.map(m=>'<option value="'+esc(String(m.cd).padStart(5,'0'))+'">'+esc(m.nm)+'</option>').join('');
 $('tseLiveMunicipio').disabled=!opts.length;
 const conc=opts.find(m=>norm(m.nm)==='concordia do para');if(conc)$('tseLiveMunicipio').value=String(conc.cd).padStart(5,'0');
 if(!opts.length)$('tseLiveMunicipio').innerHTML='<option value="">Nenhum município listado para esta eleição/UF</option>';
 $('tseLiveBuscaMunicipio').value='';
}
function filterMunicipalities(){
 const q=norm($('tseLiveBuscaMunicipio')?.value||'');
 const select=$('tseLiveMunicipio');
 const filtered=municipalities.filter(m=>!q||norm(m.nm).includes(q));
 const previous=select.value;
 select.innerHTML=filtered.map(m=>'<option value="'+esc(String(m.cd).padStart(5,'0'))+'">'+esc(m.nm)+'</option>').join('');
 if(!filtered.length){select.innerHTML='<option value="">Nenhuma cidade encontrada</option>';select.disabled=true;return;}
 select.disabled=false;
 if(filtered.some(m=>String(m.cd).padStart(5,'0')===previous))select.value=previous;
}
function loadOffices(){
 const e=selectedElection();if(!e)return;
 const uf=$('tseLiveUF').value, related=relatedElections(e), options=[];
 related.forEach(ev=>{
  const abr=(ev.abr||[]).find(a=>String(a.cd).toLowerCase()===uf)||(ev.abr||[]).find(a=>String(a.cd).toLowerCase()==='br')||(ev.abr||[])[0];
  (abr?.cp||[]).forEach(cp=>{const key=String(cp.cd)+'|'+String(ev.cd);if(!options.some(o=>o.key===key))options.push({key,ds:cp.ds,ev});});
 });
 const order={'Presidente':1,'Governador':2,'Senador':3,'Deputado Federal':4,'Deputado Estadual':5,'Deputado Distrital':6,'Prefeito':7,'Vereador':8};
 options.sort((a,b)=>(order[a.ds]||99)-(order[b.ds]||99));
 $('tseLiveCargo').innerHTML=options.map(o=>'<option value="'+esc(o.key)+'">'+esc(o.ds)+' — '+esc(o.ev.nm||'eleição')+'</option>').join('');
 $('tseLiveCargo').disabled=!options.length;
}
function makeResultURL(e,uf,mun,zone,cargo){
 const z=String(zone||'').replace(/\D/g,'');
 const zonePart=z?'-z'+z.padStart(4,'0'):'';
 const electionDir='e'+String(e.cd).padStart(6,'0');
 return BASE+'/oficial/'+e.cycle+'/'+e.cd+'/dados/'+uf+'/'+uf+String(mun).padStart(5,'0')+zonePart+'-c'+String(cargo).padStart(4,'0')+'-'+electionDir+'-u.json';
}
async function queryResults(){
 const e=selectedElection(),uf=$('tseLiveUF').value,mun=$('tseLiveMunicipio').value,cargoSelection=$('tseLiveCargo').value.split('|'),cargo=cargoSelection[0],resultElection=elections.find(x=>String(x.cd)===cargoSelection[1])||e;
 if(!e||!mun||!cargo){setStatus('Selecione eleição, estado, município e cargo.');return}
 const zone=$('tseLiveZona').value.trim(),section=$('tseLiveSecao').value.trim();
 const btn=$('tseLiveConsultar');btn.disabled=true;setStatus('Consultando resultado oficial no TSE…');$('tseLiveResultado').innerHTML='';
 try{
  let sectionUnavailable=false;
  if(section){
   setStatus('Consultando o boletim de urna da seção '+section+'…');
   try{await querySection(resultElection,uf,mun,zone,section,cargo);return}
   catch(sectionError){sectionUnavailable=true;setStatus('O arquivo específico da seção não foi encontrado. Tentando consultar a totalização do município/zona…');}
  }
  const url=makeResultURL(resultElection,uf,mun,zone,cargo);
  const data=await getJSON(url);lastResult={data,url,e:resultElection,uf,mun,zone,cargo,section:''};renderResult(lastResult);
  const state=data.and==='f'?'Totalização finalizada':data.and==='p'?'Apuração parcial/em andamento':'Resultado oficial disponível';
  setStatus((sectionUnavailable?'⚠️ Não foi possível obter o boletim da seção '+section+'; exibindo a totalização do município/zona. ':'')+state+' • Arquivo atualizado em '+(data.dg||'data não informada')+' às '+(data.hg||'hora não informada')+'.');
 }catch(e){showError(e);$('tseLiveResultado').innerHTML='<p>Não foi possível obter esse arquivo para os filtros selecionados. Confira se o cargo existe nesse pleito e se há resultado publicado. Para anos históricos, os arquivos precisam ser importados do Portal de Dados Abertos do TSE, pois não seguem todos o mesmo formato da consulta ao vivo.</p>'}
 finally{btn.disabled=false}
}
function renderResult(state){
 const d=state.data, cargo=(d.carg||[]).find(c=>String(c.cd)===String(state.cargo))||(d.carg||[])[0];
 const q=norm($('tseLiveCandidato')?.value||'');
 if(!cargo){$('tseLiveResultado').innerHTML='<p>O arquivo oficial não trouxe dados para esse cargo.</p>';return}
 let candidates=[];
 (cargo.agr||[]).forEach(a=>(a.par||[]).forEach(p=>(p.cand||[]).forEach(c=>candidates.push({n:c.n,nm:c.nm||c.nmu||'',party:p.sg||'',votes:Number(c.vap||0),pct:c.pvap}))));
 (cargo.cand||[]).forEach(c=>candidates.push({n:c.n,nm:c.nm||c.nmu||'',party:'',votes:Number(c.vap||0),pct:c.pvap}));
 const unique=new Map();candidates.forEach(c=>unique.set(String(c.n)+'|'+norm(c.nm),c));candidates=[...unique.values()].filter(c=>!q||norm(c.nm).includes(q)||String(c.n).includes(q)||norm(c.party).includes(q)).sort((a,b)=>b.votes-a.votes);
 const se=d.s||{},el=d.e||{},vo=d.v||{},meta='<div class="painel-grid" style="grid-template-columns:repeat(auto-fit,minmax(135px,1fr))"><div class="card"><small>Votos computados</small><h3>'+Number(vo.tv||0).toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Comparecimento</small><h3>'+Number(el.c||0).toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Abstenções</small><h3>'+Number(el.a||0).toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Seções totalizadas / total</small><h3>'+Number(se.st||0).toLocaleString('pt-BR')+' / '+Number(se.ts||0).toLocaleString('pt-BR')+'</h3></div></div>';
 $('tseLiveResultado').innerHTML=meta+'<h4>Votação por candidato</h4><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Nº</th><th style="text-align:left;padding:8px">Candidato</th><th style="text-align:left;padding:8px">Partido</th><th style="text-align:right;padding:8px">Votos</th><th style="text-align:right;padding:8px">%</th></tr></thead><tbody>'+candidates.map(c=>'<tr><td style="padding:8px;border-top:1px solid #ddd">'+esc(c.n)+'</td><td style="padding:8px;border-top:1px solid #ddd">'+esc(c.nm)+'</td><td style="padding:8px;border-top:1px solid #ddd">'+esc(c.party||'—')+'</td><td style="padding:8px;text-align:right;border-top:1px solid #ddd"><strong>'+c.votes.toLocaleString('pt-BR')+'</strong></td><td style="padding:8px;text-align:right;border-top:1px solid #ddd">'+(Number.isFinite(Number(c.pct))?Number(c.pct).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%':'—')+'</td></tr>').join('')+'</tbody></table></div><p style="font-size:12px;color:#666">Arquivo consultado: <a href="'+esc(state.url)+'" target="_blank" rel="noopener">abrir JSON oficial do TSE</a></p>';
}
async function querySection(e,uf,mun,zone,section,cargo){
 const z=String(zone||'').replace(/\D/g,'');if(!z)throw Error('Para consultar uma seção, informe também a zona eleitoral.');
 const pleito=String(e.pleito||'').padStart(6,'0'),m=String(mun).padStart(5,'0'),zz=z.padStart(4,'0'),ss=String(section).replace(/\D/g,'').padStart(4,'0');
 const electionDir='e'+String(e.cd).padStart(6,'0');
 const url=BASE+'/oficial/'+e.cycle+'/arquivo-urna/'+pleito+'/config/'+uf+'/p'+pleito+'-'+uf+'-m'+m+'-z'+zz+'-s'+ss+'-aux.json';
 const aux=await getJSON(url);
 const files=(aux.hashes||[]).flatMap(h=>h.arq||[]).filter(a=>String(a.tp||'').toLowerCase().includes('bu')||String(a.nm||'').toLowerCase().includes('bu'));
 if(!files.length)throw Error('O TSE não disponibilizou um boletim de urna para essa seção, ou a seção ainda não foi totalizada.');
 const file=files[files.length-1];
 const fileURL=BASE+'/'+e.cycle+'/arquivo-urna/'+pleito+'/dados/'+uf+'/'+m+'/'+zz+'/'+ss+'/'+file.nm;
 setStatus('O TSE disponibilizou o arquivo oficial do boletim desta seção. A votação por seção está em formato técnico BU/ASN.1 e não pode ser interpretada como JSON comum. A consulta por município/zona já está integrada; a leitura direta do BU precisa de um decodificador específico. Arquivo localizado: '+file.nm);
 $('tseLiveResultado').innerHTML='<div class="card"><h4>Boletim de urna localizado</h4><p>Zona '+esc(z)+' • Seção '+esc(ss)+'</p><p>O TSE publicou o arquivo desta urna, mas ele usa o formato técnico do Boletim de Urna. Para não exibir números incorretos, este módulo ainda não interpreta esse arquivo por candidato.</p><p><a href="https://resultados.tse.jus.br/oficial/app/index.html" target="_blank" rel="noopener">Abrir consulta oficial do TSE</a> · <a href="'+esc(fileURL)+'" target="_blank" rel="noopener">Abrir arquivo de urna</a></p></div>';
}
document.addEventListener('DOMContentLoaded',()=>{inject();setInterval(inject,1000)});
})();