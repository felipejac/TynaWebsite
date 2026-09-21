# Automations Cookbook × Tyna — diagnóstico e plano de ação

Levantado em 10/09/2026 a partir de: GA4 das duas propriedades (API, últimos 90 dias),
Cloudflare das duas zonas (painel, últimos 30 dias), código dos dois repositórios e
leitura das páginas publicadas.

---

## Resumo em cinco linhas

1. **Os dois sites estão, na prática, sem tráfego humano.** O AC tem cerca de 10
   sessões engajadas por semana fora do seu próprio acesso; a Tyna, cerca de 3.
2. **98,8% das sessões do AC no GA4 são um robô de Singapura** — ele inflou a
   propriedade desde meados de julho e torna qualquer métrica do AC inútil até ser
   filtrado.
3. **O link entre os dois é de mão única e está invertido.** A Tyna manda 49 links
   para o AC; o AC manda zero para a Tyna. O site maior está recebendo autoridade do
   menor, e não o contrário.
4. **O hreflang dos 49 posts traduzidos não vale nada hoje**, porque o AC não devolve
   a marcação. Google ignora par não recíproco.
5. **Link cruzado sozinho não gera tráfego entre dois sites sem tráfego.** O que
   gera é um ativo conjunto com demanda própria — e esse ativo já existe: o
   comparativo de 124 AI Gateways, publicado em português, sem versão em inglês.

A parceria vira vitória se for tratada como **rede de autoridade com um carro-chefe**,
não como troca de visitas.

---

## 1. Os números, sem o ruído

### Automations Cookbook — GA4, 90 dias

| | Sessões | Engajadas | Leitura |
| --- | ---: | ---: | --- |
| Total | 23.158 | 154 | — |
| Singapura | 21.504 | 16 | robô (ver abaixo) |
| Brasil | 153 | 77 | 132 de São Paulo, direto, 28 usuários — é o seu próprio acesso (inclui `/admin`) |
| Resto do mundo | ~1.500 | ~60 | EUA concentrado em Ashburn e Boardman, que são data centers da AWS |
| **Orgânico (todos os buscadores)** | **268** | **10** | Google 151, Bing 57, DuckDuckGo 28 |

**O robô de Singapura, identificado:** 12.209 sessões de Chrome/Windows em tela
1280×1200 e 8.893 de Chrome/Linux em 1512×982, com 3,3 segundos de sessão média e
praticamente zero engajamento. Duas "máquinas" com resolução fixa repetindo
visitas é assinatura de navegador headless em frota. Começou na semana de 6–12/07 e
teve pico de 7.448 sessões na semana de 27/07–02/08. Como ele executa JavaScript,
dispara o GA4 — por isso aparece como "Direct".

**O que o orgânico do AC realmente traz:** páginas `/vs/` (grok-vs-clickup,
mistral-vs-basecamp, grok-vs-obsidian) e posts de blog pelo Bing. Engajamento
próximo de zero em todas — o visitante chega pela comparação e sai.

### Tyna — GA4, 90 dias

| | Sessões | Engajadas |
| --- | ---: | ---: |
| Total | 172 | 32 |
| Votorantim (seu acesso) | 44 | **26** |
| Data centers dos EUA (Ashburn, Boardman, "not set") | ~65 | 2 |
| Orgânico | **3** | 0 |
| Referência do AC | **0** | 0 |

**81% do engajamento da Tyna é interno.** Os eventos de conversão do período
(`diagnostico_concluido` 4, `cta_email_clique` 7, `cta_whatsapp_clique` 2) vêm de 1 a
4 usuários — é provável que a maioria seja teste. **Linha de base honesta: zero
lead externo medido.**

### Cloudflare — 30 dias

| | AC | Tyna |
| --- | ---: | ---: |
| Requisições | 1,02 mi | 41,47 mil |
| Visitantes únicos | 82,66 mil | 2,37 mil |
| Em cache | 20% | ~0% |
| Ataques bloqueados | 3.060 | 0 |
| Top países (24h) | EUA, Alemanha, Rússia, Singapura | Japão, Alemanha, EUA, Brasil |

Visitante único no Cloudflare conta todo cliente HTTP, inclusive robô que não roda
JavaScript. A distância entre 82 mil no Cloudflare e ~600 humanos no GA4 é o tamanho
do tráfego automatizado. Os dois sites liberam os crawlers de IA ("Do not block") e
estão com o robots.txt gerenciado desligado — correto para AEO.

> Não consegui abrir as métricas do **AI Crawl Control** — o atalho do painel levou
> à visão geral da zona. Vale olhar à mão: é o dado que diz quanto GPTBot, ClaudeBot e
> PerplexityBot leem de cada site, e é o termômetro de AEO que o GA4 não mede.

---

## 2. O que está quebrado entre os dois

### 2.1 O fluxo de autoridade está invertido

| Direção | Links | Onde |
| --- | ---: | --- |
| Tyna → AC | 49 posts + `/sobre` | "Versão em inglês: Automations Cookbook" em cada tradução, link seguido |
| AC → Tyna | **0** | nem no `/about`, que **cita a Tyna pelo nome sem link** (`src/pages/about.astro:118`) |

O AC tem 6.685 URLs no sitemap e mais tempo de indexação; a Tyna tem Authority Score
2 e 94 domínios de referência de spam (ver [analise-seo-semrush.md](analise-seo-semrush.md)).
Hoje o site com menos autoridade é quem empresta.

### 2.2 hreflang de um lado só

A Tyna declara, em cada um dos 49 posts traduzidos, `hreflang="en"` e
`hreflang="x-default"` apontando para o original no AC. O AC não declara nada de volta
— não existe `hreflang` em nenhum arquivo de `src/` do repositório. Pela regra do
Google, par sem retorno é descartado.

O [estrategia-seo-aeo.md](estrategia-seo-aeo.md) afirma "hreflang pt-BR ↔ en em ambos
os sentidos, já está no lugar". **Não está** — o documento precisa ser corrigido
junto com o código.

### 2.3 O AC está perdendo tráfego brasileiro para 404

O AC teve uma fase em português, e as URLs antigas continuam recebendo visita — e
respondendo 404:

| URL antiga no AC | Sessões em 90 dias | Intenção |
| --- | ---: | --- |
| `/casos-de-uso` | 29 orgânicas do Google + 20 diretas | casos de uso de automação |
| `/blog/guia-agentes-ia-n8n` | 1 | agente de IA com n8n — **a Tyna tem esse post em português** |
| `/integracoes-zapier/typeform-para-rd-station-zapier.html` | 1 | integração com RD Station (ferramenta brasileira) |
| `/guia-workflows-crm-whatsapp` | 1 | CRM + WhatsApp |
| `/integracoes/*` (3 URLs) | 3 | integrações n8n |

Volume pequeno, mas é o único tráfego de busca **brasileiro** que o AC tem, e está
indo para uma página de erro.

### 2.4 A Tyna publica em volume o que o cliente dela não procura

49 dos 52 posts da Tyna são traduções de notícia do AC — `llm` (20), `ai-agents`
(16), `dev-tools` (12). **Nenhum é de governança.** Os 3 posts originais são todos
de governança. O blog que deveria construir autoridade no tema que a Tyna vende está
construindo autoridade no tema que o AC vende.

As traduções não são erro — têm a seção "A leitura da Tyna" e hreflang (quando
consertado). O erro seria continuar com essa proporção.

---

## 3. A tese: um ativo com demanda própria, não troca de links

Faça a conta antes de montar a ponte. O AC tem ~10 humanos engajados por semana. Um
link contextual bem colocado converte algo entre 1% e 3% dos leitores em clique. Isso
dá **uma visita por semana** da ponte AC → Tyna. Link cruzado entre dois sites sem
tráfego redistribui zero.

O que muda a conta é um ativo que atrai tráfego de fora e passa adiante:

**O comparativo de 124 AI Gateways, em inglês, no AC.**

- **Encaixa no formato que o AC já tem:** `/llm-leaderboard/`, `/ai-tools/` e 1.314
  páginas `/vs/`. Diretório comparativo é o gênero do site.
- **Tem demanda global:** "AI gateway comparison", "LLM gateway", "LiteLLM vs
  Portkey" são buscas em inglês de quem está escolhendo ferramenta — o público
  exato do AC, e um volume que o português não tem.
- **A atribuição vira link por obrigação:** o Dataset da Tyna está publicado sob
  CC BY 4.0. Republicar exige atribuir o criador — o link para a Tyna deixa de ser
  favor e passa a ser cláusula de licença.
- **Inverte o hreflang:** pela primeira vez a Tyna é o original e o AC a tradução.
  Par recíproco, cada um com canonical próprio.
- **As páginas `/vs/` que já ranqueiam viram alimentadoras:** `/vs/chatgpt-vs-openrouter`
  e similares ganham um bloco "compare os 124 gateways" apontando para a nova
  página, que aponta para a Tyna.

O resto do plano conserta o encanamento para que esse ativo, quando trouxer
tráfego, seja medido e passe autoridade.

---

## 4. Plano de ação

Cada item diz em qual repositório a mudança acontece.

### Semana 1 — tornar mensurável (sem isso, nada do resto se prova)

| # | Ação | Onde | Esforço |
| --- | --- | --- | --- |
| 1 | **Filtrar tráfego interno** nas duas propriedades: GA4 → Admin → Fluxo de dados → Configurar tag → Definir tráfego interno (seu IP) → Filtros de dados → ativar "Internal Traffic". Comece em modo teste por 48h. | GA4 | 15 min |
| 2 | **Conter o robô de Singapura no AC** com regra WAF direcionada: Security → Events, filtre país SG, pegue o ASN e o user-agent da frota, crie regra `ip.geoip.country eq "SG" and ip.geoip.asnum eq <ASN>` → Managed Challenge. **Não use Bot Fight Mode:** ele desafia requisição automatizada em geral e pode quebrar `/api/webhooks/` e `/api/checkout` do AC. **Não bloqueie Singapura inteira.** | Cloudflare (AC) | 30 min |
| 3 | **Comparação salva "sem SG, sem interno"** no GA4 do AC para ler o histórico — filtro de dados não é retroativo. | GA4 | 10 min |

### Semanas 1–2 — consertar o que está quebrado

| # | Ação | Onde | Esforço |
| --- | --- | --- | --- |
| 4 | **Link no `/about` do AC:** "specialized AI agents such as Tyna" → `<a href="https://tyna.com.br/">Tyna</a>`. Primeiro link AC → Tyna, na página de autoria, âncora de marca. | AC | 5 min |
| 5 | **hreflang recíproco nos 49 posts.** Fonte da verdade continua sendo o frontmatter `originalUrl` da Tyna: um script na Tyna gera `traducoes-pt.json` (`{ "slug-do-ac": "https://tyna.com.br/blog/slug-pt/" }`), o AC lê o mapa e, na página do post, emite no `<slot name="head">` que o `BlogLayout` já expõe: `hreflang="en"` (a própria), `hreflang="pt-BR"` (a Tyna) e `hreflang="x-default"` (a própria). Não edita 49 markdowns do AC, e post novo traduzido entra sozinho. | Tyna + AC | 1–2 h |
| 6 | **Corrigir o [estrategia-seo-aeo.md](estrategia-seo-aeo.md)**, que afirma a reciprocidade como feita. | Tyna | 5 min |
| 7 | **301 das URLs portuguesas mortas do AC.** Para a Tyna só onde existe equivalente em português de verdade: `/blog/guia-agentes-ia-n8n` → `tyna.com.br/blog/seu-primeiro-agente-de-ia-em-producao-com-n8n/`. As de automação e integração (`/casos-de-uso*`, `/integracoes*`, `/guia-workflows-crm-whatsapp`) ficam no AC, apontando para o hub correspondente — são intenção de automação para PME, não o ICP da Tyna. Antes de fechar os destinos, confira no Search Console quais têm backlink. | AC (`public/_redirects`) | 30 min |
| 8 | **Entidade única para os motores de IA:** o `Person` Felipe Jacob no JSON-LD dos dois sites com o mesmo `sameAs` (LinkedIn, GitHub, os dois domínios); o `Organization` do AC com `founder` apontando para a pessoa que também fundou a Tyna; o `llms.txt` do AC ganha uma linha: governança de IA para empresas brasileiras → tyna.com.br. É isso que faz o ChatGPT e o Perplexity tratarem os dois como a mesma autoria confiável. | Tyna + AC | 1 h |

### Semanas 2–4 — o carro-chefe

| # | Ação | Onde | Esforço |
| --- | --- | --- | --- |
| 9 | **Comparativo de AI Gateways em inglês no AC** — sugestão de URL `/ai-tools/ai-gateways/`. Mesmo CSV (`tools/dados/ai-gateways-set-2026.json` da Tyna é a fonte), mesma lógica de tabela renderizada no servidor com filtro em JS, textos reescritos para o público global (sem LGPD como eixo; com EU AI Act e SOC 2). Atribuição visível: "Research by Tyna — AI governance, São Paulo", com link. hreflang pt-BR ↔ en recíproco com `tyna.com.br/ai-gateway/comparativo/`. | AC (+ gerador da Tyna) | 1 dia |
| 10 | **Alimentadores do carro-chefe no AC:** bloco "Compare 124 AI gateways" nas páginas `/vs/` que envolvem gateway ou roteador (OpenRouter, LiteLLM, Portkey, Kong...) e nos 3 posts de gateway/roteador ("LLM routers trend...", "OneCLI credential gateway", "Speko OpenRouter for Voice"). | AC | 2–3 h |
| 11 | **Links editoriais AC → pilares da Tyna**, só onde o tema casa: posts de custo (8) → `/ai-gateway/`; de vazamento e segurança (4) → `/shadow-ai/` e o post do dado colado no ChatGPT; agente fora de controle e sandbox (2) → `/governanca-de-agentes/`; hub `/engenharia-de-agentes/fundamentos/evaluation-safety-observability` → `/governanca-de-agentes/`. Um link por página, no corpo, com rótulo explícito de idioma: "(em português, para equipes no Brasil)". | AC | 2 h |
| 12 | **Tyna → AC com propósito:** o comparativo da Tyna aponta para a versão inglesa e para o `/llm-leaderboard/` do AC (os modelos por trás dos gateways). | Tyna | 20 min |

### Mês 2–3 — mudar a proporção do blog da Tyna

| # | Ação | Onde |
| --- | --- | --- |
| 13 | **Traduzir menos, escrever mais.** Tradução do AC só quando a notícia abre porta para um pilar (custo → gateway, vazamento → shadow AI, agente → governança de agentes). Meta: pelo menos 1 original de governança para cada 2 traduções. Os 12 arquivos parados em `content/_traduzir/` passam por esse filtro antes de publicar. | Tyna |
| 14 | **Segunda rodada de ativo conjunto** se o comparativo funcionar: a mesma receita para "AI governance tools" ou "MCP gateways" — pesquisa em português na Tyna, versão inglesa no AC. | Tyna + AC |

---

## 5. O que não fazer

- **Link no rodapé de todas as páginas, nos dois sentidos, com âncora de palavra-chave.**
  Rede de sites do mesmo dono linkando em massa é o padrão que o Google trata como
  esquema de links. Uma menção de marca no rodapé ("A sister project of..."), sim;
  âncora "consultoria de governança de IA" em 6 mil páginas, não.
- **Redirecionar tráfego inglês do AC para a Tyna.** Leitor global que cai numa página
  em português sai em segundos, e o sinal de rejeição volta contra as duas.
- **Contar a ponte AC → Tyna como motor de tráfego.** Pelas contas da seção 3, é uma
  visita por semana. O motor é o comparativo em inglês e o orgânico dos pilares.
- **Bloquear Singapura inteira ou ligar Bot Fight Mode no AC** (item 2).
- **Colocar UTM nos links entre os dois sites.** UTM em link de referência sobrescreve
  a origem da sessão e apaga justamente o dado de referral que se quer medir. O GA4 já
  registra `automationscookbook.com / referral` sozinho.

---

## 6. Como saber se funcionou

Todas as métricas **excluindo tráfego interno e Singapura** (itens 1–3). Metas são
alvo, não previsão — a linha de base é baixa demais para projetar com confiança.

| Métrica | Onde | Hoje (90 dias) | Meta em 90 dias |
| --- | --- | ---: | ---: |
| Sessões engajadas humanas no AC | GA4 AC | ~10/semana | 40/semana |
| Sessões orgânicas na Tyna | GA4 Tyna | 3 | 150 |
| Sessões `automationscookbook.com / referral` na Tyna | GA4 Tyna | 0 | 30 |
| Pares hreflang recíprocos | `curl` + inspeção de URL | 0 de 49 | 50 de 50 (49 + comparativo) |
| Domínios de referência reais da Tyna | Semrush | ~0 (94 spam) | 5, sendo o AC o primeiro |
| Diagnósticos concluídos por usuário externo | GA4 Tyna, evento `diagnostico_concluido` | ~0 | 5 |
| Leitura por crawlers de IA | Cloudflare AI Crawl Control | não medido | registrar a linha de base na semana 1 |

Revisão em quatro semanas: se o comparativo em inglês não tiver indexado e recebido
as primeiras visitas orgânicas até lá, o problema é de distribuição (divulgar nos
repositórios e comunidades das próprias ferramentas mapeadas), não de link interno.
