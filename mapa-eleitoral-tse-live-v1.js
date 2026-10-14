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
   if(!r.ok){const err=new Error('TSE respondeu HTTP '+r.status+' para '+url);err.status=r.status;throw err;}
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
function electionYear(e){const m=String(e.pleitoDate||'').match(/(\d{4})$/);return m?m[1]:String(e.cycle||'').replace(/^ele/,'')}
function selectedElection(){return elections.find(e=>String(e.cd)===$('tseLiveEleicao')?.value)}
function relatedElections(e){return elections.filter(x=>x.cycle===e.cycle&&String(x.t)===String(e.t)&&((e.sqele&&x.sqele===e.sqele)||String(x.cd)===String(e.cd)))}
function inject(){
 const section=$('mapaEleitoralGabinete');if(!section||$('tseLivePanel'))return;
 const panel=document.createElement('div');panel.id='tseLivePanel';panel.className='card';panel.style.cssText='padding:16px;margin:14px 0';
 panel.innerHTML='<h3>🔴 Consulta integrada ao TSE</h3><p>Consulta os arquivos oficiais publicados pelo Tribunal Superior Eleitoral. Escolha a eleição e o local, depois pesquise pelo cargo ou candidato. Os dados são carregados do TSE, não de uma planilha manual.</p><p style="font-size:13px">🔎 <strong>Eleições históricas:</strong> para anos anteriores que não aparecem na consulta ao vivo, use a aba de importação de resultados por CSV e obtenha os arquivos no <a href="https://dadosabertos.tse.jus.br/dataset/?groups=resultados" target="_blank" rel="noopener">Portal de Dados Abertos do TSE</a> ou consulte o <a href="https://www.tse.jus.br/eleicoes/resultados-eleicoes" target="_blank" rel="noopener">arquivo oficial de resultados eleitorais</a>. Alguns anos antigos têm dados incompletos.</p><div class="form-grid">'+
 '<div class="campo"><label>Ano da eleição</label><select id="tseLiveAno"><option>Carregando…</option></select></div>'+
 '<div class="campo"><label>Eleição / turno</label><select id="tseLiveEleicao" disabled><option>Carregando…</option></select></div>'+
 '<div class="campo"><label>Estado</label><select id="tseLiveUF">'+UF.map(x=>'<option value="'+x[0]+'" '+(x[0]==='PA'?'selected':'')+'>'+x[1]+' ('+x[0]+')</option>').join('')+'</select></div>'+
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
 const years=[...new Set(elections.map(electionYear))].sort((a,b)=>Number(b)-Number(a));
 $('tseLiveAno').innerHTML=years.map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
 const defaultYear=years.includes('2026')?'2026':years[0];$('tseLiveAno').value=defaultYear;
 renderElections();await loadMunicipalities();await loadOffices();
 setStatus('Conexão com a configuração oficial do TSE concluída. Escolha os filtros e consulte.');
 }catch(e){showError(e)}
}
function renderElections(){
 const year=$('tseLiveAno').value;
 const list=elections.filter(e=>electionYear(e)===year);
 // Não restringir o nome a “eleição ordinária”: o TSE pode rotular pleitos recentes como eleição geral ou por cargo.
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
 municipalities=(data.abr||[]).find(a=>String(a.cd).toUpperCase()===uf)?.mu||[];
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
  const abr=(ev.abr||[]).find(a=>String(a.cd).toUpperCase()===uf)||(ev.abr||[]).find(a=>String(a.cd).toLowerCase()==='br')||(ev.abr||[])[0];
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
 const state=String(uf||'').toLowerCase();
 return BASE+'/oficial/'+e.cycle+'/'+e.cd+'/dados/'+state+'/'+state+String(mun).padStart(5,'0')+zonePart+'-c'+String(cargo).padStart(4,'0')+'-'+electionDir+'-u.json';
}
async function queryResults(){
 const e=selectedElection(),uf=$('tseLiveUF').value,mun=$('tseLiveMunicipio').value,cargoSelection=$('tseLiveCargo').value.split('|'),cargo=cargoSelection[0],resultElection=elections.find(x=>String(x.cd)===cargoSelection[1])||e;
 if(!e||!mun||!cargo){setStatus('Selecione eleição, estado, município e cargo.');return}
 const zone=$('tseLiveZona').value.trim(),section=$('tseLiveSecao').value.trim();
 const btn=$('tseLiveConsultar');btn.disabled=true;setStatus('Consultando resultado oficial no TSE…');$('tseLiveResultado').innerHTML='';
 try{
  if(section){
   setStatus('Consultando o boletim de urna da seção '+section+'…');
   await querySection(resultElection,uf,mun,zone,section,cargo);
   return;
  }
  const url=makeResultURL(resultElection,uf,mun,zone,cargo);
  const data=await getJSON(url);lastResult={data,url,e:resultElection,uf,mun,zone,cargo,section:''};renderResult(lastResult);
  const state=data.and==='f'?'Totalização finalizada':data.and==='p'?'Apuração parcial/em andamento':'Resultado oficial disponível';
  setStatus(state+' • Arquivo atualizado em '+(data.dg||'data não informada')+' às '+(data.hg||'hora não informada')+'.');
 }catch(e){showError(e);$('tseLiveResultado').innerHTML='<p>Não foi possível concluir a pesquisa com essa combinação de filtros. Confira ano, eleição/turno, estado, município e cargo. Se informou seção, confirme também a zona eleitoral. Em anos ou pleitos ainda não publicados pelo TSE, o arquivo pode não existir; tente novamente mais tarde ou use a importação oficial por CSV.</p><p><a href="https://resultados.tse.jus.br/oficial/app/index.html" target="_blank" rel="noopener">Conferir no portal oficial do TSE</a></p>'}
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
function berNode(bytes,pos){
 const start=pos; if(pos>=bytes.length)throw Error('Arquivo BU truncado.');
 const first=bytes[pos++];let tagNo=first&31;
 if(tagNo===31){tagNo=0;let b;do{if(pos>=bytes.length)throw Error('Tag ASN.1 incompleta.');b=bytes[pos++];tagNo=(tagNo*128)+(b&127)}while(b&128)}
 if(pos>=bytes.length)throw Error('Comprimento ASN.1 ausente.');
 let len=bytes[pos++],indefinite=len===128;
 if(len&128&&!indefinite){const n=len&127;if(n>6||pos+n>bytes.length)throw Error('Comprimento ASN.1 inválido.');len=0;for(let i=0;i<n;i++)len=len*256+bytes[pos++]}
 const valueStart=pos,constructed=!!(first&32),children=[];
 if(indefinite){
  if(!constructed)throw Error('Campo ASN.1 indefinido não é construído.');
  while(pos+1<bytes.length&&!(bytes[pos]===0&&bytes[pos+1]===0)){const n=berNode(bytes,pos);children.push(n.node);pos=n.next}
  if(pos+1>=bytes.length)throw Error('Final ASN.1 indefinido ausente.');
  const valueEnd=pos;pos+=2;
  return {node:{tag:first,tagNo,tagClass:first>>6,constructed,start,valueStart,valueEnd,end:pos,raw:bytes.slice(valueStart,valueEnd),children},next:pos};
 }
 const valueEnd=pos+len;if(valueEnd>bytes.length)throw Error('Conteúdo ASN.1 truncado.');
 if(constructed){while(pos<valueEnd){const n=berNode(bytes,pos);if(n.next<=pos||n.next>valueEnd)throw Error('Estrutura ASN.1 inválida.');children.push(n.node);pos=n.next}}
 else pos=valueEnd;
 return {node:{tag:first,tagNo,tagClass:first>>6,constructed,start,valueStart,valueEnd,end:valueEnd,raw:bytes.slice(valueStart,valueEnd),children},next:valueEnd};
}
function berChildren(bytes){const out=[];let p=0;while(p<bytes.length){const n=berNode(bytes,p);out.push(n.node);if(n.next<=p)throw Error('Não foi possível avançar no arquivo ASN.1.');p=n.next}return out}
function asnInt(n){if(!n||!n.raw||!n.raw.length)return null;let v=0;for(const b of n.raw)v=v*256+b;if(n.raw[0]&128)v-=Math.pow(256,n.raw.length*8);return Number.isSafeInteger(v)?v:null}
function firstInt(n){if(!n)return null;const direct=asnInt(n);if(direct!==null)return direct;for(const c of n.children||[]){const v=firstInt(c);if(v!==null)return v}return null}
function asnText(n){if(!n)return '';try{return new TextDecoder('utf-8').decode(n.raw||new Uint8Array()).replace(/\0+$/,'')}catch(e){return ''}}
function unwrapEnvelope(bytes){
 const roots=berChildren(bytes);let root=roots.find(n=>n.tagNo===16&&n.constructed)||roots[0];
 if(!root)throw Error('O arquivo não contém uma estrutura ASN.1 válida.');
 // BU publicados pelo TSE vêm envelopados: o conteúdo interno fica em OCTET STRING.
 const octets=(root.children||[]).find(n=>n.tagClass===0&&n.tagNo===4);
 if(octets&&octets.raw&&octets.raw.length&&octets.raw[0]===48){
  try{return berChildren(octets.raw).find(n=>n.tagNo===16&&n.constructed)||berChildren(octets.raw)[0]}catch(e){}
 }
 return root;
}
function sequenceItems(n){return n&&Array.isArray(n.children)?n.children:[]}
function identifyCandidateMeta(data,cargo){
 const out={candidate:new Map(),party:new Map()};
 const c=(data?.carg||[]).find(x=>String(x.cd)===String(cargo))||(data?.carg||[])[0];
 if(!c)return out;
 (c.agr||[]).forEach(p=>{
  const party=String(p.sg||'');
  if(p.n!=null)out.party.set(String(p.n),party);
  (p.cand||[]).forEach(x=>out.candidate.set(String(x.n),{name:x.nm||x.nmu||'',party:party||'',pct:x.pvap}));
 });
 (c.cand||[]).forEach(x=>out.candidate.set(String(x.n),{name:x.nm||x.nmu||'',party:'',pct:x.pvap}));
 return out;
}
function decodeBuSection(bytes,expected){
 const root=unwrapEnvelope(bytes),nodes=sequenceItems(root);
 // Valida município/zona/seção pelo identificador interno do próprio BU antes de exibir votos.
 const ident=nodes.find(n=>n.tagNo===16&&n.constructed&&sequenceItems(n).length>=3&&sequenceItems(sequenceItems(n)[0]).length>=2);
 let sectionInfo=null;
 if(ident){
  const a=sequenceItems(ident),mz=sequenceItems(a[0]);
  sectionInfo={municipality:firstInt(mz[0]),zone:firstInt(mz[1]),local:firstInt(a[1]),section:firstInt(a[2])};
 }
 if(!sectionInfo)throw Error('Não consegui validar município, zona e seção dentro do BU. Nenhum voto foi exibido.');
 if(String(sectionInfo.municipality)!==String(Number(expected.municipality))||String(sectionInfo.zone)!==String(Number(expected.zone))||String(sectionInfo.section)!==String(Number(expected.section))){
  throw Error('O BU retornado não corresponde ao município/zona/seção selecionados. Nenhum voto foi exibido.');
 }
 // A eleição é identificada pelo código interno TSE. Não confunde pleito com código da eleição.
 const electionNodes=[];
 function isResultsContainer(n){
  const items=sequenceItems(n);
  return items.length>0&&items.some(r=>{const rc=sequenceItems(r);return rc.length>=3&&[1,2,3].includes(firstInt(rc[0]))&&sequenceItems(rc[2]).length>0});
 }
 function walk(n){
  if(!n)return;
  if(n.tagNo===16&&n.constructed){
   const c=sequenceItems(n);
   if(c.length>=3&&firstInt(c[0])===Number(expected.election)){
    const container=c.find(isResultsContainer);
    if(container)electionNodes.push({node:n,container});
   }
  }
  sequenceItems(n).forEach(walk);
 }
 walk(root);
 const found=electionNodes[0];
 if(!found)throw Error('O BU foi validado, mas não contém a eleição selecionada ou usa uma estrutura ainda não reconhecida. Confirme eleição/turno.');
 const ec=sequenceItems(found.node), aptos=firstInt(ec[1]);
 const results=sequenceItems(found.container), cargoResults=[];
 results.forEach(r=>{
  const rc=sequenceItems(r);if(rc.length<3)return;
  const totalNodes=sequenceItems(rc[2]);
  totalNodes.forEach(tc=>{
   const t=sequenceItems(tc);if(t.length<3)return;
   const cargoCode=firstInt(t[0]);if(String(cargoCode)!==String(expected.cargo))return;
   sequenceItems(t[2]).forEach(v=>{
    const vv=sequenceItems(v);if(vv.length<2)return;
    const type=firstInt(vv[0]),votes=firstInt(vv[1]);if(votes===null)return;
    const id=vv.find(x=>x.tagNo===3&&x.constructed),idc=sequenceItems(id);
    cargoResults.push({type,votes,party:idc.length?firstInt(idc[0]):null,number:idc.length>1?firstInt(idc[1]):null});
   });
  });
 });
 if(!cargoResults.length)throw Error('A estrutura do BU foi lida, mas não encontrei votos para o cargo selecionado. Para evitar números incorretos, não exibi resultado.');
 const total=cargoResults.reduce((a,v)=>a+v.votes,0);
 return {sectionInfo,aptos,rows:cargoResults,total};
}
function countRegisteredSection(zone,section,buLocal){
 try{
  const db=JSON.parse(localStorage.getItem('gabineteDigitalDemo')||'{}');
  const people=Array.isArray(db.people)?db.people:[];
  const digits=v=>String(v==null?'':v).replace(/\D/g,'').replace(/^0+(?=\d)/,'');
  const targetZone=digits(zone),targetSection=digits(section),targetLocal=digits(buLocal);
  const matched=people.filter(p=>{
   if(!p||p.excluidoEm)return false;
   if(digits(p.zonaEleitoral)!==targetZone||digits(p.secaoEleitoral)!==targetSection)return false;
   const citizenLocal=digits(p.codigoLocalVotacao);
   return !citizenLocal||!targetLocal||citizenLocal===targetLocal;
  });
  const withLocalCode=matched.filter(p=>digits(p.codigoLocalVotacao)&&targetLocal&&digits(p.codigoLocalVotacao)===targetLocal).length;
  return {count:matched.length,withLocalCode,source:'gabineteDigitalDemo'};
 }catch(e){return {count:0,withLocalCode:0,source:'indisponível'}}
}
async function querySection(e,uf,mun,zone,section,cargo){
 const z=String(zone||'').replace(/\D/g,'');if(!z)throw Error('Para consultar uma seção, informe também a zona eleitoral.');
 const pleito=String(e.pleito||'').replace(/\D/g,'');if(!pleito)throw Error('O TSE não informou o código do pleito para esta eleição.');
 const m=String(mun).padStart(5,'0'),zz=z.padStart(4,'0'),ss=String(section).replace(/\D/g,'').padStart(4,'0');
 const state=String(uf||'').toLowerCase();
 const auxURL=BASE+'/oficial/'+e.cycle+'/arquivo-urna/'+pleito+'/config/'+state+'/p'+pleito.padStart(6,'0')+'-'+state+'-m'+m+'-z'+zz+'-s'+ss+'-aux.json';
 const aux=await getJSON(auxURL);
 const hashes=Array.isArray(aux.hashes)?aux.hashes:[];
 const usable=hashes.filter(h=>Array.isArray(h.arq)&&!/(exclu|cancel|substitu|rejeitad)/i.test(String(h.st||'')));
 const chosen=usable.find(h=>/totalizad/i.test(String(h.st||'')))||usable[usable.length-1];
 if(!chosen)throw Error('O TSE não publicou um BU utilizável para esta seção. Pode ser seção agregada, não instalada ou ainda não totalizada.');
 const file=(chosen.arq||[]).filter(a=>/^(bu|busa)$/i.test(String(a.tp||''))||/-bu(?:sa)?\.dat$/i.test(String(a.nm||''))).slice(-1)[0];
 if(!file)throw Error('O inventário oficial da seção não contém arquivo BU. Nenhum resultado foi estimado.');
 // O arquivo fica dentro da pasta do hash da urna; omitir esse nível gera HTTP 404.
 const fileURL=BASE+'/oficial/'+e.cycle+'/arquivo-urna/'+pleito+'/dados/'+state+'/'+m+'/'+zz+'/'+ss+'/'+encodeURIComponent(chosen.hash)+'/'+encodeURIComponent(file.nm);
 setStatus('Baixando o boletim oficial da seção…');
 const response=await fetch(fileURL,{cache:'no-store',headers:{Accept:'application/octet-stream, application/json'}});
 if(!response.ok)throw Error('O TSE localizou o inventário, mas o download do BU respondeu HTTP '+response.status+'.');
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(!bytes.length)throw Error('O arquivo oficial do BU veio vazio.');
 const decoded=decodeBuSection(bytes,{municipality:Number(m),zone:Number(z),section:Number(ss),election:Number(e.cd),cargo:Number(cargo)});
 // Carrega nomes/siglas do resultado oficial agregado apenas como dicionário; votos vêm exclusivamente do BU da seção.
 let official=null,meta={candidate:new Map(),party:new Map()},officialURL='';
 try{
  officialURL=makeResultURL(e,uf,mun,'',cargo);official=await getJSON(officialURL);meta=identifyCandidateMeta(official,cargo);
 }catch(err){console.warn('[Mapa eleitoral] Não foi possível obter o dicionário oficial de candidatos:',err)}
 const typeName={1:'Voto nominal',2:'Branco',3:'Nulo',4:'Voto de legenda',5:'Cargo sem candidato'};
 const rows=decoded.rows.map(v=>{
  const c=v.number==null?null:meta.candidate.get(String(v.number));
  const party=c?.party||(v.party==null?'':meta.party.get(String(v.party))||'');
  const label=v.type===2?'Voto branco':v.type===3?'Voto nulo':v.type===5?'Cargo sem candidato':v.type===4?'Legenda '+(v.number==null?'':v.number):c?.name||('Número '+(v.number==null?'—':v.number));
  return {type:v.type,label,party:party||'—',number:v.number,votes:v.votes};
 }).sort((a,b)=>b.votes-a.votes);
 const turnout=decoded.rows.filter(v=>v.type===1||v.type===2||v.type===3||v.type===4).reduce((a,v)=>a+v.votes,0);
 const totalVotes=rows.reduce((a,v)=>a+v.votes,0);
 const registry=countRegisteredSection(z,ss,decoded.sectionInfo.local);
 $('tseLiveResultado').innerHTML='<div class="card" style="padding:12px;margin:10px 0"><h4>Resultado por seção — Boletim de Urna oficial</h4><p><strong>Município TSE:</strong> '+esc(m)+' · <strong>Zona:</strong> '+esc(zz)+' · <strong>Seção:</strong> '+esc(ss)+' · <strong>Local TSE:</strong> '+esc(decoded.sectionInfo.local??'não informado')+'</p><div class="painel-grid" style="grid-template-columns:repeat(auto-fit,minmax(135px,1fr))"><div class="card"><small>Eleitores aptos</small><h3>'+Number(decoded.aptos||0).toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Votos registrados no cargo</small><h3>'+totalVotes.toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Votos por tipo somados</small><h3>'+turnout.toLocaleString('pt-BR')+'</h3></div><div class="card"><small>Cadastros do gabinete nesta seção</small><h3>'+registry.count.toLocaleString('pt-BR')+'</h3></div></div><p style="font-size:12px;color:#555">Os votos abaixo foram decodificados do arquivo BU publicado pelo TSE. Nome e partido, quando disponíveis, são associados ao resultado oficial agregado; a quantidade vem do BU da seção. A contagem de cadastros é agregada por zona/seção e, quando informado, código do local; não identifica nem infere voto ou preferência política de qualquer cidadão.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Tipo</th><th style="text-align:left;padding:8px">Número / votável</th><th style="text-align:left;padding:8px">Candidato / voto</th><th style="text-align:left;padding:8px">Partido</th><th style="text-align:right;padding:8px">Votos</th></tr></thead><tbody>'+rows.map(v=>'<tr><td style="padding:8px;border-top:1px solid #ddd">'+esc(typeName[v.type]||'Tipo '+v.type)+'</td><td style="padding:8px;border-top:1px solid #ddd">'+esc(v.number??'—')+'</td><td style="padding:8px;border-top:1px solid #ddd">'+esc(v.label)+'</td><td style="padding:8px;border-top:1px solid #ddd">'+esc(v.party)+'</td><td style="padding:8px;text-align:right;border-top:1px solid #ddd"><strong>'+v.votes.toLocaleString('pt-BR')+'</strong></td></tr>').join('')+'</tbody></table></div><p style="font-size:12px">Fonte primária: <a href="'+esc(fileURL)+'" target="_blank" rel="noopener">BU oficial do TSE</a> · <a href="'+esc(auxURL)+'" target="_blank" rel="noopener">Inventário oficial da seção</a>'+(officialURL?' · <a href="'+esc(officialURL)+'" target="_blank" rel="noopener">Referência oficial de candidatos e totalização</a>':'')+'</p><button type="button" onclick="window.__imprimirMapaSecao && window.__imprimirMapaSecao()">🖨️ Imprimir / Salvar PDF</button></div>';
 setStatus('BU oficial decodificado e seção validada. Os votos exibidos vieram do arquivo da seção, não do agregado da zona.');
}
window.__imprimirMapaSecao=function(){
 const source=$('tseLiveResultado');if(!source)return;
 const w=window.open('','_blank');if(!w){setStatus('Permita a abertura da janela de impressão para salvar em PDF.');return}
 const clone=source.cloneNode(true);clone.querySelectorAll('button').forEach(b=>b.remove());
 w.document.open();w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Mapa eleitoral — resultado por seção</title><style>body{font:14px Arial,sans-serif;color:#111;padding:22px}h4{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;text-align:left}th:last-child,td:last-child{text-align:right}.card{padding:10px}a{color:#111;text-decoration:none}@media print{body{padding:0}}</style></head><body><h2>Gabinete Online — Mapa eleitoral</h2>'+clone.innerHTML+'</body></html>');w.document.close();w.focus();w.print();
};
document.addEventListener('DOMContentLoaded',()=>{inject();setInterval(inject,1000)});
})();