/*
 * GABINETE DIGITAL — Ponte de dados Supabase
 *
 * A aplicação existente continua usando o objeto localStorage `gabineteDigitalDemo`.
 * Este arquivo faz a ponte sem obrigar a reescrever toda a interface:
 * - autentica no Supabase Auth;
 * - carrega cidadaos/demandas/agenda para o armazenamento local ao abrir;
 * - sincroniza alterações feitas pela aplicação para o Supabase;
 * - preserva dados locais existentes na primeira conexão quando o banco remoto estiver vazio;
 * - nunca usa service_role key no navegador.
 */
(function () {
  'use strict';

  const DB_KEY = 'gabineteDigitalDemo';
  const CFG_KEY = 'gabineteSupabaseConfig';
  const SESSION_KEY = 'gabineteSupabaseSession';
  const SYNCING_KEY = '__gabinete_syncing__';

  const rawGet = Storage.prototype.getItem;
  const rawSet = Storage.prototype.setItem;
  const rawRemove = Storage.prototype.removeItem;

  let syncTimer = null;
  let bootstrapping = false;

  function getConfig() {
    try { return JSON.parse(rawGet.call(localStorage, CFG_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function setConfig(value) { rawSet.call(localStorage, CFG_KEY, JSON.stringify(value)); }

  function getSession() {
    try { return JSON.parse(rawGet.call(localStorage, SESSION_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function setSession(value) { rawSet.call(localStorage, SESSION_KEY, JSON.stringify(value)); }
  function clearSession() { rawRemove.call(localStorage, SESSION_KEY); }
  function normalizeUrl(url) { return String(url || '').trim().replace(/\/+$/, ''); }

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  async function api(path, options) {
    const cfg = getConfig();
    if (!cfg || !cfg.url || !cfg.anonKey) throw new Error('Supabase ainda não configurado.');

    const headers = Object.assign({
      apikey: cfg.anonKey,
      'Content-Type': 'application/json'
    }, (options && options.headers) || {});

    const session = getSession();
    if (session && session.access_token) headers.Authorization = 'Bearer ' + session.access_token;

    let response = await fetch(normalizeUrl(cfg.url) + path, Object.assign({}, options || {}, { headers }));

    if (response.status === 401 && session && session.refresh_token) {
      const refreshed = await refreshSession();
      if (refreshed) {
        headers.Authorization = 'Bearer ' + refreshed.access_token;
        response = await fetch(normalizeUrl(cfg.url) + path, Object.assign({}, options || {}, { headers }));
      }
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || ('Supabase HTTP ' + response.status));
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function refreshSession() {
    const cfg = getConfig();
    const old = getSession();
    if (!cfg || !old || !old.refresh_token) return null;

    const response = await fetch(normalizeUrl(cfg.url) + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: old.refresh_token })
    });

    if (!response.ok) { clearSession(); return null; }
    const data = await response.json();
    setSession(data);
    return data;
  }

  async function login(email, password) {
    const cfg = getConfig();
    if (!cfg) throw new Error('Configure primeiro o Supabase.');

    const response = await fetch(normalizeUrl(cfg.url) + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'E-mail ou senha inválidos.');
    setSession(data);
    return data;
  }

  async function logout() {
    const cfg = getConfig();
    const session = getSession();
    try {
      if (cfg && session && session.access_token) {
        await fetch(normalizeUrl(cfg.url) + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + session.access_token }
        });
      }
    } catch (_) {}
    clearSession();
    location.reload();
  }

  function readLocal() {
    try {
      const data = JSON.parse(rawGet.call(localStorage, DB_KEY) || '{"people":[],"agenda":[]}');
      data.people = Array.isArray(data.people) ? data.people : [];
      data.agenda = Array.isArray(data.agenda) ? data.agenda : [];
      return data;
    } catch (_) { return { people: [], agenda: [] }; }
  }

  function writeLocal(data) { rawSet.call(localStorage, DB_KEY, JSON.stringify(data)); }

  function mapRemote(cidadaos, demandas, agenda) {
    const demandaPorCidadao = {};
    (demandas || []).forEach(function (d) {
      if (!demandaPorCidadao[d.cidadao_id]) demandaPorCidadao[d.cidadao_id] = [];
      demandaPorCidadao[d.cidadao_id].push(d);
    });

    return {
      people: (cidadaos || []).map(function (c) {
        const d = (demandaPorCidadao[c.id] || [])[0] || null;
        return {
          id: c.id,
          nome: c.nome || '',
          mae: c.nome_mae || '',
          nascimento: c.data_nascimento || '',
          cpf: c.cpf || '',
          sus: c.cartao_sus || '',
          telefone: c.telefone || '',
          bairro: c.bairro || '',
          endereco: c.endereco || '',
          observacoes: c.observacoes || '',
          demanda: d ? (d.descricao || '') : '',
          tipoDemanda: d ? (d.tipo || '') : '',
          tipo: d ? (d.tipo || '') : '',
          procedimento: d ? (d.procedimento || '') : '',
          status: d ? (d.status || 'Pendente') : 'Pendente',
          demandaId: d ? d.id : null,
          criadoEm: c.criado_em || ''
        };
      }),
      agenda: (agenda || []).map(function (a) {
        return {
          id: a.id,
          assunto: a.assunto || '',
          data: a.data || '',
          hora: a.hora ? String(a.hora).slice(0, 5) : '',
          tipo: a.tipo || 'Outro',
          status: a.status || 'Pendente',
          observacoes: a.observacoes || ''
        };
      })
    };
  }

  async function fetchRemote() {
    const results = await Promise.all([
      api('/rest/v1/cidadaos?select=*&order=criado_em.desc'),
      api('/rest/v1/demandas?select=*&order=criado_em.asc'),
      api('/rest/v1/agenda?select=*&order=data.asc,hora.asc')
    ]);
    return mapRemote(results[0], results[1], results[2]);
  }

  function makeCidadao(person) {
    if (!isUuid(person.id)) person.id = uuid();
    return {
      id: person.id,
      nome: person.nome || '',
      nome_mae: person.mae || null,
      data_nascimento: person.nascimento || null,
      cpf: person.cpf || null,
      cartao_sus: person.sus || null,
      telefone: person.telefone || null,
      bairro: person.bairro || null,
      endereco: person.endereco || null,
      observacoes: person.observacoes || null
    };
  }

  function makeDemanda(person) {
    if (!person.demanda) return null;
    if (!isUuid(person.demandaId)) person.demandaId = uuid();
    return {
      id: person.demandaId,
      cidadao_id: person.id,
      descricao: person.demanda,
      tipo: person.tipoDemanda || person.tipo || 'Outro',
      procedimento: person.procedimento || null,
      status: person.status || 'Pendente',
      observacoes: person.observacoes || null
    };
  }

  function makeAgenda(item) {
    if (!isUuid(item.id)) item.id = uuid();
    return {
      id: item.id,
      assunto: item.assunto || 'Compromisso',
      data: item.data,
      hora: item.hora || null,
      tipo: item.tipo || 'Outro',
      status: item.status || 'Pendente',
      observacoes: item.observacoes || null
    };
  }

  async function upsert(table, rows) {
    if (!rows.length) return;
    await api('/rest/v1/' + table + '?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
  }

  async function deleteMissing(table, ids) {
    const remote = await api('/rest/v1/' + table + '?select=id');
    const keep = new Set(ids);
    const obsolete = (remote || []).map(function (r) { return r.id; }).filter(function (id) { return !keep.has(id); });
    for (const id of obsolete) {
      await api('/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
    }
  }

  async function persist(data) {
    if (bootstrapping || rawGet.call(localStorage, SYNCING_KEY) === '1') return;
    const cfg = getConfig();
    const session = getSession();
    if (!cfg || !session || !session.access_token) return;

    rawSet.call(localStorage, SYNCING_KEY, '1');
    try {
      const people = data.people || [];
      const cidadaos = people.map(makeCidadao);
      const demandas = people.map(makeDemanda).filter(Boolean);
      const agenda = (data.agenda || []).map(makeAgenda);

      writeLocal(data);
      await upsert('cidadaos', cidadaos);
      await upsert('demandas', demandas);
      await upsert('agenda', agenda);
      await deleteMissing('demandas', demandas.map(function (d) { return d.id; }));
      await deleteMissing('cidadaos', cidadaos.map(function (c) { return c.id; }));
      await deleteMissing('agenda', agenda.map(function (a) { return a.id; }));
    } catch (error) {
      console.error('[Gabinete Digital] Falha na sincronização:', error);
      showToast('Salvo neste aparelho, mas a sincronização com o Supabase falhou.');
    } finally {
      rawRemove.call(localStorage, SYNCING_KEY);
    }
  }

  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { persist(readLocal()); }, 450);
  }

  function showToast(message) {
    let el = document.getElementById('gabineteToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gabineteToast';
      el.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:99999;background:#111827;color:#fff;padding:12px 16px;border-radius:10px;font:14px Arial;max-width:90%;box-shadow:0 8px 30px #0006;';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 4500);
  }

  function injectPanel() {
    if (document.getElementById('gabineteSupabasePanel')) return;
    const panel = document.createElement('div');
    panel.id = 'gabineteSupabasePanel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99998;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif;';
    panel.innerHTML = `
      <div style="width:min(520px,100%);background:#171717;color:#fff;border-radius:18px;padding:22px;box-sizing:border-box;box-shadow:0 20px 60px #0009">
        <h2 style="margin:0 0 8px">Gabinete Digital</h2>
        <p id="gabineteSupabaseStatus" style="color:#cfcfcf;margin:0 0 18px">Conecte o sistema ao Supabase para salvar os dados na nuvem.</p>
        <label style="display:block;margin:10px 0 6px">Project URL</label>
        <input id="sbUrl" placeholder="https://seu-projeto.supabase.co" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff">
        <label style="display:block;margin:10px 0 6px">Publishable key / anon key</label>
        <input id="sbKey" placeholder="eyJ..." style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff">
        <div style="height:1px;background:#333;margin:18px 0"></div>
        <label style="display:block;margin:10px 0 6px">E-mail do usuário do sistema</label>
        <input id="sbEmail" type="email" autocomplete="username" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff">
        <label style="display:block;margin:10px 0 6px">Senha</label>
        <input id="sbPassword" type="password" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #444;background:#222;color:#fff">
        <button id="sbConnect" style="width:100%;margin-top:16px;padding:13px;border:0;border-radius:10px;background:#22c55e;color:#06110a;font-weight:700;font-size:16px">Conectar e entrar</button>
        <button id="sbLocal" style="width:100%;margin-top:9px;padding:11px;border:1px solid #555;border-radius:10px;background:#222;color:#fff">Continuar somente neste aparelho</button>
        <p style="font-size:12px;color:#aaa;line-height:1.45;margin:15px 0 0">Use somente a chave pública (anon/publishable). Nunca coloque a service_role key no site.</p>
      </div>`;

    document.body.appendChild(panel);
    const cfg = getConfig();
    if (cfg) {
      document.getElementById('sbUrl').value = cfg.url || '';
      document.getElementById('sbKey').value = cfg.anonKey || '';
    }

    document.getElementById('sbConnect').onclick = async function () {
      const status = document.getElementById('gabineteSupabaseStatus');
      const url = normalizeUrl(document.getElementById('sbUrl').value);
      const anonKey = document.getElementById('sbKey').value.trim();
      const email = document.getElementById('sbEmail').value.trim();
      const password = document.getElementById('sbPassword').value;

      if (!url || !anonKey || !email || !password) {
        status.textContent = 'Preencha Project URL, chave pública, e-mail e senha.';
        return;
      }
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
        status.textContent = 'O Project URL parece inválido. Use o endereço terminado em .supabase.co.';
        return;
      }

      setConfig({ url: url, anonKey: anonKey });
      status.textContent = 'Conectando...';
      try {
        await login(email, password);
        status.textContent = 'Login realizado. Carregando os dados...';
        await bootstrap(true);
      } catch (error) {
        clearSession();
        status.textContent = 'Não foi possível conectar: ' + (error.message || error);
      }
    };

    document.getElementById('sbLocal').onclick = function () {
      panel.remove();
      showToast('Modo local ativado. Os dados ficam somente neste aparelho.');
    };
  }

  async function bootstrap(forceReload) {
    const cfg = getConfig();
    if (!cfg) {
      if (document.readyState !== 'loading') injectPanel();
      else document.addEventListener('DOMContentLoaded', injectPanel, { once: true });
      return false;
    }

    let session = getSession();
    if (!session) {
      if (document.readyState !== 'loading') injectPanel();
      else document.addEventListener('DOMContentLoaded', injectPanel, { once: true });
      return false;
    }

    if (session.expires_at && Date.now() > Number(session.expires_at) * 1000 - 60000) {
      session = await refreshSession();
      if (!session) { injectPanel(); return false; }
    }

    bootstrapping = true;
    try {
      const localBefore = readLocal();
      const remote = await fetchRemote();
      const remoteEmpty = remote.people.length === 0 && remote.agenda.length === 0;
      const localHasData = localBefore.people.length > 0 || localBefore.agenda.length > 0;

      if (remoteEmpty && localHasData) {
        bootstrapping = false;
        await persist(localBefore);
        if (forceReload) location.reload();
        return true;
      }

      writeLocal(remote);
      bootstrapping = false;
      if (forceReload) location.reload();
      return true;
    } catch (error) {
      bootstrapping = false;
      console.error('[Gabinete Digital] Supabase:', error);
      showToast('Não foi possível carregar a nuvem. O sistema continua com o último backup local.');
      return false;
    }
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === DB_KEY && rawGet.call(localStorage, SYNCING_KEY) !== '1') scheduleSync();
  };

  window.GabineteDB = {
    version: 2,
    init: function () { return bootstrap(false); },
    exportar: readLocal,
    importar: function (data) {
      if (!data || typeof data !== 'object') throw new Error('Backup inválido');
      writeLocal(data);
      location.reload();
    },
    logout: logout,
    sincronizar: function () { return persist(readLocal()); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bootstrap(false); }, { once: true });
  else bootstrap(false);
})();
