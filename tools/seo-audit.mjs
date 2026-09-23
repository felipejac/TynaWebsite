#!/usr/bin/env node
/**
 * Auditoria de SEO e indexabilidade do tyna.com.br.
 *
 * Existe porque "o site tem SEO bom" não é uma opinião que alguém deva ter — é uma
 * lista de condições verificáveis, e cada uma delas quebra silenciosamente. Página
 * fora do sitemap não é descoberta. Página órfã é descoberta e despriorizada.
 * Canonical apontando para o lugar errado consolida o sinal na URL errada. Nenhuma
 * dessas falhas aparece olhando o site no navegador.
 *
 * Uso:
 *   node tools/seo-audit.mjs              audita a produção
 *   node tools/seo-audit.mjs --local      audita os arquivos construídos em disco
 *   node tools/seo-audit.mjs --json       saída em JSON
 *   node tools/seo-audit.mjs --gsc        consulta o Search Console (precisa de escopo)
 *
 * Sai com código 1 se houver ERRO, para poder barrar um deploy.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tyna.com.br';
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const LOCAL = has('--local');
const JSON_OUT = has('--json');
const USAR_GSC = has('--gsc');

// Limites. Título e descrição são os que o Google trunca; os demais são sinais de
// conteúdo raso ou de página que não vai ranquear por falta de texto.
const LIM = {
  // O Google corta o título por largura em pixel (~600px), não por contagem de
  // caracteres. 60 é o alvo confortável; o corte só começa a doer perto de 65, e
  // avisar a cada 61 caracteres vira ruído que ninguém lê.
  tituloAlvo: 60,
  tituloMax: 65,
  tituloMin: 15,
  descMin: 110,
  descMax: 160,
  palavrasMin: 250,     // abaixo disso é conteúdo raso para busca
  marca: 'Tyna',        // precisa aparecer no título; a forma " | Tyna" é uma delas
};

const problemas = [];
const erro = (url, msg) => problemas.push({ nivel: 'ERRO', url, msg });
const aviso = (url, msg) => problemas.push({ nivel: 'AVISO', url, msg });

/* ---------- coleta ---------- */

const texto = (s) => (s || '').replace(/\s+/g, ' ').trim();

function extrair(html) {
  const meta = (re) => { const m = html.match(re); return m ? texto(m[1]) : null; };
  const todas = (re) => [...html.matchAll(re)].map((m) => m[1]);

  return {
    titulo: meta(/<title>([\s\S]*?)<\/title>/i),
    descricao: meta(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i),
    canonical: meta(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i),
    robots: meta(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i),
    lang: meta(/<html[^>]*\slang=["']([^"']*)["']/i),
    ogTitulo: meta(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i),
    ogDesc: meta(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i),
    ogImagem: meta(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i),
    h1: todas(/<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(texto),
    jsonLd: todas(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi),
    links: todas(/<a\s[^>]*href=["']([^"'#?]+)["']/gi),
    imgs: [...html.matchAll(/<img\s[^>]*>/gi)].map((m) => m[0]),
    // O corpo sem marcação, para medir conteúdo de verdade e não markup.
    palavras: html
      .replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/).filter(Boolean).length,
  };
}

async function buscar(url) {
  if (LOCAL) {
    const caminho = url.replace(SITE, '').replace(/\/$/, '/index.html') || 'index.html';
    const abs = join(RAIZ, caminho.replace(/^\//, ''));
    if (!existsSync(abs)) return { status: 404, html: '', headers: {} };
    return { status: 200, html: readFileSync(abs, 'utf8'), headers: {} };
  }
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now(), {
    redirect: 'manual',
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  });
  const headers = {};
  r.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  return { status: r.status, html: r.status === 200 ? await r.text() : '', headers };
}

// Concorrência limitada: 55 páginas de uma vez irrita qualquer borda e distorce o
// resultado com throttling que não tem nada a ver com SEO.
async function emLotes(itens, n, fn) {
  const saida = [];
  for (let i = 0; i < itens.length; i += n) {
    saida.push(...await Promise.all(itens.slice(i, i + n).map(fn)));
  }
  return saida;
}

/* ---------- checagens de site ---------- */

async function checarRobots() {
  if (LOCAL) return;
  const r = await fetch(`${SITE}/robots.txt?cb=${Date.now()}`);
  if (r.status !== 200) return erro(`${SITE}/robots.txt`, `robots.txt retorna ${r.status}`);
  const t = await r.text();

  // Disallow global é a maneira mais rápida de tirar um site inteiro do índice, e é
  // exatamente o que a Cloudflare injeta quando o "managed robots.txt" está ligado.
  const bloqueioGlobal = /^\s*User-agent:\s*\*\s*$[\s\S]*?^\s*Disallow:\s*\/\s*$/mi.test(t);
  if (bloqueioGlobal) erro(`${SITE}/robots.txt`, 'Disallow: / para todos — o site inteiro está bloqueado');
  if (!/^\s*Sitemap:\s*https?:\/\//mi.test(t)) aviso(`${SITE}/robots.txt`, 'não declara Sitemap');

  for (const bot of ['Googlebot', 'Bingbot']) {
    const rr = await fetch(`${SITE}/?cb=${Date.now()}`, { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${bot}/2.1)` } });
    if (rr.status !== 200) erro(SITE, `${bot} recebe HTTP ${rr.status} na home — a borda está barrando o crawler`);
  }
}

function urlsDoSitemap() {
  const caminho = join(RAIZ, 'sitemap.xml');
  if (!existsSync(caminho)) { erro(`${SITE}/sitemap.xml`, 'sitemap.xml não existe'); return []; }
  const xml = readFileSync(caminho, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

// Toda página publicada precisa estar no sitemap. Uma página fora dele depende de
// ser descoberta por link, o que num site novo e sem backlink quase não acontece.
function paginasEmDisco() {
  const achadas = [];
  const anda = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) { if (!['assets', 'dist', 'node_modules', '.git', 'docs', 'content', 'tools'].includes(nome)) anda(p); }
      else if (nome === 'index.html') achadas.push(p);
    }
  };
  anda(RAIZ);
  return achadas.map((p) => {
    const rel = relative(RAIZ, p).replace(/\\/g, '/').replace(/index\.html$/, '');
    return `${SITE}/${rel}`;
  });
}

/* ---------- execução ---------- */

const urls = urlsDoSitemap();
await checarRobots();

// Páginas em disco que ficaram de fora do sitemap.
if (!LOCAL || true) {
  const noSitemap = new Set(urls);
  for (const u of paginasEmDisco()) {
    if (u.includes('/404')) continue;
    if (!noSitemap.has(u)) erro(u, 'página existe mas não está no sitemap.xml');
  }
}

const paginas = await emLotes(urls, 6, async (url) => {
  const { status, html, headers } = await buscar(url);
  if (status !== 200) { erro(url, `HTTP ${status} (o sitemap não pode listar URL que não responde 200)`); return null; }

  const d = extrair(html);

  // Indexabilidade: os dois jeitos de dizer "não me indexe".
  if (/noindex/i.test(d.robots || '')) erro(url, 'meta robots contém noindex');
  if (/noindex/i.test(headers['x-robots-tag'] || '')) erro(url, 'cabeçalho X-Robots-Tag contém noindex');

  // Canonical. Autorreferente é o esperado; divergente consolida o sinal noutra URL.
  if (!d.canonical) erro(url, 'sem link canonical');
  else if (!/^https?:\/\//.test(d.canonical)) erro(url, `canonical relativo: "${d.canonical}"`);
  else if (d.canonical.replace(/\/$/, '') !== url.replace(/\/$/, '')) erro(url, `canonical aponta para outra URL: ${d.canonical}`);

  if (!d.lang) aviso(url, 'sem atributo lang no html');

  if (!d.titulo) erro(url, 'sem <title>');
  else {
    // O sufixo de marca é medido à parte de propósito. Ele é a parte que o Google
    // corta primeiro, e o corte ali não custa nada — quem lê já entendeu o título.
    // Medir com o sufixo dentro reprovaria um título de 60 caracteres perfeitamente
    // sadio só porque " | Tyna" ocupa mais sete.
    const semMarca = d.titulo.replace(/\s*[|—-]\s*(Blog\s+)?Tyna\s*$/i, '');
    // O desconto da marca vale só no teto: é lá que ele evita reprovar título sadio.
    // No piso vale o título inteiro, senão "LLMs — Blog Tyna" seria acusado de ter
    // quatro caracteres.
    if (semMarca.length > LIM.tituloMax) aviso(url, `title com ${semMarca.length} caracteres sem contar a marca (alvo ${LIM.tituloAlvo}, corte perto de ${LIM.tituloMax})`);
    if (d.titulo.length < LIM.tituloMin) aviso(url, `title com ${d.titulo.length} caracteres, curto demais`);
    if (!d.titulo.includes(LIM.marca)) aviso(url, `title não menciona "${LIM.marca}"`);
  }

  if (!d.descricao) erro(url, 'sem meta description');
  else if (d.descricao.length < LIM.descMin || d.descricao.length > LIM.descMax) {
    aviso(url, `meta description com ${d.descricao.length} caracteres (alvo ${LIM.descMin}–${LIM.descMax})`);
  }

  if (d.h1.length === 0) erro(url, 'sem <h1>');
  else if (d.h1.length > 1) aviso(url, `${d.h1.length} elementos <h1> (deve haver um)`);

  for (const [campo, valor] of [['og:title', d.ogTitulo], ['og:description', d.ogDesc], ['og:image', d.ogImagem]]) {
    if (!valor) aviso(url, `sem ${campo}`);
  }

  for (const bloco of d.jsonLd) {
    try { JSON.parse(bloco); } catch (e) { erro(url, `JSON-LD inválido: ${e.message.slice(0, 60)}`); }
  }

  const semAlt = d.imgs.filter((t) => !/\salt=/.test(t)).length;
  if (semAlt) aviso(url, `${semAlt} imagem(ns) sem atributo alt`);

  if (d.palavras < LIM.palavrasMin) aviso(url, `${d.palavras} palavras no corpo (abaixo de ${LIM.palavrasMin}, tende a não ranquear)`);

  return { url, ...d };
});

const vivas = paginas.filter(Boolean);

/* ---------- checagens que só existem no conjunto ---------- */

// Título ou descrição repetidos fazem o Google escolher uma página e ignorar as outras.
for (const campo of ['titulo', 'descricao']) {
  const mapa = new Map();
  for (const p of vivas) {
    if (!p[campo]) continue;
    if (!mapa.has(p[campo])) mapa.set(p[campo], []);
    mapa.get(p[campo]).push(p.url);
  }
  for (const [valor, lista] of mapa) {
    if (lista.length > 1) erro(lista[0], `${campo} repetido em ${lista.length} páginas: ${valor.slice(0, 48)}…`);
  }
}

// Página órfã: está no sitemap mas nenhuma outra página aponta para ela. O Google
// trata link interno como voto de importância; sem nenhum, a página fica no fim da
// fila de rastreio e muitas vezes nunca é indexada.
const apontadas = new Set();
for (const p of vivas) {
  for (const href of p.links) {
    let abs;
    try { abs = new URL(href, p.url).href; } catch { continue; }
    if (abs.startsWith(SITE)) apontadas.add(abs.replace(/\/$/, '') + '/');
  }
}
for (const p of vivas) {
  const norm = p.url.replace(/\/$/, '') + '/';
  if (norm !== `${SITE}/` && !apontadas.has(norm)) {
    erro(p.url, 'página órfã: nenhuma outra página do site aponta para ela');
  }
}

/* ---------- Search Console (opcional) ---------- */

let gsc = null;
if (USAR_GSC) {
  try {
    const token = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim();
    const r = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 403) {
      aviso(SITE, 'Search Console: credencial sem o escopo webmasters.readonly — rode o comando em docs/seo-operacao.md');
    } else if (r.ok) {
      gsc = { propriedades: (await r.json()).siteEntry?.map((s) => s.siteUrl) || [] };
      // Inspeção por URL: a única fonte que diz se o Google realmente indexou.
      const prop = gsc.propriedades.find((s) => s.includes('tyna.com.br'));
      if (prop) {
        gsc.inspecao = await emLotes(vivas.map((p) => p.url), 3, async (u) => {
          const resp = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            body: JSON.stringify({ inspectionUrl: u, siteUrl: prop, languageCode: 'pt-BR' }),
          });
          if (!resp.ok) return { url: u, estado: `erro ${resp.status}` };
          const j = await resp.json();
          const r2 = j.inspectionResult?.indexStatusResult || {};
          const estado = r2.coverageState || 'desconhecido';
          if (!/^Submitted and indexed|^Indexed/i.test(estado)) {
            erro(u, `Search Console: não indexada — ${estado}`);
          }
          return { url: u, estado, ultimoRastreio: r2.lastCrawlTime || null };
        });
      }
    }
  } catch (e) {
    aviso(SITE, `Search Console indisponível: ${e.message.slice(0, 80)}`);
  }
}

/* ---------- relatório ---------- */

const erros = problemas.filter((p) => p.nivel === 'ERRO');
const avisos = problemas.filter((p) => p.nivel === 'AVISO');

if (JSON_OUT) {
  console.log(JSON.stringify({ paginas: vivas.length, erros, avisos, gsc }, null, 2));
} else {
  const alvo = LOCAL ? 'arquivos locais' : 'produção';
  console.log(`\nAuditoria de SEO — ${alvo}: ${vivas.length} páginas do sitemap\n`);

  const agrupar = (lista) => {
    const m = new Map();
    for (const p of lista) { if (!m.has(p.url)) m.set(p.url, []); m.get(p.url).push(p.msg); }
    return m;
  };

  if (erros.length) {
    console.log(`ERROS (${erros.length}) — impedem ou degradam a indexação`);
    for (const [url, msgs] of agrupar(erros)) {
      console.log(`  ${url.replace(SITE, '') || '/'}`);
      for (const m of msgs) console.log(`      x ${m}`);
    }
    console.log('');
  }
  if (avisos.length) {
    console.log(`AVISOS (${avisos.length}) — não bloqueiam, mas custam posição`);
    for (const [url, msgs] of agrupar(avisos)) {
      console.log(`  ${url.replace(SITE, '') || '/'}`);
      for (const m of msgs) console.log(`      ! ${m}`);
    }
    console.log('');
  }
  if (gsc?.inspecao) {
    const ok = gsc.inspecao.filter((i) => /^Submitted and indexed|^Indexed/i.test(i.estado)).length;
    console.log(`Search Console: ${ok} de ${gsc.inspecao.length} indexadas (${Math.round(ok / gsc.inspecao.length * 100)}%)\n`);
  }
  if (!erros.length && !avisos.length) console.log('Nenhum problema encontrado.\n');
}

process.exit(erros.length ? 1 : 0);
