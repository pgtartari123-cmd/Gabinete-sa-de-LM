/* GABINETE LM — Histórico de atendimento realizado v1
   Acréscimo ao cadastro: permite identificar procedimentos já realizados
   e registrar hospital/clínica, data e horário sem alterar os campos existentes. */
(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])}
  function styles(){
    if(document.getElementById('hlmRealizadoStyle'))return;
    const s=document.createElement('style');s.id='hlmRealizadoStyle';
    s.textContent='.hlm-realizado-detalhes{grid-column:span 2;display:none;padding:13px 15px;margin:-4px 0 10px;background:#fff8fc;border:1px solid #f0d9e5;border-radius:14px}.hlm-realizado-detalhes.ativo{display:block}.hlm-realizado-titulo{font-size:12px;font-weight:900;color:#7d2857;margin-bottom:10px}.hlm-realizado-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}.hlm-realizado-grid .campo{margin-bottom:0}@media(max-width:700px){.hlm-realizado-detalhes{grid-column:span 1}.hlm-realizado-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function add(){
    const form=document.getElementById('formCadastro');
    if(!form||form.dataset.hlmRealizado==='1')return;
    const status=form.elements.status;
    if(!status)return;
    styles();
    const campoStatus=status.closest('.campo');
    if(!campoStatus)return;
    const campo=document.createElement('div');campo.className='campo campo-grande';
    campo.innerHTML='<label>Atendimento / procedimento</label><select name="atendimentoRealizado"><option value="">Não informado</option><option value="Já realizado">Já realizado</option><option value="Ainda não realizado">Ainda não realizado</option></select>';
    campoStatus.parentNode.insertBefore(campo,campoStatus.nextSibling);
    const detalhes=document.createElement('div');detalhes.className='hlm-realizado-detalhes';detalhes.innerHTML='<div class="hlm-realizado-titulo">📍 Dados do atendimento já realizado</div><div class="hlm-realizado-grid"><div class="campo"><label>Hospital / Clínica</label><input name="hospitalClinica" placeholder="Onde foi realizado o atendimento"></div><div class="campo"><label>Data</label><input name="dataRealizacao" type="date"></div><div class="campo"><label>Horário</label><input name="horaRealizacao" type="time"></div></div>';
    campo.parentNode.insertBefore(detalhes,campo.nextSibling);
    const sel=campo.querySelector('select');
    const sync=()=>{
      const on=sel.value==='Já realizado';
      detalhes.classList.toggle('ativo',on);
      if(!on){
        ['hospitalClinica','dataRealizacao','horaRealizacao'].forEach(k=>{const el=form.elements[k];if(el)el.value=''});
      }
    };
    sel.addEventListener('change',sync);sel.dataset.hlmLast=sel.value;sync();
    setInterval(()=>{if(!document.body.contains(sel))return;if(sel.value!==sel.dataset.hlmLast){sel.dataset.hlmLast=sel.value;sync()}},300);
    form.dataset.hlmRealizado='1';
  }
  function observe(){
    add();
    const o=new MutationObserver(add);o.observe(document.documentElement,{childList:true,subtree:true});
  }
  document.addEventListener('DOMContentLoaded',observe,{once:true});
})();