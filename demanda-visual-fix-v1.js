/* GABINETE LM — CORREÇÃO DEFINITIVA DE DEMANDAS v3
   Mantém a interface atual e corrige a origem da piscada.
   A versão anterior redesenhava a tela a cada 250ms durante 30 segundos.
   Agora a correção roda na abertura e somente quando uma sincronização
   realmente altera os dados.
   Não apaga dados.
*/
(function(){
'use strict';

function E(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function lista(p){
  if(Array.isArray(p?.demandas)&&p.demandas.length)return p.demandas;
  if(p?.demanda||p?.procedimento||p?.tipoDemanda||p?.tipo)return [p];
  return [];
}
function ultimo(p){const a=lista(p);return a[a.length-1]||{};}
function texto(v,f=''){const s=String(v??'').trim();return s||f}

function corrigirCamposLegados(){
  if(typeof db==='undefined'||!Array.isArray(db.people))return false;
  let mudou=false;
  db.people.forEach(p=>{
    const d=ultimo(p);
    if(!d)return;
    const mapa=[
      ['demanda','demanda'],['tipoDemanda','tipoDemanda'],['tipo','tipo'],
      ['procedimento','procedimento'],['status','status'],['destinoEnvio','destinoEnvio'],
      ['encaminhamento','encaminhamento'],['retorno','retorno'],['secretaria','secretaria'],
      ['dataSaida','dataSaida']
    ];
    mapa.forEach(([pk,dk])=>{
      if(!texto(p[pk])&&texto(d[dk])){p[pk]=d[dk];mudou=true}
    });
    if(!p.demanda&&d.descricao){p.demanda=d.descricao;mudou=true}
    if(!p.tipoDemanda&&d.tipo){p.tipoDemanda=d.tipo;mudou=true}
    if(!p.tipo&&d.tipo){p.tipo=d.tipo;mudou=true}
    if(!p.destinoEnvio&&d.destino_envio){p.destinoEnvio=d.destino_envio;mudou=true}
  });
  if(mudou){
    try{localStorage.setItem('gabineteDigitalDemo',JSON.stringify(db))}catch(e){console.warn('[Gabinete LM] atualização de compatibilidade:',e)}
  }
  return mudou;
}

function filtros(){
  return {
    q:String(document.getElementById('buscaDemanda')?.value||'').toLowerCase().trim(),
    tipo:String(document.getElementById('filtroTipoDemanda')?.value||'').toLowerCase(),
    status:String(document.getElementById('filtroStatusDemanda')?.value||'').toLowerCase(),
    bairro:String(document.getElementById('filtroBairroDemanda')?.value||'').toLowerCase().trim()
  };
}

function renderDemandasCorrigido(){
  if(typeof db==='undefined'||!Array.isArray(db.people))return;
  const c=document.getElementById('listaDemandas');if(!c)return;
  const f=filtros(),it=[];
  db.people.forEach(p=>lista(p).forEach(d=>it.push({p,d})));
  const rows=it.filter(({p,d})=>{
    const q=[p.nome,d.demanda,d.descricao,d.tipoDemanda,d.tipo,d.procedimento,d.destinoEnvio,d.destino_envio,d.encaminhamento,d.secretaria,d.bairro,p.cpf,p.telefone].join(' ').toLowerCase();
    const tipo=String(d.tipoDemanda||d.tipo||'').toLowerCase();
    const st=String(d.status||p.status||'Pendente').toLowerCase();
    return (!f.q||q.includes(f.q))&&(!f.tipo||tipo===f.tipo)&&(!f.status||st===f.status)&&(!f.bairro||String(p.bairro||'').toLowerCase().includes(f.bairro));
  });
  c.innerHTML=rows.map(({p,d})=>{
    const st=d.status||p.status||'Pendente';
    const destino=d.destinoEnvio||d.destino_envio||d.encaminhamento||d.secretaria||p.destinoEnvio||'Não informado';
    const tipo=d.tipoDemanda||d.tipo||'Não informado';
    const demanda=d.demanda||d.descricao||'Não informada';
    return `<div class="card"><h3>${E(demanda)}</h3><p><strong>Pessoa:</strong> ${E(p.nome)}</p><p><strong>Tipo:</strong> ${E(tipo)}</p><p><strong>Enviado para:</strong> ${E(destino)}</p><p><strong>Bairro:</strong> ${E(p.bairro||'Não informado')}</p>${d.procedimento?`<p><strong>Procedimento:</strong> ${E(d.procedimento)}</p>`:''}${d.encaminhamento&&d.encaminhamento!==destino?`<p><strong>Encaminhamento:</strong> ${E(d.encaminhamento)}</p>`:''}<span class="status ${st==='Concluído'?'concluido':st==='Em andamento'?'andamento':'pendente'}">${E(st)}</span><div class="acoes"><button type="button" onclick="mudarStatus('${E(p.id)}')">Avançar status</button><button type="button" onclick="editarCadastro('${E(p.id)}')">Editar</button>${p.telefone?`<button type="button" onclick="wa('${E(p.telefone)}','Olá, ${E(p.nome)}! Estou entrando em contato sobre sua demanda: ${E(demanda)}.')">WhatsApp</button>`:''}</div></div>`;
  }).join('')||'<div class="card vazio"><h3>Nenhuma demanda encontrada</h3><p>Altere os filtros ou cadastre uma nova demanda.</p></div>';
}

function renderPessoasCorrigido(){
  if(typeof db==='undefined'||!Array.isArray(db.people))return;
  const c=document.getElementById('listaPessoas');if(!c)return;
  const busca=String(document.getElementById('buscaPessoa')?.value||'').toLowerCase().trim();
  const bairro=String(document.getElementById('filtroBairro')?.value||'').toLowerCase().trim();
  const pessoas=db.people.filter(p=>{
    const ds=lista(p), txt=[p.nome,p.mae,p.cpf,p.sus,p.telefone,p.bairro,p.endereco,p.demanda,p.tipoDemanda,p.tipo,p.procedimento,p.destinoEnvio,...ds.map(d=>[d.demanda,d.descricao,d.tipoDemanda,d.tipo,d.procedimento,d.destinoEnvio,d.destino_envio,d.encaminhamento].join(' '))].join(' ').toLowerCase();
    return (!busca||txt.includes(busca))&&(!bairro||String(p.bairro||'').toLowerCase().includes(bairro));
  });
  c.innerHTML=pessoas.map(p=>{
    const ds=lista(p),d=ultimo(p),st=d.status||p.status||'Pendente';
    const demanda=d.demanda||d.descricao||p.demanda||'Não informada';
    const tipo=d.tipoDemanda||d.tipo||p.tipoDemanda||p.tipo||'Não informado';
    const destino=d.destinoEnvio||d.destino_envio||d.encaminhamento||d.secretaria||p.destinoEnvio||'Não informado';
    const extras=ds.length>1?`<p><strong>Demandas cadastradas:</strong> ${ds.length}</p>`:'';
    return `<div class="card"><h3>${E(p.nome)}</h3><p>${E(p.bairro||'Bairro não informado')} • ${E(p.telefone||'Telefone não informado')}</p><p><strong>Demanda:</strong> ${E(demanda)}</p><p><strong>Tipo:</strong> ${E(tipo)}</p><p><strong>Enviado para:</strong> ${E(destino)}</p>${d.procedimento?`<p><strong>Procedimento:</strong> ${E(d.procedimento)}</p>`:''}${extras}<span class="status ${st==='Concluído'?'concluido':st==='Em andamento'?'andamento':'pendente'}">${E(st)}</span><div class="acoes"><button type="button" onclick="mudarStatus('${E(p.id)}')">Avançar status</button><button type="button" onclick="verCadastro('${E(p.id)}')">Ver cadastro</button><button type="button" onclick="editarCadastro('${E(p.id)}')">Editar</button><button type="button" onclick="excluirCadastro('${E(p.id)}')">Excluir</button>${p.telefone?`<button type="button" onclick="wa('${E(p.telefone)}','Olá, ${E(p.nome)}!')">WhatsApp</button>`:''}</div></div>`;
  }).join('')||'<div class="card vazio"><h3>Nenhum cadastro encontrado</h3><p>Tente outro termo de busca ou faça um novo cadastro.</p></div>';
}

function editarCorrigido(id){
  if(typeof db==='undefined')return;
  const p=db.people.find(x=>String(x.id)===String(id));
  const f=document.getElementById('formCadastro');if(!p||!f)return;
  const d=ultimo(p);
  if(typeof window.editarCadastroOriginal==='function'){
    window.editarCadastroOriginal(id);
    setTimeout(()=>{
      [['demanda',d.demanda||d.descricao],['tipoDemanda',d.tipoDemanda||d.tipo],['destinoEnvio',d.destinoEnvio||d.destino_envio||d.encaminhamento||d.secretaria],['procedimento',d.procedimento],['status',d.status]].forEach(([k,v])=>{if(f.elements[k]&&texto(v))f.elements[k].value=v});
    },30);
    return;
  }
  Object.keys(p).forEach(k=>{const el=f.elements[k];if(el&&k!=='id'&&k!=='criadoEm')el.value=p[k]??''});
  [['demanda',d.demanda||d.descricao],['tipoDemanda',d.tipoDemanda||d.tipo],['destinoEnvio',d.destinoEnvio||d.destino_envio||d.encaminhamento||d.secretaria],['procedimento',d.procedimento],['status',d.status]].forEach(([k,v])=>{if(f.elements[k]&&texto(v))f.elements[k].value=v});
  if(typeof window.mostrarAba==='function')window.mostrarAba('cadastro');
}

function verCorrigido(id){
  if(typeof db==='undefined')return;
  const p=db.people.find(x=>String(x.id)===String(id));if(!p)return;
  const ds=lista(p);
  const textoSaida=[`NOME: ${p.nome||'Não informado'}`,`MÃE: ${p.mae||'Não informado'}`,`NASCIMENTO: ${p.nascimento||'Não informado'}`,`CPF: ${p.cpf||'Não informado'}`,`SUS: ${p.sus||'Não informado'}`,`TELEFONE: ${p.telefone||'Não informado'}`,`BAIRRO: ${p.bairro||'Não informado'}`,`ENDEREÇO: ${p.endereco||'Não informado'}`];
  ds.forEach((d,i)=>textoSaida.push(`\nDEMANDA ${i+1}: ${d.demanda||d.descricao||'Não informada'}`,`TIPO: ${d.tipoDemanda||d.tipo||'Não informado'}`,`ENVIADO PARA: ${d.destinoEnvio||d.destino_envio||d.encaminhamento||d.secretaria||'Não informado'}`,`PROCEDIMENTO: ${d.procedimento||'Não informado'}`,`STATUS: ${d.status||'Pendente'}`));
  alert(textoSaida.join('\n'));
}

function aplicar(){
  if(typeof db==='undefined')return;
  corrigirCamposLegados();
  renderPessoasCorrigido();
  renderDemandasCorrigido();
}

window.GabineteLM_DemandasFix={aplicar,renderDemandasCorrigido,renderPessoasCorrigido};
window.editarCadastroOriginal=window.editarCadastro;
window.editarCadastro=editarCorrigido;
window.verCadastro=verCorrigido;

function ciclo(){try{aplicar()}catch(e){console.warn('[Gabinete LM] correção visual:',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ciclo,{once:true});else ciclo();

/* Atualiza a visualização somente quando o sincronizador informa mudança real. */
window.addEventListener('gabinete:sincronizado',()=>{
  try{ciclo()}catch(e){console.warn('[Gabinete LM] atualização pós-sync:',e)}
});
})();