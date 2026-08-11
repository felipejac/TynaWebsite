// Publica o site em produção: Cloudflare Pages, projeto `tyna-website` (dominio tyna.com.br).
//
// IMPORTANTE: produção NÃO sai do GitHub. `git push` só versiona o código — quem publica
// é este script, que sincroniza dist/ com os arquivos da raiz e sobe via wrangler.
//
// Uso:
//   node tools/deploy.mjs            → sincroniza dist/ e publica
//   node tools/deploy.mjs --build    → regenera o blog antes (roda build-blog.mjs)
//   node tools/deploy.mjs --dry-run  → só monta dist/, não publica

import { execFileSync, execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PROJECT = 'tyna-website';
const BRANCH = 'main';

// O que é público. CNAME, content/, tools/, docs/ e imagens de trabalho ficam de fora.
const PUBLISH = ['index.html', 'sobre', 'blog', 'assets', 'rss.xml', 'sitemap.xml'];

const args = process.argv.slice(2);
const has = f => args.includes(f);
const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
// O wrangler vem pelo npx, que no Windows é um .cmd — desde o Node 20.12 spawná-lo sem shell
// dá EINVAL. Por isso vai como linha de comando única (todos os argumentos são fixos).
const runShell = cmd => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const capture = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8' }).trim();

/* ---------- 1. build opcional do blog ---------- */

if (has('--build')) {
  console.log('→ regenerando blog/ a partir de content/blog/');
  run(process.execPath, [join(ROOT, 'tools', 'build-blog.mjs')]);
}

/* ---------- 2. sincroniza dist/ ---------- */

const faltando = PUBLISH.filter(p => !existsSync(join(ROOT, p)));
if (faltando.length) {
  console.error(`✗ arquivos ausentes na raiz: ${faltando.join(', ')}`);
  process.exit(1);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
for (const p of PUBLISH) cpSync(join(ROOT, p), join(DIST, p), { recursive: true });

const contarHtml = dir => readdirSync(dir).reduce((n, e) => {
  const p = join(dir, e);
  return n + (statSync(p).isDirectory() ? contarHtml(p) : Number(e.endsWith('.html')));
}, 0);

const paginas = contarHtml(DIST);
if (paginas === 0) {
  console.error('✗ dist/ ficou sem nenhuma página HTML — deploy abortado');
  process.exit(1);
}
console.log(`→ dist/ sincronizado: ${paginas} páginas HTML`);

/* ---------- 3. contexto do git (só informativo) ---------- */

let sujo = '';
try {
  const head = capture('git', ['log', '--oneline', '-1']);
  sujo = capture('git', ['status', '--porcelain']);
  console.log(`→ commit: ${head}`);
  if (sujo) console.log('⚠ há alterações não commitadas — elas VÃO para produção mesmo assim');
} catch { /* fora de um repo git: segue o deploy */ }

if (has('--dry-run')) {
  console.log('→ --dry-run: dist/ pronto, nada publicado');
  process.exit(0);
}

/* ---------- 4. publica ---------- */

console.log(`→ publicando em Cloudflare Pages (${PROJECT})`);
runShell(`npx wrangler pages deploy dist --project-name ${PROJECT} --branch ${BRANCH} --commit-dirty=true`);
console.log('\n✓ no ar em https://tyna.com.br — confira com Ctrl+F5 (ou aba anônima)');
if (sujo) console.log('⚠ lembre de commitar e dar push para o repositório não ficar atrás de produção');
