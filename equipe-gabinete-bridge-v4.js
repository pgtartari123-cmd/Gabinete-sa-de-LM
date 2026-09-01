/* Bridge v6 — botão de cadastro de membros sempre visível */
(function(){'use strict';
function addButton(){
  const box=document.querySelector('#eqv3 .eqv3box');
  if(!box || document.getElementById('abrirMembrosV6')) return;
  const b=document.createElement('button');
  b.id='abrirMembrosV6';
  b.type='button';
  b.textContent='👥 Cadastrar / Gerenciar membros';
  b.style.cssText='display:block;width:100%;margin:14px 0 4px;padding:15px;border-radius:12px;background:#0f766e;color:#fff;font-size:16px;font-weight:800;border:0;cursor:pointer;box-sizing:border-box;';
  b.onclick=function(){
    if(typeof window.abrirEquipeMembrosV4==='function') window.abrirEquipeMembrosV4();
    else alert('O módulo de membros ainda está carregando. Feche e abra Equipe novamente.');
  };
  const toolbar=box.querySelector('.eqv3toolbar');
  if(toolbar) toolbar.insertAdjacentElement('afterend',b); else box.appendChild(b);
}
new MutationObserver(addButton).observe(document.documentElement,{childList:true,subtree:true});
addButton();
})();
