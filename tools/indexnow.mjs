// Notifica o IndexNow (Bing, Yandex e outros participantes do protocolo) sobre as
// URLs publicadas, em vez de esperar o crawler decidir revisitar o site sozinho.
//
// Uso:
//   node tools/indexnow.mjs             → envia todas as URLs do sitemap.xml
//   node tools/indexnow.mjs --changed   → detecta o que mudou (git) e envia só isso;
//                                          se nada mapear para uma URL, não envia nada
//   node tools/indexnow.mjs <url> ...   → envia só as URLs passadas como argumento
//
// tools/deploy.mjs chama `--changed` sozinho ao fim de todo deploy publicado. Essa
// chamada é best-effort: se o IndexNow falhar ou a máquina estiver offline, o deploy
// já terminou e não é desfeito por causa disso.
//
// A chave é o arquivo <chave>.txt hospedado na raiz do site — ver comentário em
// tools/deploy.mjs. Se a chave mudar, atualize as três referências: o nome do
// arquivo, KEY abaixo e a lista PUBLISH do deploy.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tyna.com.br';
const HOST = 'tyna.com.br';
const KEY = 'd3bf6674386c4a6e539f5bb870611a6c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemapUrls = () =>
  [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

// Arquivos cujo conteúdo é compartilhado por TODAS as páginas: mudar qualquer um
// deles equivale a mudar o site inteiro aos olhos de um crawler.
const ARQUIVOS_GLOBAIS = ['assets/styles.css', 'assets/site.js', 'assets/blog.css', 'tools/build-blog.mjs'];

// Mapeia um caminho de arquivo alterado para a URL pública correspondente.
// Retorna null para arquivo que não é página indexável (config, imagem, fonte de post).
function arquivoParaUrl(caminho) {
  const p = caminho.replace(/\\/g, '/');
  if (p === 'index.html') return `${SITE}/`;
  if (p === 'sobre/index.html') return `${SITE}/sobre/`;
  if (p === 'iso-42001/index.html') return `${SITE}/iso-42001/`;
  if (p === 'diagnostico/index.html') return `${SITE}/diagnostico/`;
  if (p === 'blog/index.html') return `${SITE}/blog/`;
  const post = p.match(/^blog\/([^/]+)\/index\.html$/);
  if (post && post[1] !== 'categoria') return `${SITE}/blog/${post[1]}/`;
  const cat = p.match(/^blog\/categoria\/([^/]+)\/index\.html$/);
  if (cat) return `${SITE}/blog/categoria/${cat[1]}/`;
  return null;
}

function urlsAlteradas() {
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  let arquivos = [];
  try {
    const commitados = git('diff', '--name-only', 'HEAD~1', 'HEAD').split('\n');
    const pendentes = git('status', '--porcelain').split('\n').map(l => l.slice(3));
    arquivos = [...new Set([...commitados, ...pendentes])].filter(Boolean);
  } catch {
    console.log('→ sem histórico git suficiente para comparar — enviando o sitemap inteiro');
    return sitemapUrls();
  }

  if (arquivos.some(a => ARQUIVOS_GLOBAIS.includes(a.replace(/\\/g, '/')))) {
    console.log('→ arquivo compartilhado por todas as páginas mudou — enviando o sitemap inteiro');
    return sitemapUrls();
  }

  const urls = [...new Set(arquivos.map(arquivoParaUrl).filter(Boolean))];
  return urls;
}

const args = process.argv.slice(2);
let urlList;
if (args[0] === '--changed') {
  urlList = urlsAlteradas();
  if (urlList.length === 0) {
    console.log('→ nada que afete uma página indexável mudou — nenhuma notificação enviada');
    process.exit(0);
  }
} else if (args.length) {
  urlList = args;
} else {
  urlList = sitemapUrls();
}

console.log(`→ enviando ${urlList.length} URL(s) ao IndexNow (host: ${HOST})`);
for (const u of urlList) console.log(`   ${u}`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`→ resposta: ${res.status} ${res.statusText}`);
if (res.status === 200 || res.status === 202) {
  console.log('✓ aceito — Bing e demais motores do IndexNow foram notificados');
} else {
  console.error('✗ IndexNow rejeitou o envio:', await res.text().catch(() => ''));
  process.exit(1);
}
