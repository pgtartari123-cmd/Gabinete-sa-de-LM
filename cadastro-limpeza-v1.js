/* Gabinete LM — saneamento visual do formulário + data digitável + limpeza de testes v2 */
(function(){'use strict';
  const KEY='gabineteDigitalDemo';
  const TEST_NAMES=['joão teste','joao teste','maisa dalva teste'];
  function removeDuplicados(form){
    if(!form)return;
    const names=['telefone','bairro','endereco','mae','apelido','nascimento','cpf','sus','pontoReferencia','demanda','tipoDemanda','destinoEnvio','procedimento','status','observacoes'];
    names.forEach(name=>{
      const els=Array.from(form.querySelectorAll('[name="'+name+'"]'));
      if(els.length<=1)return;
      els.slice(1).forEach(el=>{const box=el.closest('.campo');if(box)box.remove();else el.remove()});
    });
  }
  function dataDigitavel(form){
    const el=form?.elements?.nascimento;
    if(!el||el.dataset.lmDataMask==='1')return;
    el.dataset.lmDataMask='1';el.type='text';el.inputMode='numeric';el.autocomplete='bday';el.placeholder='DD/MM/AAAA';el.maxLength=10;
    el.addEventListener('input',function(){
      const raw=this.value.replace(/\D/g,'').slice(0,8);
      let v=raw;
      if(raw.length>4)v=raw.slice(0,2)+'/'+raw.slice(2,4)+'/'+raw.slice(4);
      else if(raw.length>2)v=raw.slice(0,2)+'/'+raw.slice(2);
      this.value=v;
      this.setCustomValidity('');
    });
    el.addEventListener('blur',function(){
      const v=this.value.trim();if(!v){this.setCustomValidity('');return;}
      const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if(!m){this.setCustomValidity('Use DD/MM/AAAA');return;}
      const day=+m[1],month=+m[2],year=+m[3],dt=new Date(year,month-1,day);
      this.setCustomValidity(dt.getFullYear()===year&&dt.getMonth()===month-1&&dt.getDate()===day?'':'Data inválida');
    });
  }
  function limparTestesLocais(){
    try{
      const raw=localStorage.getItem(KEY);if(!raw)return;
      const d=JSON.parse(raw);if(!d||!Array.isArray(d.people))return;
      const antes=d.people.length;
      const idsRemovidos=d.people.filter(p=>TEST_NAMES.includes(String(p?.nome||'').trim().toLowerCase())).map(p=>p.id).filter(Boolean);
      d.people=d.people.filter(p=>!TEST_NAMES.includes(String(p?.nome||'').trim().toLowerCase()));
      if(Array.isArray(d.demandas))d.demandas=d.demandas.filter(x=>!idsRemovidos.includes(x?.cidadao_id)&&!TEST_NAMES.includes(String(x?.nome||'').trim().toLowerCase()));
      if(antes!==d.people.length)localStorage.setItem(KEY,JSON.stringify(d));
    }catch(e){}
  }
  function run(){limparTestesLocais();const f=document.getElementById('formCadastro');if(!f)return;removeDuplicados(f);dataDigitavel(f);}
  document.addEventListener('DOMContentLoaded',run,{once:true});
  const obs=new MutationObserver(run);obs.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(run,1000);
})();
