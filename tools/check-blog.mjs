// Valida os posts antes de publicar.
//   node tools/check-blog.mjs
// Sai com código 1 se houver erro — encadeável em `&&`.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'content', 'blog');
const CATS = ['ai-agents', 'llm', 'dev-tools', 'automation'];
const REQ = ['title', 'description', 'pubDate', 'category', 'aeoSummary'];

let erros = 0, avisos = 0;
const erro = (f, m) => { console.log(`  ERRO   ${f}: ${m}`); erros++; };
const aviso = (f, m) => { console.log(`  aviso  ${f}: ${m}`); avisos++; };

const files = readdirSync(SRC).filter(f => f.endsWith('.md'));
const slugsVistos = new Map();

for (const file of files) {
  const raw = readFileSync(join(SRC, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) { erro(file, 'frontmatter ausente ou malformado'); continue; }

  const d = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) d[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  const body = m[2];

  for (const k of REQ) if (!d[k]) erro(file, `campo obrigatório ausente: ${k}`);

  // sobras do gabarito
  if (/TRADUZIR:/.test(raw)) erro(file, 'ainda contém marcador TRADUZIR:');
  if (/<!-- =+ ORIGINAL/.test(raw)) erro(file, 'ainda contém o bloco ORIGINAL embutido');
  if (/<!-- traduzir/.test(raw)) erro(file, 'ainda contém comentário de gabarito');

  if (d.category && !CATS.includes(d.category)) erro(file, `categoria desconhecida: ${d.category}`);
  if (d.pubDate && !/^\d{4}-\d{2}-\d{2}$/.test(d.pubDate)) erro(file, `data inválida: ${d.pubDate}`);
  if (!d.originalUrl) aviso(file, 'sem originalUrl — não vai gerar par hreflang');

  // a análise própria é o que diferencia de tradução literal
  if (!/^##\s+A leitura da Tyna/mi.test(body)) erro(file, 'falta a seção "A leitura da Tyna"');

  // FAQ precisa casar com o extrator do gerador
  const faqSec = body.split(/^##\s+.*(?:FAQ|Perguntas).*$/mi)[1];
  if (!faqSec) {
    aviso(file, 'sem seção de perguntas — não gera schema FAQPage');
  } else {
    const n = [...faqSec.matchAll(/\*\*(?:P|Q):\s*([^*]+)\*\*\s*\r?\n\s*(?:R|A):\s*([^\n]+)/g)].length;
    const marcadores = (faqSec.match(/\*\*P:/g) || []).length;
    if (n === 0) erro(file, 'perguntas não casam com o formato **P: …** / R: …');
    else if (n < marcadores) erro(file, `${marcadores - n} pergunta(s) fora do formato esperado`);
  }

  // limites de SEO
  if (d.description && d.description.length > 165) aviso(file, `description com ${d.description.length} caracteres (ideal ≤ 160)`);
  if (d.title && d.title.length > 65) aviso(file, `title com ${d.title.length} caracteres (ideal ≤ 60)`);
  if (d.aeoSummary && d.aeoSummary.split(/\s+/).length < 25) aviso(file, 'aeoSummary curto demais para ser citável');

  // duplicidade
  const slug = file.replace(/\.md$/, '');
  if (slugsVistos.has(slug)) erro(file, 'slug duplicado');
  slugsVistos.set(slug, true);
  if (d.originalUrl) {
    const dupe = [...slugsVistos.keys()].find(s => s !== slug && slugsVistos.get(s) === d.originalUrl);
    if (dupe) erro(file, `mesmo originalUrl de ${dupe}`);
    slugsVistos.set(slug, d.originalUrl);
  }
}

// pendências não terminadas
const WORK = join(ROOT, 'content', '_traduzir');
if (existsSync(WORK)) {
  const n = readdirSync(WORK).filter(f => f.endsWith('.md')).length;
  if (n) aviso('_traduzir/', `${n} arquivo(s) em tradução ainda não movido(s) para content/blog/`);
}

console.log(`\n${files.length} posts | ${erros} erro(s) | ${avisos} aviso(s)`);
process.exit(erros ? 1 : 0);
