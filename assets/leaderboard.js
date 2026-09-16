/* LLM Leaderboard — atualização ao vivo, busca, ordenação e filtro.
 *
 * O HTML já chega com as 100 primeiras linhas, renderizadas no build
 * (tools/build-leaderboard.mjs). Este arquivo busca o ranking completo — primeiro na
 * API ao vivo do Automations Cookbook, depois no modelos.json publicado junto com a
 * página — e só então substitui a tabela. Até lá, e se as duas fontes falharem, quem
 * visita vê a tabela do build, que continua correta e legível.
 *
 * A linha gerada aqui reproduz exatamente a do build. Mudou uma, muda a outra.
 */
(function () {
  'use strict';

  var tabela = document.getElementById('lbTabela');
  var cfgEl = document.getElementById('lbConfig');
  if (!tabela || !cfgEl) return;

  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  var corpo = document.getElementById('lbCorpo');
  var controles = document.getElementById('lbControles');
  var busca = document.getElementById('lbBusca');
  var contagem = document.getElementById('lbContagem');
  var chips = document.getElementById('lbChips');
  var vazio = document.getElementById('lbVazio');
  var mais = document.getElementById('lbMais');
  var atualizado = document.getElementById('lbAtualizado');
  var botoesOrdem = Array.prototype.slice.call(tabela.querySelectorAll('.lb-th'));

  // `menor`: quanto menor, melhor. Define a direção padrão da ordenação e do percentil.
  var METRICAS = [
    { chave: 'intelligence', campo: 'intelligenceIndex', f: indice, menor: false },
    { chave: 'coding', campo: 'codingIndex', f: indice, menor: false },
    { chave: 'agentic', campo: 'agenticIndex', f: indice, menor: false },
    { chave: 'speed', campo: 'outputTokensPerSecond', f: vel, menor: false },
    { chave: 'latency', campo: 'latencySeconds', f: seg, menor: true },
    { chave: 'endToEnd', campo: 'endToEndResponseSeconds', f: seg, menor: true },
    { chave: 'price', campo: 'blendedPricePer1m', f: preco, menor: true }
  ];
  var porChave = {};
  METRICAS.forEach(function (m) { porChave[m.chave] = m; });

  var n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var n2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var n4 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  function indice(v) { return v == null ? '—' : n1.format(v); }
  function vel(v) { return v == null ? '—' : n1.format(v) + ' tok/s'; }
  function seg(v) { return v == null ? '—' : n2.format(v) + ' s'; }
  function preco(v) { return v == null ? '—' : 'US$ ' + (v < 0.01 && v > 0 ? n4 : n2).format(v); }
  function lancamento(v) {
    return v ? new Date(v + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var modelos = [];
  var percentil = {};
  var estado = { ordem: 'intelligence', dir: 'desc', criador: '', termo: '', todos: false };

  /* ---------------- dados ---------------- */

  function valido(body) {
    return body && body.ok && body.models && body.models.length >= 100 && body.meta && body.meta.fetchedAt;
  }

  function buscarJson(url, ms) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal, headers: { Accept: 'application/json' } } : {})
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (body) { if (timer) clearTimeout(timer); if (!valido(body)) throw new Error('inválido'); return body; });
  }

  function montarPercentis() {
    METRICAS.forEach(function (m) {
      var vals = modelos.map(function (x) { return x[m.campo]; })
        .filter(function (v) { return v != null; })
        .sort(function (a, b) { return m.menor ? b - a : a - b; });
      percentil[m.campo] = function (v) {
        if (v == null || vals.length < 2) return null;
        var lo = 0, hi = vals.length;
        while (lo < hi) {
          var mid = (lo + hi) >> 1;
          if (m.menor ? vals[mid] > v : vals[mid] < v) lo = mid + 1; else hi = mid;
        }
        return Math.round((lo / (vals.length - 1)) * 100);
      };
    });
  }

  /* ---------------- render ---------------- */

  function linha(x, pos) {
    var celulas = METRICAS.map(function (m) {
      var v = x[m.campo];
      var ativa = m.chave === estado.ordem ? ' lb-ativa' : '';
      if (v == null) return '<td class="lb-num lb-sem' + ativa + '">—</td>';
      var p = percentil[m.campo](v);
      return '<td class="lb-num' + ativa + '"><span class="lb-v">' + esc(m.f(v)) + '</span>' +
        '<span class="lb-barra" style="--p:' + p + '%" title="melhor que ' + p + '% dos modelos com esse dado" aria-hidden="true"></span></td>';
    }).join('');
    return '<tr><td class="lb-pos">' + pos + '</td><th scope="row" class="lb-modelo">' +
      '<a href="https://artificialanalysis.ai/models/' + encodeURIComponent(x.slug) + '" target="_blank" rel="nofollow noopener">' + esc(x.name) + '</a>' +
      '<span>' + esc(x.creator) + '</span></th>' + celulas + '<td class="lb-data">' + lancamento(x.releaseDate) + '</td></tr>';
  }

  function ordenar(lista) {
    var m = porChave[estado.ordem];
    var asc = estado.dir === 'asc';
    return lista.slice().sort(function (a, b) {
      var va = a[m.campo], vb = b[m.campo];
      // sem dado vai sempre para o fim, em qualquer direção
      if (va == null && vb == null) return a.name.localeCompare(b.name);
      if (va == null) return 1;
      if (vb == null) return -1;
      var d = asc ? va - vb : vb - va;
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
  }

  function filtrar() {
    var termos = estado.termo.toLowerCase().split(/\s+/).filter(Boolean);
    return modelos.filter(function (x) {
      if (estado.criador && x.creator !== estado.criador) return false;
      if (!termos.length) return true;
      var alvo = (x.name + ' ' + x.creator).toLowerCase();
      return termos.every(function (t) { return alvo.indexOf(t) !== -1; });
    });
  }

  function render() {
    var lista = ordenar(filtrar());
    var limite = estado.todos ? lista.length : Math.min(lista.length, cfg.linhas || 100);
    corpo.innerHTML = lista.slice(0, limite).map(function (x, i) { return linha(x, i + 1); }).join('');

    var filtrado = estado.termo || estado.criador;
    contagem.textContent = filtrado
      ? lista.length + ' de ' + modelos.length + ' modelos'
      : (limite < lista.length ? 'Top ' + limite + ' de ' : '') + modelos.length + ' modelos';
    vazio.hidden = lista.length > 0;
    mais.hidden = limite >= lista.length;
    mais.textContent = 'Mostrar todos os ' + lista.length + ' modelos';

    botoesOrdem.forEach(function (b) {
      var th = b.parentNode;
      var ativo = b.getAttribute('data-ordem') === estado.ordem;
      th.classList.toggle('lb-ativa', ativo);
      th.setAttribute('aria-sort', ativo ? (estado.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  /* ---------------- interação ---------------- */

  botoesOrdem.forEach(function (b) {
    b.addEventListener('click', function () {
      var chave = b.getAttribute('data-ordem');
      if (chave === estado.ordem) {
        estado.dir = estado.dir === 'asc' ? 'desc' : 'asc';
      } else {
        estado.ordem = chave;
        estado.dir = porChave[chave].menor ? 'asc' : 'desc';
      }
      render();
    });
  });

  var atraso;
  busca.addEventListener('input', function () {
    clearTimeout(atraso);
    atraso = setTimeout(function () { estado.termo = busca.value.trim(); render(); }, 120);
  });

  chips.addEventListener('click', function (ev) {
    var chip = ev.target.closest('.lb-chip');
    if (!chip) return;
    estado.criador = chip.getAttribute('data-criador') || '';
    Array.prototype.forEach.call(chips.querySelectorAll('.lb-chip'), function (c) {
      var on = c === chip;
      c.classList.toggle('ativo', on);
      c.setAttribute('aria-pressed', String(on));
    });
    render();
  });

  mais.addEventListener('click', function () { estado.todos = true; render(); });

  /* ---------------- carga ---------------- */

  function ativar(body) {
    modelos = body.models.filter(function (x) { return x.slug && x.name; });
    montarPercentis();
    if (body.meta.fetchedAt > (cfg.geradoEm || '') && atualizado) {
      atualizado.setAttribute('datetime', body.meta.fetchedAt);
      atualizado.textContent = new Date(body.meta.fetchedAt).toLocaleDateString('pt-BR',
        { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    }
    controles.hidden = false;
    render();
  }

  buscarJson(cfg.api, 8000)
    .catch(function () { return buscarJson(cfg.reserva, 8000); })
    .then(ativar)
    .catch(function () { /* fica a tabela do build, que já está correta */ });
})();
