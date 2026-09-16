// Gera /rss.xml (RSS 2.0) a partir do HTML já publicado dos artigos em /blog.
//
// Lê o resultado final do build, e não o markdown de origem: o que entra no feed é
// exatamente o que o leitor vê na página — título da <title>, descrição da
// <meta name="description"> e data de publicação.
//
// Artigo é o arquivo index.html que contém <article class="post">. As listagens
// (/blog/, /blog/radar/, categorias) também têm <time>, mas é a data dos cards de
// outros posts; por isso a data é procurada nesta ordem:
//   1. <meta property="article:published_time" content="AAAA-MM-DD"> no <head>;
//   2. o primeiro <time datetime="..."> dentro de <article class="post">.
// Os cards de "Leia também" ficam fora do <article> e nunca são lidos como data.
//
// Um artigo sem título, descrição ou data válida faz o script falhar com a lista
// do que está faltando. Feed que omite post em silêncio é pior que build quebrado.
//
// Uso:
//   node tools/generate-rss.mjs            → grava rss.xml na raiz
//   node tools/generate-rss.mjs --check    → só valida e mostra o resumo, sem gravar

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const SITE = 'https://tyna.com.br';
const SAIDA = join(ROOT, 'rss.xml');
const CANAL = {
  title: 'Tyna - Governança de IA',
  link: SITE,
  description: 'Governança de IA na prática — política de uso, AI Gateway, LGPD e agentes em produção — e o Radar de notícias de IA, agentes e automação comentadas pela Tyna.',
  language: 'pt-BR',
};
const SOMENTE_CHECAR = process.argv.includes('--check');

/* ---------------------------------------------------------------- leitura */

function htmlDe(dir) {
  const achados = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) achados.push(...htmlDe(p));
    else if (nome.endsWith('.html')) achados.push(p);
  }
  return achados;
}

// o HTML é gerado pelo próprio site, então as entidades possíveis são poucas e conhecidas
const decodificar = s => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

const escaparXml = s => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* ---------------------------------------------------------------- datas */

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dois = n => String(n).padStart(2, '0');

// ISO 8601 → RFC 822. Data sem hora (AAAA-MM-DD) vira meio-dia no horário de Brasília:
// meia-noite UTC cairia no dia anterior para quem lê no Brasil.
function rfc822(iso) {
  const soData = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = new Date(soData ? `${iso}T12:00:00-03:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  // formatado em UTC com offset explícito: não depende do fuso da máquina que roda o build
  return `${DIAS[d.getUTCDay()]}, ${dois(d.getUTCDate())} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()} `
    + `${dois(d.getUTCHours())}:${dois(d.getUTCMinutes())}:${dois(d.getUTCSeconds())} +0000`;
}

/* ---------------------------------------------------------------- extração */

function extrair(arquivo) {
  const html = readFileSync(arquivo, 'utf8');
  const artigo = html.match(/<article class="post">([\s\S]*?)<\/article>/);
  if (!artigo) return null; // listagem, categoria: não é artigo

  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1];
  const titulo = (head.match(/<title>([^<]*)<\/title>/) || [])[1];
  const descricao = (head.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const dataIso = (head.match(/<meta property="article:published_time" content="([^"]+)"/) || [])[1]
    || (artigo[1].match(/<time datetime="([^"]+)"/) || [])[1];

  // blog/radar/slug/index.html → https://tyna.com.br/blog/radar/slug/
  const caminho = relative(ROOT, arquivo).split(sep).join('/').replace(/index\.html$/, '');
  const faltando = [
    !titulo && 'title', !descricao && 'meta description', !dataIso && 'data de publicação',
    dataIso && !rfc822(dataIso) && `data inválida (${dataIso})`,
  ].filter(Boolean);

  return {
    arquivo: relative(ROOT, arquivo),
    // o sufixo de marca é do <title> da aba, não do nome do artigo
    titulo: titulo && decodificar(titulo).replace(/\s*\|\s*Tyna\s*$/, '').trim(),
    descricao: descricao && decodificar(descricao).trim(),
    dataIso,
    pubDate: dataIso && rfc822(dataIso),
    url: `${SITE}/${caminho}`,
    secao: caminho.startsWith('blog/radar/') ? 'Radar' : 'Blog',
    faltando,
  };
}

/* ---------------------------------------------------------------- montagem */

if (!existsSync(BLOG)) {
  console.error('✗ diretório /blog não encontrado — rode o build do blog antes (node tools/build-blog.mjs)');
  process.exit(1);
}

const itens = htmlDe(BLOG).map(extrair).filter(Boolean);
const problemas = itens.filter(i => i.faltando.length);
if (problemas.length) {
  console.error(`✗ ${problemas.length} artigo(s) sem dado obrigatório para o feed:`);
  for (const p of problemas) console.error(`  ${p.arquivo}: falta ${p.faltando.join(', ')}`);
  process.exit(1);
}
if (!itens.length) {
  console.error('✗ nenhum artigo encontrado em /blog — feed não gerado');
  process.exit(1);
}

// mais recente primeiro; empate de data desempata pela URL, para a ordem ser estável entre builds
itens.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate) || a.url.localeCompare(b.url));

// lastBuildDate é a data do artigo mais recente, e não a hora do build: assim o arquivo
// só muda quando o conteúdo muda, e leitor de feed não vê "atualização" vazia
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escaparXml(CANAL.title)}</title>
  <link>${CANAL.link}</link>
  <description>${escaparXml(CANAL.description)}</description>
  <language>${CANAL.language}</language>
  <lastBuildDate>${itens[0].pubDate}</lastBuildDate>
  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${itens.map(i => `  <item>
    <title>${escaparXml(i.titulo)}</title>
    <link>${i.url}</link>
    <guid isPermaLink="true">${i.url}</guid>
    <pubDate>${i.pubDate}</pubDate>
    <description>${escaparXml(i.descricao)}</description>
    <category>${i.secao}</category>
  </item>`).join('\n')}
</channel>
</rss>
`;

const porSecao = itens.reduce((acc, i) => ({ ...acc, [i.secao]: (acc[i.secao] || 0) + 1 }), {});
const resumo = `${itens.length} artigos (${Object.entries(porSecao).map(([s, n]) => `${n} ${s}`).join(', ')}) · mais recente ${itens[0].dataIso}`;

if (SOMENTE_CHECAR) {
  console.log(`✓ rss válido para gerar: ${resumo}`);
} else {
  writeFileSync(SAIDA, xml);
  console.log(`✓ rss.xml gerado: ${resumo}`);
}
