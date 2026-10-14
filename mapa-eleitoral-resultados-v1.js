
/* Mapa eleitoral — importação de resultados oficiais do TSE e comparação agregada por seção */
(function(){
'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession',AT='gabineteAccessToken',LOCAL='gabineteResultadosTSEv1';
const $=id=>document.getElementById(id);
const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localData(){try{const d=JSON.parse(localStorage.getItem(DB)||'{}');return Array.isArray(d.people)?d.people.filter(p=>!p.excluidoEm):[]}catch(e){return[]}}
function cfg(){try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch(e){return null}}
function token(){try{return localStorage.getItem(AT)||JSON.parse(localStorage.getItem(SES)||'null')?.access_token||''}catch(e){return''}}
function api(path,opts){const c=cfg();if(!c?.url||!c?.anonKey||!token())throw Error('Entre no sistema e confirme a conexão para sincronizar os resultados eleitorais.');return fetch(String(c.url).replace(/\/+$/,'')+'/rest/v1/'+path,Object.assign({headers:{apikey:c.anonKey,Authorization:'Bearer '+token(),'Content-Type':'application/json'}},opts||{})).then(async r=>{if(!r.ok)throw Error('Supabase HTTP '+r.status+': '+(await r.text()).slice(0,220));const t=await r.text();return t?JSON.parse(t):null})}
function hash(s){let a=2166136261,b=2246822519;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a^=c;a=Math.imul(a,16777619);b^=(c+i);b=Math.imul(b,3266489917)}return'tse_'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')+'_'+s.length}
function csv(text){text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0]||'';const delim=(first.match(/;/g)||[]).length> (first.match(/,/g)||[]).length?';':',';const out=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){v+='"';i++}else q=!q}else if(c===delim&&!q){row.push(v);v=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>String(x).trim()))out.push(row);row=[];v=''}else v+=c}row.push(v);if(row.some(x=>String(x).trim()))out.push(row);if(out.length<2)throw Error('O arquivo não parece ser um CSV com cabeçalho e linhas de resultado.');const heads=out.shift().map(x=>norm(x).replace(/[^a-z0-9_]/g,''));return out.map(r=>Object.fromEntries(heads.map((h,i)=>[h,String(r[i]||'').trim()])))}
function pick(o,names){for(const n of names){const v=o[norm(n).replace(/[^a-z0-9_]/g,'')];if(v!=null&&v!=='')return v}return''}
function normalizeRow(o,meta){
 const year=Number(pick(o,['ANO_ELEICAO','ano_eleicao'])||meta.year),turn=Number(pick(o,['NR_TURNO','turno'])||meta.turn||1);
 const municipality=pick(o,['NM_MUNICIPIO','municipio'])||meta.municipio;
 const zone=String(pick(o,['NR_ZONA','zona'])||'').trim().padStart(3,'0'),section=String(pick(o,['NR_SECAO','seção','secao'])||'').trim().padStart(4,'0');
 const office=pick(o,['DS_CARGO','cargo']),candidate=pick(o,['NM_VOTAVEL','nome_candidato']),number=pick(o,['NR_VOTAVEL','numero_candidato']);
 const localCode=pick(o,['CD_LOCAL_VOTACAO','NR_LOCAL_VOTACAO','codigo_local_votacao']),localName=pick(o,['NM_LOCAL_VOTACAO','DS_LOCAL_VOTACAO','local_votacao','nome_local_votacao']);
 const votes=Number(String(pick(o,['QT_VOTOS','votos'])||'0').replace(/\./g,'').replace(',','.'));
 if(!year||!municipality||!zone||!section||!office||!candidate||!Number.isFinite(votes))return null;
 const uf=pick(o,['SG_UF','uf'])||meta.uf||'PA',code=pick(o,['CD_MUNICIPIO','codigo_municipio']);
 const typ=meta.tipo||pick(o,['NM_TIPO_ELEICAO','tipo_eleicao'])||'Outra eleição';
 const key=[year,turn,uf,code,municipality,localCode,localName,zone,section,office,number,candidate].join('|');
 return{id:hash(key),ano_eleicao:year,tipo_eleicao:typ,turno:turn,uf,codigo_municipio:code||null,municipio,zona:zone,secao:section,codigo_local_votacao:localCode||null,local_votacao:localName||'',cargo:office,numero_candidato:number||null,nome_candidato:candidate,votos:Math.max(0,Math.round(votes)),origem:'TSE'};
}
function inject(){
 const sec=$('mapaEleitoralGabinete');if(!sec||$('melTsePainel'))return;
 const panel=document.createElement('div');panel.id='melTsePainel';panel.className='card';panel.style.cssText='padding:14px;margin-bottom:14px';
 panel.innerHTML='<h3>📊 Resultados oficiais e conferência por seção</h3><p>Use a base oficial do TSE de votação por seção. Para as Eleições 2026, o TSE disponibiliza arquivo por UF; para o Pará, baixe a base oficial e importe o CSV extraído do ZIP. <a href="https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_PA.zip" target="_blank" rel="noopener">⬇️ Baixar votação por seção — Pará (2026)</a> · <a href="https://dadosabertos.tse.jus.br/dataset/resultados-2026" target="_blank" rel="noopener">Fonte e outras bases oficiais</a> · <a href="https://resultados.tse.jus.br/oficial/app/index.html" target="_blank" rel="noopener">Portal Resultados do TSE</a>. O arquivo contém os votos por seção; a associação oficial de seção a escola/local será carregada separadamente para não atribuir seções à escola errada.</p><div class="form-grid"><div class="campo"><label>Município</label><input id="melTseMunicipio" value="Concórdia do Pará" placeholder="Município do arquivo"></div><div class="campo"><label>UF</label><select id="melTseUF"><option value="PA" selected>PA</option><option value="AC">AC</option><option value="AL">AL</option><option value="AM">AM</option><option value="AP">AP</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MG">MG</option><option value="MS">MS</option><option value="MT">MT</option><option value="PB">PB</option><option value="PE">PE</option><option value="PI">PI</option><option value="PR">PR</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RO">RO</option><option value="RR">RR</option><option value="RS">RS</option><option value="SC">SC</option><option value="SE">SE</option><option value="SP">SP</option><option value="TO">TO</option></select></div><div class="campo"><label>Tipo de eleição</label><select id="melTseTipo"><option>Eleições municipais</option><option>Eleições gerais</option><option>Outra eleição</option></select></div><div class="campo"><label>Ano da eleição</label><input id="melTseAno" type="number" min="1994" max="2100" value="2024"></div><div class="campo"><label>Turno</label><select id="melTseTurno"><option value="1">1º turno</option><option value="2">2º turno</option></select></div><div class="campo campo-grande"><label>Arquivo CSV oficial do TSE</label><input id="melTseArquivo" type="file" accept=".csv,text/csv"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button id="melTseImportar" type="button">⬆️ Importar resultados</button><button id="melTseAtualizar" type="button" class="btn-secundario">☁️ Carregar resultados salvos</button></div><div id="melTseStatus" aria-live="polite" style="margin:8px 0"></div><hr><h3>Conferência por escola/local de votação</h3><div class="form-grid"><div class="campo campo-grande"><label>Escola / local de votação (do arquivo oficial importado)</label><select id="melTseFiltroLocal"><option value="">Todos os locais</option></select></div><div class="campo"><label>Zona eleitoral</label><input id="melTseFiltroZona" inputmode="numeric" value="087" placeholder="Ex.: 087"></div><div class="campo"><label>Seção</label><input id="melTseFiltroSecao" placeholder="Ex.: 0209"></div><div class="campo"><label>Cargo</label><select id="melTseFiltroCargo"><option value="">Todos os cargos</option></select></div><div class="campo"><label>Candidato para comparar</label><select id="melTseFiltroCandSelect"><option value="">Todos os candidatos</option></select></div><div class="campo"><label>Buscar candidato</label><input id="melTseFiltroCand" placeholder="Nome ou número (opcional)"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button id="melTseImprimir" type="button">🖨️ Imprimir / Salvar PDF</button></div><div id="melTseResumo" style="margin:10px 0"></div><div id="melTseTabela"></div>';
 sec.appendChild(panel);
 ['melTseFiltroLocal','melTseFiltroZona','melTseFiltroSecao','melTseFiltroCand','melTseFiltroCandSelect','melTseAno','melTseTurno','melTseTipo','melTseMunicipio','melTseUF','melTseFiltroCargo'].forEach(id=>$(id)?.addEventListener('input',render));
 $('melTseImportar').addEventListener('click',importFile);$('melTseAtualizar').addEventListener('click',loadResults);$('melTseImprimir').addEventListener('click',printReport);
 loadResults();
}
function readLocal(){try{return JSON.parse(localStorage.getItem(LOCAL)||'[]')}catch(e){return[]}}
function saveLocal(rows){localStorage.setItem(LOCAL,JSON.stringify(rows))}
async function loadResults(){
 const status=$('melTseStatus');if(status)status.textContent='Carregando resultados eleitorais salvos…';
 try{const remote=[];for(let offset=0;offset<100000;offset+=1000){const page=await api('resultados_eleitorais?select=*&order=ano_eleicao.desc&limit=1000',{headers:{'Range-Unit':'items','Range':offset+'-'+(offset+999)}});remote.push(...(page||[]));if(!page||page.length<1000)break}const map=new Map();[...readLocal(),...remote].forEach(r=>map.set(r.id,r));saveLocal([...map.values()]);if(status)status.textContent='Resultados carregados: '+map.size+' registro(s).';render()}
 catch(e){if(status)status.textContent='Não foi possível consultar o banco agora. '+e.message+' Os dados já importados neste aparelho continuam guardados.';render()}
}
async function importFile(){
 const file=$('melTseArquivo').files?.[0];if(!file){$('melTseStatus').textContent='Escolha primeiro o arquivo CSV do TSE.';return}
 const btn=$('melTseImportar');btn.disabled=true;$('melTseStatus').textContent='Lendo e validando arquivo…';
 try{
  const rows=csv(await file.text()),meta={year:Number($('melTseAno').value),turn:Number($('melTseTurno').value),tipo:$('melTseTipo').value,municipio:$('melTseMunicipio').value.trim(),uf:$('melTseUF').value};
  if(!meta.municipio)throw Error('Informe o município antes de importar.');
  const normalized=rows.map(r=>normalizeRow(r,meta)).filter(Boolean).filter(r=>norm(r.municipio)===norm(meta.municipio)&&r.uf===meta.uf&&r.ano_eleicao===meta.year&&r.turno===meta.turn);
  if(!normalized.length)throw Error('Nenhum resultado compatível encontrado. Confira o CSV, município, UF, ano e turno. O TSE pode usar outro nome de município no arquivo.');
  const map=new Map(readLocal().map(r=>[r.id,r]));normalized.forEach(r=>map.set(r.id,r));const all=[...map.values()];saveLocal(all);
  $('melTseStatus').textContent='Arquivo validado: '+normalized.length+' resultados de candidato/seção. Enviando ao banco…';
  let uploaded=0;for(let i=0;i<normalized.length;i+=250){await api('resultados_eleitorais?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(normalized.slice(i,i+250))});uploaded+=Math.min(250,normalized.length-i)}
  $('melTseStatus').textContent='Importação concluída: '+uploaded+' linhas sincronizadas. Fonte: CSV oficial do TSE. Locais de votação identificados no arquivo: '+new Set(normalized.map(r=>r.local_votacao).filter(Boolean)).size+'. '+all.length+' registros mantidos neste aparelho.';
  render();
 }catch(e){$('melTseStatus').textContent='Importação não concluída: '+e.message+' Nenhum cadastro de cidadão foi alterado. Os resultados importados podem continuar salvos neste aparelho; confira a conexão antes de repetir a sincronização.'}
 finally{btn.disabled=false}
}
function printReport(){
 const table=$('melTseTabela');if(!table||!table.innerHTML.trim()){alert('Gere primeiro um relatório com resultados.');return}
 const title='Mapa eleitoral por local de votação';
 const meta='Município: '+($('melTseMunicipio')?.value||'')+' / '+($('melTseUF')?.value||'')+' • Eleição: '+($('melTseTipo')?.value||'')+' • Ano: '+($('melTseAno')?.value||'')+' • Turno: '+($('melTseTurno')?.value||'');
 const w=window.open('','_blank');
 if(!w){alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.');return}
 w.document.open();w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font:12px Arial,sans-serif;color:#111;padding:20px}h1{font-size:20px}p{margin:6px 0 16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px;text-align:left}th{background:#eee}small{color:#444}.nota{margin-top:16px;font-size:10px}@page{size:landscape;margin:12mm}</style></head><body><h1>'+esc(title)+'</h1><p>'+esc(meta)+'</p>'+table.innerHTML+'<p class="nota">Resultados eleitorais: dados importados do arquivo oficial do TSE. Cadastros são contagens agregadas por zona/seção e não comprovam o voto de nenhuma pessoa.</p><script>window.onload=function(){window.focus();window.print()}<\/script></body></html>');w.document.close();
}
function render(){
 const table=$('melTseTabela');if(!table)return;
 const all=readLocal(),year=Number($('melTseAno')?.value||0),turn=Number($('melTseTurno')?.value||1),mun=norm($('melTseMunicipio')?.value||''),uf=$('melTseUF')?.value||'PA',type=$('melTseTipo')?.value||'',local=$('melTseFiltroLocal')?.value||'',zone=($('melTseFiltroZona')?.value||'').trim(),section=($('melTseFiltroSecao')?.value||'').trim(),cand=norm($('melTseFiltroCand')?.value||''),office=$('melTseFiltroCargo')?.value||'',chosen=$('melTseFiltroCandSelect')?.value||'';
 let base=all.filter(r=>r.ano_eleicao===year&&r.turno===turn&&norm(r.municipio)===mun&&r.uf===uf&&norm(r.tipo_eleicao)===norm(type));
 const offices=[...new Set(base.map(r=>r.cargo))].sort();const sel=$('melTseFiltroCargo');if(sel){const current=sel.value;if(sel.dataset.options!==offices.join('|')){sel.innerHTML='<option value="">Todos os cargos</option>'+offices.map(o=>'<option>'+esc(o)+'</option>').join('');sel.dataset.options=offices.join('|');if(offices.includes(current))sel.value=current}}
 const byOffice=base.filter(r=>(!office||r.cargo===office));
 const localOptions=new Map();byOffice.forEach(r=>{if(r.local_votacao)localOptions.set(String(r.codigo_local_votacao||'')+'|'+r.local_votacao,{code:String(r.codigo_local_votacao||''),name:r.local_votacao})});
 const localSelect=$('melTseFiltroLocal');if(localSelect){const old=localSelect.value;const sig=[...localOptions.keys()].sort().join('~');if(localSelect.dataset.options!==sig){localSelect.innerHTML='<option value="">Todos os locais</option>'+[...localOptions.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(x=>'<option value="'+esc(x.code+'|'+x.name)+'">'+esc(x.name+(x.code?' ('+x.code+')':''))+'</option>').join('');localSelect.dataset.options=sig;if([...localOptions.keys()].includes(old))localSelect.value=old}}
 const selectedLocal=(localSelect?.value||local).split('|');
 const candidateMap=new Map();byOffice.forEach(r=>candidateMap.set(String(r.numero_candidato||'')+'|'+r.nome_candidato,{number:String(r.numero_candidato||''),name:r.nome_candidato}));
 const candidateOptions=[...candidateMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const candidateSelect=$('melTseFiltroCandSelect');
 if(candidateSelect){const old=candidateSelect.value;const sig=candidateOptions.map(x=>x.number+'|'+x.name).join('~');if(candidateSelect.dataset.options!==sig){candidateSelect.innerHTML='<option value="">Todos os candidatos</option>'+candidateOptions.map(x=>'<option value="'+esc(x.number+'|'+x.name)+'">'+esc((x.number?x.number+' — ':'')+x.name)+'</option>').join('');candidateSelect.dataset.options=sig;if(candidateOptions.some(x=>x.number+'|'+x.name===old))candidateSelect.value=old}}
 const selectedCandidate=(candidateSelect?.value||chosen).split('|');
 let filtered=byOffice.filter(r=>(!selectedLocal[1]||(String(r.codigo_local_votacao||'')===selectedLocal[0]&&r.local_votacao===selectedLocal.slice(1).join('|')))&&(!zone||r.zona.includes(zone))&&(!section||r.secao.includes(section))&&(!cand||(norm(r.nome_candidato).includes(cand)||String(r.numero_candidato||'').includes(cand)))&&(!selectedCandidate[1]||(String(r.numero_candidato||'')===selectedCandidate[0]&&r.nome_candidato===selectedCandidate.slice(1).join('|'))));
 const matchesLocal=p=>!selectedLocal[1]||(selectedLocal[0]&&String(p.codigoLocalVotacao||'')?String(p.codigoLocalVotacao)===selectedLocal[0]:norm(p.localVotacao||p.localEleitoral||'')===norm(selectedLocal.slice(1).join('|')));
 const people=localData().filter(p=>matchesLocal(p)&&(!zone||String(p.zonaEleitoral||'').replace(/\D/g,'').padStart(3,'0').includes(zone.replace(/\D/g,'')))&&(!section||String(p.secaoEleitoral||'').replace(/\D/g,'').padStart(4,'0').includes(section.replace(/\D/g,''))));
 const uniquePeople=new Set(people.map(p=>String(p.id||p.cpf||p.nome||'')).filter(Boolean)).size;
 const selectedVoteTotal=filtered.reduce((n,r)=>n+Number(r.votos||0),0);
 const sectionsWithOfficialVotes=new Set(filtered.map(r=>r.zona+'|'+r.secao)).size;
 const sections=new Map();
 byOffice.filter(r=>(!selectedLocal[1]||(String(r.codigo_local_votacao||'')===selectedLocal[0]&&r.local_votacao===selectedLocal.slice(1).join('|')))&&(!zone||r.zona.includes(zone))&&(!section||r.secao.includes(section))).forEach(r=>sections.set(r.zona+'|'+r.secao,{zona:r.zona,secao:r.secao}));
 people.forEach(p=>{const z=String(p.zonaEleitoral||'').replace(/\D/g,'').padStart(3,'0'),s=String(p.secaoEleitoral||'').replace(/\D/g,'').padStart(4,'0');if(z&&s&&z!=='000'&&s!=='0000')sections.set(z+'|'+s,{zona:z,secao:s})});
 const keyOf=r=>String(r.zona).padStart(3,'0')+'|'+String(r.secao).padStart(4,'0');
 const sectionCount=(z,s)=>new Set(localData().filter(p=>matchesLocal(p)&&String(p.zonaEleitoral||'').replace(/\D/g,'').padStart(3,'0')===z&&String(p.secaoEleitoral||'').replace(/\D/g,'').padStart(4,'0')===s).map(p=>String(p.id||p.cpf||p.nome||'')).filter(Boolean)).size;
 const fmt=n=>Number(n||0).toLocaleString('pt-BR');
 $('melTseResumo').innerHTML='<div class="painel-grid" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr))"><div class="card"><small>Linhas oficiais no filtro</small><h3>'+fmt(filtered.length)+'</h3></div><div class="card"><small>Cadastros únicos nas seções filtradas</small><h3>'+fmt(uniquePeople)+'</h3></div><div class="card"><small>Votos somados nas linhas visíveis</small><h3>'+fmt(filtered.reduce((n,r)=>n+r.votos,0))+'</h3></div><div class="card"><small>Seções no cruzamento</small><h3>'+fmt(sections.size)+'</h3></div></div><p style="font-size:12px;color:#666">Total de votos oficiais nas linhas filtradas: '+fmt(selectedVoteTotal)+'. Seções com resultado oficial para o filtro: '+fmt(sectionsWithOfficialVotes)+'. Cadastros são contagens agregadas e não identificam o voto de nenhuma pessoa. Se uma seção não tiver linha no CSV oficial importado, o sistema não presume zero votos.</p>';
 if(!filtered.length&&!sections.size){table.innerHTML='<div class="card vazio">Nenhum resultado para esses filtros. Importe o CSV oficial do TSE ou ajuste eleição, turno, município, zona e seção.</div>';return}
 const sortedSections=[...sections.values()].sort((a,b)=>a.zona.localeCompare(b.zona,undefined,{numeric:true})||a.secao.localeCompare(b.secao,undefined,{numeric:true}));
 // Resumo por escola: agrega votos do candidato em todas as seções daquele local.
 const schoolRows=byOffice.filter(r=>(!selectedLocal[1]||(String(r.codigo_local_votacao||'')===selectedLocal[0]&&r.local_votacao===selectedLocal.slice(1).join('|')))&&(!zone||r.zona.includes(zone))&&(!section||r.secao.includes(section)));
 const schoolAgg=new Map();
 schoolRows.forEach(r=>{const k=[r.codigo_local_votacao||'',r.local_votacao||'Local não identificado',r.cargo,r.numero_candidato||'',r.nome_candidato].join('|');const x=schoolAgg.get(k)||{local:r.local_votacao||'Local não identificado',cargo:r.cargo,numero:r.numero_candidato||'',candidato:r.nome_candidato,votos:0,sections:new Set()};x.votos+=Number(r.votos||0);x.sections.add(r.zona+'|'+r.secao);schoolAgg.set(k,x)});
 const schoolTable='<h4>Resumo de votos por escola/local</h4><p style="font-size:12px;color:#666">O total abaixo soma as seções oficiais vinculadas ao local selecionado. Para ver uma única escola, selecione-a no filtro de local.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Escola/local</th><th>Cargo</th><th>Nº</th><th>Candidato</th><th>Seções no resultado</th><th>Total de votos oficiais</th></tr></thead><tbody>'+[...schoolAgg.values()].sort((a,b)=>a.local.localeCompare(b.local,'pt-BR')||b.votos-a.votos).map(x=>'<tr><td>'+esc(x.local)+'</td><td>'+esc(x.cargo)+'</td><td>'+esc(x.numero||'—')+'</td><td>'+esc(x.candidato)+'</td><td>'+fmt(x.sections.size)+'</td><td><strong>'+fmt(x.votos)+'</strong></td></tr>').join('')+'</tbody></table></div>';
 let rows=[];
 sortedSections.forEach(s=>{
  const z=String(s.zona).padStart(3,'0'),sec=String(s.secao).padStart(4,'0'),cnt=sectionCount(z,sec);
  const sectionRows=filtered.filter(r=>keyOf(r)===z+'|'+sec);
  if(sectionRows.length){sectionRows.forEach(r=>rows.push('<tr><td>'+esc(z)+'</td><td>'+esc(sec)+'</td><td>'+esc(r.cargo)+'</td><td>'+esc(r.numero_candidato||'—')+'</td><td>'+esc(r.nome_candidato)+'</td><td><strong>'+fmt(r.votos)+'</strong></td><td>'+fmt(cnt)+'</td></tr>'))}
  else rows.push('<tr><td>'+esc(z)+'</td><td>'+esc(sec)+'</td><td>'+esc(office||'—')+'</td><td>'+esc(selectedCandidate[0]||'—')+'</td><td>'+esc(selectedCandidate[1]?selectedCandidate.slice(1).join('|'):'Sem candidato selecionado')+'</td><td>Sem linha oficial na base importada</td><td>'+fmt(cnt)+'</td></tr>');
 });
 table.innerHTML=schoolTable+'<h4>Detalhamento por seção</h4><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Zona</th><th>Seção</th><th>Cargo</th><th>Nº</th><th>Candidato</th><th>Votos oficiais</th><th>Cadastros na seção</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
function boot(){inject();window.addEventListener('gabinete:dados-atualizados',render);window.addEventListener('gabinete-sync-status',render);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
