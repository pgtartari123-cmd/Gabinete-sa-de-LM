/* Bridge — força o módulo de equipe em nuvem */
(function(){'use strict';
function carregarV6(cb){
  if(typeof window.abrirEquipeMembrosV6==='function'){cb();return}
  const s=document.createElement('script');
  s.src='equipe-gabinete-v6.js?v=7001';
  s.onload=cb;
  s.onerror=()=>alert('Não foi possível carregar o módulo de equipe em nuvem. Recarregue a página.');
  document.body.appendChild(s);
}
function addButton(){
  const box=document.querySelector('#eqv3 .eqv3box');
  if(!box)return;
  let b=document.getElementById('abrirMembrosV6');
  if(!b){
    b=document.createElement('button');
    b.id='abrirMembrosV6'; b.type='button';
    b.textContent='☁️ Cadastrar / Gerenciar equipe na nuvem';
    b.style.cssText='display:block;width:100%;margin:14px 0 4px;padding:15px;border-radius:12px;background:#0f766e;color:#fff;font-size:16px;font-weight:800;border:0;cursor:pointer;box-sizing:border-box;';
    b.onclick=function(){carregarV6(()=>window.abrirEquipeMembrosV6())};
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
