// Valida todo JSON-LD que vai para produção contra o vocabulário oficial do schema.org.
//
// Três verificações, todas bloqueantes:
//   1. o JSON é válido;
//   2. todo @type existe no schema.org, e toda propriedade existe e pertence ao tipo
//      (domainIncludes do próprio tipo ou de um ancestral) — é o que pega campo
//      inventado ou campo no tipo errado;
//   3. o que o schema afirma está na página: pergunta de FAQPage e passo de HowTo
//      precisam aparecer no texto visível. Schema que descreve conteúdo que o leitor
//      não vê é o que o Google trata como marcação enganosa.
//
// O vocabulário é baixado de schema.org na primeira execução e guardado no diretório
// temporário do sistema.
//
// Uso: node tools/check-jsonld.mjs

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOCAB_URL = 'https://schema.org/version/latest/schemaorg-current-https.jsonld';
const CACHE = join(tmpdir(), 'schemaorg-current-https.jsonld');

if (!existsSync(CACHE)) {
  const r = await fetch(VOCAB_URL);
  if (!r.ok) { console.error(`✗ não consegui baixar o vocabulário (${r.status})`); process.exit(1); }
  writeFileSync(CACHE, await r.text());
}
const grafo = JSON.parse(readFileSync(CACHE, 'utf8'))['@graph'];
const ids = v => (v == null ? [] : (Array.isArray(v) ? v : [v]).map(x => x['@id']));
const nome = id => id.replace(/^schema:/, '');

const classes = new Map();   // Tipo -> [supertipos]
const props = new Map();     // propriedade -> { dominio: [tipos] }
for (const n of grafo) {
  const t = [].concat(n['@type']);
  if (t.includes('rdfs:Class')) classes.set(nome(n['@id']), ids(n['rdfs:subClassOf']).map(nome));
  if (t.includes('rdf:Property')) props.set(nome(n['@id']), { dominio: ids(n['schema:domainIncludes']).map(nome) });
}
// tipos de dado (Text, URL, Date...) também são classes para efeito de @type
const ancestrais = (tipo, vistos = new Set()) => {
  if (vistos.has(tipo)) return vistos;
  vistos.add(tipo);
  for (const s of classes.get(tipo) || []) ancestrais(s, vistos);
  return vistos;
};

// páginas publicadas, o mesmo recorte do deploy
const PUBLICADO = readFileSync(join(ROOT, 'tools', 'deploy.mjs'), 'utf8')
  .match(/const PUBLISH = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
const arquivos = [];
const varrer = d => {
  for (const e of readdirSync(join(ROOT, d))) {
    const rel = posix.join(d, e);
    if (statSync(join(ROOT, rel)).isDirectory()) varrer(rel);
    else if (e.endsWith('.html')) arquivos.push(rel);
  }
};
for (const p of PUBLICADO) {
  if (!existsSync(join(ROOT, p))) continue;
  if (statSync(join(ROOT, p)).isDirectory()) varrer(p);
  else if (p.endsWith('.html') || p === 'ai.json') arquivos.push(p);
}

// arquivos passados na linha de comando substituem o recorte do deploy — útil para
// validar página que ainda não é publicada (os esqueletos comerciais, por exemplo)
const pedidos = process.argv.slice(2);
if (pedidos.length) arquivos.splice(0, arquivos.length, ...pedidos);

const erros = [];
const contagem = new Map();
const erro = (arq, msg) => erros.push(`${arq}: ${msg}`);

function validarNo(arq, no, caminho) {
  if (Array.isArray(no)) { no.forEach((x, i) => validarNo(arq, x, `${caminho}[${i}]`)); return; }
  if (!no || typeof no !== 'object') return;
  if (no['@graph']) validarNo(arq, no['@graph'], `${caminho}.@graph`);
  const tipos = no['@type'] ? [].concat(no['@type']) : [];
  for (const t of tipos) {
    if (!classes.has(t)) erro(arq, `${caminho}: tipo inexistente no schema.org "${t}"`);
    contagem.set(t, (contagem.get(t) || 0) + 1);
  }
  const linhagem = new Set(tipos.flatMap(t => [...ancestrais(t)]));
  for (const [k, v] of Object.entries(no)) {
    if (k.startsWith('@')) continue;
    const p = props.get(k);
    if (!p) { erro(arq, `${caminho}: propriedade inexistente no schema.org "${k}"`); continue; }
    if (tipos.length && p.dominio.length && !p.dominio.some(d => linhagem.has(d))) {
      erro(arq, `${caminho}: "${k}" não pertence a ${tipos.join('/')} (domínio: ${p.dominio.join(', ')})`);
    }
    if (v && typeof v === 'object') validarNo(arq, v, `${caminho}.${k}`);
  }
}

const visivel = html => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').toLowerCase();
const normal = s => String(s).replace(/\s+/g, ' ').trim().toLowerCase();

function coletar(no, tipo, saida = []) {
  if (Array.isArray(no)) { no.forEach(x => coletar(x, tipo, saida)); return saida; }
  if (!no || typeof no !== 'object') return saida;
  if ([].concat(no['@type'] || []).includes(tipo)) saida.push(no);
  for (const [k, v] of Object.entries(no)) if (!k.startsWith('@') || k === '@graph') coletar(v, tipo, saida);
  return saida;
}

let blocos = 0;
for (const arq of arquivos) {
  const bruto = readFileSync(join(ROOT, arq), 'utf8');
  const jsons = arq.endsWith('.json')
    ? [bruto]
    : [...bruto.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const texto = arq.endsWith('.json') ? null : visivel(bruto);
  for (const [i, j] of jsons.entries()) {
    blocos++;
    let obj;
    try { obj = JSON.parse(j); } catch (e) { erro(arq, `bloco ${i + 1}: JSON inválido (${e.message})`); continue; }
    validarNo(arq, obj, `bloco${i + 1}`);
    if (!texto) continue;
    for (const f of coletar(obj, 'FAQPage')) {
      for (const q of [].concat(f.mainEntity || [])) {
        if (q.name && !texto.includes(normal(q.name))) erro(arq, `FAQPage: pergunta não aparece na página — "${q.name}"`);
      }
    }
    for (const h of coletar(obj, 'HowTo')) {
      for (const s of [].concat(h.step || [])) {
        if (s.name && !texto.includes(normal(s.name))) erro(arq, `HowTo: passo não aparece na página — "${s.name}"`);
      }
    }
  }
}

const tipos = [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(', ');
console.log(`${arquivos.length} arquivos | ${blocos} blocos de JSON-LD | ${erros.length} erro(s)`);
console.log(`tipos: ${tipos}`);
if (erros.length) {
  console.log('\n' + erros.join('\n'));
  process.exit(1);
}
