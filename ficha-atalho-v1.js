/* GABINETE DIGITAL — atalho para Ficha 360
   Faz o botão "Ver cadastro" abrir a ficha completa do cidadão. */
(function(){
  'use strict';
  function instalar(){
    if(typeof window.verFichaCidadao!=='function')return false;
    window.verCadastro=function(id){
      window.verFichaCidadao(id);
    };
    return true;
  }
  if(!instalar()){
    let tentativas=0;
    const timer=setInterval(()=>{
      tentativas++;
      if(instalar()||tentativas>40)clearInterval(timer);
    },250);
  }
})();
