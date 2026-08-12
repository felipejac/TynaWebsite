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

    setTimeout(() => {
      pulsar();
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
