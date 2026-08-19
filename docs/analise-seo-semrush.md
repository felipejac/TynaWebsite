# Análise de SEO e AI Search — dados do Semrush, 18/08/2026

Leitura feita direto no Semrush, consultando `tyna.com.br` pelas ferramentas de análise
de domínio (não pelo projeto cadastrado, que é de outro site). Base de dados Brasil,
desktop, snapshot de 17–18/08/2026.

É a primeira vez que o site é olhado com dado de terceiro, e ele contradiz duas coisas
que estavam registradas como certas. As correções estão marcadas.

---

## 1. O retrato do domínio

| Métrica | Valor | Leitura |
| --- | --- | --- |
| Authority Score | **2** | "Lacks organic traffic" |
| Tráfego orgânico | **0** | consistente com o GA4 |
| Palavras-chave orgânicas | **2** | ambas "felipe jacob", posições 26 e 29, apontando para `/sobre/` |
| Domínios de referência | **94** | e aqui mora o problema — ver seção 2 |
| Backlinks | **293** | |
| Menções em AI Search | **0** | ChatGPT, AI Overview, AI Mode e Gemini, todos zerados |
| Páginas citadas por IA | **0** | |

As duas únicas palavras-chave em que o site aparece são o nome do Felipe, em posição 26
e 29, com 90 buscas/mês e dificuldade 19. Nem isso está resolvido: a página `/sobre/`
ranqueia abaixo da primeira página para o próprio nome.

---

## 2. Correção grave: não é "zero backlinks". É pior.

O que estava registrado no [estudo de backlinks](backlinks-estudo.md) de ontem: *linha de
base zero*. O `npm run backlinks` mediu zero, e mediu certo — ele confere uma lista de
alvos editoriais, e nenhum deles linka o site.

**O que o Semrush mostra é que existem 94 domínios apontando para tyna.com.br, e que
todos são spam.** Não é contradição: são coisas diferentes. Não há um único link
editorial, e há um perfil inteiro de lixo em volta.

### A composição

| Sinal | Valor |
| --- | --- |
| Domínios com Authority Score 0–10 | **95%** (89 de 94) |
| Origem: Singapura | **78%** (66 domínios) |
| Origem: Moldávia | **15%** (13 domínios) |
| Domínios de referência × IPs distintos | 94 domínios em **38 IPs**, 35 sub-redes |
| Categoria entre as listadas | inclui **Adult** |
| Network Graph do Semrush | **"Dangerous"** |
| Follow × nofollow | 134 follow (46%) · 159 nofollow (54%) |

### Os textos-âncora dizem tudo

| Âncora | Backlinks | Domínios |
| --- | --- | --- |
| `tyna.com.br` | 150 | 86 |
| `https://tyna.com.br/` | 136 | 3 |
| `high quality dofollow backlinks da 50 pa 40 premium pbn network service tyna.com.br rank first page google fast seo link building buy backlinks online cheap` | 5 | 3 |
| `tyna.com.br's conversions skyrocketed by +250% after implementing strategies from fiverr ⚡️` | 1 | 1 |

### As fontes

- `bilmaplimzs.blogspot.com` — blogspot de spam com **13.513 links externos** por página
- rede "Where to buy 🚀 aged domains and backlinks 🔥": `all-aged-domains.com`,
  `allwebsitesdirectory.com`, `alltopleveldomains.space`, `websitescrawl.art`,
  `way2check.art`, `tyres.pro`, `taxies.biz`, `theface.in`, `themumbai.in`,
  `procycling.org` e dezenas de clones, cada página com ~10.159 links externos
- `backlinksbank.com`, `backlinkon.com`, `backlinkhouse.com`, `backlinkstree.com`,
  `cheapsmmprovider.online` — vendedores de link
- `trendyhealthtimes.com`, `rdxextremez.com` — "🏆 Boost your Google rankings with
  Premium PBN 🏆"
- `atomizelink.icu`, `analyticshaven.top`, `factmags.com`, `goooogla.com` — páginas
  geradas automaticamente

### O que isso é, e o que não é

**Não é** algo que alguém contratou. O primeiro registro é de **26/06/2025**, mais de um
ano antes da reconstrução do site (12–13/08/2026), e o padrão — anchor que é literalmente
o anúncio do vendedor de PBN, páginas com dez mil links externos cada, IPs concentrados
em Singapura — é o de robô que varre domínios e gera página para cada um, para anunciar o
próprio serviço. Acontece com domínio qualquer. **E continua chegando:** o Semrush
registrou 3 backlinks novos há 6 dias.

**Não é, tampouco, motivo para pânico.** O Google afirma que a maioria dos sites não
precisa usar a ferramenta de desautorização, porque esse tipo de lixo é ignorado
automaticamente. "Dangerous" é rótulo do Semrush, não do Google.

**O que fazer, na ordem:**

1. **Rodar o Backlink Audit** do Semrush para `tyna.com.br` (a conta tem a ferramenta; o
   Toxicity Score só aparece depois de criar a campanha). É o que transforma impressão em
   número.
2. **Conferir no Search Console se existe ação manual.** Segurança e ações manuais. Se
   não houver — e provavelmente não há —, não fazer nada além de monitorar.
3. **Só considerar disavow** se aparecer ação manual ou queda inexplicada depois de o site
   começar a ranquear. Disavow preventivo em site novo é mais arriscado que o problema.
4. **Não adicionar nada que se pareça com isso.** É o argumento que já estava no estudo de
   ontem, agora com evidência local: o domínio já tem 94 vizinhos ruins. O 95º não ajuda.

---

## 3. O mercado, medido

Volumes de busca no Brasil, por cluster:

| Cluster | Volume total/mês | Termo-cabeça | Volume | KD |
| --- | --- | --- | --- | --- |
| **agentes de ia** | **28.600** | agentes de ia | 4.4K | 50 |
| **pl 2338** | **4.330** | pl 2338/2023 | 1.9K | 50 |
| iso 42001 | 2.780 | iso 42001 | 590 | 22 |
| shadow ai | 1.550¹ | shadow ai | 390 | 27 |
| **governança de ia** | 1.130 | governança de ia | **260** | **26 — "Easy"** |
| lgpd + inteligência artificial | 240 | site lgpd inteligência artificial | 110 | 37 |
| marco legal da IA | 90 | marco legal da inteligência artificial | 70 | n/a |
| política de uso de IA | **20** | política de uso de inteligência artificial | 20 | n/a |

¹ o cluster "shadow ai" está poluído por termos de edição de imagem (`ai drop shadow`,
`ai shadow removal`); a intenção correta fica perto de 390–560.

### Duas correções ao que eu havia registrado

**Correção 1 — "LGPD é termo muito mais procurado que governança de IA".** Escrevi isso
ao publicar `/lgpd-e-ia/`. É falso para a interseção que a página ataca: LGPD + IA soma
**240** buscas/mês, contra **1.130** do cluster de governança de IA. "LGPD" sozinho é
grande; "LGPD e IA" não é. A página continua fazendo sentido — pelo ICP e pela ligação
com o resto do site —, mas não pelo motivo que dei.

**Correção 2 — "política de uso de IA é o item de maior intenção comercial da
categoria".** Por volume de busca é o menor de todos: **20 buscas/mês**. A tese de que
quem procura template está montando a política agora continua de pé, e o lead é de
qualidade — mas são pouquíssimas pessoas. A página vale como ativo de distribuição e de
prova, não como canal de busca.

---

## 4. A maior oportunidade: a página que não existe

O site tem sete guias. **Nenhum ataca o termo-cabeça da categoria.**

`governança de ia` — 260 buscas/mês, **KD 26, classificado "Easy"** pelo próprio Semrush:
*"é bem possível ranquear para esta palavra-chave"*. A SERP explica por quê:

| # | Quem ranqueia | Page AS | Ref. domains | Backlinks |
| --- | --- | --- | --- | --- |
| — | **AI Overview** | | | |
| 1 | ibm.com/br-pt/think/topics/ai-governance | 22 | 10 | 26 |
| 2 | estacio.br — curso de graduação | 14 | 1 | 2 |
| 3 | direitosp.fgv.br — projeto de pesquisa | 18 | 4 | 6 |
| 4 | posdigital.pucpr.br — pós | 12 | 1 | 1 |
| 5 | alura.com.br | 14 | 3 | 8 |
| 6 | **privacytools.com.br** | **0** | **0** | **0** |
| 7 | databricks.com | 15 | 1 | 1 |

**A sexta posição é ocupada por uma página com autoridade zero e nenhum backlink.** Metade
da primeira página é curso de faculdade e projeto de pesquisa — ninguém vendendo o
serviço, ninguém com o conteúdo que a Tyna já tem escrito espalhado em sete páginas.

É a maior oportunidade isolada do site: uma página-pilar `/governanca-de-ia/` que responda
o termo-cabeça e sirva de hub para os sete guias existentes.

---

## 5. O acerto por acidente, e a correção barata

`/pl-2338/` mira o **maior cluster com intenção compatível do mercado: 4.330 buscas/mês.**
Isso não estava no cálculo quando a página foi feita — ela entrou por ser o item 4 do
plano de conteúdo, escrito por outro motivo.

Só que o `<title>` lidera com **"Marco Legal da IA"**, que tem **90** buscas/mês, enquanto
**"PL 2338"** — que tem 4.330 somando as variantes — aparece depois. As pessoas procuram
pelo número do projeto, não pelo nome.

A SERP de `pl 2338` é dura no topo e aberta no meio:

| # | Quem ranqueia | Page AS | Ref. domains |
| --- | --- | --- | --- |
| — | **AI Overview** | | |
| 1 | senado.leg.br | 66 | 1.7K |
| 2 | camara.leg.br | 64 | 579 |
| 3 | legis.senado.leg.br | 46 | 126 |
| 4 | exame.com | 44 | 17 |
| 5 | direitosnarede.org.br | 14 | 16 |

Top 3 é institucional e não se disputa. Mas a quinta posição é uma ONG com Page Authority
14 e 16 domínios de referência. E o Semrush estima o custo de entrada com precisão útil:
**"você vai precisar de 15 domínios de referência e conteúdo otimizado para competir
aqui"**.

**Isso dá meta ao estudo de backlinks**: não é "conseguir links", é **15 domínios reais**.

---

## 6. AI Search: zero, e o gargalo é o mesmo

Zero menções e zero páginas citadas em ChatGPT, AI Overview, AI Mode e Gemini.

Vale separar o que já foi feito do que falta:

- **Feito e verificado:** `llms.txt`, `ai.json` com 8 páginas e 19 perguntas, JSON-LD
  espelhando texto visível, FAQ em todas as páginas-pilar, `robots.txt` liberando os 8
  crawlers de treino — e confirmado em produção que a Cloudflare não sobrescreve mais.
- **O que falta não é técnico.** As duas SERPs mais importantes (`governança de ia` e
  `pl 2338`) **têm AI Overview**. O AI Overview é montado a partir do que já ranqueia. Sem
  posição orgânica e sem citação de terceiro, não há de onde ser citado.

Ou seja: **AEO não é um canal paralelo ao SEO neste estágio. É consequência dele.** A
ordem correta é ranquear e ser citado; a camada técnica já está pronta para quando isso
acontecer.

---

## 7. O que eu faria, em ordem

1. **Publicar `/governanca-de-ia/`** — termo-cabeça, KD 26 "Easy", SERP com página de
   autoridade zero em sexto. Hub para os sete guias. É a maior oportunidade do site.
2. **Trocar o título de `/pl-2338/`** para liderar com "PL 2338/2023", que é como as
   4.330 buscas são escritas. Custo: uma linha.
3. **Rodar o Backlink Audit** e conferir ação manual no Search Console. Decidir sobre
   disavow com dado, não com susto.
4. **Perseguir 15 domínios de referência reais** — a meta que o Semrush nomeou. A lista
   priorizada já existe em [backlinks-alvos.json](backlinks-alvos.json).
5. **Resolver o próprio nome.** "felipe jacob" tem 90 buscas/mês, KD 19, e `/sobre/` está
   em 26º. É a busca mais fácil que existe para este domínio e ela está perdida.
6. **Olhar o cluster de agentes de IA (28.600/mês)** com cuidado: é dez vezes o de
   governança, o blog já tem 16 posts na categoria, e `/governanca-de-agentes/` é a ponte
   entre o público que busca e o que a Tyna vende. Intenção é de quem constrói, não de
   quem contrata — mas é o volume que existe.

---

## Nota de método

Tudo acima é leitura de dado de terceiro (Semrush) em um snapshot de 17–18/08/2026, com o
site publicado há seis dias. Volume de busca é estimativa, e Authority Score e Keyword
Difficulty são métricas proprietárias do Semrush — não são números do Google. O que tem
valor aqui é a ordem de grandeza e a comparação entre clusters, não o número exato.
