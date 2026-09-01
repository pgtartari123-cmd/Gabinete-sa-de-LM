/* GABINETE DIGITAL — Cadastro de demanda v2
   Mantém a demanda do formulário sincronizada com o array de múltiplas demandas.
   Adiciona prioridade, prazo e responsável sem quebrar os cadastros existentes. */
(function(){
  'use strict';
  const DB='gabineteDigitalDemo';
  let editingId=null;
  let editingDemandId=null;
  const read=()=>{try{return JSON.parse(localStorage.getItem(DB)||'{"people":[],"agenda":[]}')}catch(e){return{people:[],agenda:[]}}};
  const write=d=>localStorage.setItem(DB,JSON.stringify(d));
  const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function addStyles(){
    if(document.getElementById('cadastroDemandaV2Style'))return;
    const s=document.createElement('style');s.id='cadastroDemandaV2Style';
    s.textContent=`.cdv2-badge{display:inline-flex;align-items:center;gap:6px;margin:4px 0 10px;padding:7px 10px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12px;font-weight:800}.cdv2-help{margin:-4px 0 4px;color:#64748b;font-size:12px}.cdv2-prioridade{font-weight:700}`;
    document.head.appendChild(s);
  }

  function addFields(){
    const form=document.getElementById('formCadastro');
    if(!form||form.dataset.cdv2==='1')return;
    const tipo=form.elements.tipoDemanda;
    if(!tipo)return;
    form.dataset.cdv2='1';addStyles();
    const wrap=tipo.closest('.campo');
    const badge=document.createElement('div');badge.className='cdv2-badge';badge.textContent='🎯 Gestão da demanda';
    const help=document.createElement('div');help.className='cdv2-help';help.textContent='Defina prioridade e prazo já no atendimento.';
    wrap.parentNode.insertBefore(badge,wrap);
    wrap.parentNode.insertBefore(help,wrap);
    const make=(name,label,type,html)=>{const d=document.createElement('div');d.className='campo';d.innerHTML=`<label>${label}</label>${html||`<input name="${name}" type="${type||'text'}">`}`;return d};
    const parent=wrap.parentNode;
    parent.insertBefore(make('prioridade','Prioridade','',`<select name="prioridade" class="cdv2-prioridade"><option>Normal</option><option>Baixa</option><option>Alta</option><option>Urgente</option></select>`),wrap.nextSibling);
    parent.insertBefore(make('prazo','Prazo para atendimento','date'),wrap.nextSibling.nextSibling);
    parent.insertBefore(make('responsavel','Responsável','',`<input name="responsavel" placeholder="Ex.: Assessoria / Vereador / Secretaria">`),wrap.nextSibling.nextSibling.nextSibling);
  }

  function captureEdit(){
    const old=window.editarCadastro;
    if(typeof old!=='function'||window.__cdv2Wrapped)return;
    window.__cdv2Wrapped=true;
    window.editarCadastro=function(id){
      const db=read(),p=(db.people||[]).find(x=>x.id===id);editingId=id;editingDemandId=p?.demandaId||p?.demandas?.[p.demandas.length-1]?.id||null;
      old(id);
      setTimeout(()=>fillDemandFields(),30);
    };
  }

  function fillDemandFields(){
    const form=document.getElementById('formCadastro');if(!form)return;
    const db=read(),p=(db.people||[]).find(x=>x.id===editingId);if(!p)return;
    const d=(p.demandas||[]).find(x=>x.id===editingDemandId)||(p.demandas||[]).slice(-1)[0];
    if(!d)return;
    ['prioridade','prazo','responsavel'].forEach(k=>{if(form.elements[k])form.elements[k].value=d[k]||p[k]||form.elements[k].value||''});
  }

  function syncDemand(){
    const form=document.getElementById('formCadastro');if(!form)return;
    const db=read();let p=editingId?(db.people||[]).find(x=>x.id===editingId):null;
    if(!p){const nome=String(form.elements.nome?.value||'').trim();p=(db.people||[]).find(x=>x.nome===nome);}
    if(!p)return;
    p.demandas=Array.isArray(p.demandas)?p.demandas:[];
    const demanda=String(p.demanda||form.elements.demanda?.value||'').trim();if(!demanda)return;
    let d=editingDemandId?p.demandas.find(x=>x.id===editingDemandId):null;
    if(!d)d=p.demandas.find(x=>x.demanda===demanda)||null;
    if(!d){d={id:uid(),criadoEm:new Date().toISOString()};p.demandas.push(d)}
    d.demanda=demanda;
    d.tipoDemanda=p.tipoDemanda||p.tipo||form.elements.tipoDemanda?.value||'Outro';
    d.tipo=d.tipoDemanda;
    d.procedimento=p.procedimento||form.elements.procedimento?.value||'';
    d.status=p.status||form.elements.status?.value||'Pendente';
    d.observacoes=p.observacoes||form.elements.observacoes?.value||'';
    d.prioridade=form.elements.prioridade?.value||d.prioridade||'Normal';
    d.prazo=form.elements.prazo?.value||d.prazo||'';
    d.responsavel=form.elements.responsavel?.value||d.responsavel||'';
    d.atualizadoEm=new Date().toISOString();
    p.demanda=demanda;p.tipoDemanda=d.tipoDemanda;p.tipo=d.tipoDemanda;p.procedimento=d.procedimento;p.status=d.status;p.prioridade=d.prioridade;p.prazo=d.prazo;p.responsavel=d.responsavel;p.demandaId=d.id;
    write(db);
    if(window.render)window.render();if(window.renderDemandas)window.renderDemandas();if(window.atualizarPainel)window.atualizarPainel();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    addFields();captureEdit();
    const form=document.getElementById('formCadastro');
    if(form)form.addEventListener('submit',()=>setTimeout(()=>{syncDemand();editingId=null;editingDemandId=null},120));
    const cancel=document.querySelector('#formCadastro .btn-cancelar');if(cancel)cancel.addEventListener('click',()=>{editingId=null;editingDemandId=null});
  });
  const observer=new MutationObserver(()=>{addFields();captureEdit()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
