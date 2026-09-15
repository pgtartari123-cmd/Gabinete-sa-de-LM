/* GABINETE LM — CIDADE + ESTADO DE NASCIMENTO v13 */
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const ESTADOS=['Pará','Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Paraná','Paraíba','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'];
const norm=s=>String(s||'').trim().replace(/\s+/g,' '),ehEstado=v=>ESTADOS.some(x=>x.toLowerCase()===norm(v).toLowerCase());
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];d.agenda=Array.isArray(d.agenda)?d.agenda:[];return d}catch(e){return{people:[],agenda:[]}}};
const form=()=>document.getElementById('formCadastro');
function separar(v){const s=norm(v);if(!s)return{city:'',state:''};const re=new RegExp('^(.*?)\\s*(?:\\/|-|—|,)\\s*('+ESTADOS.join('|')+')$','i'),m=s.match(re);if(!m)return ehEstado(s)?{city:'',state:s}:{city:s,state:''};const city=norm(m[1]),state=norm(m[2]);return ehEstado(city)?{city:'',state}:{city,state}}
function campos(p){let city=norm(p?.cidadeNascimento||p?.cidadeOrigem||''),state=norm(p?.estadoNascimento||p?.estadoOrigem||'');if(ehEstado(city)){if(!state)state=city;city=''}if(!state){const x=separar(p?.origemNascimento||'');if(x.state){if(!city)city=x.city;state=x.state}}return{city,state}}
function inject(){const f=form(),el=f?.elements?.cidadeOrigem;if(!f||!el)return;const box=el.closest('.campo'),label=box?.querySelector('label');if(label)label.textContent='Cidade onde nasceu';el.placeholder='Ex.: Concórdia do Pará';if(!f.elements.estadoOrigem){const b=document.createElement('div');b.className='campo';b.innerHTML='<label>Estado onde nasceu</label><select name="estadoOrigem"><option value="">Selecione o estado</option>'+ESTADOS.map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select>';box?.parentNode?.insertBefore(b,box.nextSibling)}}
function preencherPessoa(p){const f=form();if(!f)return;const x=campos(p);if(f.elements.cidadeOrigem)f.elements.cidadeOrigem.value=x.city;if(f.elements.estadoOrigem)f.elements.estadoOrigem.value=x.state}
function formatar(p){const x=campos(p);return x.city&&x.state?x.city+' / '+x.state:x.city||x.state||'Não informado'}
function prepararDados(){const d=read();let mudou=false;d.people.forEach(p=>{const x=campos(p),o=x.city&&x.state?x.city+' / '+x.state:(x.city||x.state);if(norm(p.cidadeNascimento)!==x.city){p.cidadeNascimento=x.city;mudou=true}if(norm(p.estadoNascimento)!==x.state){p.estadoNascimento=x.state;mudou=true}if(norm(p.cidadeOrigem)!==x.city){p.cidadeOrigem=x.city;mudou=true}if(norm(p.estadoOrigem)!==x.state){p.estadoOrigem=x.state;mudou=true}if(norm(p.origemNascimento)!==o){p.origemNascimento=o;mudou=true}});if(mudou)localStorage.setItem(KEY,JSON.stringify(d))}
window.GabineteLM_OrigemFix={formatar,inject,prepararDados};
function envolverEdicao(){if(typeof window.editarCadastro!=='function'||window.editarCadastro.__origemV13)return;const original=window.editarCadastro,wrapped=function(id){original(id);setTimeout(()=>{const p=read().people.find(x=>x.id===id);if(p)preencherPessoa(p)},80)};wrapped.__origemV13=true;window.editarCadastro=wrapped}
function iniciar(){prepararDados();inject();envolverEdicao()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
setInterval(()=>{inject();envolverEdicao()},3000);
})();