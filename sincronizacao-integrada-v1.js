/* Gabinete Digital — integra o login principal com a sincronização Supabase.
   O usuário faz login uma única vez; o módulo banco-v5 não deve pedir uma segunda senha. */
(function(){
  'use strict';
  function fecharLoginDuplicado(){
    var m=document.getElementById('gabineteLoginV5');
    if(m) m.remove();
  }
  function sincronizarQuandoAutenticado(){
    fecharLoginDuplicado();
    var token=localStorage.getItem('gabineteAccessToken');
    if(token && window.GabineteDB && typeof window.GabineteDB.sincronizar==='function'){
      window.GabineteDB.sincronizar().catch(function(e){console.warn('Sincronização integrada:',e)});
      return true;
    }
    return false;
  }
  document.addEventListener('DOMContentLoaded',function(){
    var tentativas=0;
    var timer=setInterval(function(){
      tentativas++;
      fecharLoginDuplicado();
      if(sincronizarQuandoAutenticado() || tentativas>=30) clearInterval(timer);
    },250);
  });
})();
