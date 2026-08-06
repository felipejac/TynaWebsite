# Estratégia de SEO e AEO — tyna.com.br

Documento vivo. Última revisão: 06/08/2026.

O site tem duas frentes de descoberta e elas exigem coisas diferentes:

- **SEO** — ranquear no Google e no Bing. Compete por posição em uma lista.
- **AEO** — ser a fonte citada quando ChatGPT, Perplexity, Gemini ou as AI Overviews respondem. Não compete por posição; compete por ser **extraível**.

O mesmo texto raramente atende bem às duas. O que segue separa o que já está implementado do que depende de decisão sua.

---

## 1. O que já está no ar

### Técnico

| Item | Estado |
|---|---|
| `sitemap.xml` com `lastmod` e pares `hreflang` | gerado a cada build |
| `rss.xml` (30 posts mais recentes) | gerado |
| Canonical próprio em toda página | sim |
| `hreflang` pt-BR ↔ en apontando para o original | sim, quando o post tem `originalUrl` |
| Open Graph + Twitter Card | sim |
| HTTPS + HTTP→HTTPS 301 | sim |
| CSS/JS versionados (`?v=`) | sim |

### Dados estruturados (JSON-LD)

Cada post carrega três blocos; as listagens carregam um:

- **BlogPosting** — título, descrição, datas, autor (`Person` → `/sobre/`), publisher (`Organization`), `inLanguage: pt-BR`, `citation` para a fonte original.
- **BreadcrumbList** — Início › Blog › Categoria › Post.
- **FAQPage** — extraído automaticamente das perguntas do post.
- **Blog** nas páginas de índice e categoria.

O `FAQPage` é o item de maior retorno para AEO: é o formato que motores de resposta consomem com menos atrito.

### Editorial

- **Caixa "Resposta curta"** no topo de cada post (`aeoSummary`): 2 a 4 frases que respondem à pergunta central de forma autossuficiente, sem depender do resto do texto. É o trecho desenhado para ser citado.
- **Análise própria** ("A leitura da Tyna") em cada post. Não é enfeite: diferencia a página de uma tradução literal, que o Google trata como conteúdo raso.
- **Perguntas frequentes** em linguagem natural, no formato que as pessoas realmente digitam.

### Crawlers de IA

A Cloudflare serve um `robots.txt` gerenciado na borda que **sobrescreve** qualquer arquivo do repositório. A política atual:

- **Bloqueados** (treinamento): GPTBot, ClaudeBot, CCBot, Google-Extended, Amazonbot, Applebot-Extended, Bytespider, meta-externalagent
- **Liberados** (busca e citação): OAI-SearchBot, PerplexityBot, Googlebot, Bingbot, ChatGPT-User, Claude-User, Claude-SearchBot
- `Content-Signal: search=yes, ai-train=no, use=reference`

Isso já é a configuração desejada para AEO: o conteúdo não alimenta treinamento, mas pode ser recuperado e citado. Alterar em: dash Cloudflare › AI Crawl Control.

---

## 2. Pendências que dependem de você

### Imediato

1. **Google Search Console** — verificar a propriedade `tyna.com.br` e enviar o sitemap. Sem isso a indexação demora semanas em vez de dias.
2. **Bing Webmaster Tools** — importa mais do que o tráfego do Bing sugere: o índice do Bing alimenta o ChatGPT Search.
3. **Perfil de organização** — LinkedIn e Google Business com o mesmo nome, descrição e URL do JSON-LD. Consistência entre fontes é o que os motores usam para confiar na entidade.

### Estrutural (próximos 90 dias)

4. **Páginas-pilar por tema**, não só posts de notícia. Notícia envelhece; página-pilar acumula autoridade. Candidatas naturais a partir do que a Tyna já vende:
   - Governança de IA para empresas brasileiras
   - LGPD e inteligência artificial: o que muda na prática
   - AI Gateway: o que é e quando faz sentido
   - Como avaliar um agente de IA antes de colocar em produção

   Cada pilar deve linkar para os posts de notícia relacionados, e eles de volta para o pilar.

5. **Interligação interna.** O gerador já cria "Leia também" por categoria. Falta o link editorial dentro do texto, que é o que carrega contexto semântico de verdade.

6. **Glossário** (`/glossario/`) com verbetes curtos: RAG, AEO, agente autônomo, AI Gateway, harness, fine-tuning. Verbete curto e objetivo é altamente citável — em português há pouca concorrência boa.

---

## 3. Como escrever para AEO

Regras práticas, aplicadas nos posts já publicados:

1. **Responda antes de contextualizar.** A caixa "Resposta curta" existe para isso. Motor de resposta extrai o primeiro trecho autossuficiente que encontra.
2. **Uma ideia por parágrafo.** Parágrafo que emenda três assuntos não é extraível.
3. **Título em forma de pergunta ou afirmação, não em trocadilho.** "O que é um AI Gateway" é encontrável; "Portais para o futuro" não é.
4. **Números e nomes específicos.** "70% menos tokens" é citável; "redução significativa" não é.
5. **Data visível e `dateModified` real.** Motores penalizam conteúdo de idade indeterminada em temas que mudam rápido.
6. **Cite a fonte primária com link.** Aumenta a chance de a sua página ser tratada como fonte secundária confiável em vez de cópia.

---

## 4. Risco a monitorar: conteúdo duplicado entre domínios

Os posts em português são traduções de material do `automationscookbook.com`. Tradução **não** é conteúdo duplicado para o Google *desde que* haja sinalização correta — que já está no lugar:

- `hreflang` pt-BR ↔ en em ambos os sentidos
- Canonical próprio em cada versão (a página em português **não** aponta canonical para a inglesa; isso a removeria do índice)
- Análise original em cada post, que a versão inglesa não tem

O que **aumentaria** o risco: publicar tradução literal, sem a seção de análise, em volume. É por isso que a etapa de análise própria não é opcional no processo.

---

## 5. Métricas que valem acompanhar

| Métrica | Onde | Frequência |
|---|---|---|
| Páginas indexadas vs. enviadas | Search Console | semanal |
| Consultas com impressão mas sem clique | Search Console | quinzenal |
| Posição média por categoria | Search Console | mensal |
| Citações em ChatGPT/Perplexity | teste manual com 10 perguntas fixas | mensal |
| Rich results válidos (FAQ, Article) | teste de resultados ricos do Google | a cada 10 posts |

O teste manual de citação é rudimentar e é o único método honesto disponível hoje: não existe ferramenta confiável de rank tracking para motores de resposta. Monte uma lista de 10 perguntas que um cliente faria, rode uma vez por mês, anote se a Tyna aparece.

---

## 6. Sobre "humanizar" o texto

O pedido original mencionava uma etapa para o conteúdo não ser classificado como gerado por IA. Vale registrar o que foi feito e o que não dá para prometer.

**O que foi feito:** os textos foram reescritos, não traduzidos palavra a palavra. Ritmo de frase variado, voz ativa, vocabulário técnico em português real, ausência de tiques de LLM ("é importante notar que", "no mundo de hoje", listas de três adjetivos). Cada post ganhou análise original que não existe no texto de origem.

**O que não dá para prometer:** que um detector específico classifique o texto como humano. Detectores de IA têm taxa de erro alta nos dois sentidos e nenhum deles é usado pelo Google como critério de ranqueamento.

**O que de fato importa:** a política do Google é sobre *valor*, não sobre origem. Conteúdo gerado por IA não é penalizado por ser gerado por IA; conteúdo raso é penalizado por ser raso. A seção de análise própria em cada post é a defesa real — e é também o que faz o texto valer a leitura.

---

## 7. Processo para os próximos lotes

```bash
# 1. Traduzir: criar content/blog/<slug-pt>.md com frontmatter completo
#    (title, description, pubDate, category, tags, sourceUrl, sourceName,
#     originalUrl, aeoSummary) + seção "A leitura da Tyna"
# 2. Gerar
node tools/build-blog.mjs
# 3. Publicar
npx wrangler pages deploy dist --project-name=tyna-website --branch=main
```

O slug em português deve ser descritivo e sem data. O `originalUrl` é obrigatório: é o que gera o par `hreflang`.
