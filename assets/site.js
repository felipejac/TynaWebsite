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

  // WhatsApp flutuante — pulso periódico para chamar atenção.
  // A primeira batida vem com o rótulo; depois só o pulso, para não virar ruído.
  const waFab = document.getElementById('waFab');
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (waFab && !semMovimento) {
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
