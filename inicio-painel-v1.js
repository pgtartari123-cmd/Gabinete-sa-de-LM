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

  function avisar(msg){
    var old=document.getElementById('gabinetePagamentoAviso');
    if(old)old.remove();
    var e=document.createElement('div');
    e.id='gabinetePagamentoAviso';
    e.textContent=msg;
    e.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;padding:14px 18px;border-radius:12px;font:600 14px Arial;box-shadow:0 8px 30px #0006;max-width:90%;text-align:center';
    document.body.appendChild(e);
    setTimeout(function(){e.remove()},6000);
  }

  function comprarGabineteLM(){
    try{
      window.location.href='./pagamento.html?v=2002';
    }catch(e){
      console.error(e);
      avisar('⚠️ Não foi possível abrir a página de pagamento.');
    }
  }
  window.comprarGabineteLM=comprarGabineteLM;

  function inserirOferta(){
    if(document.getElementById('gabineteOfertaCompra'))return;
    var painel=document.getElementById('painel');
    if(!painel)return;
    var box=document.createElement('div');
    box.id='gabineteOfertaCompra';
    box.className='card destaque';
    box.style.cssText='margin-top:18px;border:1px solid rgba(0,0,0,.08);padding:20px';
    box.innerHTML='<h3>🚀 Comprar licença do sistema — Gabinete LM</h3><p>Você está adquirindo a licença completa do sistema para gestão do gabinete, cidadãos, demandas, agenda e relatórios.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:16px 0"><div style="border:1px solid #16a34a;border-radius:14px;padding:16px;background:#f0fdf4"><p style="margin:0 0 6px;font-weight:800;color:#166534">💠 Pagamento via Pix</p><strong style="font-size:26px;color:#166534">R$ 3.800,00</strong><p style="margin:5px 0 0;font-size:13px;color:#166534">Valor à vista</p></div><div style="border:1px solid #d9468f;border-radius:14px;padding:16px;background:#fff7fb"><p style="margin:0 0 6px;font-weight:800">💳 Cartão de crédito</p><strong style="font-size:26px">Até 10× de R$ 430,00</strong><p style="margin:5px 0 0;font-size:13px">Total de R$ 4.300,00. O valor final pode variar conforme as taxas da operadora.</p></div></div><button id="btnComprarGabineteLM" type="button" onclick="comprarGabineteLM()">🛒 Comprar licença do sistema</button><p style="font-size:12px;opacity:.7;margin-top:10px">Escolha a forma de pagamento na próxima etapa.</p>';
    painel.appendChild(box);
  }

  function iniciar(){
    painel();
    inserirOferta();
    var n=0;
    var t=setInterval(function(){
      n++;
      fecharLoginDuplicado();
      inserirOferta();
      if(integrar() || n>=40) clearInterval(t);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
