/**
 * traduzir-prompts.mjs
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Mass-translate ONLY the `Prompt` column of a prompts CSV from English to
 *   Brazilian Portuguese (pt-BR) via the Anthropic Messages API. Every other
 *   column (Categoria, Nome, ...) is preserved byte-for-byte. Output is a new
 *   CSV with the same header and the Prompt column replaced by the translation.
 *
 * USAGE
 *   ANTHROPIC_API_KEY=sk-ant-... node traduzir-prompts.mjs [entrada.csv] [saida.csv]
 *
 *   Defaults (if argv omitted):
 *     entrada.csv -> ./entrada-traduzir.csv
 *     saida.csv   -> ./saida-traduzida.csv
 *
 *   Optional env vars:
 *     MODEL        -> Anthropic model id (default: "claude-sonnet-5")
 *     BATCH_SIZE   -> prompts per API request (default: 20)
 *     MAX_RETRIES  -> retries per batch on transient errors (default: 5)
 *
 * TRANSLATION / PRESERVATION RULES (enforced via the SYSTEM prompt)
 *   Translate the prose to natural, fluent Brazilian Portuguese, BUT keep the
 *   following EXACTLY as in the original (do NOT translate or alter):
 *     - Technology / product / model names: Midjourney, Sora, Veo, GPT, Firefly,
 *       Runway, Flux, Stable Diffusion, ChatGPT, Claude, Linux, Python,
 *       JavaScript, SQL, React, API, etc.
 *     - Code snippets and inline code.
 *     - CLI flags / parameters, e.g. `--ar 16:9`, `--s 150`, `--raw`.
 *     - Placeholders in curly braces or shell form: {VARIÁVEL}, {SUBJECT},
 *       ${...} — preserved character-for-character.
 *   Translations are returned as a strict JSON array aligned to input order.
 * ---------------------------------------------------------------------------
 */

import fs from 'node:fs';

// --------------------------- config ---------------------------------------
const INPUT = process.argv[2] || './entrada-traduzir.csv';
const OUTPUT = process.argv[3] || './saida-traduzida.csv';
const MODEL = process.env.MODEL || 'claude-sonnet-5';
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 20);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 5);
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error(
    '\nERRO: variável de ambiente ANTHROPIC_API_KEY não definida.\n' +
    'Defina-a antes de rodar, por exemplo:\n\n' +
    '  export ANTHROPIC_API_KEY=sk-ant-...\n' +
    '  node traduzir-prompts.mjs entrada.csv saida.csv\n\n' +
    'Ou inline:\n\n' +
    '  ANTHROPIC_API_KEY=sk-ant-... node traduzir-prompts.mjs entrada.csv saida.csv\n'
  );
  process.exit(1);
}

// ----------------------- RFC-4180 CSV parser -------------------------------
// Handles quoted fields, embedded commas/newlines, and doubled quotes ("").
function parseCSV(text) {
  const rows = [];
  let field = '';
  let record = [];
  let i = 0;
  let inQuotes = false;
  const n = text.length;
  if (text.charCodeAt(0) === 0xfeff) i = 1; // strip BOM
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { record.push(field); field = ''; i++; continue; }
    if (c === '\r') { if (text[i + 1] === '\n') i++; record.push(field); field = ''; rows.push(record); record = []; i++; continue; }
    if (c === '\n') { record.push(field); field = ''; rows.push(record); record = []; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || record.length > 0) { record.push(field); rows.push(record); }
  return rows;
}

// CSV field serialization (RFC-4180): quote if it contains ", comma, or newline.
function csvField(v) {
  const s = v == null ? '' : String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(fields) {
  return fields.map(csvField).join(',');
}

// ------------------------------ prompt -------------------------------------
const SYSTEM_PROMPT = `Você é um tradutor profissional EN -> pt-BR (português do Brasil), especializado em prompts para ferramentas de IA.

Você receberá um array JSON de prompts em inglês. Traduza CADA prompt para um português do Brasil natural e fluente.

REGRAS DE PRESERVAÇÃO — mantenha EXATAMENTE como no original, sem traduzir:
- Nomes de tecnologias/produtos/modelos: Midjourney, Sora, Veo, GPT, Firefly, Runway, Flux, Stable Diffusion, ChatGPT, Claude, Linux, Python, JavaScript, SQL, React, API, etc.
- Trechos de código e código inline.
- Flags/parâmetros de linha de comando, ex.: --ar 16:9, --s 150, --raw.
- Placeholders entre chaves ou em forma de shell: {VARIÁVEL}, {SUBJECT}, \${...} — preservados caractere por caractere (não traduza o conteúdo dentro das chaves).

FORMATO DA RESPOSTA (obrigatório):
- Responda APENAS com um array JSON de strings, na MESMA ORDEM e com o MESMO NÚMERO de itens que a entrada.
- Cada item é a tradução pt-BR do prompt correspondente.
- Não inclua comentários, markdown, cercas de código, numeração ou qualquer texto fora do array JSON.`;

// -------------------------- API call w/ retry ------------------------------
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateBatch(prompts, batchNo) {
  const userContent =
    'Traduza os seguintes prompts. Retorne um array JSON de strings alinhado à ordem de entrada.\n\n' +
    JSON.stringify(prompts, null, 2);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        const backoff = Math.min(60000, 1000 * 2 ** (attempt - 1));
        console.warn(`  [batch ${batchNo}] HTTP ${res.status}, retry ${attempt}/${MAX_RETRIES} em ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      let text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      // strip accidental code fences
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr) || arr.length !== prompts.length) {
        throw new Error(`resposta desalinhada: esperados ${prompts.length}, recebidos ${Array.isArray(arr) ? arr.length : 'não-array'}`);
      }
      return arr.map(String);
    } catch (err) {
      const backoff = Math.min(60000, 1000 * 2 ** (attempt - 1));
      console.warn(`  [batch ${batchNo}] erro (tentativa ${attempt}/${MAX_RETRIES}): ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      await sleep(backoff);
    }
  }
  throw new Error(`batch ${batchNo}: falhou após ${MAX_RETRIES} tentativas`);
}

// ------------------------------- main --------------------------------------
async function main() {
  console.log(`Lendo: ${INPUT}`);
  const raw = fs.readFileSync(INPUT, 'utf8');
  const table = parseCSV(raw);
  const header = table[0];
  const dataRows = table.slice(1).filter(r => !(r.length === 1 && r[0] === ''));

  const lower = header.map(h => h.trim().toLowerCase());
  const iPrompt = lower.indexOf('prompt');
  if (iPrompt === -1) {
    console.error('ERRO: coluna "Prompt" não encontrada no cabeçalho:', JSON.stringify(header));
    process.exit(1);
  }
  console.log(`Cabeçalho: ${JSON.stringify(header)} | coluna prompt no índice ${iPrompt}`);
  console.log(`Linhas de dados: ${dataRows.length} | modelo: ${MODEL} | batch: ${BATCH_SIZE}`);

  const prompts = dataRows.map(r => r[iPrompt]);
  const translations = new Array(prompts.length);

  const totalBatches = Math.ceil(prompts.length / BATCH_SIZE);
  for (let b = 0; b < totalBatches; b++) {
    const start = b * BATCH_SIZE;
    const slice = prompts.slice(start, start + BATCH_SIZE);
    console.log(`Traduzindo batch ${b + 1}/${totalBatches} (linhas ${start}..${start + slice.length - 1})`);
    const out = await translateBatch(slice, b + 1);
    for (let k = 0; k < out.length; k++) translations[start + k] = out[k];
  }

  // rebuild CSV: same header, prompt column replaced by translation
  const outLines = [csvRow(header)];
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r].slice();
    row[iPrompt] = translations[r];
    outLines.push(csvRow(row));
  }
  fs.writeFileSync(OUTPUT, outLines.join('\r\n') + '\r\n');
  console.log(`\nConcluído. Escrito: ${OUTPUT} (${dataRows.length} linhas traduzidas)`);
}

main().catch(err => { console.error('FALHA:', err); process.exit(1); });
