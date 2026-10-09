/* Gabinete Lene Martins — notificações locais e lembretes */
(function(){
'use strict';
const DB_KEY='gabineteDigitalDemo', SEEN_KEY='gabineteNotificacoesV1';
const readDB=()=>{try{return JSON.parse(localStorage.getItem(DB_KEY)||'{"people":[],"agenda":[]}')}catch(_){return{people:[],agenda:[]}}};
const readSeen=()=>{try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')}catch(_){return{}}};
const saveSeen=x=>localStorage.setItem(SEEN_KEY,JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function panel(){
 if(document.getElementById('gabNotifPanel'))return;
 const agenda=document.getElementById('agenda');if(!agenda)return;
 const box=document.createElement('div');box.id='gabNotifPanel';box.className='card';box.style.cssText='margin:14px 0;padding:16px;border:1px solid #f0b8d1;border-radius:14px;background:#fff8fb';
 box.innerHTML='<h3>🔔 Notificações deste celular</h3><p style="margin:6px 0 12px">Receba alertas de aniversários e compromissos neste aparelho. Para testar, autorize as notificações abaixo.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="gabNotifEnable">Ativar notificações</button><button type="button" id="gabNotifTest" class="btn-secundario">Enviar notificação de teste</button></div><p id="gabNotifStatus" role="status" style="font-size:13px;margin-top:10px"></p><p style="font-size:12px;color:#64748b;margin-top:8px">Nesta primeira etapa, os lembretes são verificados enquanto o sistema está aberto. Para alertas garantidos com o app fechado, a próxima etapa será ativar o serviço de notificações push no servidor.</p>';
 const form=document.getElementById('formAgenda');if(form)form.insertAdjacentElement('afterend',box);else agenda.appendChild(box);
 box.querySelector('#gabNotifEnable').addEventListener('click',enable);
 box.querySelector('#gabNotifTest').addEventListener('click',test);
 status();
}
function status(){const el=document.getElementById('gabNotifStatus');if(!el)return;if(!('Notification'in window)){el.textContent='Este navegador não oferece notificações. Abra o sistema em um navegador compatível.';return}el.textContent=Notification.permission==='granted'?'✅ Notificações autorizadas neste aparelho.':Notification.permission==='denied'?'⚠️ Permissão bloqueada. Ative nas configurações do navegador/celular.':'Permissão ainda não concedida.'}
async function enable(){if(!('Notification'in window)){alert('Este navegador não oferece suporte a notificações.');return}try{const p=await Notification.requestPermission();status();if(p==='granted'){notify('Gabinete Lene Martins','Notificações ativadas neste aparelho.');checkReminders()}}catch(e){const el=document.getElementById('gabNotifStatus');if(el)el.textContent='Não foi possível ativar: '+e.message}}
function notify(title,body,tag){if(!('Notification'in window)||Notification.permission!=='granted')return;try{if('serviceWorker'in navigator){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:'./icons/icon-192.svg',badge:'./icons/icon-192.svg',tag:tag||'gabinete-'+Date.now(),renotify:false,data:{url:'./'}})).catch(()=>new Notification(title,{body,tag:tag||'gabinete'}))}else new Notification(title,{body,tag:tag||'gabinete'})}catch(e){console.warn('Notificação:',e)}}
function test(){if(!('Notification'in window)||Notification.permission!=='granted'){enable();return}notify('🔔 Teste — Gabinete Lene Martins','Deu certo! Este celular está autorizado a exibir notificações.','gabinete-teste');}
function dateBirth(v){v=String(v||'').trim();let m=v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);if(m)return{d:+m[1],m:+m[2]};m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return{d:+m[3],m:+m[2]};return null}
function checkReminders(){
 if(!('Notification'in window)||Notification.permission!=='granted')return;
 const db=readDB(),seen=readSeen(),now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 (db.people||[]).forEach(p=>{const b=dateBirth(p.nascimento);if(!b||b.d!==now.getDate()||b.m!==now.getMonth()+1)return;const key='birthday:'+today+':'+p.id;if(seen[key])return;notify('🎂 Aniversário hoje',String(p.nome||'Cidadão')+' faz aniversário hoje.','gabinete-'+key);seen[key]=true});
 (db.agenda||[]).forEach(a=>{if(!a.data||a.status==='Concluído'||a.status==='Cancelado')return;const parts=String(a.data).split('-').map(Number);if(parts.length!==3)return;const at=new Date(parts[0],parts[1]-1,parts[2],...(String(a.hora||'00:00').split(':').map(Number)));const diff=at.getTime()-now.getTime();if(diff<0||diff>30*60*1000)return;const key='agenda:'+a.id+':'+today+':'+String(a.hora||'');if(seen[key])return;const mins=Math.max(0,Math.round(diff/60000));notify('📅 Compromisso próximo',String(a.assunto||'Compromisso')+' começa '+(mins===0?'agora':'em '+mins+' min')+(a.hora?' ('+a.hora+')':'')+'.','gabinete-'+key);seen[key]=true});
 saveSeen(seen);
}
function init(){panel();status();checkReminders();setInterval(checkReminders,60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkReminders()});window.addEventListener('focus',checkReminders);window.addEventListener('online',checkReminders);const old=window.mostrarAba; if(typeof old==='function'&&!old.__notifWrapped){const wrapped=function(name){const r=old.apply(this,arguments);if(name==='agenda')setTimeout(panel,0);return r};wrapped.__notifWrapped=true;window.mostrarAba=wrapped}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();