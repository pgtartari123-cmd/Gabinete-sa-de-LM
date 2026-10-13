
/* Mapa eleitoral — importação de resultados oficiais do TSE e comparação agregada por seção */
(function(){
'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession',AT='gabineteAccessToken',LOCAL='gabineteResultadosTSEv1';
const $=id=>document.getElementById(id);
const norm=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localData(){try{const d=JSON.parse(localStorage.getItem(DB)||'{}');return Array.isArray(d.people)?d.people:[]}catch(e){return[]}}
function cfg(){try{return JSON.parse(localStorage.getItem(CFG)||'null')}catch(e){return null}}
function token(){try{return localStorage.getItem(AT)||JSON.parse(localStorage.getItem(SES)||'null')?.access_token||''}catch(e){return''}}
function api(path,opts){const c=cfg();if(!c?.url||!c?.anonKey||!token())throw Error('Entre no sistema e confirme a conexão para sincronizar os resultados eleitorais.');return fetch(String(c.url).replace(/\/+$/,'')+'/rest/v1/'+path,Object.assign({headers:{apikey:c.anonKey,Authorization:'Bearer '+token(),'Content-Type':'application/json'}},opts||{})).then(async r=>{if(!r.ok)throw Error('Supabase HTTP '+r.status+': '+(await r.text()).slice(0,220));const t=await r.text();return t?JSON.parse(t):null})}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return('tse_'+(h>>>0).toString(16).padStart(8,'0')+'_'+s.length)}
function csv(text){text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0]||'';const delim=(first.match(/;/g)||[]).length> (first.match(/,/g)||[]).length?';':',';const out=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){v+='"';i++}else q=!q}else if(c===delim&&!q){row.push(v);v=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>String(x).trim()))out.push(row);row=[];v=''}else v+=c}row.push(v);if(row.some(x=>String(x).trim()))out.push(row);if(out.length<2)throw Error('O arquivo não parece ser um CSV com cabeçalho e linhas de resultado.');const heads=out.shift().map(x=>norm(x).replace(/[^a-z0-9_]/g,''));return out.map(r=>Object.fromEntries(heads.map((h,i)=>[h,String(r[i]||'').trim()])))}
function pick(o,names){for(const n of names){const v=o[norm(n).replace(/[^a-z0-9_]/g,'')];if(v!=null&&v!=='')return v}return''}
function normalizeRow(o,meta){
 const year=Number(pick(o,['ANO_ELEICAO','ano_eleicao'])||meta.year),turn=Number(pick(o,['NR_TURNO','turno'])||meta.turn||1);
 const municipality=pick(o,['NM_MUNICIPIO','municipio'])||meta.municipio;
 const zone=String(pick(o,['NR_ZONA','zona'])||'').trim().padStart(3,'0'),section=String(pick(o,['NR_SECAO','seção','secao'])||'').trim().padStart(4,'0');
 const office=pick(o,['DS_CARGO','cargo']),candidate=pick(o,['NM_VOTAVEL','nome_candidato']),number=pick(o,['NR_VOTAVEL','numero_candidato']);
 const votes=Number(String(pick(o,['QT_VOTOS','votos'])||'0').replace(/\./g,'').replace(',','.'));
 if(!year||!municipality||!zone||!section||!office||!candidate||!Number.isFinite(votes))return null;
 const uf=pick(o,['SG_UF','uf'])||meta.uf||'PA',code=pick(o,['CD_MUNICIPIO','codigo_municipio']);
 const typ=pick(o,['NM_TIPO_ELEICAO','tipo_eleicao'])||meta.tipo|| (year%2===0?'Eleições gerais/municipais':'Eleição');
 const key=[year,turn,uf,code,municipality,zone,section,office,number,candidate].join('|');
 return{id:hash(key),ano_eleicao:year,tipo_eleicao:typ,turno:turn,uf,codigo_municipio:code||null,municipio,zona:zone,secao:section,cargo:office,numero_candidato:number||null,nome_candidato:candidate,votos:Math.max(0,Math.round(votes)),origem:'TSE'};
}
function inject(){
 const sec=$('mapaEleitoralGabinete');if(!sec||$('melTsePainel'))return;
 const panel=document.createElement('div');panel.id='melTsePainel';panel.className='card';panel.style.cssText='padding:14px;margin-bottom:14px';
 panel.innerHTML='<h3>📊 Resultados oficiais e conferência por seção</h3><p>Importe o CSV de resultados por seção baixado no portal de Dados Abertos do TSE. Os resultados ficam separados dos cadastros e são sincronizados com o banco do gabinete.</p><div class="form-grid"><div class="campo"><label>Município</label><input id="melTseMunicipio" value="Concórdia do Pará" placeholder="Município do arquivo"></div><div class="campo"><label>UF</label><select id="melTseUF"><option value="PA" selected>PA</option><option value="AC">AC</option><option value="AL">AL</option><option value="AM">AM</option><option value="AP">AP</option><option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option><option value="MG">MG</option><option value="MS">MS</option><option value="MT">MT</option><option value="PB">PB</option><option value="PE">PE</option><option value="PI">PI</option><option value="PR">PR</option><option value="RJ">RJ</option><option value="RN">RN</option><option value="RO">RO</option><option value="RR">RR</option><option value="RS">RS</option><option value="SC">SC</option><option value="SE">SE</option><option value="SP">SP</option><option value="TO">TO</option></select></div><div class="campo"><label>Tipo de eleição</label><select id="melTseTipo"><option>Eleições municipais</option><option>Eleições gerais</option><option>Outra eleição</option></select></div><div class="campo"><label>Ano da eleição</label><input id="melTseAno" type="number" min="1994" max="2100" value="2024"></div><div class="campo"><label>Turno</label><select id="melTseTurno"><option value="1">1º turno</option><option value="2">2º turno</option></select></div><div class="campo campo-grande"><label>Arquivo CSV oficial do TSE</label><input id="melTseArquivo" type="file" accept=".csv,text/csv"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button id="melTseImportar" type="button">⬆️ Importar resultados</button><button id="melTseAtualizar" type="button" class="btn-secundario">☁️ Carregar resultados salvos</button></div><div id="melTseStatus" aria-live="polite" style="margin:8px 0"></div><hr><h3>Conferência por zona e seção</h3><div class="form-grid"><div class="campo"><label>Zona</label><input id="melTseFiltroZona" placeholder="Ex.: 015"></div><div class="campo"><label>Seção</label><input id="melTseFiltroSecao" placeholder="Ex.: 0209"></div><div class="campo"><label>Cargo</label><select id="melTseFiltroCargo"><option value="">Todos os cargos</option></select></div><div class="campo"><label>Buscar candidato</label><input id="melTseFiltroCand" placeholder="Nome ou número"></div></div><div id="melTseResumo" style="margin:10px 0"></div><div id="melTseTabela"></div>';
 sec.appendChild(panel);
 ['melTseFiltroZona','melTseFiltroSecao','melTseFiltroCand','melTseAno','melTseTurno','melTseTipo','melTseMunicipio','melTseUF','melTseFiltroCargo'].forEach(id=>$(id)?.addEventListener('input',render));
 $('melTseImportar').addEventListener('click',importFile);$('melTseAtualizar').addEventListener('click',loadResults);
 loadResults();
}
function readLocal(){try{return JSON.parse(localStorage.getItem(LOCAL)||'[]')}catch(e){return[]}}
function saveLocal(rows){localStorage.setItem(LOCAL,JSON.stringify(rows))}
async function loadResults(){
 const status=$('melTseStatus');if(status)status.textContent='Carregando resultados eleitorais salvos…';
 try{const remote=await api('resultados_eleitorais?select=*&order=ano_eleicao.desc&limit=50000');const map=new Map();[...readLocal(),...(remote||[])].forEach(r=>map.set(r.id,r));saveLocal([...map.values()]);if(status)status.textContent='Resultados carregados: '+map.size+' registro(s).';render()}
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
  $('melTseStatus').textContent='Importação concluída: '+uploaded+' linhas sincronizadas. Fonte: arquivo oficial do TSE. '+all.length+' registros mantidos neste aparelho.';
  render();
 }catch(e){$('melTseStatus').textContent='Importação não concluída: '+e.message+' Nenhum cadastro de cidadão foi alterado. Os resultados locais anteriores foram preservados.'}
 finally{btn.disabled=false}
}
function render(){
 const table=$('melTseTabela');if(!table)return;
 const all=readLocal(),year=Number($('melTseAno')?.value||0),turn=Number($('melTseTurno')?.value||1),mun=norm($('melTseMunicipio')?.value||''),uf=$('melTseUF')?.value||'PA',type=$('melTseTipo')?.value||'',zone=($('melTseFiltroZona')?.value||'').trim(),section=($('melTseFiltroSecao')?.value||'').trim(),cand=norm($('melTseFiltroCand')?.value||''),office=$('melTseFiltroCargo')?.value||'';
 let base=all.filter(r=>r.ano_eleicao===year&&r.turno===turn&&norm(r.municipio)===mun&&r.uf===uf);
 const offices=[...new Set(base.map(r=>r.cargo))].sort();const sel=$('melTseFiltroCargo');if(sel){const current=sel.value;if(sel.dataset.options!==offices.join('|')){sel.innerHTML='<option value="">Todos os cargos</option>'+offices.map(o=>'<option>'+esc(o)+'</option>').join('');sel.dataset.options=offices.join('|');if(offices.includes(current))sel.value=current}}
 const filtered=base.filter(r=>(!zone||r.zona.includes(zone))&&(!section||r.secao.includes(section))&&(!office||r.cargo===office)&&(!cand||(norm(r.nome_candidato).includes(cand)||String(r.numero_candidato||'').includes(cand))));
 const people=localData().filter(p=>(!zone||String(p.zonaEleitoral||'').padStart(3,'0').includes(zone))&&(!section||String(p.secaoEleitoral||'').padStart(4,'0').includes(section)));
 const uniquePeople=new Set(people.map(p=>String(p.id||p.cpf||p.nome||'')).filter(Boolean)).size;
 $('melTseResumo').innerHTML='<div class="painel-grid" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr))"><div class="card"><small>Resultados carregados (filtro)</small><h3>'+filtered.length+'</h3></div><div class="card"><small>Cidadãos únicos cadastrados nas seções filtradas</small><h3>'+uniquePeople+'</h3></div><div class="card"><small>Votos somados nas linhas filtradas</small><h3>'+filtered.reduce((n,r)=>n+r.votos,0).toLocaleString('pt-BR')+'</h3></div></div><p style="font-size:12px;color:#666">Os cidadãos cadastrados e os votos oficiais são indicadores agregados diferentes. Não representam vínculo entre uma pessoa atendida e o voto de um candidato.</p>';
 if(!filtered.length){table.innerHTML='<div class="card vazio">Nenhum resultado para esses filtros. Importe o CSV oficial do TSE ou ajuste eleição, turno, município, zona e seção.</div>';return}
 const sorted=filtered.slice().sort((a,b)=>String(a.zona).localeCompare(String(b.zona),undefined,{numeric:true})||String(a.secao).localeCompare(String(b.secao),undefined,{numeric:true})||a.cargo.localeCompare(b.cargo)||b.votos-a.votos);
 table.innerHTML='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Zona</th><th>Seção</th><th>Cargo</th><th>Nº</th><th>Candidato</th><th>Votos oficiais</th><th>Atendimentos únicos na seção</th></tr></thead><tbody>'+sorted.map(r=>{const cnt=new Set(localData().filter(p=>String(p.zonaEleitoral||'').padStart(3,'0')===r.zona&&String(p.secaoEleitoral||'').padStart(4,'0')===r.secao).map(p=>String(p.id||p.cpf||p.nome||'')).filter(Boolean)).size;return'<tr><td>'+esc(r.zona)+'</td><td>'+esc(r.secao)+'</td><td>'+esc(r.cargo)+'</td><td>'+esc(r.numero_candidato||'—')+'</td><td>'+esc(r.nome_candidato)+'</td><td><strong>'+r.votos.toLocaleString('pt-BR')+'</strong></td><td>'+cnt+'</td></tr>'}).join('')+'</tbody></table></div>';
}
document.addEventListener('DOMContentLoaded',()=>{inject();setInterval(inject,1500)});
})();
