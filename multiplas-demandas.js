/* Módulo de múltiplas demandas por cidadão */
(function(){
  function uid(){return (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():String(Date.now()+Math.random())}
  function garantir(p){
    if(!Array.isArray(p.demandas)){
      p.demandas=[];
      if(p.demanda){p.demandas.push({id:uid(),demanda:p.demanda,tipoDemanda:p.tipoDemanda||p.tipo||'Outro',procedimento:p.procedimento||'',status:p.status||'Pendente',criadoEm:p.criadoEm||new Date().toISOString()})}
    }
    return p.demandas
  }
  function salvar(){localStorage.setItem(KEY,JSON.stringify(db));if(typeof render==='function')render();if(typeof renderDemandas==='function')renderDemandas();if(typeof atualizarPainel==='function')atualizarPainel();}
  window.adicionarDemanda=id=>{
    const p=db.people.find(x=>x.id===id);if(!p)return;
    const demanda=prompt('Digite a nova demanda para '+(p.nome||'este cidadão')+':');if(!demanda||!demanda.trim())return;
    const tipo=prompt('Tipo da demanda (Saúde, Educação, Infraestrutura etc.):','Outro')||'Outro';
    const proc=prompt('Procedimento / Serviço (opcional):','')||'';
    garantir(p).push({id:uid(),demanda:demanda.trim(),tipoDemanda:tipo.trim()||'Outro',procedimento:proc.trim(),status:'Pendente',criadoEm:new Date().toISOString()});
    p.demanda=demanda.trim();p.tipoDemanda=tipo.trim()||'Outro';p.tipo=p.tipoDemanda;p.procedimento=proc.trim();p.status='Pendente';
    salvar();alert('Nova demanda adicionada ao cidadão!');
  };
  window.excluirDemanda=(pid,did)=>{
    const p=db.people.find(x=>x.id===pid);if(!p)return;const ds=garantir(p);if(ds.length<=1)return alert('O cidadão precisa manter pelo menos uma demanda.');if(!confirm('Excluir esta demanda?'))return;p.demandas=ds.filter(d=>d.id!==did);const atual=p.demandas[p.demandas.length-1];p.demanda=atual.demanda;p.tipoDemanda=atual.tipoDemanda;p.tipo=atual.tipoDemanda;p.procedimento=atual.procedimento;p.status=atual.status;salvar();
  };
  window.alterarStatusDemanda=(pid,did)=>{const p=db.people.find(x=>x.id===pid);if(!p)return;const d=garantir(p).find(x=>x.id===did);if(!d)return;d.status=d.status==='Pendente'?'Em andamento':d.status==='Em andamento'?'Concluído':'Pendente';const atual=p.demandas[p.demandas.length-1];if(atual===d){p.status=d.status;p.demanda=d.demanda;p.tipoDemanda=d.tipoDemanda;p.tipo=d.tipoDemanda;p.procedimento=d.procedimento}salvar()};
  function renderMultiplas(){
    document.querySelectorAll('#listaPessoas .card').forEach(card=>{
      const h=card.querySelector('h3');if(!h||card.dataset.multi==='1')return;
      const nome=h.textContent.trim(),p=db.people.find(x=>String(x.nome||'').trim()===nome);if(!p)return;card.dataset.multi='1';
      garantir(p);
      const b=document.createElement('div');b.className='acoes';b.innerHTML='<button type="button">+ Adicionar demanda</button>';b.firstChild.onclick=()=>adicionarDemanda(p.id);card.appendChild(b);
      const ds=garantir(p);if(ds.length>1){const box=document.createElement('div');box.className='card-subdemandas';box.innerHTML='<strong>Demandas deste cidadão</strong>'+ds.map(d=>`<div class="subdemanda"><div><b>${esc(d.demanda)}</b><small>${esc(d.tipoDemanda||'Outro')} • ${esc(d.status||'Pendente')}</small></div><button type="button">Avançar</button><button type="button">Excluir</button></div>`).join('');Array.from(box.querySelectorAll('.subdemanda')).forEach((el,i)=>{el.querySelectorAll('button')[0].onclick=()=>alterarStatusDemanda(p.id,ds[i].id);el.querySelectorAll('button')[1].onclick=()=>excluirDemanda(p.id,ds[i].id)});card.appendChild(box)}
    });
  }
  const antigoRender=window.render, antigoDemandas=window.renderDemandas;
  window.render=function(){if(antigoRender)antigoRender();setTimeout(renderMultiplas,0)};
  window.renderDemandas=function(){
    const c=document.getElementById('listaDemandas');if(!c){if(antigoDemandas)antigoDemandas();return}
    const q=(document.getElementById('buscaDemanda')?.value||'').toLowerCase().trim(),tipo=(document.getElementById('filtroTipoDemanda')?.value||'').toLowerCase(),status=(document.getElementById('filtroStatusDemanda')?.value||'').toLowerCase(),bairro=(document.getElementById('filtroBairroDemanda')?.value||'').toLowerCase().trim(),it=[];
    db.people.forEach(p=>garantir(p).forEach(d=>it.push({p,d})));
    const lista=it.filter(({p,d})=>{const texto=[p.nome,d.demanda,d.procedimento,p.bairro,p.cpf,p.telefone].join(' ').toLowerCase();return(!q||texto.includes(q))&&(!tipo||String(d.tipoDemanda||'').toLowerCase()===tipo)&&(!status||String(d.status||'Pendente').toLowerCase()===status)&&(!bairro||String(p.bairro||'').toLowerCase().includes(bairro))});
    c.innerHTML=lista.map(({p,d})=>`<div class="card"><h3>${esc(d.demanda)}</h3><p><strong>Pessoa:</strong> ${esc(p.nome)}</p><p><strong>Tipo:</strong> ${esc(d.tipoDemanda||'Outro')}</p><p><strong>Bairro:</strong> ${esc(p.bairro||'Não informado')}</p>${d.procedimento?`<p><strong>Procedimento:</strong> ${esc(d.procedimento)}</p>`:''}<span class="status ${statusClass(d.status||'Pendente')}">${esc(d.status||'Pendente')}</span><div class="acoes"><button type="button" onclick="alterarStatusDemanda('${esc(p.id)}','${esc(d.id)}')">Avançar status</button><button type="button" onclick="adicionarDemanda('${esc(p.id)}')">+ Outra demanda</button>${p.telefone?`<button type="button" onclick="wa('${esc(p.telefone)}','Olá, ${esc(p.nome)}! Estou entrando em contato sobre sua demanda: ${esc(d.demanda)}.')">WhatsApp</button>`:''}</div></div>`).join('')||'<div class="card vazio"><h3>Nenhuma demanda encontrada</h3><p>Altere os filtros ou cadastre uma nova demanda.</p></div>';
  };
  window.gerarRelatorio=function(){
    const inicio=document.getElementById('relInicio')?.value||'',fim=document.getElementById('relFim')?.value||'',tipo=(document.getElementById('relTipo')?.value||'').toLowerCase(),status=(document.getElementById('relStatus')?.value||'').toLowerCase(),bairro=(document.getElementById('relBairro')?.value||'').toLowerCase().trim(),lista=[];
    db.people.forEach(p=>garantir(p).forEach(d=>{const criado=(d.criadoEm||p.criadoEm||'').slice(0,10),t=String(d.tipoDemanda||'').toLowerCase(),s=String(d.status||'Pendente').toLowerCase(),b=String(p.bairro||'').toLowerCase();if((!inicio||criado>=inicio)&&(!fim||criado<=fim)&&(!tipo||t===tipo)&&(!status||s===status)&&(!bairro||b.includes(bairro)))lista.push({p,d,criado})}));
    const c=document.getElementById('resultadoRelatorio');if(!c)return;const porTipo={},porBairro={};lista.forEach(x=>{porTipo[x.d.tipoDemanda||'Outro']=(porTipo[x.d.tipoDemanda||'Outro']||0)+1;porBairro[x.p.bairro||'Não informado']=(porBairro[x.p.bairro||'Não informado']||0)+1});const esc2=window.esc||((v)=>String(v??''));
    c.innerHTML=`<div class="rel-cabecalho"><div><span class="eyebrow">GABINETE DIGITAL</span><h2>Relatório de Demandas</h2><p>Período: ${inicio?fmtData(inicio):'início não informado'} até ${fim?fmtData(fim):'data atual'}</p></div><div><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</div></div><div class="rel-resumo"><div><span>Total</span><strong>${lista.length}</strong></div><div><span>Pendentes</span><strong>${lista.filter(x=>(x.d.status||'Pendente')==='Pendente').length}</strong></div><div><span>Em andamento</span><strong>${lista.filter(x=>x.d.status==='Em andamento').length}</strong></div><div><span>Concluídas</span><strong>${lista.filter(x=>x.d.status==='Concluído').length}</strong></div></div><div class="rel-grid"><div class="card"><h3>Por tipo de demanda</h3>${Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<p class="rel-linha"><span>${esc2(k)}</span><strong>${v}</strong></p>`).join('')||'<p>Nenhum resultado.</p>'}</div><div class="card"><h3>Por bairro</h3>${Object.entries(porBairro).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<p class="rel-linha"><span>${esc2(k)}</span><strong>${v}</strong></p>`).join('')||'<p>Nenhum resultado.</p>'}</div></div><div class="card rel-tabela"><h3>Detalhamento</h3>${lista.length?`<div class="tabela-wrap"><table><thead><tr><th>Cidadão</th><th>Demanda</th><th>Tipo</th><th>Bairro</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>${lista.map(x=>`<tr><td>${esc2(x.p.nome)}</td><td>${esc2(x.d.demanda)}</td><td>${esc2(x.d.tipoDemanda||'Outro')}</td><td>${esc2(x.p.bairro||'Não informado')}</td><td>${esc2(x.d.status||'Pendente')}</td><td>${fmtData(x.criado)}</td></tr>`).join('')}</tbody></table></div>`:'<p>Nenhuma demanda encontrada com os filtros selecionados.</p>'}</div>`;
  };
  document.addEventListener('DOMContentLoaded',()=>{db.people.forEach(garantir);localStorage.setItem(KEY,JSON.stringify(db));setTimeout(()=>{renderMultiplas();if(document.getElementById('listaDemandas'))window.renderDemandas()},100)});
})();
