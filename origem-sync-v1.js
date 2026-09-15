/* GABINETE LM — sincronização de cidade + estado de nascimento */
(function(){'use strict';
const DB='gabineteDigitalDemo',CFG='gabineteSupabaseConfig',SES='gabineteSupabaseSession',AT='gabineteAccessToken';
const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
const cfg=()=>{try{return JSON.parse(get.call(localStorage,CFG)||'null')}catch(e){return null}};
const token=()=>get.call(localStorage,AT)||(()=>{try{return JSON.parse(get.call(localStorage,SES)||'{}').access_token||''}catch(e){return''}})();
const base=()=>String(cfg()?.url||'').replace(/\/+$/,'');
const estados='Pará|Acre|Alagoas|Amapá|Amazonas|Bahia|Ceará|Distrito Federal|Espírito Santo|Goiás|Maranhão|Mato Grosso|Mato Grosso do Sul|Minas Gerais|Paraná|Paraíba|Pernambuco|Piauí|Rio de Janeiro|Rio Grande do Norte|Rio Grande do Sul|Rondônia|Roraima|Santa Catarina|São Paulo|Sergipe|Tocantins';
function origem(p){const cidade=String(p.cidadeNascimento||p.cidadeOrigem||'').trim(),estado=String(p.estadoNascimento||p.estadoOrigem||'').trim();if(cidade&&estado)return cidade+' / '+estado;return String(p.origemNascimento||cidade||estado||'').trim()||null}
function parse(v){const s=String(v||'').trim(),m=s.match(new RegExp('^(.*?)\\s*(?:/|-|—|,)\\s*('+estados+')$','i'));return m?{cidade:m[1].trim(),estado:m[2].trim()}:{cidade:s,estado:''}}
async function run(){const c=cfg(),t=token();if(!c?.url||!c?.anonKey||!t)return;try{const d=JSON.parse(get.call(localStorage,DB)||'{"people":[],"agenda":[]}');if(!Array.isArray(d.people)||!d.people.length)return;const rows=d.people.map(p=>({id:p.id,cidade_origem:origem(p)}));const r=await fetch(base()+'/rest/v1/cidadaos?on_conflict=id',{method:'POST',headers:{apikey:c.anonKey,Authorization:'Bearer '+t,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});if(!r.ok)return;const raw=get.call(localStorage,DB);const local=JSON.parse(raw);local.people.forEach(p=>{const x=parse(origem(p));if(x.cidade&&!p.cidadeNascimento)p.cidadeNascimento=x.cidade;if(x.estado&&!p.estadoNascimento)p.estadoNascimento=x.estado;if(x.estado&&!p.estadoOrigem)p.estadoOrigem=x.estado;if(x.cidade&&!p.cidadeOrigem)p.cidadeOrigem=x.cidade;if(x.cidade||x.estado)p.origemNascimento=x.cidade&&x.estado?x.cidade+' / '+x.estado:(x.cidade||x.estado)});set.call(localStorage,DB,JSON.stringify(local))}catch(e){console.warn('Origem sync:',e)}}
window.GabineteLM_OrigemSync=run;
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1800),{once:true});
})();