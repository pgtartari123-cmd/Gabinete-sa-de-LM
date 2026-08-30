const KEY = 'gabineteDigitalDemo';

let db = JSON.parse(
  localStorage.getItem(KEY) || '{"people":[],"agenda":[]}'
);

const $ = (selector) => document.querySelector(selector);

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
  render();
  renderDemandas();
  renderAgenda();
  renderBirthdays();
}

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

/* =========================
   NAVEGAÇÃO
========================= */

document.querySelectorAll('nav button').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.style.display = 'none';
    });

    const target = $('#' + button.dataset.t);

    if (target) {
      target.style.display = 'block';
    }

    if (button.dataset.t === 'painel') {
      renderBirthdays();
    }
  };
});

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

  // DD/MM/AAAA
  let match = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);

  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  // AAAA-MM-DD
  if (!match) {
    match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

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
   CADASTRO DE PESSOA
========================= */

$('#form').onsubmit = (event) => {
  event.preventDefault();

  const person = Object.fromEntries(
    new FormData(event.target)
  );

  person.id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();

  db.people.unshift(person);

  event.target.reset();

  save();

  alert('Cadastro salvo com sucesso!');

  const peopleButton =
    document.querySelector('[data-t="pessoas"]');

  if (peopleButton) {
    peopleButton.click();
  }
};

/* =========================
   AGENDA
========================= */

$('#agendaForm').onsubmit = (event) => {
  event.preventDefault();

  const appointment = Object.fromEntries(
    new FormData(event.target)
  );

  appointment.id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();

  db.agenda.push(appointment);

  event.target.reset();

  save();

  alert('Compromisso agendado com sucesso!');
};

/* =========================
   PESSOAS
========================= */

function render() {
  const query =
    ($('#q')?.value || '').toLowerCase().trim();

  const bairro =
    ($('#bairro')?.value || '').toLowerCase().trim();

  const people = db.people.filter((person) => {

    const searchText = [
      person.nome,
      person.cpf,
      person.telefone,
      person.sus,
      person.demanda,
      person.tipo
    ]
      .join(' ')
      .toLowerCase();

    const personBairro =
      (person.bairro || '').toLowerCase();

    return (
      (!query || searchText.includes(query)) &&
      (!bairro || personBairro.includes(bairro))
    );
  });

  const container = $('#people');

  if (!container) return;

  container.innerHTML =
    people.map((person) => `
      <div class="item">

        <div>
          <b>${esc(person.nome)}</b>

          <div class="muted">
            ${esc(person.bairro || 'Bairro não informado')}
            •
            ${esc(person.telefone || 'Telefone não informado')}
          </div>

          <div>
            ${esc(person.tipo || 'Demanda')}
            ${person.demanda ? ' • ' + esc(person.demanda) : ''}
          </div>

          <div>
            <span class="badge">
              ${esc(person.status || 'Pendente')}
            </span>
          </div>
        </div>

        <button
          onclick="wa(
            '${esc(person.telefone)}',
            'Olá, ${esc(person.nome)}!'
          )"
        >
          WhatsApp
        </button>

      </div>
    `).join('') ||
    `
      <div class="panel">
        Nenhum cadastro encontrado.
      </div>
    `;

  $('#nP').textContent = db.people.length;

  $('#nD').textContent =
    db.people.filter(
      (person) =>
        !['Resolvida', 'Arquivada'].includes(
          person.status
        )
    ).length;

  $('#nA').textContent =
    db.agenda.filter(
      (appointment) =>
        appointment.status === 'Pendente'
    ).length;

  $('#nB').textContent =
    db.people.filter(
      (person) => birth(person)
    ).length;

  renderBirthdaysPanel();
}

/* =========================
   DEMANDAS
========================= */

function renderDemandas() {
  const query =
    ($('#proc')?.value || '').toLowerCase().trim();

  const bairro =
    ($('#procB')?.value || '').toLowerCase().trim();

  const status =
    $('#procS')?.value || '';

  const demands = db.people.filter((person) => {

    const demanda =
      (
        (person.demanda || '') +
        ' ' +
        (person.tipo || '')
      ).toLowerCase();

    const personBairro =
      (person.bairro || '').toLowerCase();

    return (
      (!query || demanda.includes(query)) &&
      (!bairro || personBairro.includes(bairro)) &&
      (!status || person.status === status)
    );
  });

  const container = $('#demands');

  if (!container) return;

  container.innerHTML =
    demands.map((person) => `
      <div class="item">

        <div>
          <b>
            ${esc(person.demanda || 'Sem demanda')}
          </b>

          <div>
            ${esc(person.tipo || 'Tipo não informado')}
          </div>

          <div>
            ${esc(person.nome)}
            •
            ${esc(person.bairro || 'Bairro não informado')}
          </div>

          <div class="muted">
            ${esc(person.telefone || 'Telefone não informado')}
            •
            ${esc(person.referencia || 'Sem referência')}
          </div>
        </div>

        <span class="badge">
          ${esc(person.status || 'Pendente')}
        </span>

      </div>
    `).join('') ||
    `
      <div class="panel">
        Nenhuma demanda encontrada.
      </div>
    `;
}

/* =========================
   AGENDA
========================= */

function renderAgenda() {
  const appointments = [...db.agenda].sort(
    (a, b) =>
      ((a.data || '') + (a.hora || ''))
        .localeCompare(
          (b.data || '') + (b.hora || '')
        )
  );

  const container = $('#agendaList');

  if (!container) return;

  container.innerHTML =
    appointments.map((appointment) => `
      <div class="item">

        <div>
          <b>
            ${esc(appointment.assunto)}
          </b>

          <div>
            ${esc(appointment.data)}
            às
            ${esc(appointment.hora)}
            •
            ${esc(appointment.tipo)}
          </div>

          <div class="muted">
            Responsável:
            ${esc(
              appointment.responsavel ||
              'Não informado'
            )}
          </div>
        </div>

        <span class="badge">
          ${esc(appointment.status)}
        </span>

      </div>
    `).join('') ||
    `
      <div class="panel">
        Agenda vazia.
      </div>
    `;
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
  const birthdays = getBirthdays();

  const container = $('#birthdays');

  if (!container) return;

  container.innerHTML =
    birthdays.map((item) => `
      <div class="item">

        <div>
          <b>
            ${esc(item.person.nome)}
          </b>

          <div>
            ${item.date.toLocaleDateString('pt-BR')}
            •
            ${esc(
              item.person.telefone ||
              'Telefone não informado'
            )}
          </div>
        </div>

        <button
          onclick="wa(
            '${esc(item.person.telefone)}',
            'Parabéns, ${esc(item.person.nome)}! 🎉 Desejamos muita saúde, felicidade e um excelente novo ciclo!'
          )"
        >
          Felicitações
        </button>

      </div>
    `).join('') ||
    `
      <div class="panel">
        Nenhum aniversário cadastrado.
      </div>
    `;
}

/* =========================
   ANIVERSÁRIOS NO PAINEL
========================= */

function renderBirthdaysPanel() {
  const container = $('#bp');

  if (!container) return;

  const birthdays = getBirthdays().slice(0, 5);

  container.innerHTML =
    birthdays.map((item) => `
      <div class="item">

        <div>
          <b>
            ${esc(item.person.nome)}
          </b>

          <div class="muted">
            ${item.date.toLocaleDateString('pt-BR')}
            •
            ${esc(
              item.person.telefone ||
              'Sem telefone'
            )}
          </div>
        </div>

      </div>
    `).join('') ||
    `
      <div class="muted">
        Nenhum aniversário cadastrado.
      </div>
    `;
}

/* =========================
   INICIALIZAÇÃO
========================= */

render();
renderDemandas();
renderAgenda();
renderBirthdays();
