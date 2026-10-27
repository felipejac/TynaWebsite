/* Comparativo de AI Gateways — filtro, ordenação e detalhe.
 *
 * A tabela vem inteira do servidor: 124 linhas de dados mais 124 linhas de detalhe,
 * já no HTML. Este arquivo não constrói nada, só decide o que fica visível e em que
 * ordem. Se ele não carregar, a página continua sendo uma tabela completa e legível —
 * que é o comportamento que se espera de conteúdo, e não de aplicativo.
 *
 * Cada linha de dado carrega o valor NORMALIZADO nos data-attributes (data-cat,
 * data-ent, ...) enquanto a célula mostra o texto original da planilha. É por isso que
 * filtrar por "Self-hosted" também traz "Self-hosted (K8s)" sem que a célula minta
 * sobre o que estava escrito na fonte.
 */
(function () {
  'use strict';

  var tabela = document.getElementById('cmpTabela');
  if (!tabela) return;

  var corpo = tabela.tBodies[0];
  var campoBusca = document.getElementById('cmpBusca');
  var selects = Array.prototype.slice.call(document.querySelectorAll('.cmp-bar select'));
  var contador = document.getElementById('cmpContagem');
  var vazio = document.getElementById('cmpVazio');
  var btnLimpar = document.getElementById('cmpLimpar');
  var btnTudo = document.getElementById('cmpTudo');
  var ordenadores = Array.prototype.slice.call(document.querySelectorAll('.cmp-sort'));

  var linhas = Array.prototype.slice.call(corpo.querySelectorAll('tr.cmp-row'));
  var total = linhas.length;
  // O detalhe é o irmão imediato da linha. Guardar o par aqui evita reconsultar o DOM
  // a cada ordenação, que é onde uma tabela desse tamanho começa a engasgar.
  var pares = linhas.map(function (tr) {
    return { linha: tr, detalhe: tr.nextElementSibling };
  });

  var colator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

  /* ---------------- filtro ---------------- */

  function termos() {
    return (campoBusca.value || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function aplicar() {
    var t = termos();
    var visiveis = 0;

    pares.forEach(function (p) {
      var ok = selects.every(function (s) {
        return !s.value || p.linha.getAttribute('data-' + s.dataset.campo) === s.value;
      });
      if (ok && t.length) {
        var alvo = p.linha.getAttribute('data-busca');
        // todos os termos precisam bater: "open source china" filtra de verdade,
        // em vez de devolver a união dos dois
        ok = t.every(function (x) { return alvo.indexOf(x) !== -1; });
      }
      p.linha.hidden = !ok;
      if (p.detalhe) p.detalhe.hidden = !ok || !p.linha.classList.contains('aberta');
      if (ok) visiveis++;
    });

    contador.innerHTML = visiveis === total
      ? '<strong>' + total + '</strong> ferramentas mapeadas'
      : '<strong>' + visiveis + '</strong> de ' + total + ' ferramentas';
    vazio.hidden = visiveis > 0;
    gravarEstado();
  }

  /* ---------------- ordenação ---------------- */

  var COLUNA = ['nome', 'cat', 'ent', 'oss', 'lic', 'ori', 'sta'];

  function ordenar(indice, direcao) {
    var chave = COLUNA[indice];
    var ordenado = pares.slice().sort(function (a, b) {
      var r = colator.compare(
        a.linha.getAttribute('data-' + chave),
        b.linha.getAttribute('data-' + chave)
      );
      // desempate sempre pelo nome, para que a ordem seja estável e reproduzível
      if (r === 0) r = colator.compare(a.linha.dataset.nome, b.linha.dataset.nome);
      return direcao === 'desc' ? -r : r;
    });
    var frag = document.createDocumentFragment();
    ordenado.forEach(function (p) {
      frag.appendChild(p.linha);
      if (p.detalhe) frag.appendChild(p.detalhe);
    });
    corpo.appendChild(frag);
  }

  ordenadores.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var dir = b.dataset.dir === 'asc' ? 'desc' : 'asc';
      ordenadores.forEach(function (o) {
        delete o.dataset.dir;
        o.setAttribute('aria-sort', 'none');
      });
      b.dataset.dir = dir;
      b.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
      ordenar(i, dir);
      gravarEstado();
    });
  });

  /* ---------------- detalhe ---------------- */

  function alternar(tr, abrir) {
    var det = tr.nextElementSibling;
    var btn = tr.querySelector('.cmp-exp');
    if (!det || !btn) return;
    var estado = typeof abrir === 'boolean' ? abrir : !tr.classList.contains('aberta');
    tr.classList.toggle('aberta', estado);
    det.hidden = !estado || tr.hidden;
    btn.setAttribute('aria-expanded', String(estado));
    btn.firstElementChild.textContent = estado ? '−' : '+';
  }

  corpo.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.cmp-exp');
    if (btn) alternar(btn.closest('tr.cmp-row'));
  });

  btnTudo.addEventListener('click', function () {
    var abrir = btnTudo.dataset.estado !== 'aberto';
    pares.forEach(function (p) { if (!p.linha.hidden) alternar(p.linha, abrir); });
    btnTudo.dataset.estado = abrir ? 'aberto' : 'fechado';
    btnTudo.textContent = abrir ? 'Recolher detalhes' : 'Abrir detalhes';
  });

  /* ---------------- estado no endereço ----------------
     Vai no fragmento (#), não na query string: assim o filtro é compartilhável sem
     criar mil URLs indexáveis com o mesmo conteúdo da página original. */

  var restaurando = false;

  function gravarEstado() {
    if (restaurando) return;
    var p = new URLSearchParams();
    if (campoBusca.value.trim()) p.set('q', campoBusca.value.trim());
    selects.forEach(function (s) { if (s.value) p.set(s.dataset.campo, s.value); });
    var s = p.toString();
    if (s) {
      history.replaceState(null, '', '#' + s);
    } else if (location.hash.indexOf('=') !== -1) {
      // limpa só o fragmento que ESTE script escreveu. Apagar qualquer hash apagaria
      // também a âncora com que a pessoa chegou (#tabela, #gw-litellm), e o link
      // compartilhado perderia o destino no primeiro filtro aplicado.
      history.replaceState(null, '', location.pathname);
    }
  }

  function lerEstado() {
    if (!location.hash || location.hash.length < 2) return;
    // uma âncora comum (#tabela, #gw-litellm) não é estado de filtro
    if (location.hash.indexOf('=') === -1) return;
    restaurando = true;
    var p = new URLSearchParams(location.hash.slice(1));
    // o fragmento descreve o estado INTEIRO, não um remendo sobre o que já estava:
    // campo ausente na URL é campo vazio, senão um link compartilhado mostraria uma
    // lista diferente da que quem compartilhou estava vendo
    campoBusca.value = p.get('q') || '';
    selects.forEach(function (s) {
      var v = p.get(s.dataset.campo);
      s.value = v && Array.prototype.some.call(s.options, function (o) { return o.value === v; })
        ? v
        : '';
    });
    restaurando = false;
  }

  /* ---------------- ligações ---------------- */

  var atraso;
  campoBusca.addEventListener('input', function () {
    clearTimeout(atraso);
    atraso = setTimeout(aplicar, 120);
  });
  selects.forEach(function (s) { s.addEventListener('change', aplicar); });

  btnLimpar.addEventListener('click', function () {
    campoBusca.value = '';
    selects.forEach(function (s) { s.value = ''; });
    aplicar();
    campoBusca.focus();
  });

  // Trocar só o fragmento não recarrega o documento: sem isto, colar um link filtrado
  // na barra de endereço de uma aba que já está aberta mudaria a URL e nada mais.
  window.addEventListener('hashchange', function () {
    lerEstado();
    aplicar();
  });

  lerEstado();
  aplicar();
})();
