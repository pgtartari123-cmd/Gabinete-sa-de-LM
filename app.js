const KEY = 'gabineteDigitalDemo';

let db = JSON.parse(
  localStorage.getItem(KEY) ||
  '{"people":[],"agenda":[]}'
);

db.people = Array.isArray(db.people) ? db.people : [];
db.agenda = Array.isArray(db.agenda) ? db.agenda : [];

const $ = (selector) => document.querySelector(selector);

/* =========================
   SALVAMENTO
========================= */

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));

  render();
  renderDemandas();
  renderAgenda();
  renderBirthdays();
}

/* =========================
   SEGURANÇA HTML
========================= */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

/* =========================
   WHATSAPP
========================= */

function wa(telefone, mensagem) {
  let numero = String(telefone || '').replace(/\D/g, '');

  if (!numero) {
    alert('Telefone não cadastrado.');
    return;
  }

  if (numero.length === 10 || numero.length === 11) {
    numero = '55' + numero;
  }

  const url =
    'https://wa.me/' +
    numero +
    '?text=' +
    encodeURIComponent(mensagem);

  window.open(url, '_blank');
}

/* =========================
   DATA DE NASCIMENTO
========================= */

function birth(person) {
  const value = String(person.nascimento || '').trim();

  if (!value) return null;

  let day;
  let month;
  let year;

  let match = value.match(
    /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/
  );

  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  if (!match) {
    match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (match) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    }
  }

  if (!day || !month || !year) {
    return null;
  }

  const now = new Date();

  let date = new Date(
    now.getFullYear(),
    month - 1,
    day
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (date < today) {
    date.setFullYear(date.getFullYear() + 1);
  }

  return date;
}

/* =========================
   NOVO CADASTRO
========================= */

const formCadastro = $('#formCadastro');

if (formCadastro) {
  formCadastro.addEventListener('submit', function(event) {
    event.preventDefault();

    const person = Object.fromEntries(
      new FormData(event.target)
    );

    person.id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();

    /*
      O HTML usa "tipoDemanda".
      Também salvamos como "tipo" para manter
      compatibilidade com cadastros antigos.
    */

    person.demanda = person.demanda || '';
    person.tipoDemanda = person.tipoDemanda || '';
    person.tipo = person.tipoDemanda || '';
    person.status = person.status || 'Pendente';

    db.people.unshift(person);

    event.target.reset();

    save();

    alert('Cadastro salvo com sucesso!');

    if (typeof mostrarAba === 'function') {
      mostrarAba('pessoas');
    }
  });
}

/* =========================
   PESSOAS
========================= */

function render() {
  const busca =
    ($('#buscaPessoa')?.value || '')
      .toLowerCase()
      .trim();

  const bairro =
    ($('#filtroBairro')?.value || '')
      .toLowerCase()
      .trim();

  const pessoas = db.people.filter((person) => {

    const texto = [
      person.nome,
      person.mae,
      person.cpf,
      person.sus,
      person.telefone,
      person.bairro,
      person.endereco,
      person.demanda,
      person.tipoDemanda,
      person.tipo,
      person.procedimento,
      person.status
    ]
      .join(' ')
      .toLowerCase();

    const personBairro =
      String(person.bairro || '')
        .toLowerCase();

    return (
      (!busca || texto.includes(busca)) &&
      (!bairro || personBairro.includes(bairro))
    );
  });

  const container = $('#listaPessoas');

  if (!container) return;

  container.innerHTML =
    pessoas.map((person) => {

      const tipo =
        person.tipoDemanda ||
        person.tipo ||
        'Não informado';

      return `
        <div class="card">

          <h3>${esc(person.nome)}</h3>

          <p>
            ${esc(person.bairro || 'Bairro não informado')}
            •
            ${esc(person.telefone || 'Telefone não informado')}
          </p>

          <p>
            <strong>Demanda:</strong>
            ${esc(person.demanda || 'Não informada')}
          </p>

          <p>
            <strong>Tipo:</strong>
            ${esc(tipo)}
          </p>

          ${
            person.procedimento
              ? `
                <p>
                  <strong>Procedimento:</strong>
                  ${esc(person.procedimento)}
                </p>
              `
              : ''
          }

          <p>
            <strong>Status:</strong>
            ${esc(person.status || 'Pendente')}
          </p>

          ${
            person.cpf
              ? `<p><strong>CPF:</strong> ${esc(person.cpf)}</p>`
              : ''
          }

          ${
            person.sus
              ? `<p><strong>SUS:</strong> ${esc(person.sus)}</p>`
              : ''
          }

          ${
            person.endereco
              ? `<p><strong>Endereço:</strong> ${esc(person.endereco)}</p>`
              : ''
          }

          ${
            person.telefone
              ? `
                <button
                  type="button"
                  onclick="wa(
                    '${esc(person.telefone)}',
                    'Olá, ${esc(person.nome)}!'
                  )"
                >
                  WhatsApp
                </button>
              `
              : ''
          }

        </div>
      `;
    }).join('') ||
    `
      <div class="card">
        <p>Nenhum cadastro encontrado.</p>
      </div>
    `;

  atualizarPainel();
}

/* =========================
   PAINEL
========================= */

function atualizarPainel() {
  const painel = $('#painelConteudo');

  if (!painel) return;

  const total = db.people.length;

  const pendentes = db.people.filter(
    (p) => (p.status || 'Pendente') === 'Pendente'
  ).length;

  const andamento = db.people.filter(
    (p) => p.status === 'Em andamento'
  ).length;

  const concluidos = db.people.filter(
    (p) => p.status === 'Concluído'
  ).length;

  painel.innerHTML = `
    <div class="card">
      <h3>Resumo do gabinete</h3>

      <p>
        <strong>${total}</strong>
        pessoas cadastradas
      </p>

      <p>
        <strong>${pendentes}</strong>
        demandas pendentes
      </p>

      <p>
        <strong>${andamento}</strong>
        demandas em andamento
      </p>

      <p>
        <strong>${concluidos}</strong>
        demandas concluídas
      </p>
    </div>
  `;
}

/* =========================
   DEMANDAS
========================= */

function renderDemandas() {
  const container = $('#listaDemandas');

  if (!container) return;

  const demandas = db.people.filter(
    (person) => person.demanda
  );

  container.innerHTML =
    demandas.map((person) => {

      const tipo =
        person.tipoDemanda ||
        person.tipo ||
        'Não informado';

      return `
        <div class="card">

          <h3>
            ${esc(person.demanda)}
          </h3>

          <p>
            <strong>Pessoa:</strong>
            ${esc(person.nome)}
          </p>

          <p>
            <strong>Tipo:</strong>
            ${esc(tipo)}
          </p>

          <p>
            <strong>Bairro:</strong>
            ${esc(person.bairro || 'Não informado')}
          </p>

          ${
            person.procedimento
              ? `
                <p>
                  <strong>Procedimento:</strong>
                  ${esc(person.procedimento)}
                </p>
              `
              : ''
          }

          <p>
            <strong>Status:</strong>
            ${esc(person.status || 'Pendente')}
          </p>

          ${
            person.telefone
              ? `
                <button
                  type="button"
                  onclick="wa(
                    '${esc(person.telefone)}',
                    'Olá, ${esc(person.nome)}! Estou entrando em contato sobre sua demanda: ${esc(person.demanda)}.'
                  )"
                >
                  WhatsApp
                </button>
              `
              : ''
          }

        </div>
      `;
    }).join('') ||
    `
      <div class="card">
        <p>Nenhuma demanda cadastrada.</p>
      </div>
    `;
}

/* =========================
   AGENDA
========================= */

function renderAgenda() {
  const container = $('#listaAgenda');

  if (!container) return;

  if (!db.agenda.length) {
    container.innerHTML = `
      <div class="card">
        <h3>Agenda</h3>
        <p>Nenhum compromisso cadastrado.</p>
      </div>
    `;
    return;
  }

  const agenda = [...db.agenda].sort(
    (a, b) =>
      String(a.data || '')
        .localeCompare(String(b.data || ''))
  );

  container.innerHTML =
    agenda.map((item) => `
      <div class="card">

        <h3>
          ${esc(item.assunto || 'Compromisso')}
        </h3>

        <p>
          ${esc(item.data || '')}
          ${
            item.hora
              ? ` às ${esc(item.hora)}`
              : ''
          }
        </p>

        ${
          item.tipo
            ? `<p><strong>Tipo:</strong> ${esc(item.tipo)}</p>`
            : ''
        }

        <p>
          <strong>Status:</strong>
          ${esc(item.status || 'Pendente')}
        </p>

      </div>
    `).join('');
}

/* =========================
   ANIVERSÁRIOS
========================= */

function getBirthdays() {
  return db.people
    .map((person) => ({
      person,
      date: birth(person)
    }))
    .filter((item) => item.date)
    .sort((a, b) => a.date - b.date);
}

function renderBirthdays() {
  const container = $('#listaAniversarios');

  if (!container) return;

  const birthdays = getBirthdays();

  container.innerHTML =
    birthdays.map((item) => `
      <div class="card">

        <h3>
          ${esc(item.person.nome)}
        </h3>

        <p>
          Aniversário:
          ${item.date.toLocaleDateString('pt-BR')}
        </p>

        ${
          item.person.telefone
            ? `
              <button
                type="button"
                onclick="wa(
                  '${esc(item.person.telefone)}',
                  'Parabéns, ${esc(item.person.nome)}! 🎉 Desejamos muita saúde, felicidade e um excelente novo ciclo!'
                )"
              >
                Enviar felicitações pelo WhatsApp
              </button>
            `
            : ''
        }

      </div>
    `).join('') ||
    `
      <div class="card">
        <p>Nenhum aniversário cadastrado.</p>
      </div>
    `;
}

/* =========================
   FILTROS
========================= */

$('#buscaPessoa')?.addEventListener(
  'input',
  render
);

$('#filtroBairro')?.addEventListener(
  'input',
  render
);

/* =========================
   IMPRESSÃO
========================= */

window.imprimirPessoas = function() {
  window.print();
};

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    render();
    renderDemandas();
    renderAgenda();
    renderBirthdays();
    atualizarPainel();

  }
);

/* =========================
   COMPATIBILIDADE
========================= */

window.render = render;
window.renderDemandas = renderDemandas;
window.renderAgenda = renderAgenda;
window.renderBirthdays = renderBirthdays;
window.wa = wa;
