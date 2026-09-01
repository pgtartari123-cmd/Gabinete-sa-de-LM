/* Bridge — módulo de equipe em nuvem, com fallback direto */
(function(){'use strict';
function carregarV6(cb){
  if(typeof window.abrirEquipeMembrosV6==='function'){cb();return}
  const s=document.createElement('script');
  s.src='equipe-gabinete-v6.js?v=9001';
  s.onload=cb;
  s.onerror=()=>alert('Não foi possível carregar o cadastro da equipe. Recarregue a página.');
  document.body.appendChild(s);
}
function abrirNuvem(){
  carregarV6(function(){
    if(typeof window.abrirEquipeMembrosV6==='function') window.abrirEquipeMembrosV6();
    else alert('O cadastro da equipe ainda está carregando. Toque novamente em alguns segundos.');
  });
}
function addButton(){
  const box=document.querySelector('#eqv3 .eqv3box');
  if(!box)return;
  let b=document.getElementById('abrirMembrosV6');
  if(!b){
    b=document.createElement('button');
    b.id='abrirMembrosV6'; b.type='button';
    b.textContent='☁️ Cadastrar / Gerenciar equipe';
    b.setAttribute('aria-label','Cadastrar ou gerenciar equipe');
    b.style.cssText='display:block;width:100%;margin:14px 0 4px;padding:15px;border-radius:12px;background:#0f766e;color:#fff;font-size:16px;font-weight:800;border:0;cursor:pointer;box-sizing:border-box;';
    b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();abrirNuvem();});
    const toolbar=box.querySelector('.eqv3toolbar');
    if(toolbar) toolbar.insertAdjacentElement('afterend',b); else box.appendChild(b);
  }
  box.querySelectorAll('button').forEach(x=>{
    const t=(x.textContent||'').toLowerCase();
    if(x.id!=='abrirMembrosV6' && /cadastrar|membros|gerenciar/.test(t)) x.style.display='none';
  });
}
new MutationObserver(addButton).observe(document.documentElement,{childList:true,subtree:true});
addButton();
})();
