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

  async function comprarGabineteLM(){
    var token=localStorage.getItem('gabineteAccessToken');
    if(!token){avisar('Faça login no Gabinete LM antes de comprar a licença.');return}
    var b=document.getElementById('btnComprarGabineteLM');
    if(b){b.disabled=true;b.textContent='⏳ Preparando pagamento...'}
    try{
      var r=await fetch('https://qizakldwyeqbummhtpsg.supabase.co/functions/v1/mercadopago-checkout',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'apikey':'sb_publishable_ZEM5lEJsiveCFkU9sClkCA_sn3v2M4X'},
        body:JSON.stringify({origin:window.location.origin+window.location.pathname})
      });
      var data=await r.json().catch(function(){return{}});
      if(!r.ok||!data.init_point&&!data.sandbox_init_point)throw new Error(data.error||'Não foi possível criar o checkout.');
      var url=data.sandbox_init_point||data.init_point;
      window.location.href=url;
    }catch(e){
      console.error(e);
      avisar('⚠️ '+(e.message||'Erro ao preparar o pagamento.'));
      if(b){b.disabled=false;b.textContent='💳 Comprar licença — R$ 4.300,00'}
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
    box.innerHTML='<h3>🚀 Gabinete LM — Licença completa</h3><p>Tenha acesso ao sistema completo de gestão do gabinete, cidadãos, demandas, agenda e relatórios.</p><p><strong style="font-size:24px">R$ 4.300,00</strong> <span style="opacity:.7">pagamento único</span></p><button id="btnComprarGabineteLM" type="button" onclick="comprarGabineteLM()">💳 Comprar licença — R$ 4.300,00</button><p style="font-size:12px;opacity:.65;margin-top:10px">Pagamento protegido pelo Mercado Pago • Ambiente de testes enquanto estamos configurando.</p>';
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
