const KEY = 'gabineteDigitalDemo';

let db = JSON.parse(localStorage.getItem(KEY) || '{"people":[],"agenda":[]}');
db.people = Array.isArray(db.people) ? db.people : [];
db.agenda = Array.isArray(db.agenda) ? db.agenda : [];
let editandoId = null;
const $ = (selector) => document.querySelector(selector);

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
  render(); renderDemandas(); renderAgenda(); renderBirthdays();
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function wa(telefone, mensagem) {
  let numero = String(telefone || '').replace(/\D/g, '');
  if (!numero) { alert('Telefone não cadastrado.'); return; }
  if (numero.length === 10 || numero.length === 11) numero = '55' + numero;
  window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem), '_blank');
}

function birth(person) {
  const value = String(person.nascimento || '').trim();
  if (!value) return null;
  let day, month, year, match = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (match) { day=Number(match[1]); month=Number(match[2]); year=Number(match[3]); }
  if (!match) {
    match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) { year=Number(match[1]); month=Number(match[2]); day=Number(match[3]); }
  }
  if (!day || !month || !year) return null;
  const now = new Date();
  let date = new Date(now.getFullYear(), month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date < today) date.setFullYear(date.getFullYear() + 1);
  return date;
}

/* =========================
   NOVO CADASTRO / EDIÇÃO
========================= */
const formCadastro = $('#formCadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', function(event) {
    event.preventDefault();
    const dados = Object.fromEntries(new FormData(event.target));
    dados.demanda = dados.demanda || '';
    dados.tipoDemanda = dados.tipoDemanda || '';
    dados.tipo = dados.tipoDemanda || '';
    dados.status = dados.status || 'Pendente';

    if (editandoId) {
      const index = db.people.findIndex((person) => person.id === editandoId);
      if (index !== -1) db.people[index] = {...db.people[index], ...dados, id: editandoId};
      editandoId = null;
      event.target.reset();
      const botao = formCadastro.querySelector('button[type="submit"]');
      if (botao) botao.textContent = 'Salvar cadastro';
      save();
      alert('Cadastro atualizado com sucesso!');
    } else {
      dados.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      db.people.unshift(dados);
      event.target.reset();
      save();
      alert('Cadastro salvo com sucesso!');
    }
    if (typeof mostrarAba === 'function') mostrarAba('pessoas');
  });
}

window.verCadastro = function(id) {
  const person = db.people.find((item) => item.id === id);
  if (!person) { alert('Cadastro não encontrado.'); return; }
  const tipo = person.tipoDemanda || person.tipo || 'Não informado';
  const nascimento = person.nascimento ? new Date(person.nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';
  alert([
    `NOME: ${person.nome || 'Não informado'}`,
    `MÃE: ${person.mae || 'Não informado'}`,
    `NASCIMENTO: ${nascimento}`,
    `CPF: ${person.cpf || 'Não informado'}`,
    `SUS: ${person.sus || 'Não informado'}`,
    `TELEFONE: ${person.telefone || 'Não informado'}`,
    `BAIRRO: ${person.bairro || 'Não informado'}`,
    `ENDEREÇO: ${person.endereco || 'Não informado'}`,
    `DEMANDA: ${person.demanda || 'Não informada'}`,
    `TIPO DE DEMANDA: ${tipo}`,
    `PROCEDIMENTO / SERVIÇO: ${person.procedimento || 'Não informado'}`,
    `STATUS: ${person.status || 'Pendente'}`
  ].join('\n'));
};

window.editarCadastro = function(id) {
  const person = db.people.find((item) => item.id === id);
  if (!person || !formCadastro) { alert('Cadastro não encontrado.'); return; }
  editandoId = id;
  Object.keys(person).forEach((campo) => {
    const elemento = formCadastro.elements[campo];
    if (elemento && campo !== 'id') elemento.value = person[campo] || '';
  });
  if (formCadastro.elements.tipoDemanda) formCadastro.elements.tipoDemanda.value = person.tipoDemanda || person.tipo || '';
  const botao = formCadastro.querySelector('button[type="submit"]');
  if (botao) botao.textContent = 'Atualizar cadastro';
  if (typeof mostrarAba === 'function') mostrarAba('cadastro');
  window.scrollTo({top:0, behavior:'smooth'});
};

window.cancelarEdicao = function() {
  if (!formCadastro) return;
  editandoId = null; formCadastro.reset();
  const botao = formCadastro.querySelector('button[type="submit"]');
  if (botao) botao.textContent = 'Salvar cadastro';
};

window.excluirCadastro = function(id) {
  const person = db.people.find((item) => item.id === id);
  if (!person) { alert('Cadastro não encontrado.'); return; }
  if (!confirm(`Deseja realmente excluir o cadastro de ${person.nome || 'esta pessoa'}?\n\nEssa ação não pode ser desfeita.`)) return;
  db.people = db.people.filter((item) => item.id !== id);
  if (editandoId === id) cancelarEdicao();
  save();
  alert('Cadastro excluído com sucesso!');
};

/* =========================
   PESSOAS
========================= */
function render() {
  const busca = ($('#buscaPessoa')?.value || '').toLowerCase().trim();
  const bairro = ($('#filtroBairro')?.value || '').toLowerCase().trim();
  const pessoas = db.people.filter((person) => {
    const texto = [person.nome,person.mae,person.cpf,person.sus,person.telefone,person.bairro,person.endereco,person.demanda,person.tipoDemanda,person.tipo,person.procedimento,person.status].join(' ').toLowerCase();
    return (!busca || texto.includes(busca)) && (!bairro || String(person.bairro || '').toLowerCase().includes(bairro));
  });
  const container = $('#listaPessoas');
  if (!container) return;
  container.innerHTML = pessoas.map((person) => {
    const tipo = person.tipoDemanda || person.tipo || 'Não informado';
    return `
      <div class="card">
        <h3>${esc(person.nome)}</h3>
        <p>${esc(person.bairro || 'Bairro não informado')} • ${esc(person.telefone || 'Telefone não informado')}</p>
        <p><strong>Demanda:</strong> ${esc(person.demanda || 'Não informada')}</p>
        <p><strong>Tipo:</strong> ${esc(tipo)}</p>
        ${person.procedimento ? `<p><strong>Procedimento:</strong> ${esc(person.procedimento)}</p>` : ''}
        <p><strong>Status:</strong> ${esc(person.status || 'Pendente')}</p>
        ${person.cpf ? `<p><strong>CPF:</strong> ${esc(person.cpf)}</p>` : ''}
        ${person.sus ? `<p><strong>SUS:</strong> ${esc(person.sus)}</p>` : ''}
        ${person.endereco ? `<p><strong>Endereço:</strong> ${esc(person.endereco)}</p>` : ''}
        <div class="acoes">
          <button type="button" onclick="verCadastro('${esc(person.id)}')">Ver cadastro</button>
          <button type="button" onclick="editarCadastro('${esc(person.id)}')">Editar</button>
          <button type="button" onclick="excluirCadastro('${esc(person.id)}')">Excluir</button>
          ${person.telefone ? `<button type="button" onclick="wa('${esc(person.telefone)}','Olá, ${esc(person.nome)}!')">WhatsApp</button>` : ''}
        </div>
      </div>`;
  }).join('') || `<div class="card"><p>Nenhum cadastro encontrado.</p></div>`;
  atualizarPainel();
}

function atualizarPainel() {
  const painel = $('#painelConteudo');
  if (!painel) return;
  const total = db.people.length;
  const pendentes = db.people.filter((p) => (p.status || 'Pendente') === 'Pendente').length;
  const andamento = db.people.filter((p) => p.status === 'Em andamento').length;
  const concluidos = db.people.filter((p) => p.status === 'Concluído').length;
  painel.innerHTML = `<div class="card"><h3>Resumo do gabinete</h3><p><strong>${total}</strong> pessoas cadastradas</p><p><strong>${pendentes}</strong> demandas pendentes</p><p><strong>${andamento}</strong> demandas em andamento</p><p><strong>${concluidos}</strong> demandas concluídas</p></div>`;
}

function renderDemandas() {
  const container = $('#listaDemandas');
  if (!container) return;
  const demandas = db.people.filter((person) => person.demanda);
  container.innerHTML = demandas.map((person) => {
    const tipo = person.tipoDemanda || person.tipo || 'Não informado';
    return `<div class="card"><h3>${esc(person.demanda)}</h3><p><strong>Pessoa:</strong> ${esc(person.nome)}</p><p><strong>Tipo:</strong> ${esc(tipo)}</p><p><strong>Bairro:</strong> ${esc(person.bairro || 'Não informado')}</p>${person.procedimento ? `<p><strong>Procedimento:</strong> ${esc(person.procedimento)}</p>` : ''}<p><strong>Status:</strong> ${esc(person.status || 'Pendente')}</p><div class="acoes"><button type="button" onclick="verCadastro('${esc(person.id)}')">Ver cadastro</button><button type="button" onclick="editarCadastro('${esc(person.id)}')">Editar</button>${person.telefone ? `<button type="button" onclick="wa('${esc(person.telefone)}','Olá, ${esc(person.nome)}! Estou entrando em contato sobre sua demanda: ${esc(person.demanda)}.')">WhatsApp</button>` : ''}</div></div>`;
  }).join('') || `<div class="card"><p>Nenhuma demanda cadastrada.</p></div>`;
}

function renderAgenda() {
  const container = $('#listaAgenda');
  if (!container) return;
  if (!db.agenda.length) { container.innerHTML = `<div class="card"><h3>Agenda</h3><p>Nenhum compromisso cadastrado.</p></div>`; return; }
  const agenda = [...db.agenda].sort((a,b) => String(a.data || '').localeCompare(String(b.data || '')));
  container.innerHTML = agenda.map((item) => `<div class="card"><h3>${esc(item.assunto || 'Compromisso')}</h3><p>${esc(item.data || '')}${item.hora ? ` às ${esc(item.hora)}` : ''}</p>${item.tipo ? `<p><strong>Tipo:</strong> ${esc(item.tipo)}</p>` : ''}<p><strong>Status:</strong> ${esc(item.status || 'Pendente')}</p></div>`).join('');
}

function getBirthdays() {
  return db.people.map((person) => ({person,date:birth(person)})).filter((item) => item.date).sort((a,b) => a.date - b.date);
}

function renderBirthdays() {
  const container = $('#listaAniversarios');
  if (!container) return;
  const birthdays = getBirthdays();
  container.innerHTML = birthdays.map((item) => `<div class="card"><h3>${esc(item.person.nome)}</h3><p>Aniversário: ${item.date.toLocaleDateString('pt-BR')}</p>${item.person.telefone ? `<button type="button" onclick="wa('${esc(item.person.telefone)}','Parabéns, ${esc(item.person.nome)}! 🎉 Desejamos muita saúde, felicidade e um excelente novo ciclo!')">Enviar felicitações pelo WhatsApp</button>` : ''}</div>`).join('') || `<div class="card"><p>Nenhum aniversário cadastrado.</p></div>`;
}

$('#buscaPessoa')?.addEventListener('input', render);
$('#filtroBairro')?.addEventListener('input', render);
window.imprimirPessoas = function() { window.print(); };

document.addEventListener('DOMContentLoaded', function() { render(); renderDemandas(); renderAgenda(); renderBirthdays(); atualizarPainel(); });
window.render = render;
window.renderDemandas = renderDemandas;
window.renderAgenda = renderAgenda;
window.renderBirthdays = renderBirthdays;
window.wa = wa;
