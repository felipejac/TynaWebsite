// Gera /llm-leaderboard/ — espelho do LLM Leaderboard do Automations Cookbook.
//
// A fonte é a API pública do AC (`/api/llm-leaderboard`), que por sua vez lê o
// Artificial Analysis Intelligence Index e guarda cache de 6h. O serviço semanal que
// mantém o AC atualizado é o que mantém esta página atualizada: aqui só se espelha.
//
// Três camadas, cada uma cobrindo a falha da anterior:
//   1. HTML com as 100 primeiras linhas já renderizadas — é o que o Google indexa,
//      e é por isso que a página NÃO monta a tabela no navegador como a do AC faz.
//   2. No navegador, assets/leaderboard.js busca a API ao vivo e substitui a tabela
//      pelos 651+ modelos, com busca, ordenação e filtro. A página fica fresca mesmo
//      sem novo deploy.
//   3. Se a API do AC estiver fora, o navegador usa `modelos.json`, publicado junto
//      com a página; e se estiver fora durante o build, o build usa o último snapshot
//      bom em tools/dados/ em vez de publicar uma página vazia.
//
// Uso:
//   node tools/build-leaderboard.mjs            → busca, grava snapshot e gera a página
//   node tools/build-leaderboard.mjs --offline  → gera a partir do snapshot, sem rede

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tyna.com.br';
const PAGE_URL = `${SITE}/llm-leaderboard/`;
const API = 'https://automationscookbook.com/api/llm-leaderboard?sort=intelligence';
const AC_PAGE = 'https://automationscookbook.com/llm-leaderboard';
const AA_URL = 'https://artificialanalysis.ai/leaderboards/models';
const SNAPSHOT = join(ROOT, 'tools', 'dados', 'llm-leaderboard.json');
const OUT_DIR = join(ROOT, 'llm-leaderboard');
const LLMS_TXT = join(ROOT, 'llms.txt');
const LINHAS_SSR = 100;
const MIN_MODELOS = 100; // resposta com menos que isso é sinal de API quebrada, não de mercado

// a versão dos assets mora no gerador do blog; lida daqui para as duas nunca divergirem
const ASSET_V = readFileSync(join(ROOT, 'tools', 'build-blog.mjs'), 'utf8').match(/const ASSET_V = '(\d+)'/)[1];

const offline = process.argv.includes('--offline');

/* ---------------------------------------------------------------------------- */
/* 1. dados                                                                      */
/* ---------------------------------------------------------------------------- */

function valido(body) {
  return body?.ok && Array.isArray(body.models) && body.models.length >= MIN_MODELOS && body.meta?.fetchedAt;
}

async function buscar() {
  const res = await fetch(API, {
    headers: { Accept: 'application/json', 'User-Agent': 'TynaSiteBuild/1.0 (+https://tyna.com.br/)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!valido(body)) throw new Error(`resposta inválida (${body?.models?.length ?? 0} modelos)`);
  return body;
}

function gravarSnapshot(body) {
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  // um modelo por linha: o diff semanal mostra quais modelos mudaram, em vez de
  // trocar uma linha única de 300 KB
  const linhas = body.models.map(m => '    ' + JSON.stringify(m)).join(',\n');
  writeFileSync(SNAPSHOT, `{\n  "ok": true,\n  "meta": ${JSON.stringify(body.meta)},\n  "models": [\n${linhas}\n  ]\n}\n`);
}

let dados;
if (!offline) {
  try {
    dados = await buscar();
    gravarSnapshot(dados);
    console.log(`→ leaderboard: ${dados.models.length} modelos da API (${dados.meta.fetchedAt})`);
  } catch (e) {
    console.warn(`⚠ leaderboard: API indisponível (${e.message}) — usando o último snapshot`);
  }
}
if (!dados) {
  if (!existsSync(SNAPSHOT)) {
    console.error('✗ leaderboard: sem API e sem snapshot — página não gerada');
    process.exit(1);
  }
  dados = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  console.log(`→ leaderboard: snapshot de ${dados.meta.fetchedAt} (${dados.models.length} modelos)`);
}

const { meta } = dados;
const modelos = dados.models.filter(m => m.slug && m.name);
const porInteligencia = [...modelos].sort((a, b) =>
  (b.intelligenceIndex ?? -Infinity) - (a.intelligenceIndex ?? -Infinity) || a.name.localeCompare(b.name));

/* ---------------------------------------------------------------------------- */
/* 2. formatação — número em pt-BR, preço em dólar, data no fuso de São Paulo    */
/* ---------------------------------------------------------------------------- */

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n4 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmt = {
  indice: v => (v == null ? '—' : n1.format(v)),
  preco: v => (v == null ? '—' : `US$ ${(v < 0.01 && v > 0 ? n4 : n2).format(v)}`),
  vel: v => (v == null ? '—' : `${n1.format(v)} tok/s`),
  seg: v => (v == null ? '—' : `${n2.format(v)} s`),
  lancamento: v => (v ? new Date(`${v}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'),
};
const dataLonga = iso => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
const atualizadoEm = dataLonga(meta.fetchedAt);
// número de versão, não quantidade: fica com ponto, como o fornecedor publica
const versao = String(meta.intelligenceIndexVersion);

/* ---------------------------------------------------------------------------- */
/* 3. métricas e percentis                                                       */
/* ---------------------------------------------------------------------------- */

// `menor` = quanto menor, melhor. A barra de cada célula é o percentil do modelo
// naquela métrica (melhor que X% dos modelos com o dado), não a fração do máximo:
// um único modelo de US$ 150 por milhão achataria a barra de preço de todos os outros.
const METRICAS = [
  { chave: 'intelligence', campo: 'intelligenceIndex', rotulo: 'Inteligência', f: fmt.indice, menor: false },
  { chave: 'coding', campo: 'codingIndex', rotulo: 'Coding', f: fmt.indice, menor: false },
  { chave: 'agentic', campo: 'agenticIndex', rotulo: 'Agentic', f: fmt.indice, menor: false },
  { chave: 'speed', campo: 'outputTokensPerSecond', rotulo: 'Velocidade', f: fmt.vel, menor: false },
  { chave: 'latency', campo: 'latencySeconds', rotulo: 'Latência', f: fmt.seg, menor: true },
  { chave: 'endToEnd', campo: 'endToEndResponseSeconds', rotulo: 'E2E', f: fmt.seg, menor: true },
  { chave: 'price', campo: 'blendedPricePer1m', rotulo: 'Preço/1M', f: fmt.preco, menor: true },
];

const percentil = {};
for (const m of METRICAS) {
  const vals = modelos.map(x => x[m.campo]).filter(v => v != null).sort((a, b) => (m.menor ? b - a : a - b));
  percentil[m.campo] = v => {
    if (v == null || vals.length < 2) return null;
    let lo = 0, hi = vals.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; (m.menor ? vals[mid] > v : vals[mid] < v) ? (lo = mid + 1) : (hi = mid); }
    return Math.round((lo / (vals.length - 1)) * 100);
  };
}

/* ---------------------------------------------------------------------------- */
/* 4. destaques calculados — tudo que o texto afirma sai do dado desta rodada    */
/* ---------------------------------------------------------------------------- */

const maiorPor = (lista, campo) => lista.filter(x => x[campo] != null).sort((a, b) => b[campo] - a[campo])[0];
const menorPor = (lista, campo) => lista.filter(x => x[campo] != null && x[campo] > 0).sort((a, b) => a[campo] - b[campo])[0];

const lider = porInteligencia[0];
const segundo = porInteligencia[1];
const terceiro = porInteligencia[2];
const top50 = porInteligencia.filter(x => x.intelligenceIndex != null).slice(0, 50);
const liderCodigo = maiorPor(modelos, 'codingIndex');
const liderAgentico = maiorPor(modelos, 'agenticIndex');
const maisRapido = maiorPor(top50, 'outputTokensPerSecond');
const maisBarato = menorPor(top50, 'blendedPricePer1m');
const corte = lider.intelligenceIndex * 0.75;
const custoBeneficio = modelos
  .filter(x => x.intelligenceIndex != null && x.intelligenceIndex >= corte && x.blendedPricePer1m > 0)
  .sort((a, b) => b.intelligenceIndex / b.blendedPricePer1m - a.intelligenceIndex / a.blendedPricePer1m)[0];

const contagemCriador = new Map();
for (const x of modelos) contagemCriador.set(x.creator, (contagemCriador.get(x.creator) || 0) + 1);
const nCriadores = contagemCriador.size;
const criadoresTop = [...contagemCriador.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
const melhorPorCriador = criadoresTop.map(([c]) => porInteligencia.find(x => x.creator === c && x.intelligenceIndex != null)).filter(Boolean);

/* ---------------------------------------------------------------------------- */
/* 5. marcação — o mesmo desenho de linha que assets/leaderboard.js reproduz     */
/* ---------------------------------------------------------------------------- */

const linkAA = x => `https://artificialanalysis.ai/models/${encodeURIComponent(x.slug)}`;

function linha(x, pos) {
  const celulas = METRICAS.map(m => {
    const v = x[m.campo];
    const ativa = m.chave === 'intelligence' ? ' lb-ativa' : '';
    if (v == null) return `<td class="lb-num lb-sem${ativa}">—</td>`;
    const p = percentil[m.campo](v);
    return `<td class="lb-num${ativa}"><span class="lb-v">${esc(m.f(v))}</span><span class="lb-barra" style="--p:${p}%" title="melhor que ${p}% dos modelos com esse dado" aria-hidden="true"></span></td>`;
  }).join('');
  return `<tr><td class="lb-pos">${pos}</td><th scope="row" class="lb-modelo"><a href="${linkAA(x)}" target="_blank" rel="nofollow noopener">${esc(x.name)}</a><span>${esc(x.creator)}</span></th>${celulas}<td class="lb-data">${fmt.lancamento(x.releaseDate)}</td></tr>`;
}

const tbody = porInteligencia.slice(0, LINHAS_SSR).map((x, i) => '            ' + linha(x, i + 1)).join('\n');

const destaque = (num, titulo, x, valor, nota) => `        <div class="svc-card">
          <span class="num">${num}</span>
          <h3>${titulo}</h3>
          <p><strong><a href="${linkAA(x)}" target="_blank" rel="nofollow noopener">${esc(x.name)}</a></strong>, da ${esc(x.creator)} — ${valor}.</p>
          <ul class="deliverables"><li>${nota}</li></ul>
        </div>`;

const destaques = [
  destaque('01', 'Mais inteligente', lider, `índice ${fmt.indice(lider.intelligenceIndex)}`, `à frente de ${esc(segundo.name)} (${fmt.indice(segundo.intelligenceIndex)})`),
  liderCodigo && destaque('02', 'Melhor em programação', liderCodigo, `índice de código ${fmt.indice(liderCodigo.codingIndex)}`, 'Coding Index da Artificial Analysis'),
  liderAgentico && destaque('03', 'Melhor em tarefas agênticas', liderAgentico, `índice agêntico ${fmt.indice(liderAgentico.agenticIndex)}`, 'uso de ferramenta e tarefa de várias etapas'),
  maisRapido && destaque('04', 'Mais rápido entre os 50 mais inteligentes', maisRapido, fmt.vel(maisRapido.outputTokensPerSecond), 'mediana de tokens de saída por segundo'),
  maisBarato && destaque('05', 'Mais barato entre os 50 mais inteligentes', maisBarato, `${fmt.preco(maisBarato.blendedPricePer1m)} por milhão de tokens`, `índice de inteligência ${fmt.indice(maisBarato.intelligenceIndex)}`),
  custoBeneficio && destaque('06', 'Melhor custo-benefício', custoBeneficio, `${n2.format(custoBeneficio.intelligenceIndex / custoBeneficio.blendedPricePer1m)} pontos de inteligência por dólar`, `entre os modelos com pelo menos 75% do índice do líder`),
].filter(Boolean).join('\n');

const tabelaCriadores = melhorPorCriador.map(x => `            <tr><td>${esc(x.creator)}</td><td><a href="${linkAA(x)}" target="_blank" rel="nofollow noopener">${esc(x.name)}</a></td><td class="lb-num">${fmt.indice(x.intelligenceIndex)}</td><td class="lb-num">${fmt.preco(x.blendedPricePer1m)}</td><td class="lb-num">${contagemCriador.get(x.creator)}</td></tr>`).join('\n');

const chips = [`<button type="button" class="lb-chip ativo" data-criador="" aria-pressed="true">Todas</button>`]
  .concat(criadoresTop.map(([c, n]) => `<button type="button" class="lb-chip" data-criador="${esc(c)}" aria-pressed="false">${esc(c)} <span>${n}</span></button>`))
  .join('\n          ');

const cabecalhoMetricas = METRICAS.map(m =>
  `<th scope="col" class="lb-num${m.chave === 'intelligence' ? ' lb-ativa' : ''}" aria-sort="${m.chave === 'intelligence' ? 'descending' : 'none'}"><button type="button" class="lb-th" data-ordem="${m.chave}">${m.rotulo}</button></th>`
).join('\n                ');

/* ---------------------------------------------------------------------------- */
/* 6. FAQ — respostas geradas do dado, idênticas no HTML e no JSON-LD            */
/* ---------------------------------------------------------------------------- */

const faq = [
  ['Qual é o melhor modelo de IA hoje?',
    `No ranking atualizado em ${atualizadoEm}, o ${lider.name}, da ${lider.creator}, lidera o Artificial Analysis Intelligence Index v${versao} com ${fmt.indice(lider.intelligenceIndex)} pontos. Em seguida vêm ${segundo.name} (${fmt.indice(segundo.intelligenceIndex)}) e ${terceiro.name} (${fmt.indice(terceiro.intelligenceIndex)}). O índice mede capacidade geral; o melhor modelo para uma empresa depende também de custo por token, latência e de onde o dado pode ser processado.`],
  liderCodigo && ['Qual é o melhor LLM para programação?',
    `Pelo Coding Index da Artificial Analysis, o ${liderCodigo.name}, da ${liderCodigo.creator}, tem a maior pontuação em código: ${fmt.indice(liderCodigo.codingIndex)}. O índice combina avaliações de geração e edição de código; para uso em assistente de programação, vale olhar também a latência, porque modelos de raciocínio longo podem demorar dezenas de segundos para começar a responder.`],
  maisBarato && ['Qual é o LLM mais barato com boa qualidade?',
    `Entre os 50 modelos com maior índice de inteligência, o mais barato é o ${maisBarato.name}, da ${maisBarato.creator}: ${fmt.preco(maisBarato.blendedPricePer1m)} por milhão de tokens, com índice ${fmt.indice(maisBarato.intelligenceIndex)}.${custoBeneficio ? ` Na relação entre inteligência e preço, o destaque é o ${custoBeneficio.name}, com ${n2.format(custoBeneficio.intelligenceIndex / custoBeneficio.blendedPricePer1m)} pontos por dólar entre os modelos com pelo menos 75% do índice do líder.` : ''} O preço é uma estimativa combinada que supõe 1 token de entrada para cada 3 de saída.`],
  maisRapido && ['Qual é o modelo de IA mais rápido?',
    `Entre os 50 modelos mais inteligentes, o ${maisRapido.name}, da ${maisRapido.creator}, é o mais rápido, com mediana de ${fmt.vel(maisRapido.outputTokensPerSecond)} de saída. Velocidade de geração e latência são coisas diferentes: um modelo pode gerar rápido e ainda assim demorar para emitir o primeiro token, se raciocina antes de responder.`],
  ['De onde vêm os dados e com que frequência o ranking é atualizado?',
    `Os dados são do Artificial Analysis, que testa os modelos de forma independente e publica o Intelligence Index, os índices de código e agêntico e as medições de velocidade, latência e preço. O ranking é o mesmo publicado pelo Automations Cookbook, atualizado toda semana; ao abrir a página, a tabela ainda busca a versão mais recente disponível. Esta atualização cobre ${modelos.length} modelos de ${nCriadores} empresas.`],
  ['Como escolher um LLM para uso corporativo?',
    'Comece pelo caso de uso, não pelo topo do ranking. Defina qual qualidade é suficiente, quanto a operação pode pagar por milhão de tokens e qual latência o usuário tolera. Depois vêm as perguntas que o benchmark não responde: onde o dado é processado, o que o contrato do fornecedor diz sobre retenção e treino, e se a arquitetura permite trocar de modelo sem reescrever a aplicação — que é o papel de um AI Gateway.'],
].filter(Boolean);

/* ---------------------------------------------------------------------------- */
/* 7. página                                                                     */
/* ---------------------------------------------------------------------------- */

const titulo = 'LLM Leaderboard 2026: ranking dos modelos de IA | Tyna';
const descricao = `Ranking de ${modelos.length} modelos de IA da OpenAI, Anthropic, Google, DeepSeek e outras por inteligência, código, velocidade, latência e preço. Atualizado toda semana.`;
const whats = 'https://wa.me/5511997228945?text=Ol%C3%A1%2C%20Felipe.%20Vim%20pelo%20LLM%20Leaderboard%20e%20quero%20falar%20sobre%20IA%20na%20minha%20empresa.';

const jsonld = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `LLM Leaderboard — ranking de ${modelos.length} modelos de IA`,
    description: `Ranking de ${modelos.length} modelos de linguagem de ${nCriadores} empresas, com Artificial Analysis Intelligence Index v${meta.intelligenceIndexVersion}, índices de código e agêntico, velocidade de saída, latência até o primeiro token, tempo de resposta completa e preço estimado por milhão de tokens.`,
    url: PAGE_URL,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    dateModified: meta.fetchedAt,
    keywords: ['LLM leaderboard', 'ranking de LLM', 'melhores modelos de IA', 'comparativo de modelos de IA', 'benchmark de LLM', 'preço de LLM'],
    creator: { '@type': 'Organization', name: 'Artificial Analysis', url: 'https://artificialanalysis.ai/' },
    publisher: { '@type': 'Organization', name: 'Tyna', url: `${SITE}/` },
    isBasedOn: [AA_URL, AC_PAGE],
    variableMeasured: METRICAS.map(m => ({ '@type': 'PropertyValue', name: m.rotulo })),
    distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${PAGE_URL}modelos.json` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Os 20 modelos de IA com maior índice de inteligência',
    numberOfItems: 20,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: porInteligencia.slice(0, 20).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: `${x.name} (${x.creator})`, url: linkAA(x) })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'LLM Leaderboard', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'pt-BR',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DQS0KMDT3G"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-DQS0KMDT3G');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- gerado por tools/build-leaderboard.mjs — edite o gerador, não este arquivo -->
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${PAGE_URL}">
<meta property="og:type" content="website">
<meta property="og:title" content="LLM Leaderboard: ranking de ${modelos.length} modelos de IA">
<meta property="og:description" content="Quem lidera hoje: ${esc(lider.name)} (${esc(lider.creator)}). Compare ${modelos.length} modelos por inteligência, código, velocidade, latência e preço.">
<meta property="og:url" content="${PAGE_URL}">
<meta property="og:image" content="${SITE}/assets/logo-tyna-dark.png">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%230D1117%22/><path d=%22M28 32h44M50 32v40%22 stroke=%22%23C9A968%22 stroke-width=%226%22 stroke-linecap=%22round%22/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://automationscookbook.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/styles.css?v=${ASSET_V}">
${jsonld.map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join('\n')}
<link rel="alternate" type="application/ld+json" href="/ai.json" title="Grafo de conhecimento da Tyna">
</head>
<body>

<header>
  <div class="wrap nav">
    <a href="../" class="logo"><img src="../assets/logo-tyna-dark.png" alt="Tyna" width="1222" height="394"> <span>IA &amp; GOVERNANÇA</span></a>
    <nav>
      <ul id="navList">
        <li><a href="../#servicos">Serviços</a></li>
        <li><a href="../#guias">Guias</a></li>
        <li><a href="../ai-gateway/comparativo/">AI Gateway</a></li>
        <li><a href="../iso-42001/">ISO 42001</a></li>
        <li><a href="../#cases">Cases</a></li>
        <li><a href="../blog/">Blog</a></li>
        <li><a href="../sobre/">Sobre</a></li>
        <li><a href="${whats}" target="_blank" rel="noopener" class="btn btn-primary mobile-cta">Agendar conversa</a></li>
      </ul>
    </nav>
    <a href="${whats}" target="_blank" rel="noopener" class="btn btn-primary" id="navCta">Agendar conversa</a>
    <button class="nav-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false">☰</button>
  </div>
</header>

<main id="top">

  <!-- HERO -->
  <section class="hero" style="border-bottom:none; padding-bottom:36px;">
    <div class="wrap">
      <p class="eyebrow">LLM Leaderboard</p>
      <h1 style="max-width:900px;">LLM Leaderboard: o ranking dos modelos de IA</h1>
      <p class="lead" style="max-width:780px;">${modelos.length} modelos de linguagem de ${nCriadores} empresas — OpenAI, Anthropic, Google, DeepSeek, Alibaba, Mistral e outras — comparados por inteligência, programação, capacidade agêntica, velocidade, latência e preço por milhão de tokens. Os dados são do Artificial Analysis Intelligence Index e o ranking é atualizado toda semana.</p>
      <div class="status-card">
        <span class="status-badge">Atualizado em <time id="lbAtualizado" datetime="${esc(meta.fetchedAt)}">${atualizadoEm}</time></span>
        <p class="status-line">Líder atual: <strong>${esc(lider.name)}</strong>, da ${esc(lider.creator)}, com índice de inteligência ${fmt.indice(lider.intelligenceIndex)}.</p>
        <p class="status-meta">Artificial Analysis Intelligence Index v${versao} · dados por <a href="${AA_URL}" target="_blank" rel="noopener">Artificial Analysis</a> · espelho do <a href="${AC_PAGE}" target="_blank" rel="noopener">LLM Leaderboard do Automations Cookbook</a></p>
      </div>
      <div class="hero-ctas">
        <a href="#ranking" class="btn btn-primary">Ver o ranking completo</a>
        <a href="#como-escolher" class="btn btn-ghost">Como escolher um LLM</a>
      </div>
    </div>
  </section>

  <!-- DESTAQUES -->
  <section id="destaques" style="padding-top:40px;">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Destaques desta atualização</p>
        <h2>Quem lidera em cada critério</h2>
        <p>Nenhum modelo vence em tudo. O mais inteligente raramente é o mais rápido, e o mais barato quase nunca está no topo — os seis destaques abaixo são recalculados a cada atualização do ranking.</p>
      </div>
      <div class="svc-grid">
${destaques}
      </div>
    </div>
  </section>

  <!-- RANKING -->
  <section id="ranking">
    <div class="wrap">
      <div class="section-head" style="max-width:780px;">
        <p class="eyebrow">O ranking</p>
        <h2>Ranking de ${modelos.length} modelos de IA</h2>
        <p>Ordenado por índice de inteligência. Clique no cabeçalho de uma coluna para reordenar, busque por modelo ou empresa, ou filtre por fabricante. A barra de cada célula mostra a posição do modelo naquela métrica entre todos os que têm o dado.</p>
      </div>

      <div class="lb-controles" id="lbControles" hidden>
        <div class="lb-barra-busca">
          <label class="lb-busca">
            <span class="sr-only">Buscar modelo ou empresa</span>
            <input type="search" id="lbBusca" placeholder="Buscar modelo ou empresa…" autocomplete="off" spellcheck="false">
          </label>
          <p class="lb-contagem" id="lbContagem" role="status">Top ${LINHAS_SSR} de ${modelos.length} modelos</p>
        </div>
        <div class="lb-chips" id="lbChips" role="group" aria-label="Filtrar por empresa">
          ${chips}
        </div>
      </div>

      <div class="lb-scroll">
        <table class="lb-table" id="lbTabela">
          <caption class="sr-only">Ranking de modelos de IA por índice de inteligência, código, capacidade agêntica, velocidade, latência, tempo de resposta e preço, atualizado em ${atualizadoEm}.</caption>
          <thead>
            <tr>
                <th scope="col" class="lb-pos">#</th>
                <th scope="col" class="lb-modelo">Modelo</th>
                ${cabecalhoMetricas}
                <th scope="col" class="lb-data">Lançamento</th>
            </tr>
          </thead>
          <tbody id="lbCorpo">
${tbody}
          </tbody>
        </table>
      </div>
      <p class="cmp-nada" id="lbVazio" hidden>Nenhum modelo com essa combinação de busca e empresa.</p>
      <div class="lb-pe">
        <button type="button" class="btn btn-ghost" id="lbMais" hidden>Mostrar todos os ${modelos.length} modelos</button>
        <p class="cmp-legenda">Preço combinado estimado com 1 token de entrada para cada 3 de saída, em dólares por milhão de tokens. Latência é a mediana de tempo até o primeiro token; em modelos de raciocínio, inclui o tempo pensando antes de responder. Dados por <a href="${AA_URL}" target="_blank" rel="noopener">Artificial Analysis</a>.</p>
      </div>
    </div>
  </section>

  <!-- POR EMPRESA -->
  <section id="por-empresa">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Por fabricante</p>
        <h2>O melhor modelo de cada empresa</h2>
        <p>O modelo com maior índice de inteligência de cada uma das ${criadoresTop.length} empresas com mais modelos no ranking.</p>
      </div>
      <div class="lb-scroll">
        <table class="lb-table lb-mini">
          <thead>
            <tr><th scope="col">Empresa</th><th scope="col">Melhor modelo</th><th scope="col" class="lb-num">Inteligência</th><th scope="col" class="lb-num">Preço/1M</th><th scope="col" class="lb-num">Modelos no ranking</th></tr>
          </thead>
          <tbody>
${tabelaCriadores}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- COMO LER -->
  <section id="como-ler">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Metodologia</p>
        <h2>Como ler cada coluna</h2>
        <p>Todas as medições são do Artificial Analysis, que roda as mesmas avaliações em todos os modelos em vez de repetir o número divulgado por cada fabricante.</p>
      </div>
      <table class="spec-table">
        <thead><tr><th scope="col">Coluna</th><th scope="col">O que mede</th></tr></thead>
        <tbody>
          <tr><td>Inteligência</td><td>Artificial Analysis Intelligence Index v${versao}: nota composta de avaliações de raciocínio, conhecimento, matemática e código. É a coluna que ordena o ranking.</td></tr>
          <tr><td>Coding</td><td>Coding Index: desempenho em geração e edição de código. Só existe para os modelos em que a avaliação foi rodada.</td></tr>
          <tr><td>Agentic</td><td>Agentic Index: capacidade de usar ferramentas e completar tarefas de várias etapas — o critério que mais importa para agentes em produção.</td></tr>
          <tr><td>Velocidade</td><td>Mediana de tokens de saída por segundo, medida na API do fornecedor.</td></tr>
          <tr><td>Latência</td><td>Mediana de segundos até o primeiro token. Em modelos que raciocinam antes de responder, inclui esse tempo de raciocínio.</td></tr>
          <tr><td>E2E</td><td>Resposta completa, de ponta a ponta: mediana de segundos da requisição até o fim da resposta — o tempo que o usuário de fato espera.</td></tr>
          <tr><td>Preço/1M</td><td>Preço por milhão de tokens: estimativa combinada em dólares, supondo 1 token de entrada para cada 3 de saída. O custo real depende do perfil de uso de cada aplicação.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- COMO ESCOLHER -->
  <section id="como-escolher">
    <div class="wrap problem-grid">
      <div>
        <p class="eyebrow">Do ranking à decisão</p>
        <h2>O ranking não escolhe o modelo da sua empresa</h2>
        <p style="color:var(--text-muted); font-size:16px;">O topo da tabela diz qual modelo é mais capaz em avaliação padronizada. A decisão de adoção depende de quatro perguntas que nenhum benchmark responde.</p>
      </div>
      <div class="risk-list">
        <div class="risk-item">
          <span class="num">01</span>
          <div><h4>Qual qualidade é suficiente?</h4><p>Classificar ticket, resumir reunião e redigir contrato pedem níveis diferentes de modelo. Pagar pelo líder do ranking em tarefa que o 40º resolve é o erro de custo mais comum em IA corporativa.</p></div>
        </div>
        <div class="risk-item">
          <span class="num">02</span>
          <div><h4>Quanto a operação aguenta por token?</h4><p>O preço por milhão parece pequeno até multiplicar por volume. A conta certa é custo por caso de uso por mês — e ela só existe quando o consumo passa por um ponto único de medição, como um <a href="../ai-gateway/">AI Gateway</a>.</p></div>
        </div>
        <div class="risk-item">
          <span class="num">03</span>
          <div><h4>Onde o dado pode ser processado?</h4><p>Dado pessoal enviado a um modelo é tratamento sob a LGPD, com contrato de operador e transferência internacional a avaliar. O modelo mais inteligente pode ser o que o jurídico não aprova. Ver <a href="../lgpd-e-ia/">LGPD em fluxos de IA</a>.</p></div>
        </div>
        <div class="risk-item">
          <span class="num">04</span>
          <div><h4>Dá para trocar de modelo sem reescrever?</h4><p>O líder muda a cada poucas semanas — este ranking é a prova. Arquitetura presa a um fornecedor transforma cada lançamento em projeto. Compare as opções no <a href="../ai-gateway/comparativo/">comparativo de 124 AI Gateways</a>.</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Perguntas frequentes</p>
        <h2>LLM Leaderboard, em resposta direta</h2>
      </div>
      <div class="faq">
${faq.map(([q, a]) => `        <div class="faq-item">\n          <h3>${esc(q)}</h3>\n          <p>${esc(a)}</p>\n        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- FONTE -->
  <section id="fonte">
    <div class="wrap">
      <div class="section-head" style="max-width:780px;">
        <p class="eyebrow">Fonte e atualização</p>
        <h2>De onde vêm estes números</h2>
      </div>
      <div style="max-width:780px;">
        <p style="color:var(--text-muted); margin-bottom:18px;">As medições são do <a href="${AA_URL}" target="_blank" rel="noopener">Artificial Analysis</a>, que avalia os modelos de forma independente e publica os índices e as medições de desempenho e preço. Esta página espelha o <a href="${AC_PAGE}" target="_blank" rel="noopener">LLM Leaderboard do Automations Cookbook</a>, em inglês, atualizado por rotina semanal.</p>
        <p style="color:var(--text-muted); margin-bottom:18px;"><strong>Duas camadas de atualização.</strong> A versão publicada foi gerada em ${atualizadoEm}. Ao abrir a página, a tabela busca a versão mais recente disponível e se atualiza sozinha; se a fonte estiver fora do ar, fica a versão publicada.</p>
        <p style="color:var(--text-muted);"><strong>Os dados em JSON</strong> estão em <a href="modelos.json">/llm-leaderboard/modelos.json</a>, com os mesmos campos da tabela.</p>
      </div>
    </div>
  </section>

  <!-- CTA final -->
  <section class="cta-band" style="border-bottom:none;">
    <div class="wrap">
      <p class="eyebrow">Próximo passo</p>
      <h2>Escolher o modelo é a parte fácil</h2>
      <p style="color:var(--text-muted); font-size:16.5px; max-width:600px; margin:0 auto 30px;">O difícil é saber quais modelos a empresa já usa, quanto custam e que dado passa por eles. O diagnóstico de maturidade responde em dez perguntas e três minutos, sem cadastro.</p>
      <div class="hero-ctas" style="justify-content:center;">
        <a href="../diagnostico/" class="btn btn-primary">Fazer o diagnóstico</a>
        <a href="${whats}" target="_blank" rel="noopener" class="btn btn-ghost">Falar com o Felipe</a>
      </div>
    </div>
  </section>

</main>

<footer id="contato">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-left">
        <a href="../" class="logo"><img src="../assets/logo-tyna.png" alt="Tyna" width="1222" height="394"> <span>IA &amp; GOVERNANÇA</span></a>
        <p>Consultoria em Inteligência Artificial aplicada ao negócio, com governança do prompt ao agente em produção.</p>
      </div>
      <div class="foot-right">
        <div class="foot-col">
          <h5>Contato</h5>
          <!--email_off--><a href="mailto:contato@tyna.com.br">E-mail</a><!--/email_off-->
          <a href="https://linkedin.com/in/felipelj" target="_blank" rel="noopener">LinkedIn</a>
        </div>
        <div class="foot-col">
          <h5>Guias</h5>
          <a href="../governanca-de-ia/">Governança de IA</a>
          <a href="../iso-42001/">ISO 42001</a>
          <a href="../shadow-ai/">Shadow AI</a>
          <a href="../ai-gateway/">AI Gateway</a>
          <a href="../ai-gateway/comparativo/">Comparativo de gateways</a>
          <a href="./">LLM Leaderboard</a>
          <a href="../governanca-de-agentes/">Governança de agentes</a>
          <a href="../politica-de-uso-de-ia/">Política de uso de IA</a>
          <a href="../lgpd-e-ia/">LGPD e IA</a>
          <a href="../pl-2338/">Marco Legal da IA</a>
        </div>
        <div class="foot-col">
          <h5>Site</h5>
          <a href="../#servicos">Serviços</a>
          <a href="../#trilhas">Trilhas</a>
          <a href="../diagnostico/">Diagnóstico</a>
          <a href="../blog/">Blog</a>
          <a href="../sobre/">Sobre</a>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 Tyna. Todos os direitos reservados.</span>
      <span>tyna.com.br</span>
    </div>
  </div>
</footer>

<script type="application/json" id="lbConfig">${JSON.stringify({ api: API, reserva: 'modelos.json', geradoEm: meta.fetchedAt, linhas: LINHAS_SSR }).replace(/</g, '\\u003c')}</script>
<!-- O botão flutuante do WhatsApp é montado por assets/site.js, que roda em todas as páginas -->
<script src="../assets/site.js?v=${ASSET_V}"></script>
<script src="../assets/leaderboard.js?v=${ASSET_V}"></script>

</body>
</html>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'index.html'), html);

// reserva do navegador: só os campos que a tabela usa, no mesmo formato da API
const CAMPOS = ['slug', 'name', 'creator', 'releaseDate', ...METRICAS.map(m => m.campo)];
const reserva = {
  ok: true,
  meta: { fetchedAt: meta.fetchedAt, modelCount: modelos.length, intelligenceIndexVersion: meta.intelligenceIndexVersion, attribution: meta.attribution, blendedPriceNote: meta.blendedPriceNote },
  models: porInteligencia.map(x => Object.fromEntries(CAMPOS.map(c => [c, x[c] ?? null]))),
};
writeFileSync(join(OUT_DIR, 'modelos.json'), JSON.stringify(reserva));

/* ---------------------------------------------------------------------------- */
/* 8. llms.txt — o trecho do leaderboard acompanha o dado                        */
/* ---------------------------------------------------------------------------- */

const INI = '<!-- LLM-LEADERBOARD:BEGIN -->';
const FIM = '<!-- LLM-LEADERBOARD:END -->';
if (existsSync(LLMS_TXT)) {
  const txt = readFileSync(LLMS_TXT, 'utf8');
  const i = txt.indexOf(INI), f = txt.indexOf(FIM);
  if (i !== -1 && f > i) {
    const bloco = `${INI}
**Qual é o melhor modelo de IA hoje? (ranking de ${atualizadoEm})**
${faq[0][1]}
${liderCodigo ? `Melhor em código: ${liderCodigo.name} (${fmt.indice(liderCodigo.codingIndex)}). ` : ''}${maisBarato ? `Mais barato entre os 50 mais inteligentes: ${maisBarato.name} (${fmt.preco(maisBarato.blendedPricePer1m)} por milhão de tokens). ` : ''}${maisRapido ? `Mais rápido entre os 50 mais inteligentes: ${maisRapido.name} (${fmt.vel(maisRapido.outputTokensPerSecond)}).` : ''}
Ranking completo de ${modelos.length} modelos, atualizado toda semana: ${PAGE_URL}
${FIM}`;
    writeFileSync(LLMS_TXT, txt.slice(0, i) + bloco + txt.slice(f + FIM.length));
  }
}

console.log(`✓ llm-leaderboard/ gerado: ${modelos.length} modelos, ${LINHAS_SSR} no HTML, líder ${lider.name} (${lider.intelligenceIndex})`);
