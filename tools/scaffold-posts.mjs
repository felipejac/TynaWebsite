// Prepara posts para tradução.
//
// Puxa os posts em inglês direto do repositório do Automations Cookbook,
// monta o frontmatter em português já preenchido e grava um arquivo de
// trabalho por post com o original embutido como referência.
//
//   node tools/scaffold-posts.mjs --list              # o que falta traduzir
//   node tools/scaffold-posts.mjs --take 8            # prepara os 8 mais recentes pendentes
//   node tools/scaffold-posts.mjs --take 8 --digest   # + imprime o texto original no terminal
//
// Variável opcional: ACB_REPO=/caminho/do/automationscb-landing

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PT_DIR = join(ROOT, 'content', 'blog');
const WORK = join(ROOT, 'content', '_traduzir');
const ACB = process.env.ACB_REPO || join(ROOT, '..', 'automationscb-landing');
const ORIGIN = 'https://automationscookbook.com/blog';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

/* ---------- traduções mecânicas ---------- */

const TAGS = {
  'ai-agents': 'agentes-de-ia', 'ai agent': 'agentes-de-ia', 'agents': 'agentes-de-ia',
  'automation': 'automacao', 'automation-workflows': 'fluxos-de-automacao',
  'best-practices': 'boas-praticas', 'security': 'seguranca', 'debugging': 'depuracao',
  'production': 'producao', 'cost-optimization': 'otimizacao-de-custo', 'ai-costs': 'custo-de-ia',
  'prompt-engineering': 'engenharia-de-prompt', 'state-management': 'gestao-de-estado',
  'open source': 'codigo-aberto', 'open-source': 'codigo-aberto', 'reasoning': 'raciocinio',
  'cloud-infrastructure': 'infraestrutura-em-nuvem', 'data-quality': 'qualidade-de-dados',
  'context-engineering': 'engenharia-de-contexto', 'user-engagement': 'engajamento',
  'content-optimization': 'otimizacao-de-conteudo', 'ai-generated-content': 'conteudo-gerado-por-ia',
  'ai-generated-images': 'imagens-geradas-por-ia', 'confidence-scores': 'scores-de-confianca',
  'reinforcement-learning': 'aprendizado-por-reforco', 'quant-trading': 'trading-quantitativo',
  'gui-design': 'design-de-interface', 'shared-memory': 'memoria-compartilhada',
  'internal-tools': 'ferramentas-internas', 'secret-management': 'gestao-de-segredos',
  'self-destructing-secrets': 'segredos-efemeros', 'ai-model-switching': 'troca-de-modelo',
  'ai-cost-tracking': 'controle-de-custo', 'billing': 'faturamento', 'funding': 'investimento',
  'compute': 'computacao', 'expertise': 'especialistas', 'cognitive-debt': 'divida-cognitiva',
  'physical-ai': 'ia-fisica', 'ai-models': 'modelos-de-ia', 'inference-api': 'api-de-inferencia',
  'open-weight-models': 'modelos-de-peso-aberto', 'edge-computing': 'edge-computing',
  'cloud-coding': 'codigo-na-nuvem', 'llm-router': 'roteador-de-llm', 'low-code': 'low-code',
  'web-components': 'web-components', 'markdown': 'markdown', 'rust': 'rust', 'rag': 'rag',
};
const ptTag = t => TAGS[t.toLowerCase().trim()] || t.toLowerCase().trim().replace(/\s+/g, '-');

const STOP = new Set(['a','an','the','and','or','to','for','of','in','on','with','from','at','by','as','is','are','its','new','now','how','why','what','launches','launch']);
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
  .filter(w => w && !STOP.has(w)).slice(0, 7).join('-');

/* ---------- frontmatter ---------- */

function parseFm(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const d = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    d[kv[1]] = v.startsWith('[') ? v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
                                 : v.replace(/^["']|["']$/g, '');
  }
  return { data: d, body: m[2].trim() };
}

/* ---------- fonte em inglês ---------- */

function loadEnglish() {
  if (!existsSync(ACB)) {
    console.error(`Repositório não encontrado: ${ACB}\nDefina ACB_REPO=/caminho/do/automationscb-landing`);
    process.exit(1);
  }
  const git = a => execSync(`git -C "${ACB}" ${a}`, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  try { git('fetch origin --quiet'); } catch { /* offline: usa o que já está clonado */ }

  const paths = git('ls-tree -r --name-only origin/main src/content/blog')
    .split(/\r?\n/).filter(p => p.endsWith('.md'));

  const posts = paths.map(path => {
    const p = parseFm(git(`show origin/main:${path}`));
    return p && { ...p.data, body: p.body, enSlug: path.split('/').pop().replace(/\.md$/, '') };
  }).filter(Boolean).filter(p => p.draft !== 'true');

  return posts.sort((a, b) => (b.pubDate || '').localeCompare(a.pubDate || ''));
}

/* ---------- estado ---------- */

const translated = new Set(
  (existsSync(PT_DIR) ? readdirSync(PT_DIR) : []).filter(f => f.endsWith('.md'))
    .map(f => (parseFm(readFileSync(join(PT_DIR, f), 'utf8'))?.data.originalUrl || '').replace(`${ORIGIN}/`, ''))
    .filter(Boolean)
);

const english = loadEnglish();
const pending = english.filter(p => !translated.has(p.enSlug));

console.log(`Inglês: ${english.length} | traduzidos: ${translated.size} | pendentes: ${pending.length}\n`);

if (flag('--list') || !flag('--take')) {
  for (const p of pending.slice(0, Number(val('--list', 60)))) {
    console.log(`  ${p.pubDate}  ${String(p.category).padEnd(10)}  ${p.title}`);
  }
  if (!flag('--take')) console.log(`\nPara preparar: node tools/scaffold-posts.mjs --take 8 --digest`);
  process.exit(0);
}

/* ---------- gera arquivos de trabalho ---------- */

const take = pending.slice(0, Number(val('--take', 8)));
if (existsSync(WORK)) rmSync(WORK, { recursive: true });
mkdirSync(WORK, { recursive: true });

for (const p of take) {
  const slug = slugify(p.title);
  const tags = (p.tags || []).map(ptTag);
  const fm = [
    '---',
    `title: "TRADUZIR: ${p.title}"`,
    `description: "TRADUZIR: ${p.description || ''}"`,
    `pubDate: "${p.pubDate}"`,
    `category: "${p.category}"`,
    `tags: [${tags.map(t => `"${t}"`).join(',')}]`,
    p.sourceUrl ? `sourceUrl: "${p.sourceUrl}"` : '',
    p.sourceName ? `sourceName: "${p.sourceName}"` : '',
    `originalUrl: "${ORIGIN}/${p.enSlug}"`,
    `aeoSummary: "TRADUZIR: ${(p.aeoSummary || '').replace(/"/g, "'")}"`,
    'draft: false',
    '---',
  ].filter(Boolean).join('\n');

  const gabarito = `
## O que aconteceu

<!-- traduzir -->

## Por que isso importa para quem constrói

<!-- traduzir os bullets -->

## A leitura da Tyna

<!-- OBRIGATÓRIO: análise própria, não existe no original -->

## Perguntas frequentes

**P: ?**
R:
`;

  writeFileSync(join(WORK, `${slug}.md`), `${fm}\n${gabarito}\n<!-- ================= ORIGINAL (apagar ao terminar) =================\n\n${p.body}\n\n================================================================ -->\n`);
  console.log(`  preparado: ${slug}.md   ← ${p.enSlug}`);
}

if (flag('--digest')) {
  console.log('\n\n########## ORIGINAIS ##########\n');
  for (const p of take) console.log(`\n===== ${slugify(p.title)} =====\nTITLE: ${p.title}\nDESC: ${p.description}\nAEO: ${p.aeoSummary}\n\n${p.body}\n`);
}

console.log(`\n${take.length} arquivos em content/_traduzir/`);
console.log('Ao terminar cada um: mover para content/blog/ e rodar node tools/check-blog.mjs');
