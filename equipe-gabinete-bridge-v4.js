/* Bridge v5 — conecta permissões à gestão de membros com botão visível no mobile */
(function(){'use strict';
function bridge(){
  const old=window.abrirEquipeGabinete;
  if(typeof old!=='function'||window.__eq5bridge)return;
  window.__eq5bridge=true;
  window.abrirEquipeGabinete=function(){
    old();
    setTimeout(()=>{
      const box=document.querySelector('#eqv3 .eqv3box');
      if(!box||box.querySelector('#abrirMembrosV4'))return;
      const b=document.createElement('button');
      b.id='abrirMembrosV4';
      b.type='button';
      b.textContent='👥 Gerenciar membros da equipe';
      b.className='eqv3save';
      b.style.cssText='display:block;width:100%;margin:12px 0 0;padding:13px;border-radius:12px;background:#4f46e5;color:#fff;font-weight:800;border:0;cursor:pointer;';
      b.onclick=()=>window.abrirEquipeMembrosV4&&window.abrirEquipeMembrosV4();
      const toolbar=box.querySelector('.eqv3toolbar');
      if(toolbar) toolbar.insertAdjacentElement('afterend',b); else box.appendChild(b);
    },120);
  };
}
bridge();
window.addEventListener('load',bridge);
})();
