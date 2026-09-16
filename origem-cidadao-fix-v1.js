/* GABINETE LM — ORIGEM CENTRAL v17
   Normaliza origens antigas sem inventar cidade e impede que sincronização
   volte a gravar formatos como PARÁ / Pará / Pará.
*/
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const ESTADOS=['Pará','Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Minas Gerais','Paraná','Paraíba','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'];
const norm=s=>String(s??'').trim().replace(/\s+/g,' '),estado=v=>ESTADOS.find(x=>x.toLowerCase()===norm(v).toLowerCase())||'';
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(e){return{people:[],agenda:[]}}};
function separar(v){const s=norm(v);if(!s)return{city:'',state:''};const parts=s.split(/\s*(?:\/|-|—|,)\s*/).filter(Boolean);let st='',cities=[];parts.forEach(part=>{const e=estado(part);if(e)st=e;else cities.push(part)});return st?{city:norm(cities.join(' / ')),state:st}:estado(s)?{city:'',state:estado(s)}:{city:s,state:''}}
function campos(p){
 let city=norm(p?.cidadeNascimento), state=estado(p?.estadoNascimento);
 const origem=norm(p?.origemNascimento);
 const origemParsed=separar(origem);
 const cityParsed=separar(p?.cidadeOrigem);
 if(!city){if(cityParsed.city)city=cityParsed.city;else if(origemParsed.city)city=origemParsed.city}
 if(!state){state=estado(p?.estadoOrigem)||origemParsed.state||cityParsed.state}
 if(isEstado(city))city='';
 if(isEstado(state)===false)state='';
 return{city:norm(city),state};
}
function isEstado(v){return !!estado(v)}
function formatar(p){const x=campos(p);return x.city&&x.state?x.city+' / '+x.state:x.city||x.state||'Não informado'}
function origemNormalizada(p){const x=campos(p);return x.city&&x.state?x.city+' / '+x.state:x.city||x.state||''}
function inject(){const f=document.getElementById('formCadastro'),el=f?.elements?.cidadeOrigem;if(!f||!el)return;const box=el.closest('.campo'),lab=box?.querySelector('label');if(lab)lab.textContent='Cidade onde nasceu';el.placeholder='Ex.: Belém';if(!f.elements.estadoOrigem){const b=document.createElement('div');b.className='campo';b.innerHTML='<label>Estado onde nasceu</label><select name="estadoOrigem"><option value="">Selecione o estado</option>'+ESTADOS.filter((x,i,a)=>a.indexOf(x)===i).map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select>';box?.parentNode?.insertBefore(b,box.nextSibling)}}
function preencher(p){const f=document.getElementById('formCadastro');if(!f)return;const x=campos(p);if(f.elements.cidadeOrigem)f.elements.cidadeOrigem.value=x.city;if(f.elements.estadoOrigem)f.elements.estadoOrigem.value=x.state}
function preparar(){const d=read();let mudou=false;d.people.forEach(p=>{const x=campos(p),o=x.city&&x.state?x.city+' / '+x.state:x.city||x.state;if(norm(p.cidadeNascimento)!==x.city){p.cidadeNascimento=x.city;mudou=true}if(norm(p.estadoNascimento)!==x.state){p.estadoNascimento=x.state;mudou=true}if(norm(p.cidadeOrigem)!==x.city){p.cidadeOrigem=x.city;mudou=true}if(norm(p.estadoOrigem)!==x.state){p.estadoOrigem=x.state;mudou=true}if(norm(p.origemNascimento)!==o){p.origemNascimento=o;mudou=true}});if(mudou)localStorage.setItem(KEY,JSON.stringify(d));return{d,mudou}}
function token(){try{return localStorage.getItem('gabineteAccessToken')||JSON.parse(localStorage.getItem('gabineteSupabaseSession')||'{}').access_token||''}catch(e){return''}}
function cfg(){try{return JSON.parse(localStorage.getItem('gabineteSupabaseConfig')||'null')}catch(e){return null}}
async function salvarNuvem(id,origem){const c=cfg(),t=token();if(!c?.url||!c?.anonKey||!t||!id||!origem)return false;try{const r=await fetch(String(c.url).replace(/\/+$/,'')+'/rest/v1/cidadaos?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{apikey:c.anonKey,Authorization:'Bearer '+t,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({cidade_origem:origem,atualizado_em:new Date().toISOString()})});return r.ok}catch(e){console.warn('Origem central:',e);return false}}
async function migrarAntigos(){const {d}=preparar();if(!navigator.onLine)return;let enviados=0;for(const p of d.people){const origem=origemNormalizada(p);if(!p?.id||!origem)continue;const bruto=norm(p.origemNascimento);if(bruto!==origem){if(await salvarNuvem(p.id,origem))enviados++}}if(enviados)console.log('[Gabinete LM] Migração de origem antiga concluída:',enviados)}
function salvarOrigem(){const f=document.getElementById('formCadastro');if(!f)return;const nome=norm(f.elements.nome?.value),rawCity=norm(f.elements.cidadeOrigem?.value),rawState=estado(f.elements.estadoOrigem?.value);if(!nome||(!rawCity&&!rawState))return;const x=separar(rawCity+(rawState?' / '+rawState:'')),city=x.city,state=rawState||x.state,origem=city&&state?city+' / '+state:city||state;if(!origem)return;const d=read(),p=d.people.find(x=>norm(x.nome)===nome);if(!p)return;p.cidadeNascimento=city;p.estadoNascimento=state;p.cidadeOrigem=city;p.estadoOrigem=state;p.origemNascimento=origem;p.atualizadoEm=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(d));setTimeout(()=>salvarNuvem(p.id,origem),100)}
function envolverEdicao(){if(typeof window.editarCadastro!=='function'||window.editarCadastro.__origemV17)return;const old=window.editarCadastro,wrapped=function(id){old(id);setTimeout(()=>{const p=read().people.find(x=>x.id===id);if(p)preencher(p)},100)};wrapped.__origemV17=true;window.editarCadastro=wrapped}
function iniciar(){preparar();inject();envolverEdicao();const f=document.getElementById('formCadastro');if(f&&!f.dataset.origemCentral17){f.dataset.origemCentral17='1';f.addEventListener('submit',()=>setTimeout(salvarOrigem,500))}setTimeout(migrarAntigos,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.GabineteLM_OrigemFix={formatar,inject,prepararDados:preparar};
setInterval(()=>{inject();envolverEdicao()},3000);
})();