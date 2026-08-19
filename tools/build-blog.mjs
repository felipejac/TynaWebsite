// Gerador estático do blog da Tyna.
// Lê content/blog/*.md (markdown + frontmatter) e emite HTML pronto em blog/.
// Sem dependências: roda com `node tools/build-blog.mjs`.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'content', 'blog');
const OUT = join(ROOT, 'blog');
const SITE = 'https://tyna.com.br';
// CTA "Agendar conversa": abre a conversa no WhatsApp, com a mesma mensagem do botão
// flutuante. Era mailto:, e mailto: não faz nada em máquina sem cliente de e-mail
// configurado — o caso do C-level que usa Gmail no navegador. O clique morria em
// silêncio e o lead sumia. O WhatsApp funciona em qualquer dispositivo.
//
// Não precisa mais do wrapper email_off: ele existia só para impedir que a ofuscação
// de e-mail da Cloudflare (Scrape Shield) transformasse o mailto em
// /cdn-cgi/l/email-protection. Sem mailto no href, não há o que ofuscar.
const WA_CTA = 'https://wa.me/5511997228945?text=' +
  encodeURIComponent('Olá, Felipe. Vim pelo site da Tyna e quero falar sobre governança de IA.');
const ctaAgendar = (cls = '', attrs = '') =>
  `<a href="${WA_CTA}" target="_blank" rel="noopener" class="btn btn-primary${cls ? ' ' + cls : ''}"${attrs ? ' ' + attrs : ''}>Agendar conversa</a>`;
const ASSET_V = '15';

const CATEGORIES = {
  'governanca': 'Governança de IA',
  'ai-agents': 'Agentes de IA',
  'llm': 'LLMs',
  'dev-tools': 'Ferramentas de Dev',
  'automation': 'Automação',
};

// Texto próprio por categoria. Antes a descrição saía de um molde — "Artigos sobre
// X: análise prática..." — o que produzia cinco descrições quase idênticas, curtas
// demais para o SERP, sobre páginas com 47 a 116 palavras de corpo. Página de
// categoria assim é conteúdo raso e quase-duplicado ao mesmo tempo: o Google escolhe
// uma e ignora as outras. Com texto próprio, cada uma passa a ter o que ranquear.
const CAT_META = {
  'governanca': {
    guias: '<h2>Por onde começar</h2><p>Se o assunto é novo na sua empresa, a ordem que funciona é esta: descobrir o que já está em uso com o <a href="/shadow-ai/">checklist de mapeamento de shadow AI</a>, definir <a href="/governanca-de-agentes/">até onde cada agente vai sem um humano</a>, unificar acesso e auditoria em um <a href="/ai-gateway/">AI Gateway</a> e, quando a governança precisar ser verificável por terceiro, seguir para a <a href="/iso-42001/">ISO/IEC 42001</a>. Sobre a regulação brasileira, o <a href="/pl-2338/">status do PL 2338</a> fica registrado com data e fonte conferível: ele ainda não é lei.</p>',
    desc: 'Governança de IA na prática: política interna, comitê, adequação à LGPD em fluxos de IA e guardrails em agentes que já rodam em produção.',
    intro: 'Governança de IA é o conjunto de decisões que define até onde a empresa deixa a Inteligência Artificial ir sozinha — e quem responde quando ela erra. Aqui o assunto é tratado de dentro da operação: política que as equipes de fato seguem, comitê com prazo de resposta, adequação à LGPD nos fluxos onde o dado pessoal realmente trafega, e guardrail aplicado em execução, não escrito em documento.',
  },
  'ai-agents': {
    guias: '<h2>Antes de colocar um agente no ar</h2><p>Os textos aqui cobrem o que quebra em produção. O que precisa estar decidido antes está reunido no guia de <a href="/governanca-de-agentes/">governança de agentes de IA</a>: escopo de autonomia, guardrail em execução, escalonamento humano e trilha de auditoria, com um roteiro de dez perguntas para usar em revisão. Para o agente que já está no ar sem ter passado por revisão nenhuma, o caminho é o <a href="/shadow-ai/">mapeamento de shadow AI</a>.</p>',
    desc: 'Agentes de IA em produção: arquitetura, escopo de autonomia, escalonamento humano e o que costuma quebrar quando o sistema decide sozinho.',
    intro: 'Agente de IA é diferente de ferramenta de IA: ele decide e age em nome da empresa, sem um leitor humano no meio. Isso muda a pergunta de "quem pode usar" para "até onde ele vai sem um humano". Os textos aqui tratam de arquitetura, escopo de autonomia definido antes da produção, escalonamento com destino e prazo, e trilha de auditoria da decisão.',
  },
  'llm': {
    guias: '<h2>Do modelo à operação</h2><p>Escolher modelo é a parte fácil e a que menos dura. O que sustenta o uso de LLM em escala é a camada em volta: um <a href="/ai-gateway/">AI Gateway</a> que unifica acesso, custo, observabilidade e auditoria, e a decisão de <a href="/governanca-de-agentes/">até onde o sistema age sozinho</a>. Quem ainda não sabe quantos modelos e ferramentas a própria empresa usa começa pelo <a href="/shadow-ai/">checklist de mapeamento</a>.</p>',
    desc: 'Modelos de linguagem na prática: lançamentos, custo por token, janela de contexto e o que muda de fato no fluxo de quem usa LLM em produção.',
    intro: 'Todo mês sai um modelo novo, e quase nada disso muda o trabalho de quem já tem algo rodando. O recorte aqui é o do operador: o que mudou em custo, em latência, em janela de contexto e em confiabilidade — e o que é anúncio que não sobrevive ao primeiro caso real.',
  },
  'dev-tools': {
    guias: '<h2>Ferramenta boa, rastro nenhum</h2><p>Extensão de navegador que lê a tela, assistente conectado ao repositório e chave de API criada no cartão de alguém são exatamente o que o <a href="/shadow-ai/">mapeamento de shadow AI</a> encontra, e quase nunca aparecem em inventário de software. Quando a empresa decide organizar isso sem proibir, a resposta é um <a href="/ai-gateway/">AI Gateway</a>: credencial da empresa, custo por time e registro do que saiu.</p>',
    desc: 'Ferramentas de desenvolvimento com IA: o que cada uma entrega, o que ainda não entrega e como muda o trabalho de quem constrói software.',
    intro: 'Ferramenta de desenvolvimento com IA envelhece rápido e promete mais do que entrega. Os textos desta seção olham o que a ferramenta faz no fluxo real de trabalho, onde ela ainda exige a pessoa, e o que ela deixa de rastro — inclusive de segredo e de credencial, que é onde a conveniência costuma custar caro.',
  },
  'automation': {
    guias: '<h2>Automação que sobrevive ao terceiro mês</h2><p>O que derruba um fluxo automatizado quase nunca é o modelo: é o caso fora do previsto e a falta de alguém conseguindo explicar depois o que aconteceu. Os dois guias que tratam disso são <a href="/governanca-de-agentes/">governança de agentes de IA</a>, com o critério de escalonamento e a trilha de auditoria, e <a href="/ai-gateway/">AI Gateway</a>, que é onde custo e registro deixam de ser problema de cada fluxo. Para descobrir as automações que já rodam sem ninguém saber, o <a href="/shadow-ai/">checklist de mapeamento</a>.</p><p>Na prática, três perguntas separam a automação que fica da que é desligada. A primeira é o que acontece quando a entrada foge do previsto: se a resposta for "o fluxo quebra e alguém percebe depois", não há operação, há sorte. A segunda é quem é avisado quando ela para, pelo nome, e em quanto tempo. A terceira é se dá para reconstruir, meses depois, o que a automação leu e executou em um caso específico — que é exatamente o que um cliente pede quando contesta, e o que uma auditoria pede sem avisar.</p>',
    desc: 'Automação com IA: integração entre sistemas, orquestração de fluxos e o ponto em que automatizar deixa de compensar sem governança.',
    intro: 'Automatizar com IA é fácil de começar e difícil de sustentar. O que separa um fluxo que dura de um que é desligado em três meses raramente é o modelo: é integração com os sistemas que já existem, tratamento do caso que foge do previsto, e alguém conseguindo explicar depois o que a automação fez.',
  },
};

/* ---------- frontmatter ---------- */

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('frontmatter ausente');
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    v = v.trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      data[k] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      data[k] = v.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

/* ---------- markdown (subconjunto usado nos posts) ---------- */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${escAttr(u)}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function mdToHtml(md) {
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) { closeList(); continue; }

    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) { closeList(); const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`); continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(ol[1])}</li>`); continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

/* ---------- FAQ: extrai pares P/R para o schema FAQPage ---------- */

function extractFaq(md) {
  const sec = md.split(/^##\s+.*(?:FAQ|Perguntas).*$/mi)[1];
  if (!sec) return [];
  const pairs = [];
  const re = /\*\*(?:P|Q):\s*([^*]+)\*\*\s*\r?\n\s*(?:R|A):\s*([^\n]+)/g;
  let m;
  while ((m = re.exec(sec))) pairs.push({ q: m[1].trim(), a: m[2].trim() });
  return pairs;
}

/* ---------- shell ---------- */

const fmtDate = iso => new Date(iso + 'T12:00:00Z')
  .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

// `image` é opcional e vale o caminho relativo à raiz do site (ex.: assets/blog/x.jpg).
// Sem ele o compartilhamento cai no logo, que é o padrão histórico do blog.
function shell({ title, description, canonical, head = '', body, depth, image }) {
  const up = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DQS0KMDT3G"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-DQS0KMDT3G');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="${SITE}/${image || 'assets/logo-tyna-dark.png'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%230D1117%22/><path d=%22M28 32h44M50 32v40%22 stroke=%22%23C9A968%22 stroke-width=%226%22 stroke-linecap=%22round%22/></svg>">
<link rel="alternate" type="application/rss+xml" title="Blog Tyna" href="${SITE}/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}assets/styles.css?v=${ASSET_V}">
<link rel="stylesheet" href="${up}assets/blog.css?v=${ASSET_V}">
${head}</head>
<body>

<header>
  <div class="wrap nav">
    <a href="${up}" class="logo"><img src="${up}assets/logo-tyna-dark.png" alt="Tyna" width="1222" height="394"> <span>IA &amp; GOVERNANÇA</span></a>
    <nav>
      <ul id="navList">
        <li><a href="${up}#servicos">Serviços</a></li>
        <li><a href="${up}iso-42001/">ISO 42001</a></li>
        <li><a href="${up}#trilhas">Trilhas</a></li>
        <li><a href="${up}blog/">Blog</a></li>
        <li><a href="${up}sobre/">Sobre</a></li>
        <li>${ctaAgendar('mobile-cta')}</li>
      </ul>
    </nav>
    ${ctaAgendar('', 'id="navCta"')}
    <button class="nav-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false">☰</button>
  </div>
</header>

${body}

<footer id="contato">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-left">
        <a href="${up}" class="logo"><img src="${up}assets/logo-tyna.png" alt="Tyna" width="1222" height="394"> <span>IA &amp; GOVERNANÇA</span></a>
        <p>Consultoria em Inteligência Artificial aplicada ao negócio, com governança do prompt ao agente em produção.</p>
      </div>
      <div class="foot-right">
        <div class="foot-col">
          <h5>Contato</h5>
          <!--email_off--><a href="mailto:contato@tyna.com.br">E-mail</a><!--/email_off-->
          <a href="https://linkedin.com/in/felipelj" target="_blank" rel="noopener">LinkedIn</a>
        </div>
        <div class="foot-col">
          <h5>Blog</h5>
          ${activeCats().map(([s, n]) => `<a href="${up}blog/categoria/${s}/">${n}</a>`).join('\n          ')}
        </div>
        <div class="foot-col">
          <h5>Guias</h5>
          <a href="${up}governanca-de-ia/">Governança de IA</a>
          <a href="${up}iso-42001/">ISO 42001</a>
          <a href="${up}shadow-ai/">Shadow AI</a>
          <a href="${up}ai-gateway/">AI Gateway</a>
          <a href="${up}governanca-de-agentes/">Governança de agentes</a>
          <a href="${up}politica-de-uso-de-ia/">Política de uso de IA</a>
          <a href="${up}lgpd-e-ia/">LGPD e IA</a>
          <a href="${up}pl-2338/">Marco Legal da IA</a>
        </div>
        <div class="foot-col">
          <h5>Site</h5>
          <a href="${up}#servicos">Serviços</a>
          <a href="${up}diagnostico/">Diagnóstico</a>
          <a href="${up}sobre/">Sobre</a>
          <a href="${up}blog/">Blog</a>
          <a href="${up}rss.xml">RSS</a>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 Tyna. Todos os direitos reservados.</span>
      <span>tyna.com.br</span>
    </div>
  </div>
</footer>

<script src="${up}assets/site.js?v=${ASSET_V}"></script>

</body>
</html>
`;
}

const activeCats = () => Object.entries(CATEGORIES).filter(([s]) => posts.some(p => p.category === s));

const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj)}</script>\n`;

/* ---------- leitura ---------- */

const posts = readdirSync(SRC).filter(f => f.endsWith('.md')).map(file => {
  const { data, body } = parseFrontmatter(readFileSync(join(SRC, file), 'utf8'));
  return { ...data, slug: file.replace(/\.md$/, ''), body, faq: extractFaq(body), tags: data.tags || [] };
}).filter(p => p.draft !== 'true').sort((a, b) => b.pubDate.localeCompare(a.pubDate));

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

/* ---------- páginas de post ---------- */

const card = (p, up) => `<article class="post-card">
  <a class="post-card-link" href="${up}blog/${p.slug}/">
    <span class="tag">${CATEGORIES[p.category] || p.category}</span>
    <h3>${esc(p.title)}</h3>
    <p class="desc">${esc(p.description)}</p>
    <time datetime="${p.pubDate}">${fmtDate(p.pubDate)}</time>
  </a>
</article>`;

// Card de destaque: ocupa a largura toda no topo do índice, com a imagem do post.
// Só o índice geral usa — nas páginas de categoria o destaque perderia o sentido de
// "o que ler primeiro no blog".
const cardDestaque = (p, up) => `<article class="post-card post-card-destaque">
  <a class="post-card-link" href="${up}blog/${p.slug}/">
    ${p.image ? `<span class="destaque-img"><img src="${up}${p.image}" alt="${escAttr(p.imageAlt || p.title)}" width="1200" height="630" loading="eager" decoding="async"></span>` : ''}
    <span class="destaque-txt">
      <span class="tag tag-destaque">Em destaque</span>
      <span class="tag">${CATEGORIES[p.category] || p.category}</span>
      <h2>${esc(p.title)}</h2>
      <p class="desc">${esc(p.description)}</p>
      <time datetime="${p.pubDate}">${fmtDate(p.pubDate)}</time>
    </span>
  </a>
</article>`;

for (const p of posts) {
  const canonical = `${SITE}/blog/${p.slug}/`;
  const related = posts.filter(o => o.slug !== p.slug && o.category === p.category).slice(0, 3);

  let head = ld({
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.title, description: p.description,
    datePublished: p.pubDate, dateModified: p.pubDate,
    inLanguage: 'pt-BR',
    author: { '@type': 'Person', name: 'Felipe Jacob', url: `${SITE}/sobre/` },
    publisher: { '@type': 'Organization', name: 'Tyna', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo-tyna-dark.png` } },
    mainEntityOfPage: canonical,
    keywords: p.tags.join(', '),
    articleSection: CATEGORIES[p.category] || p.category,
    ...(p.sourceUrl ? { citation: p.sourceUrl } : {}),
  });

  head += ld({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      { '@type': 'ListItem', position: 3, name: CATEGORIES[p.category] || p.category, item: `${SITE}/blog/categoria/${p.category}/` },
      { '@type': 'ListItem', position: 4, name: p.title, item: canonical },
    ],
  });

  if (p.faq.length) {
    head += ld({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }

  if (p.originalUrl) {
    head += `<link rel="alternate" hreflang="en" href="${p.originalUrl}">\n`;
    head += `<link rel="alternate" hreflang="pt-BR" href="${canonical}">\n`;
    head += `<link rel="alternate" hreflang="x-default" href="${p.originalUrl}">\n`;
  }

  const body = `<main id="top">
  <article class="post">
    <div class="wrap post-wrap">
      <nav class="crumbs" aria-label="Trilha"><a href="../../">Início</a> › <a href="../">Blog</a> › <a href="../categoria/${p.category}/">${CATEGORIES[p.category] || p.category}</a></nav>
      <p class="eyebrow">${CATEGORIES[p.category] || p.category}</p>
      <h1>${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.pubDate}">${fmtDate(p.pubDate)}</time> · Por <a href="../../sobre/">Felipe Jacob</a></p>
      <p class="lead">${esc(p.description)}</p>

      ${p.image ? `<figure class="post-hero"><img src="../../${p.image}" alt="${escAttr(p.imageAlt || p.title)}" width="1200" height="630" loading="eager" decoding="async"></figure>` : ''}

      ${p.aeoSummary ? `<aside class="answer-box"><h2>Resposta curta</h2><p>${esc(p.aeoSummary)}</p></aside>` : ''}

      <div class="post-body">
${mdToHtml(p.body)}
      </div>

      ${p.sourceUrl ? `<p class="post-source">Fonte original: <a href="${escAttr(p.sourceUrl)}" target="_blank" rel="noopener nofollow">${esc(p.sourceName || p.sourceUrl)}</a></p>` : ''}
      ${p.originalUrl ? `<p class="post-source">Versão em inglês: <a href="${escAttr(p.originalUrl)}" target="_blank" rel="noopener">Automations Cookbook</a></p>` : ''}

      <ul class="post-tags">${p.tags.map(t => `<li>#${esc(t)}</li>`).join('')}</ul>
    </div>
  </article>

  ${related.length ? `<section class="related">
    <div class="wrap">
      <div class="section-head"><p class="eyebrow">Leia também</p><h2>Mais sobre ${CATEGORIES[p.category] || p.category}</h2></div>
      <div class="post-grid">${related.map(r => card(r, '../../')).join('\n')}</div>
    </div>
  </section>` : ''}

  <section class="cta-band" style="border-bottom:none;">
    <div class="wrap">
      <p class="eyebrow">Próximo passo</p>
      <h2>Quer aplicar isso na sua empresa, com governança?</h2>
      ${ctaAgendar()}
    </div>
  </section>
</main>`;

  mkdirSync(join(OUT, p.slug), { recursive: true });
  writeFileSync(join(OUT, p.slug, 'index.html'),
    // " | Tyna" (7 chars) em vez do antigo " — Blog Tyna" (12 chars): o sufixo mais
    // longo empurrava 22 dos 37 titulos para alem de 60 caracteres, o limite que
    // Google e Bing toleram sem cortar o titulo no resultado de busca.
    shell({ title: `${p.title} | Tyna`, description: p.description, canonical, head, body, depth: 2, image: p.image }));
}

/* ---------- índice e categorias ---------- */

function listing({ title, description, canonical, heading, sub, items, depth, active, intro, guias }) {
  const up = '../'.repeat(depth);
  const head = ld({
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'Blog Tyna', url: `${SITE}/blog/`, inLanguage: 'pt-BR',
    description,
    blogPost: items.slice(0, 20).map(p => ({
      '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.pubDate,
    })),
  });

  // O destaque só aparece no índice geral. Numa página de categoria ele competiria
  // com o filtro que a pessoa acabou de aplicar.
  const destaque = active ? null : items.find(p => p.destaque === 'true');
  const grade = destaque ? items.filter(p => p !== destaque) : items;

  const body = `<main id="top">
  <section class="hero blog-hero">
    <div class="wrap">
      <p class="eyebrow">Blog · ${items.length} ${items.length === 1 ? 'artigo' : 'artigos'}</p>
      <h1>${esc(heading)}</h1>
      <p class="lead" style="max-width:640px;">${esc(sub)}</p>
      <nav class="cat-nav" aria-label="Categorias">
        <a href="${up}blog/"${!active ? ' class="on"' : ''}>Todos</a>
        ${activeCats().map(([s, n]) => `<a href="${up}blog/categoria/${s}/"${active === s ? ' class="on"' : ''}>${n}</a>`).join('\n        ')}
      </nav>
      ${intro ? `<p class="cat-intro">${esc(intro)}</p>` : ''}
    </div>
  </section>
  <section>
    <div class="wrap">
      ${destaque ? cardDestaque(destaque, up) : ''}
      <div class="post-grid">${grade.map(p => card(p, up)).join('\n')}</div>
    </div>
  </section>
  ${guias ? `<section class="cat-guias">
    <div class="wrap">${guias}</div>
  </section>` : ''}
</main>`;

  return shell({ title, description, canonical, head, body, depth });
}

writeFileSync(join(OUT, 'index.html'), listing({
  title: 'Blog — IA, agentes e automação | Tyna',
  description: 'Análise de agentes de IA, LLMs e automação para quem coloca sistema em produção. Notícia destrinchada, sem hype, com o que muda na prática.',
  canonical: `${SITE}/blog/`,
  heading: 'IA em produção, destrinchada.',
  sub: 'Agentes, LLMs e ferramentas de automação — o que saiu, o que muda no seu fluxo e o que ignorar.',
  items: posts, depth: 1, active: null,
}));

for (const [slug, name] of Object.entries(CATEGORIES)) {
  const items = posts.filter(p => p.category === slug);
  if (!items.length) continue;
  mkdirSync(join(OUT, 'categoria', slug), { recursive: true });
  const meta = CAT_META[slug] || {};
  writeFileSync(join(OUT, 'categoria', slug, 'index.html'), listing({
    title: `${name} — Blog Tyna`,
    description: meta.desc || `Artigos sobre ${name.toLowerCase()}: análise prática para equipes que colocam IA em produção.`,
    canonical: `${SITE}/blog/categoria/${slug}/`,
    heading: name,
    sub: `Tudo que a Tyna publicou sobre ${name.toLowerCase()}.`,
    intro: meta.intro,
    guias: meta.guias,
    items, depth: 3, active: slug,
  }));
}

/* ---------- sitemap, rss, robots ---------- */

// lastmod das páginas estáticas sai da data de modificação do próprio arquivo, e o das
// listagens sai do post mais recente que elas exibem. Carimbar a data do build em tudo
// faria o lastmod mudar a cada publicação sem o conteúdo ter mudado — e o Google passa
// a ignorar o campo quando ele se comporta assim.
const mtime = rel => {
  try { return statSync(join(ROOT, rel)).mtime.toISOString().slice(0, 10); }
  catch { return undefined; }
};
const maisRecente = lista => lista.map(p => p.pubDate).sort().pop();

const staticPages = [
  { loc: `${SITE}/`, pri: '1.0', freq: 'weekly', mod: mtime('index.html') },
  // termo-cabeca da categoria e hub dos demais guias — prioridade acima das outras
  { loc: `${SITE}/governanca-de-ia/`, pri: '0.95', freq: 'monthly', mod: mtime('governanca-de-ia/index.html') },
  { loc: `${SITE}/iso-42001/`, pri: '0.9', freq: 'monthly', mod: mtime('iso-42001/index.html') },
  { loc: `${SITE}/diagnostico/`, pri: '0.9', freq: 'monthly', mod: mtime('diagnostico/index.html') },
  { loc: `${SITE}/shadow-ai/`, pri: '0.9', freq: 'monthly', mod: mtime('shadow-ai/index.html') },
  // a data de modificação importa mais aqui do que nas outras: a página afirma um status
  // de tramitação com data, e o lastmod é o que sinaliza ao Google que ela foi reconferida
  { loc: `${SITE}/pl-2338/`, pri: '0.9', freq: 'monthly', mod: mtime('pl-2338/index.html') },
  { loc: `${SITE}/ai-gateway/`, pri: '0.9', freq: 'monthly', mod: mtime('ai-gateway/index.html') },
  { loc: `${SITE}/governanca-de-agentes/`, pri: '0.9', freq: 'monthly', mod: mtime('governanca-de-agentes/index.html') },
  { loc: `${SITE}/politica-de-uso-de-ia/`, pri: '0.9', freq: 'monthly', mod: mtime('politica-de-uso-de-ia/index.html') },
  { loc: `${SITE}/lgpd-e-ia/`, pri: '0.9', freq: 'monthly', mod: mtime('lgpd-e-ia/index.html') },
  { loc: `${SITE}/sobre/`, pri: '0.8', freq: 'monthly', mod: mtime('sobre/index.html') },
  { loc: `${SITE}/blog/`, pri: '0.9', freq: 'daily', mod: maisRecente(posts) },
  ...Object.keys(CATEGORIES).filter(s => posts.some(p => p.category === s))
    .map(s => ({
      loc: `${SITE}/blog/categoria/${s}/`, pri: '0.6', freq: 'weekly',
      mod: maisRecente(posts.filter(p => p.category === s)),
    })),
];

writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/1999/xhtml/sitemap" xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`.replace(/[\s\S]*/, () => {
    const rows = [
      ...staticPages.map(p => `  <url><loc>${p.loc}</loc>${p.mod ? `<lastmod>${p.mod}</lastmod>` : ''}<changefreq>${p.freq}</changefreq><priority>${p.pri}</priority></url>`),
      ...posts.map(p => `  <url><loc>${SITE}/blog/${p.slug}/</loc><lastmod>${p.pubDate}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${p.originalUrl ? `<xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE}/blog/${p.slug}/"/><xhtml:link rel="alternate" hreflang="en" href="${p.originalUrl}"/>` : ''}</url>`),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
  }));

writeFileSync(join(ROOT, 'rss.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Blog Tyna — IA, agentes e automação</title>
  <link>${SITE}/blog/</link>
  <description>Análise de agentes de IA, LLMs e automação para quem coloca sistema em produção.</description>
  <language>pt-BR</language>
  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 30).map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE}/blog/${p.slug}/</link>
    <guid isPermaLink="true">${SITE}/blog/${p.slug}/</guid>
    <pubDate>${new Date(p.pubDate + 'T12:00:00Z').toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
    <category>${CATEGORIES[p.category] || p.category}</category>
  </item>`).join('\n')}
</channel>
</rss>
`);

// robots.txt NÃO é gerado de propósito: a Cloudflare serve um robots.txt
// gerenciado na borda que sobrescreve qualquer arquivo do origin.
// Para alterar: dash Cloudflare › AI Crawl Control.
//
// Conferido em produção em 12/08/2026:
//  - bloqueados (crawlers de treinamento): GPTBot, ClaudeBot, Google-Extended,
//    CCBot, Bytespider, Amazonbot, Applebot-Extended, meta-externalagent
//  - liberados (busca e citação): Googlebot, Bingbot, OAI-SearchBot,
//    ChatGPT-User, Claude-User, PerplexityBot
//  - NÃO existe linha `Sitemap:` — o comentário anterior aqui dizia que existia,
//    e estava errado. O Google recebe o sitemap pelo Search Console; Bing e outros
//    o descobririam pelo robots.txt, então esse canal está em falta.

console.log(`OK — ${posts.length} posts | ${Object.keys(CATEGORIES).filter(s => posts.some(p => p.category === s)).length} categorias | sitemap + rss`);
