  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', open);
    navToggle.textContent = open ? '✕' : '☰';
  });
  navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', false);
    navToggle.textContent = '☰';
  }));
  }

  // Track tabs (Liderança / Times)
  const tabs = document.querySelectorAll('.track-tab');
  const groups = document.querySelectorAll('.track-group');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      groups.forEach(g => g.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector('.track-group[data-group="' + tab.dataset.track + '"]').classList.add('active');
    });
  });

  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // CTA de e-mail: rede de segurança para o mailto.
  //
  // Todo "Agendar conversa" é um mailto:. Isso depende de o visitante ter um cliente
  // de e-mail configurado — e quem usa Gmail ou Outlook no navegador (o caso do
  // C-level que este site atende) muitas vezes não tem. Nesse cenário o clique não
  // faz NADA, sem erro e sem aviso, e o lead some. Reproduzido em MacBook.
  //
  // Aqui o mailto continua acontecendo normalmente. Se, passado o tempo limite, a
  // página ainda estiver visível e com foco, é sinal de que nenhum aplicativo assumiu
  // o clique: aí abrimos as alternativas que funcionam em qualquer máquina.
  (function () {
    var ESPERA_MS = 1200;
    var painel, timer;

    function partesDoMailto(href) {
      var sem = href.replace(/^mailto:/i, '');
      var corte = sem.indexOf('?');
      var para = decodeURIComponent(corte === -1 ? sem : sem.slice(0, corte));
      var q = new URLSearchParams(corte === -1 ? '' : sem.slice(corte + 1));
      return { para: para, assunto: q.get('subject') || '', corpo: q.get('body') || '' };
    }

    function montar() {
      if (painel) return painel;
      painel = document.createElement('div');
      painel.className = 'mail-fb';
      painel.setAttribute('role', 'dialog');
      painel.setAttribute('aria-modal', 'true');
      painel.setAttribute('aria-label', 'Outras formas de falar com a Tyna');
      painel.innerHTML =
        '<div class="mf-card">' +
          '<button class="mf-close" type="button" aria-label="Fechar">&times;</button>' +
          '<h3>Seu computador não abriu o e-mail</h3>' +
          '<p>Isso acontece quando não há um aplicativo de e-mail configurado. Escolha por onde prefere falar — todas as opções abaixo levam à mesma conversa.</p>' +
          '<div class="mf-opts">' +
            '<a class="btn btn-primary" data-mf="gmail" target="_blank" rel="noopener">Escrever pelo Gmail</a>' +
            '<a class="btn btn-ghost" data-mf="outlook" target="_blank" rel="noopener">Escrever pelo Outlook</a>' +
            '<a class="btn btn-ghost" data-mf="whats" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
            '<button class="mf-mail" type="button" data-mf="copiar"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(painel);

      painel.addEventListener('click', function (e) {
        if (e.target === painel || e.target.closest('.mf-close')) fechar();
        var copiar = e.target.closest('[data-mf="copiar"]');
        if (copiar) {
          var end = copiar.getAttribute('data-endereco');
          var pronto = function () { copiar.textContent = 'Endereço copiado'; };
          if (navigator.clipboard) navigator.clipboard.writeText(end).then(pronto, pronto);
          else pronto();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && painel.classList.contains('on')) fechar();
      });
      return painel;
    }

    function fechar() { if (painel) painel.classList.remove('on'); }

    function abrir(href) {
      var p = partesDoMailto(href);
      var el = montar();
      var q = function (s) { return el.querySelector('[data-mf="' + s + '"]'); };

      q('gmail').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(p.para) +
        '&su=' + encodeURIComponent(p.assunto) + '&body=' + encodeURIComponent(p.corpo);
      q('outlook').href = 'https://outlook.office.com/mail/deeplink/compose?to=' + encodeURIComponent(p.para) +
        '&subject=' + encodeURIComponent(p.assunto) + '&body=' + encodeURIComponent(p.corpo);
      q('whats').href = WA_LINK;

      var btnCopiar = q('copiar');
      btnCopiar.setAttribute('data-endereco', p.para);
      btnCopiar.textContent = p.para;

      el.classList.add('on');
      var primeiro = el.querySelector('.mf-opts .btn');
      if (primeiro) primeiro.focus();

      if (typeof gtag === 'function') gtag('event', 'cta_email_sem_cliente');
    }

    // Detecção: em vez de perguntar "a página está focada?" (que é falso em aba de
    // segundo plano e suprimiria o plano B indevidamente), observamos se a página
    // PERDE o foco depois do clique. Perder o foco significa que algum aplicativo
    // assumiu o mailto — nesse caso não fazemos nada. Se nada assumir, abrimos.
    var assumido = false;
    function marcarAssumido() { assumido = true; }
    window.addEventListener('blur', marcarAssumido);
    window.addEventListener('pagehide', marcarAssumido);
    document.addEventListener('visibilitychange', function () { if (document.hidden) marcarAssumido(); });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="mailto:"]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (typeof gtag === 'function') gtag('event', 'cta_email_clique');
      assumido = false;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!assumido) abrir(href);
      }, ESPERA_MS);
    });
  })();

  // Medição dos cliques que vão para o WhatsApp.
  //
  // Os CTAs "Agendar conversa" eram mailto: e disparavam cta_email_clique. Agora vão
  // para o WhatsApp, e sem este bloco a conversão principal do site sairia do GA4 sem
  // deixar rastro. Um ouvinte delegado cobre tudo de uma vez: os CTAs no corpo da
  // página e o botão flutuante, que também não era medido antes.
  //
  // O parâmetro `origem` separa os dois, porque a leitura é diferente: o flutuante é
  // impulso, o CTA no corpo vem depois de ler o argumento.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="wa.me/"]');
    if (!a || typeof gtag !== 'function') return;
    gtag('event', 'cta_whatsapp_clique', {
      origem: a.classList.contains('wa-fab') ? 'flutuante' : 'botao',
    });
  });

  // WhatsApp flutuante — montado aqui, e não no HTML, para valer em todas as páginas
  // (home, Sobre, índice do blog e os posts) sem duplicar markup nem depender de um
  // rebuild do blog. O CSS mora em styles.css, que todas as páginas já carregam.
  const WA_LINK = 'https://wa.me/5511997228945?text=' +
    encodeURIComponent('Olá, Felipe. Vim pelo site da Tyna e quero falar sobre governança de IA.');
  const WA_ICONE = 'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 ' +
    '9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 ' +
    '1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.23 ' +
    '8.23 0 0 1 0 16.47Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42l-.47-.01c-.16 ' +
    '0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.65 4.2 3.71.59.25 1.04.4 ' +
    '1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z';

  let waFab = document.getElementById('waFab');
  if (!waFab) {
    waFab = document.createElement('a');
    waFab.id = 'waFab';
    waFab.className = 'wa-fab';
    waFab.href = WA_LINK;
    waFab.target = '_blank';
    waFab.rel = 'noopener';
    waFab.setAttribute('aria-label', 'Falar com a Tyna no WhatsApp');
    waFab.innerHTML =
      '<span class="wa-tip" aria-hidden="true">Falar no WhatsApp</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + WA_ICONE + '"/></svg>';
    document.body.appendChild(waFab);
  }

  // Pulso periódico para chamar atenção. A primeira batida vem com o rótulo;
  // depois só o pulso, para não virar ruído.
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!semMovimento) {
    const PULSO_MS = 3100;   // duração das duas repetições da animação
    const INTERVALO = 11000; // respiro entre uma chamada e outra
    let timerPulso;

    const pulsar = () => {
      waFab.classList.remove('wa-ping');
      void waFab.offsetWidth; // reinicia a animação quando o pulso anterior ainda não limpou
      waFab.classList.add('wa-ping');
      clearTimeout(timerPulso);
      timerPulso = setTimeout(() => waFab.classList.remove('wa-ping'), PULSO_MS);
    };

    const ciclo = setInterval(() => {
      if (!document.hidden) pulsar();
    }, INTERVALO);

    // O rótulo "Falar no WhatsApp" ajuda no desktop, onde sobra margem lateral. No
    // celular ele atravessa o conteúdo — fica por cima do texto que a pessoa está
    // lendo. Lá vai só o pulso; o ícone do WhatsApp já se explica sozinho.
    //
    // A largura é medida quando o balão iria aparecer, e não na carga do script:
    // no momento do disparo o layout já está resolvido, o que evita depender de
    // matchMedia avaliado cedo demais.
    setTimeout(() => {
      pulsar();
      if (window.innerWidth <= 720) return;
      waFab.classList.add('wa-show-tip');
      setTimeout(() => waFab.classList.remove('wa-show-tip'), 4000);
    }, 2600);

    // Depois do clique não faz mais sentido insistir
    waFab.addEventListener('click', () => {
      clearInterval(ciclo);
      clearTimeout(timerPulso);
      waFab.classList.remove('wa-ping');
    });
  }

  // Botão que copia um bloco de texto puro (o checklist de shadow AI, o roteiro de
  // agentes). O texto vem de um <pre> escondido apontado por data-copiar, e não é
  // remontado a partir do DOM: o que a pessoa cola é exatamente o que foi revisado,
  // sem depender de como as seções estão marcadas hoje.
  //
  // Estava inline na página de shadow AI. Virou código compartilhado quando a segunda
  // página passou a precisar do mesmo comportamento — inclusive do plano B, que é a
  // parte que ninguém lembra de copiar junto.
  document.querySelectorAll('[data-copiar]').forEach(function (btn) {
    var fonte = document.getElementById(btn.getAttribute('data-copiar'));
    var aviso = document.getElementById(btn.getAttribute('data-aviso') || '');
    if (!fonte || !aviso) return;

    var padrao = aviso.textContent;
    var voltar;

    function feedback(msg) {
      aviso.textContent = msg;
      clearTimeout(voltar);
      voltar = setTimeout(function () { aviso.textContent = padrao; }, 4000);
    }

    function selecionar() {
      // clipboard.writeText exige contexto seguro, permissão e página em foco; em
      // navegador antigo a promessa nem existe. Aqui o texto aparece selecionado e o
      // Ctrl+C fica com a pessoa — melhor do que um botão que falha em silêncio.
      fonte.hidden = false;
      var faixa = document.createRange();
      faixa.selectNodeContents(fonte);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(faixa);
      feedback('Não consegui copiar por aqui — o texto está selecionado, use Ctrl+C.');
    }

    btn.addEventListener('click', function () {
      function ok() {
        feedback(btn.getAttribute('data-ok') || 'Copiado.');
        var evento = btn.getAttribute('data-evento');
        if (evento && typeof gtag === 'function') {
          gtag('event', evento, { pagina: btn.getAttribute('data-pagina') || location.pathname });
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fonte.textContent).then(ok, selecionar);
      } else {
        selecionar();
      }
    });
  });
