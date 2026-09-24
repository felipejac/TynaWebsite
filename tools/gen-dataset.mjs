// gen-dataset.mjs — Gera biblioteca-prompts/dataset.json a partir de data.js
// Roda com: node tools/gen-dataset.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataJs = readFileSync(join(ROOT, 'biblioteca-prompts', 'assets', 'data.js'), 'utf8');
const lines = dataJs.split('\n');

// Helper: extract a single-quoted string value for a key from a body string
function extractField(body, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`);
  const m = body.match(re);
  return m ? m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : '';
}

const prompts = [];

const promptsStart = lines.findIndex(l => l.startsWith('const PROMPTS'));
const csvStart = lines.findIndex(l => l.startsWith('const CSV_PROMPTS'));

// ---- Extract PROMPTS (5 stacks, each with 29 cases) ----
// Structure: stackname:{ 'CASE-ID':{tool,categoria,lang,p,c,n}, ... }
if (promptsStart !== -1 && csvStart !== -1) {
  // Find stack-level sections by lines like: autoral:{
  let currentStack = null;
  let entryId = null;
  let entryLines = [];

  const flushEntry = () => {
    if (!entryId || !currentStack) return;
    const body = entryLines.join('\n');
    prompts.push({
      id: `${currentStack}-${entryId}`,
      stack: currentStack,
      caseId: entryId,
      categoria: extractField(body, 'categoria'),
      lang: extractField(body, 'lang'),
      tool: extractField(body, 'tool'),
      prompt: extractField(body, 'p'),
      params: extractField(body, 'c'),
      note: extractField(body, 'n'),
    });
    entryId = null;
    entryLines = [];
  };

  for (let i = promptsStart + 1; i < csvStart; i++) {
    const line = lines[i];

    // Detect stack header: "autoral:{" or "autoral : {"
    const stackM = line.match(/^(\w+)\s*:\s*\{$/);
    if (stackM) {
      flushEntry();
      currentStack = stackM[1];
      continue;
    }

    // Detect case entry: "'KV-01':{" on one line
    const caseM = line.match(/^'([A-Z][A-Z0-9-]+)'\s*:\s*\{/);
    if (caseM) {
      flushEntry();
      entryId = caseM[1];
      entryLines = [line];
      continue;
    }

    // Accumulate body lines
    if (entryId) entryLines.push(line);
  }
  flushEntry();
}

// ---- Extract CSV_PROMPTS using line-based approach ----
// Each entry: line starts with 'XX-NNN':{
let cId = null;
let cBody = [];

const flushCsv = () => {
  if (!cId) return;
  const body = cBody.join('\n');
  prompts.push({
    id: cId,
    categoria: extractField(body, 'categoria'),
    lang: extractField(body, 'lang'),
    tool: extractField(body, 'tool'),
    prompt: extractField(body, 'p'),
    params: extractField(body, 'c'),
    note: extractField(body, 'n'),
  });
  cId = null;
  cBody = [];
};

for (let i = csvStart; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('const CSV_PROMPTS')) continue;
  if (line === '};') { flushCsv(); break; }

  const idMatch = line.match(/^'([^']+)'\s*:\s*\{/);
  if (idMatch) {
    flushCsv();
    cId = idMatch[1];
    cBody = [line];
  } else if (cId) {
    cBody.push(line);
  }
}
flushCsv();

console.log(`PROMPTS entries: ${prompts.filter(p => p.stack).length}`);
console.log(`CSV_PROMPTS entries: ${prompts.filter(p => !p.stack).length}`);
console.log(`Total: ${prompts.length}`);

// Clean up: remove the stack field from the output (it was only for ID generation)
const cleanPrompts = prompts.map(({ stack, caseId, ...rest }) => rest);

// Collect unique categories found in data
const cats = [...new Set(cleanPrompts.map(p => p.categoria).filter(Boolean))].sort();

const dataset = {
  name: 'Biblioteca de Prompts de IA — Tyna',
  description: 'Coleção de prompts de IA para marketing, design, desenvolvimento e negócios',
  url: 'https://tyna.com.br/biblioteca-prompts/',
  license: 'CC-BY-4.0',
  created: '2026-09-24',
  version: '2.0',
  totalPrompts: cleanPrompts.length,
  languages: ['pt-BR', 'en'],
  categories: [
    'Imagem', 'Vídeo', 'Web Development', 'Education', 'Marketing', 'Design',
    'Business Planning', 'Data Science', 'Automations', 'Creative Writing',
    'Video Generation', 'Image Generation', 'Learning & Skills', 'Vibe Coding',
    'Lifestyle & Health', 'Entertainment & Gaming', 'Outros',
  ],
  prompts: cleanPrompts,
};

const outPath = join(ROOT, 'biblioteca-prompts', 'dataset.json');
writeFileSync(outPath, JSON.stringify(dataset, null, 2), 'utf8');
console.log(`\nOK — ${cleanPrompts.length} prompts written to ${outPath}`);
console.log(`Categories found: ${cats.join(', ')}`);
