/* Bridge Equipe — compatibilidade mínima com o gerenciador cloud atual. */
(function(){
  'use strict';
  function abrir(){
    if(typeof window.abrirEquipeMembrosV6==='function') return window.abrirEquipeMembrosV6();
    alert('O gerenciador de equipe ainda está carregando. Tente novamente em alguns segundos.');
  }
  window.abrirEquipeGabinete=abrir;
  window.abrirEquipeMembrosBridge=abrir;
  window.GabineteEquipeCloud={open:abrir};
})();
