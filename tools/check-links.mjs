// Confere todo link interno do site publicado localmente.
//
// Para cada <a href> de cada página HTML que vai para produção, resolve o destino e
// classifica: existe (ok), responde por 301 do _redirects (redirecionado — funciona,
// mas link interno não deveria passar por redirecionamento) ou não existe (quebrado).
// Também lista páginas do sitemap que nenhuma outra página linka (órfãs).
//
// Uso: node tools/check-links.mjs      → sai com código 1 se houver link quebrado ou órfã

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tyna.com.br';
// o mesmo recorte que tools/deploy.mjs publica
const PUBLICADO = readFileSync(join(ROOT, 'tools', 'deploy.mjs'), 'utf8')
  .match(/const PUBLISH = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));

const paginas = [];
const varrer = d => {
  for (const e of readdirSync(join(ROOT, d))) {
    const rel = posix.join(d, e);
    if (statSync(join(ROOT, rel)).isDirectory()) varrer(rel);
    else if (e.endsWith('.html')) paginas.push(rel);
  }
};
for (const p of PUBLICADO) {
  if (!existsSync(join(ROOT, p))) continue;
  statSync(join(ROOT, p)).isDirectory() ? varrer(p) : p.endsWith('.html') && paginas.push(p);
}

const redirects = new Map();
if (existsSync(join(ROOT, '_redirects'))) {
  for (const l of readFileSync(join(ROOT, '_redirects'), 'utf8').split('\n')) {
    const [de, para] = l.trim().split(/\s+/);
    if (de && !de.startsWith('#') && para) redirects.set(de, para);
  }
}

// URL do site → caminho de arquivo, como o Cloudflare Pages serve
function arquivoDe(pathname) {
  const p = decodeURIComponent(pathname).replace(/^\//, '');
  const candidatos = p === '' ? ['index.html'] : p.endsWith('/') ? [p + 'index.html'] : [p, p + '.html', p + '/index.html'];
  return candidatos.find(c => PUBLICADO.some(x => c === x || c.startsWith(x + '/')) && existsSync(join(ROOT, c)));
}

const quebrados = [], redirecionados = [], linkados = new Set();
for (const pag of paginas) {
  const html = readFileSync(join(ROOT, pag), 'utf8');
  const base = new URL('/' + pag.replace(/index\.html$/, ''), SITE);
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(mailto:|tel:|javascript:|#|data:)/.test(href)) continue;
    let url;
    try { url = new URL(href, base); } catch { continue; }
    if (url.origin !== SITE) continue;
    const alvo = url.pathname;
    if (arquivoDe(alvo)) { linkados.add(alvo.endsWith('/') || alvo === '/' ? alvo : alvo); continue; }
    if (redirects.has(alvo)) { redirecionados.push(`${pag} → ${alvo} (301 ${redirects.get(alvo)})`); linkados.add(redirects.get(alvo)); continue; }
    quebrados.push(`${pag} → ${href}`);
  }
}

const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const noSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
const orfas = noSitemap.filter(p => p !== '/' && !linkados.has(p));

console.log(`${paginas.length} páginas | ${quebrados.length} links quebrados | ${redirecionados.length} links passando por 301 | ${orfas.length} órfãs`);
if (quebrados.length) console.log('\nQUEBRADOS\n  ' + [...new Set(quebrados)].join('\n  '));
if (redirecionados.length) console.log('\nPASSAM POR 301\n  ' + [...new Set(redirecionados)].slice(0, 40).join('\n  '));
if (orfas.length) console.log('\nÓRFÃS\n  ' + orfas.join('\n  '));
process.exit(quebrados.length || orfas.length ? 1 : 0);
