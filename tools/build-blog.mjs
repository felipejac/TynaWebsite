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
// CTA "Agendar conversa": abre o cliente de e-mail do dispositivo com assunto preenchido.
// Os comentários email_off desligam a ofuscação de e-mail da Cloudflare (Scrape Shield)
// nesse trecho — sem eles o href vira /cdn-cgi/l/email-protection e só volta a ser mailto:
// depois que o JS da Cloudflare roda.
const MAILTO_CTA = 'mailto:contato@tyna.com.br?subject=Agendamento%20reuni%C3%A3o%20Tyna';
const ctaAgendar = (cls = '', attrs = '') =>
  `<!--email_off--><a href="${MAILTO_CTA}" class="btn btn-primary${cls ? ' ' + cls : ''}"${attrs ? ' ' + attrs : ''}>Agendar conversa</a><!--/email_off-->`;
const ASSET_V = '7';

const CATEGORIES = {
  'ai-agents': 'Agentes de IA',
  'llm': 'LLMs',
  'dev-tools': 'Ferramentas de Dev',
  'automation': 'Automação',
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

function shell({ title, description, canonical, head = '', body, depth }) {
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
<meta property="og:image" content="${SITE}/assets/logo-tyna-dark.png">
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
          <h5>Site</h5>
          <a href="${up}iso-42001/">ISO 42001</a>
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
    shell({ title: `${p.title} | Tyna`, description: p.description, canonical, head, body, depth: 2 }));
}

/* ---------- índice e categorias ---------- */

function listing({ title, description, canonical, heading, sub, items, depth, active }) {
  const up = '../'.repeat(depth);
  const head = ld({
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'Blog Tyna', url: `${SITE}/blog/`, inLanguage: 'pt-BR',
    description,
    blogPost: items.slice(0, 20).map(p => ({
      '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.pubDate,
    })),
  });

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
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="post-grid">${items.map(p => card(p, up)).join('\n')}</div>
    </div>
  </section>
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
  writeFileSync(join(OUT, 'categoria', slug, 'index.html'), listing({
    title: `${name} — Blog Tyna`,
    description: `Artigos sobre ${name.toLowerCase()}: análise prática para equipes que colocam IA em produção.`,
    canonical: `${SITE}/blog/categoria/${slug}/`,
    heading: name,
    sub: `Tudo que publicamos sobre ${name.toLowerCase()}.`,
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
  { loc: `${SITE}/iso-42001/`, pri: '0.9', freq: 'monthly', mod: mtime('iso-42001/index.html') },
  { loc: `${SITE}/diagnostico/`, pri: '0.9', freq: 'monthly', mod: mtime('diagnostico/index.html') },
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
