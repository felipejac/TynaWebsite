#!/usr/bin/env node
// Verificador da base de conhecimento em docs/kb.
//
// As convenções de docs/kb/CONVENCOES.md só valem se alguém as cobrar. Este script
// é esse alguém. Cada checagem abaixo corresponde a uma regra numerada de lá, e o
// motivo de cada uma é sempre o mesmo: um trecho recuperado isoladamente por uma
// busca semântica precisa fazer sentido sozinho.
//
// Uso:  node tools/kb-lint.mjs        (erro = saída 1)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const KB = join(RAIZ, 'docs', 'kb');

const TIPOS = ['conceito', 'servico', 'case', 'concorrente', 'posicionamento', 'mercado', 'operacao', 'decisao'];
const CONFIANCA = ['alta', 'media', 'estimativa'];
const PUBLICOS = ['c-level', 'ti', 'juridico', 'compliance', 'interno'];
const TAGS = [
  'governanca', 'risco', 'compliance', 'lgpd', 'iso-42001', 'agentes', 'shadow-ai',
  'gateway', 'capacitacao', 'case', 'varejo', 'automotivo', 'bens-de-consumo',
  'concorrencia', 'preco', 'venda', 'objecao', 'icp', 'seo', 'meta', 'site',
];
const OBRIGATORIOS = ['titulo', 'id', 'tipo', 'tags', 'resumo', 'atualizado', 'confianca'];

// Regra 3: expressões que só fazem sentido com o trecho vizinho junto.
const ANAFORA = [
  /\bcomo vimos acima\b/i, /\bconforme (?:a )?(?:tabela|seção|nota) anterior\b/i,
  /\bcomo dito (?:acima|anteriormente)\b/i, /\bno tópico anterior\b/i,
  /\besse cliente\b/i, /\bessa empresa\b/i, /\bo cliente em questão\b/i,
];

const erros = [];
const avisos = [];

function listar(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '_templates' ? [] : listar(p);
    return p.endsWith('.md') ? [p] : [];
  });
}

// Parser de frontmatter deliberadamente mínimo: escalares e listas inline `[a, b]`.
// Não vale trazer dependência de YAML para sete campos de formato conhecido.
function frontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const linha of m[1].split(/\r?\n/)) {
    const par = linha.match(/^([a-z-]+):\s*(.*)$/i);
    if (!par) continue;
    const [, chave, bruto] = par;
    const v = bruto.trim();
    fm[chave] = v.startsWith('[')
      ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : v;
  }
  return fm;
}

const arquivos = listar(KB);
const idsConhecidos = new Map();
const linksUsados = [];

for (const arq of arquivos) {
  const rel = relative(RAIZ, arq).replace(/\\/g, '/');
  const texto = readFileSync(arq, 'utf8');
  const err = (m) => erros.push(`${rel}: ${m}`);
  const avi = (m) => avisos.push(`${rel}: ${m}`);

  const fm = frontmatter(texto);
  if (!fm) { err('sem frontmatter'); continue; }

  // Regra 4 — frontmatter obrigatório e vocabulário fechado.
  for (const campo of OBRIGATORIOS) {
    if (!fm[campo] || fm[campo].length === 0) err(`campo obrigatório ausente ou vazio: ${campo}`);
  }
  if (fm.tipo && !TIPOS.includes(fm.tipo)) err(`tipo fora do vocabulário: ${fm.tipo}`);
  if (fm.confianca && !CONFIANCA.includes(fm.confianca)) err(`confianca fora do vocabulário: ${fm.confianca}`);
  if (fm.atualizado && !/^\d{4}-\d{2}-\d{2}$/.test(fm.atualizado)) err(`atualizado deve ser AAAA-MM-DD, veio "${fm.atualizado}"`);
  for (const t of fm.tags || []) if (!TAGS.includes(t)) err(`tag fora do vocabulário controlado: "${t}"`);
  for (const p of fm.publico || []) if (!PUBLICOS.includes(p)) err(`publico fora do vocabulário: "${p}"`);

  // O id é o alvo dos [[links]]; se divergir do nome do arquivo, o link quebra.
  const esperado = basename(arq, '.md');
  if (fm.id && fm.id !== esperado) err(`id "${fm.id}" diverge do nome do arquivo "${esperado}"`);
  if (fm.id) idsConhecidos.set(fm.id, rel);

  const corpo = texto.slice(texto.indexOf('---', 3) + 3);

  // Regra 2 — a resposta curta é o trecho com maior chance de ser o único recuperado.
  const bloco = corpo.match(/##\s+Resposta curta\s*\r?\n([\s\S]*?)(?=\r?\n##\s|$)/);
  if (!bloco) {
    if (fm.tipo !== 'operacao' || !/INDICE|CONVENCOES/i.test(rel)) err('sem bloco "## Resposta curta"');
  } else {
    const palavras = bloco[1].trim().split(/\s+/).filter(Boolean).length;
    if (palavras < 30) err(`"Resposta curta" com ${palavras} palavras; mínimo 30 para responder sozinha`);
    else if (palavras > 110) avi(`"Resposta curta" com ${palavras} palavras; alvo é 40–80`);
  }

  // Notas marcadas com a tag `meta` documentam as próprias regras da base. Elas
  // citam frases proibidas como exemplo e numeram itens sem fonte externa — cobrar
  // as regras 3 e 6 delas geraria só falso-positivo.
  const ehMeta = (fm.tags || []).includes('meta');

  // Regra 6 — número sem fonte vira passivo.
  const temNumero = /\b(?:R\$|US\$)\s?[\d.,]+|\b\d+(?:[.,]\d+)?\s?(?:%|x\b)|\b\d{2,}\s?mil\b/.test(corpo);
  if (temNumero && !fm.fonte && !ehMeta) avi('há números no corpo e o campo "fonte" está vazio');

  // Regra 3 — autossuficiência de cada trecho.
  if (!ehMeta) {
    for (const re of ANAFORA) {
      const achou = corpo.match(re);
      if (achou) err(`referência que depende do trecho vizinho: "${achou[0]}"`);
    }
  }

  // Regra 5 — cabeçalho a cada 150–300 palavras, para o corte cair em fronteira boa.
  const totalPalavras = corpo.split(/\s+/).filter(Boolean).length;
  const cabecalhos = (corpo.match(/^##\s+/gm) || []).length;
  if (cabecalhos > 0 && totalPalavras / cabecalhos > 320) {
    avi(`média de ${Math.round(totalPalavras / cabecalhos)} palavras por cabeçalho; alvo é até 300`);
  }

  for (const l of corpo.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
    linksUsados.push({ de: rel, alvo: l[1].trim() });
  }
}

// Regra 8 — link para nota inexistente é legítimo, mas precisa ser visível.
const pendentes = new Map();
for (const { de, alvo } of linksUsados) {
  if (!idsConhecidos.has(alvo)) {
    if (!pendentes.has(alvo)) pendentes.set(alvo, new Set());
    pendentes.get(alvo).add(de);
  }
}

// Nota órfã não é recuperada por travessia de grafo; só por busca direta.
const apontadas = new Set(linksUsados.map((l) => l.alvo));
const orfas = [...idsConhecidos.keys()].filter((id) => !apontadas.has(id) && !/INDICE|convencoes/i.test(id));

console.log(`\nBase de conhecimento: ${arquivos.length} notas, ${idsConhecidos.size} ids, ${linksUsados.length} links.\n`);

if (erros.length) {
  console.log(`ERROS (${erros.length})`);
  for (const e of erros) console.log('  x ' + e);
  console.log('');
}
if (avisos.length) {
  console.log(`AVISOS (${avisos.length})`);
  for (const a of avisos) console.log('  ! ' + a);
  console.log('');
}
if (pendentes.size) {
  console.log(`LINKS PENDENTES (${pendentes.size}) — notas ainda não escritas`);
  for (const [alvo, origens] of pendentes) console.log(`  ~ [[${alvo}]] <- ${[...origens].join(', ')}`);
  console.log('');
}
if (orfas.length) {
  console.log(`NOTAS ÓRFÃS (${orfas.length}) — ninguém aponta para elas`);
  for (const o of orfas) console.log('  o ' + o);
  console.log('');
}
if (!erros.length && !avisos.length && !pendentes.size && !orfas.length) console.log('Tudo em conformidade.\n');

process.exit(erros.length ? 1 : 0);
