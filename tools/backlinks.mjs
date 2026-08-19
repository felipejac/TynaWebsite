#!/usr/bin/env node
/**
 * Ciclo de backlinks — prospecção verificada, não geração automática.
 *
 * O que este script FAZ:
 *   - percorre docs/backlinks-alvos.json e, em cada alvo, baixa a página onde o link
 *     apareceria se a ação tivesse dado certo, e procura por tyna.com.br;
 *   - separa link seguido de link com rel=nofollow/ugc/sponsored, porque só o primeiro
 *     transfere autoridade;
 *   - relata honestamente quando não deu para verificar (403, timeout, bloqueio de bot),
 *     em vez de contar como ausência;
 *   - opcionalmente puxa os backlinks reais que o Bing enxerga, se houver chave de API;
 *   - escreve docs/backlinks-status.md com data, para virar registro e não achismo.
 *
 * O que este script NÃO FAZ, de propósito:
 *   - não cria link em lugar nenhum, não preenche formulário, não posta comentário e
 *     não envia e-mail. Criação automática de backlink em massa é link scheme pelas
 *     diretrizes do Google, e o risco cairia sobre um domínio sem histórico algum.
 *     O que se automatiza aqui é a parte chata: descobrir, conferir e cobrar.
 *
 * Uso:
 *   node tools/backlinks.mjs             # verifica todos os alvos
 *   node tools/backlinks.mjs --pendentes # só o que ainda não está publicado
 *   node tools/backlinks.mjs --bing      # soma os backlinks que o Bing conhece
 *
 * Para o modo --bing: gerar a chave em Bing Webmaster Tools › Settings › API Access e
 * exportar BING_WEBMASTER_API_KEY. Sem a chave, o modo é ignorado com aviso.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALVOS = join(ROOT, 'docs', 'backlinks-alvos.json');
const SAIDA = join(ROOT, 'docs', 'backlinks-status.md');

const args = process.argv.slice(2);
const has = f => args.includes(f);

const dados = JSON.parse(readFileSync(ALVOS, 'utf8'));
const DOMINIO = dados.dominio;

/* ---------- verificação de um alvo ---------- */

// Alguns veículos bloqueiam requisição sem cara de navegador. Isso não é contorno de
// proteção: é identificar-se de forma que o servidor aceite responder o HTML público.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const TIMEOUT_MS = 15000;

async function baixar(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    const html = r.ok ? await r.text() : '';
    return { status: r.status, html };
  } catch (e) {
    return { status: 0, html: '', erro: e.name === 'AbortError' ? 'tempo esgotado' : e.message };
  } finally {
    clearTimeout(t);
  }
}

// Um link para o domínio pode existir e não valer nada: rel="nofollow" pede ao buscador
// que ignore a indicação. Separar os dois evita comemorar o que não conta.
function analisarLinks(html) {
  const achados = [...html.matchAll(/<a\b[^>]*href=["']([^"']*tyna\.com\.br[^"']*)["'][^>]*>/gi)];
  if (!achados.length) return { total: 0, seguidos: 0, nofollow: 0, exemplos: [] };
  let seguidos = 0, nofollow = 0;
  const exemplos = [];
  for (const m of achados) {
    const tag = m[0];
    const rel = (tag.match(/rel=["']([^"']*)["']/i) || [, ''])[1].toLowerCase();
    const bloqueado = /nofollow|ugc|sponsored/.test(rel);
    if (bloqueado) nofollow++; else seguidos++;
    if (exemplos.length < 3) exemplos.push(m[1]);
  }
  return { total: achados.length, seguidos, nofollow, exemplos };
}

async function verificar(alvo) {
  if (!alvo.verificacao) return { ...alvo, resultado: 'sem-url-de-verificacao' };
  const { status, html, erro } = await baixar(alvo.verificacao);
  if (status === 0) return { ...alvo, resultado: 'inacessivel', detalhe: erro };
  if (status === 403 || status === 401) return { ...alvo, resultado: 'bloqueou-robo', detalhe: `HTTP ${status}` };
  if (status === 404) return { ...alvo, resultado: 'pagina-inexistente', detalhe: 'HTTP 404' };
  if (status >= 400) return { ...alvo, resultado: 'erro-http', detalhe: `HTTP ${status}` };

  const links = analisarLinks(html);
  if (!links.total) return { ...alvo, resultado: 'sem-link', detalhe: `HTTP ${status}` };
  return {
    ...alvo,
    resultado: links.seguidos ? 'link-no-ar' : 'link-nofollow',
    detalhe: `${links.total} link(s): ${links.seguidos} seguido(s), ${links.nofollow} nofollow`,
    exemplos: links.exemplos,
  };
}

/* ---------- Bing: os backlinks que o buscador realmente conhece ---------- */

async function bing() {
  const chave = process.env.BING_WEBMASTER_API_KEY;
  if (!chave) {
    console.log('\n! modo --bing pedido sem BING_WEBMASTER_API_KEY no ambiente — pulando.');
    console.log('  Gere em Bing Webmaster Tools › Settings › API Access.');
    return null;
  }
  const url = `https://ssl.bing.com/webmaster/api.svc/json/GetLinkCounts?apikey=${chave}`
    + `&siteUrl=${encodeURIComponent('https://' + DOMINIO)}&page=0`;
  const { status, html, erro } = await baixar(url);
  if (status !== 200) {
    console.log(`\n! Bing respondeu ${status || 'nada'}${erro ? ` (${erro})` : ''} — sem dados desta vez.`);
    return null;
  }
  try {
    const j = JSON.parse(html);
    const linhas = j?.d?.Links || j?.d || [];
    console.log(`\n— Bing conhece ${Array.isArray(linhas) ? linhas.length : 0} origem(ns) de link para ${DOMINIO}`);
    return Array.isArray(linhas) ? linhas : [];
  } catch {
    console.log('\n! resposta do Bing não veio em JSON reconhecível.');
    return null;
  }
}

/* ---------- execução ---------- */

const ROTULO = {
  'link-no-ar': '✓ no ar (seguido)',
  'link-nofollow': '~ no ar, mas nofollow',
  'sem-link': '· ainda sem link',
  'bloqueou-robo': '? bloqueou a verificação',
  'inacessivel': '? inacessível',
  'pagina-inexistente': '? página não existe',
  'erro-http': '? erro HTTP',
  'sem-url-de-verificacao': '· sem URL para conferir',
};

const alvos = has('--pendentes') ? dados.alvos.filter(a => a.status !== 'publicado') : dados.alvos;

console.log(`\nCiclo de backlinks — ${alvos.length} alvo(s), domínio ${DOMINIO}\n`);

// Sequencial de propósito: é uma lista curta, e disparar dezenas de requisições ao mesmo
// tempo contra veículos de imprensa é a melhor forma de ser bloqueado por engano.
const resultados = [];
for (const alvo of alvos) {
  const r = await verificar(alvo);
  resultados.push(r);
  const rotulo = ROTULO[r.resultado] || r.resultado;
  console.log(`  ${rotulo.padEnd(24)} ${r.nome}`);
  if (r.detalhe) console.log(`  ${''.padEnd(24)} ${r.detalhe}`);
}

const noAr = resultados.filter(r => r.resultado === 'link-no-ar');
const nofollow = resultados.filter(r => r.resultado === 'link-nofollow');
const naoVerificados = resultados.filter(r => ['bloqueou-robo', 'inacessivel', 'erro-http', 'pagina-inexistente'].includes(r.resultado));

console.log(`\nResumo: ${noAr.length} link(s) seguido(s) · ${nofollow.length} nofollow · `
  + `${resultados.length - noAr.length - nofollow.length - naoVerificados.length} pendente(s) · `
  + `${naoVerificados.length} não verificável(is) por robô`);

if (has('--bing')) await bing();

/* ---------- registro ---------- */

const hoje = new Date().toISOString().slice(0, 10);
const porTipo = {};
for (const r of resultados) (porTipo[r.tipo] ||= []).push(r);

const md = `# Status dos backlinks — ${hoje}

Gerado por \`npm run backlinks\`. Não editar à mão: a lista de alvos fica em
[backlinks-alvos.json](backlinks-alvos.json) e o raciocínio em
[backlinks-estudo.md](backlinks-estudo.md).

**${noAr.length} link(s) seguido(s)** · ${nofollow.length} nofollow ·
${resultados.length - noAr.length - nofollow.length - naoVerificados.length} pendente(s) ·
${naoVerificados.length} não verificável(is) automaticamente

${Object.entries(porTipo).map(([tipo, itens]) => `## ${tipo}

| Alvo | Situação | Prioridade | Esforço | Aderência ao ICP |
| --- | --- | --- | --- | --- |
${itens.map(i => `| [${i.nome}](${i.site}) | ${ROTULO[i.resultado] || i.resultado} | ${i.prioridade} | ${i.esforco} | ${i.aderencia} |`).join('\n')}
`).join('\n')}
## Como ler "não verificável"

Veículo que responde 403 a requisição automatizada não está sem link: está sem
verificação. A conferência desses casos é no navegador, e o resultado entra no campo
\`status\` do JSON, à mão.
`;

writeFileSync(SAIDA, md);
console.log(`\n→ registro escrito em docs/backlinks-status.md`);
