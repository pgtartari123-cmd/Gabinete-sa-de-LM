/* Gabinete Digital — inicialização e login/sincronização integrados */
(function(){
  'use strict';
  function painel(){
    try{
      if(typeof window.mostrarAba==='function') window.mostrarAba('painel');
      else {
        document.querySelectorAll('.tab').forEach(function(el){el.style.display='none'});
        var p=document.getElementById('painel');
        if(p)p.style.display='block';
      }
      window.scrollTo(0,0);
    }catch(e){console.warn(e)}
  }
  function fecharLoginDuplicado(){
    var m=document.getElementById('gabineteLoginV5');
    if(m)m.remove();
  }
  function integrar(){
    fecharLoginDuplicado();
    var token=localStorage.getItem('gabineteAccessToken');
    if(token && window.GabineteDB && typeof window.GabineteDB.sincronizar==='function'){
      window.GabineteDB.sincronizar().catch(function(e){console.warn('Sincronização:',e)});
      return true;
    }
    return false;
  }
  function iniciar(){
    painel();
    var n=0;
    var t=setInterval(function(){
      n++;
      fecharLoginDuplicado();
      if(integrar() || n>=40) clearInterval(t);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
