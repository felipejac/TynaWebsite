# Operação de SEO e indexação — tyna.com.br

Como o site se mantém indexável sem depender de alguém lembrar de conferir.

Última auditoria completa: 16/08/2026.

---

## 1. O diagnóstico que originou isto

O GA4 mostrava **zero tráfego orgânico**. Havia duas explicações possíveis e muito
diferentes: o site não estar indexado, ou estar indexado e não ranquear. Testei as
duas.

| Verificação | Resultado |
| --- | --- |
| `robots.txt` em produção | liberação total, sem `Disallow` |
| Googlebot busca a home | HTTP 200, 45 KB |
| Bingbot busca a home | HTTP 200, 45 KB |
| Cabeçalho `X-Robots-Tag` | ausente |
| `noindex` em alguma página | nenhum |
| Canonical | presente e autorreferente em todas as 61 |
| Páginas órfãs | nenhuma |
| Título ou descrição duplicados | nenhum |
| Páginas fora do sitemap | nenhuma |
| URLs do sitemap que não respondem 200 | nenhuma |

**Conclusão: não há impedimento técnico.** O site é rastreável e indexável. O zero de
orgânico não vem de bloqueio — vem de o site ser novo, não ter nenhum backlink e não
ter tempo de rastreio acumulado. Isso importa porque muda o que resolve: nenhuma
mudança de código produz backlink.

### Confirmado no Search Console em 16/08/2026

O relatório agregado de **Páginas** ainda mostra "dados em processamento" — a
propriedade foi verificada em 12/08 e o Google leva alguns dias para consolidar. Mas a
**Inspeção de URL** responde na hora, e ela confirmou o diagnóstico acima.

| Item | Estado |
| --- | --- |
| Sitemap `/sitemap.xml` | enviado em 12/08, **status Processado**, última leitura **16/08**, **61 páginas encontradas** |
| Cliques na Pesquisa (11 a 15/08) | 0 |

Inspeção por URL, amostra de cinco páginas:

| Página | Estado no Google |
| --- | --- |
| `/` | **indexada** |
| `/sobre/` | **indexada** |
| `/diagnostico/` | **indexada** |
| `/blog/governanca-madura-reverte-mais-agente-de-ia/` | **indexada** — publicada no mesmo dia |
| `/iso-42001/` | não indexada: *detectada, mas não rastreada*. Último rastreamento: N/D |

**Quatro de cinco indexadas, incluindo uma publicada horas antes.** O Google está
rastreando o site ativamente — o número de páginas encontradas no sitemap bate
exatamente com as 61 da auditoria.

A ISO 42001 era a exceção: descoberta pelo sitemap, nunca buscada. Não é erro, é fila
de rastreio de site novo. Foi enviada pelo **Solicitar indexação**, que a coloca em
fila prioritária.

Isso fecha a pergunta que estava aberta desde a primeira leitura do GA4: **o conteúdo
está sendo indexado.** O zero de orgânico é falta de posição e de demanda, não falta
de índice — e é por isso que a saída de prazo curto está no plano de distribuição, e
não aqui.

O que o código pode garantir é que **nada quebre a indexação sem alguém perceber** —
e é isso que a auditoria faz.

---

## 2. A auditoria

```bash
npm run seo          # audita a produção (61 páginas, ~1 min)
npm run seo:local    # audita os arquivos em disco, antes de publicar
npm run seo:gsc      # inclui dados reais do Search Console
node tools/seo-audit.mjs --json   # saída para outro programa consumir
```

### O que ela verifica, e por que cada item importa

**Nível ERRO — impede ou degrada a indexação. Barra o deploy.**

| Verificação | Por que é erro |
| --- | --- |
| URL do sitemap não responde 200 | sitemap listando URL morta queima confiança de rastreio |
| Página em disco fora do sitemap | depende de ser descoberta por link; em site novo, quase nunca é |
| `noindex` em meta ou em `X-Robots-Tag` | pedido explícito de exclusão do índice |
| Sem canonical, ou canonical relativo | sem ele, parâmetro de URL vira página duplicada |
| Canonical apontando para outra URL | consolida o sinal na página errada |
| Sem `<title>` ou sem meta description | o SERP inventa um, e o inventado converte pior |
| Sem `<h1>` | some o sinal mais forte de assunto da página |
| JSON-LD que não faz parse | dado estruturado inválido é dado estruturado ignorado |
| Título ou descrição repetidos entre páginas | o Google escolhe uma e descarta as outras |
| Página órfã | link interno é voto de importância; sem nenhum, fica no fim da fila |
| `Disallow: /` no robots.txt | tira o site inteiro do índice |
| Googlebot ou Bingbot recebendo status diferente de 200 | a borda está barrando o crawler |

**Nível AVISO — custa posição, não tira do índice. Não barra o deploy.**

Título longo demais, meta description fora da faixa de 110 a 160, conteúdo com menos
de 250 palavras, imagem sem `alt`, ausência de Open Graph, `html` sem `lang`.

A separação é deliberada: um portão que reprova por meia dúzia de caracteres de meta
description vira um portão que alguém desliga na primeira urgência.

### Duas calibragens que valem explicar

**O sufixo de marca não conta no comprimento do título.** O Google corta o título por
largura em pixel, e ` | Tyna` é justamente a parte que ele corta primeiro — sem
prejuízo, porque quem leu já entendeu. Medir com o sufixo dentro reprovaria um título
de 60 caracteres perfeitamente sadio. O desconto vale só no teto: no piso, vale o
título inteiro, senão `LLMs — Blog Tyna` seria acusado de ter quatro caracteres.

**O limite de título é 65, não 60.** 60 é o alvo confortável; o corte só começa a doer
perto de 65. Avisar a cada 61 caracteres produz ruído que ninguém lê.

---

## 3. O portão no deploy

`npm run deploy` roda `seo-audit --local` antes de subir qualquer coisa. Havendo
**ERRO**, o deploy aborta e nada é publicado.

```bash
npm run deploy              # com portão
npm run deploy -- --no-seo  # pula o portão, para emergência
```

O portão foi testado com falha real: uma página criada fora do sitemap faz a auditoria
sair com código 1 e o deploy abortar com mensagem explicando o motivo.

---

## 4. Search Console — como ligar

A auditoria sabe consultar o Search Console e dizer, **por URL**, se o Google indexou
e qual o motivo quando não indexou. É a única fonte que responde isso de verdade.

Hoje a credencial do Google no ambiente tem escopo só de Analytics. Para ligar, uma
vez só:

```bash
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform"
```

O comando abre o navegador e exige clique — por isso não dá para automatizar. Depois
disso:

```bash
npm run seo:gsc
```

Passa a sair, ao fim do relatório, a linha `Search Console: N de 61 indexadas (X%)`, e
cada página não indexada vira ERRO com o motivo que o Google reporta.

**Sobre forçar indexação:** não existe. A Indexing API do Google só aceita
`JobPosting` e `BroadcastEvent` — usá-la para página comum viola os termos e não
funciona. Para Bing e Yandex, o IndexNow já dispara sozinho a cada deploy
(`tools/indexnow.mjs`), o que cobre esse lado.

---

## 5. Avisos aceitos, e por quê

Três avisos permanecem de propósito:

| Página | Aviso | Por que fica |
| --- | --- | --- |
| `/diagnostico/` | 239 palavras | é ferramenta interativa; o conteúdo são as 10 perguntas, que vivem no JavaScript |
| `/blog/categoria/governanca/` | 186 palavras | cresce sozinho conforme entram posts de governança |
| `/blog/categoria/automation/` | 104 palavras | a categoria tem um post só |

Página de categoria já ganhou texto próprio (`CAT_META` em `tools/build-blog.mjs`).
Antes as cinco compartilhavam uma descrição de molde — cinco descrições quase
idênticas, curtas demais, sobre páginas de 47 a 116 palavras. Era conteúdo raso e
quase-duplicado ao mesmo tempo.

---

## 6. O que a auditoria corrigiu nesta rodada

De **35 avisos para 3**, com zero erro em ambos os momentos.

- 5 páginas de categoria: descrição própria de 110 a 160 caracteres, e um parágrafo
  de abertura que deu a cada uma texto para ranquear
- 8 posts com meta description entre 93 e 109 caracteres: reescritas para a faixa,
  acrescentando informação real e não enchimento
- 7 títulos acusados de "sem a marca": era erro do meu check, que exigia o sufixo
  exato em vez de a presença da marca

---

## 7. O que nenhum script resolve

Vale estar escrito, para não voltar como expectativa.

**Backlink.** É o principal sinal de autoridade e não se produz por código. O site tem
zero. Enquanto tiver, o teto de posição é baixo por mais correto que o HTML esteja.

**Idade de domínio e histórico de rastreio.** O Google visita mais o que já provou que
muda. Site novo entra numa fila lenta.

**Demanda pelo termo.** Página perfeita sobre assunto que ninguém busca não traz
visita. A escolha de assunto está na seção 8 do `plano-de-crescimento.md`.

O caminho de tráfego em prazo curto é distribuição, não busca — e isso está detalhado
no mesmo documento.

---

## 8. Rotina sugerida

| Quando | O quê |
| --- | --- |
| Todo deploy | automático, pelo portão |
| Semanal | `npm run seo` contra a produção |
| Depois de ligar o Search Console | `npm run seo:gsc`, para ver a indexação real |
| Ao criar página nova na raiz | conferir se entrou no `PUBLISH` do `deploy.mjs` e no sitemap |
