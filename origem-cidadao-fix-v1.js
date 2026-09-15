/* GABINETE LM — LOCAL DE ORIGEM / RESIDÊNCIA v3 */
(function(){'use strict';
const KEY='gabineteDigitalDemo';
const ESTADOS=['Pará','Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Paraná','Paraíba','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'];
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[],"agenda":[]}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[],agenda:[]}}};
const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
function separar(v){const s=norm(v);if(!s)return{city:'',state:''};const re=new RegExp('^(.*?)\\s*(?:\\/|-|—|,)\\s*('+ESTADOS.join('|')+')$','i');const m=s.match(re);if(m)return{city:norm(m[1]),state:norm(m[2])};return{city:s,state:''}}
function form(){return document.getElementById('formCadastro')}
function inject(){const f=form(),el=f?.elements?.cidadeOrigem;if(!el||f.dataset.origemV3)return;f.dataset.origemV3='1';const box=el.closest('.campo');const label=box?.querySelector('label');if(label)label.textContent='Cidade onde mora / Estado';el.placeholder='Ex.: Concórdia do Pará / Pará';const old=f.elements.estadoOrigem;if(old){const oldBox=old.closest('.campo');if(oldBox)oldBox.remove()}}
function preencher(){const f=form();const el=f?.elements?.cidadeOrigem;if(!el)return;const nome=norm(f.elements.nome?.value);if(!nome)return;const p=read().people.find(x=>norm(x.nome)===nome);if(!p)return;const raw=p.origemNascimento||p.cidadeOrigem||p.cidadeResidencia||p.municipio||p.cidade||'';if(raw)el.value=norm(raw)}
function salvar(){const f=form();const el=f?.elements?.cidadeOrigem;if(!f||!el)return;const v=norm(el.value);if(!v)return;const d=read(),nome=norm(f.elements.nome?.value),p=d.people.find(x=>norm(x.nome)===nome)||d.people[0];if(!p)return;p.cidadeOrigem=v;p.origemNascimento=v;localStorage.setItem(KEY,JSON.stringify(d));try{window.GabineteDB?.sincronizar?.()}catch(e){}}
function formatar(p){let raw=norm(p?.origemNascimento||p?.cidadeOrigem||p?.cidadeResidencia||p?.municipio||p?.cidade||'');let city=norm(p?.cidadeOrigem||p?.cidadeResidencia||p?.municipio||p?.cidade||'');let state=norm(p?.estadoOrigem||p?.estadoNascimento||'');if(city&&state){if(city.toLowerCase()===state.toLowerCase())return state;return city+' / '+state}if(raw){const x=separar(raw);if(x.city&&x.state)return x.city+' / '+x.state;return raw}return state||'Não informado'}
function prepararDados(){const d=read();let alterou=false;d.people.forEach(p=>{const raw=norm(p.origemNascimento||p.cidadeOrigem||p.cidadeResidencia||p.municipio||p.cidade||'');if(raw&&!p.cidadeOrigem){p.cidadeOrigem=raw;alterou=true}if(raw&&!p.origemNascimento){p.origemNascimento=raw;alterou=true}});if(alterou)localStorage.setItem(KEY,JSON.stringify(d))}
window.GabineteLM_OrigemFix={formatar,inject,prepararDados};
function iniciar(){prepararDados();inject();setTimeout(preencher,200);const f=form();if(f&&!f.dataset.origemListenerV3){f.dataset.origemListenerV3='1';f.addEventListener('submit',()=>setTimeout(salvar,0))}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
setInterval(()=>{prepararDados();inject();preencher()},1500);
})();
