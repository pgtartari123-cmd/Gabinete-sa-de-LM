/* GABINETE LM — Impressões 2: localização por bairro v1 */
(function(){
  'use strict';
  const KEY='gabineteDigitalDemo';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{"people":[]}');d.people=Array.isArray(d.people)?d.people:[];return d}catch(e){return{people:[]}}};
  const bairro=p=>String(p?.bairro||'').trim()||'Bairro não informado';
  const proc=p=>p?.procedimento||((p?.demandas||[]).map(d=>d?.procedimento).filter(Boolean).join(' • '))||p?.demanda||'Não informado';
  const realizado=p=>p?.atendimentoRealizado==='Já realizado';
  function styles(){
    if(document.getElementById('imp2Style'))return;
    const s=document.createElement('style');s.id='imp2Style';
    s.textContent=`
      .imp2-acoes{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}
      .imp2-acoes button{border:0;border-radius:11px;padding:11px 15px;font-weight:800;cursor:pointer;background:#fce7f3;color:#2b1b26}
      .imp2-acoes .imp2-principal{background:#d9468f;color:#fff}
      .imp2-resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
      .imp2-resumo>div{background:#fff;border:1px solid #f0d9e5;border-radius:15px;padding:15px}
      .imp2-resumo strong{display:block;font-size:26px}.imp2-resumo span{font-size:12px;color:#7a6270}
      .imp2-bairro{background:#fff;border:1px solid #f0d9e5;border-radius:16px;padding:15px;margin-bottom:13px}
      .imp2-bairro-head{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid #f0d9e5;padding-bottom:10px;margin-bottom:9px}
      .imp2-bairro-head h3{margin:0}.imp2-bairro-head span{font-size:12px;color:#7a6270;font-weight:800}
      .imp2-pessoa{padding:10px 0;border-bottom:1px solid #f3e7ed}.imp2-pessoa:last-child{border-bottom:0}
      .imp2-pessoa strong{display:block}.imp2-pessoa small{display:block;color:#64748b;margin-top:2px}
      #imp2PrintArea{display:none}
      @media(max-width:700px){.imp2-resumo{grid-template-columns:1fr}.imp2-bairro-head{align-items:flex-start;flex-direction:column}}
      @media print{
        @page{size:A4 portrait;margin:0}
        body.imp2-printing>*:not(#imp2PrintArea){display:none!important}
        body.imp2-printing #imp2PrintArea{display:block!important;position:static!important}
        .imp2-page{width:210mm;height:297mm;min-height:297mm;box-sizing:border-box;padding:8mm 10mm;display:grid;grid-template-rows:repeat(5,minmax(0,1fr));gap:3mm;page-break-after:always;break-after:page}
        .imp2-card{border:1px solid #222;padding:3mm 4mm;box-sizing:border-box;font:8pt/1.15 Arial,sans-serif;overflow:hidden;min-height:0}
        .imp2-card h3{font-size:11pt;margin:0 0 2mm}.imp2-card .bairro{font-weight:800;margin-bottom:1.5mm}
        .imp2-card div{padding:.5mm 0}.imp2-card b{display:inline-block;min-width:31mm}
        .imp2-titulo{font-size:15pt;font-weight:900;margin-bottom:1mm}.imp2-sub{font-size:8pt;color:#555;margin-bottom:2mm}
      }
    `;
    document.head.appendChild(s);
  }
  function groups(){
    const map=new Map();
    read().people.forEach(p=>{const b=bairro(p);if(!map.has(b))map.set(b,[]);map.get(b).push(p)});
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR',{sensitivity:'base'})).map(([b,ps])=>[b,ps.sort((x,y)=>String(x.nome||'').localeCompare(String(y.nome||''),'pt-BR',{sensitivity:'base'}))]);
  }
  function render(){
    const c=document.getElementById('impressoes2Conteudo');if(!c)return;
    styles();const gs=groups(),total=read().people.length,bs=gs.length,real=read().people.filter(realizado).length;
    c.innerHTML='<div class="imp2-resumo"><div><span>CADASTRADOS</span><strong>'+total+'</strong></div><div><span>BAIRROS / COMUNIDADES</span><strong>'+bs+'</strong></div><div><span>JÁ REALIZADOS</span><strong>'+real+'</strong></div></div><div class="imp2-list">'+(gs.map(([b,ps])=>'<article class="imp2-bairro"><div class="imp2-bairro-head"><h3>📍 '+esc(b)+'</h3><span>'+ps.length+' paciente(s)</span></div>'+ps.map(p=>'<div class="imp2-pessoa"><strong>'+esc(p.nome||'Sem nome')+'</strong><small>'+esc(p.endereco||'Endereço não informado')+(p.telefone?' • '+esc(p.telefone):'')+'</small><small>Procedimento: '+esc(proc(p))+(realizado(p)&&p.hospitalClinica?' • Realizado em: '+esc(p.hospitalClinica):'')+'</small></div>').join('')+'</article>').join('')||'<div class="card vazio"><h3>Nenhum cadastro encontrado</h3></div>')+'</div>';
  }
  function print(){
    const people=read().people.slice().sort((a,b)=>{const bb=bairro(a).localeCompare(bairro(b),'pt-BR',{sensitivity:'base'});return bb||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR',{sensitivity:'base'})});
    if(!people.length)return alert('Não há pacientes cadastrados para imprimir.');
    styles();
    let area=document.getElementById('imp2PrintArea');if(!area){area=document.createElement('div');area.id='imp2PrintArea';document.body.appendChild(area)}
    const cards=people.map(p=>'<div class="imp2-card"><div class="imp2-titulo">'+esc(p.nome||'Sem nome')+'</div><div class="bairro"><b>Bairro / Comunidade:</b> '+esc(bairro(p))+'</div><div><b>Endereço:</b> '+esc(p.endereco||'Não informado')+(p.cep?' — CEP '+esc(p.cep):'')+'</div><div><b>Telefone:</b> '+esc(p.telefone||'Não informado')+'</div><div><b>Procedimento:</b> '+esc(proc(p))+'</div><div><b>Status:</b> '+esc(p.status||'Pendente')+'</div>'+(realizado(p)?'<div><b>Atendimento:</b> Já realizado</div><div><b>Local:</b> '+esc(p.hospitalClinica||'Não informado')+'</div><div><b>Data / horário:</b> '+esc(p.dataRealizacao?new Date(p.dataRealizacao+'T00:00:00').toLocaleDateString('pt-BR'):'Não informado')+(p.horaRealizacao?' • '+esc(p.horaRealizacao):'')+'</div>':'')+'</div>');
    const pages=[];for(let i=0;i<cards.length;i+=5)pages.push(cards.slice(i,i+5).join(''));
    area.innerHTML=pages.map((x,i)=>'<section class="imp2-page"><div class="imp2-card" style="display:none"></div>'+x+'</section>').join('');
    document.body.classList.add('imp2-printing');
    setTimeout(()=>{window.print();setTimeout(()=>document.body.classList.remove('imp2-printing'),700)},80);
  }
  function boot(){styles();render();document.getElementById('imp2Atualizar')?.addEventListener('click',render);document.getElementById('imp2Imprimir')?.addEventListener('click',print);window.addEventListener('storage',e=>{if(e.key===KEY)render()});setInterval(()=>{if(document.getElementById('impressoes2')?.style.display!=='none')render()},1500)}
  document.addEventListener('DOMContentLoaded',boot,{once:true});
  window.renderImpressoes2=render;
})();