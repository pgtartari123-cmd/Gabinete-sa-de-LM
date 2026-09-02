/* Gabinete LM — saneamento visual do formulário + data digitável + carregamento dos campos finais */
(function(){'use strict';
  const KEY='gabineteDigitalDemo';
  const TEST_NAMES=['joão teste','joao teste','maisa dalva teste'];
  function removeDuplicados(form){
    if(!form)return;
    const names=['telefone','bairro','endereco','mae','apelido','nascimento','cpf','sus','pontoReferencia','demanda','tipoDemanda','destinoEnvio','procedimento','status','observacoes'];
    names.forEach(name=>{const els=Array.from(form.querySelectorAll('[name="'+name+'"]'));if(els.length>1)els.slice(1).forEach(el=>el.closest('.campo')?.remove()||el.remove())});
    const labels=['Bairro / Comunidade','Endereço'];
    labels.forEach(text=>{const boxes=Array.from(form.querySelectorAll('.campo')).filter(x=>x.querySelector('label')?.textContent?.trim()===text);if(boxes.length>1)boxes.slice(1).forEach(x=>x.remove())});
  }
  function dataDigitavel(form){
    const el=form?.elements?.nascimento;
    if(!el||el.dataset.lmDataMask==='1')return;
    el.dataset.lmDataMask='1';el.type='text';el.inputMode='numeric';el.autocomplete='bday';el.placeholder='DD/MM/AAAA';el.maxLength=10;
    el.addEventListener('input',function(){const raw=this.value.replace(/\D/g,'').slice(0,8);this.value=raw.length>4?raw.slice(0,2)+'/'+raw.slice(2,4)+'/'+raw.slice(4):raw.length>2?raw.slice(0,2)+'/'+raw.slice(2):raw;this.setCustomValidity('')});
    el.addEventListener('blur',function(){const v=this.value.trim();if(!v){this.setCustomValidity('');return}const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m){this.setCustomValidity('Use DD/MM/AAAA');return}const day=+m[1],month=+m[2],year=+m[3],dt=new Date(year,month-1,day);this.setCustomValidity(dt.getFullYear()===year&&dt.getMonth()===month-1&&dt.getDate()===day?'':'Data inválida')});
  }
  function limparTestesLocais(){try{const raw=localStorage.getItem(KEY);if(!raw)return;const d=JSON.parse(raw);if(!d||!Array.isArray(d.people))return;const ids=d.people.filter(p=>TEST_NAMES.includes(String(p?.nome||'').trim().toLowerCase())).map(p=>p.id).filter(Boolean);d.people=d.people.filter(p=>!TEST_NAMES.includes(String(p?.nome||'').trim().toLowerCase()));if(Array.isArray(d.demandas))d.demandas=d.demandas.filter(x=>!ids.includes(x?.cidadao_id)&&!TEST_NAMES.includes(String(x?.nome||'').trim().toLowerCase()));localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
  function carregarCamposFinais(){if(document.getElementById('dadosCidadaoFinalScript'))return;const s=document.createElement('script');s.id='dadosCidadaoFinalScript';s.src='./dados-cidadao-final-v1.js?v=1001';s.async=false;(document.head||document.documentElement).appendChild(s)}
  function run(){limparTestesLocais();const f=document.getElementById('formCadastro');if(!f)return;removeDuplicados(f);dataDigitavel(f);carregarCamposFinais()}
  document.addEventListener('DOMContentLoaded',run,{once:true});
  const obs=new MutationObserver(run);obs.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(run,1000);
})();
