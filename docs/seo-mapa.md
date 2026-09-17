# Mapa de SEO do site (17/09/2026)

Levantamento de todas as 78 páginas publicadas: título, descrição, H1, tamanho,
dados estruturados e o termo que cada página deveria ganhar. A régua é a da memória
do projeto: **segurança, custo e treinamento para empresa grande** — tráfego que vira
lead, não visita curiosa.

Dados de busca usados aqui: Search Console, 11/08 a 14/09/2026 — 224 impressões,
1 clique, posição média 46.

## 1. A lacuna mais cara: treinamento

Treinamento e capacitação é um dos três pilares comerciais e **não tem página nenhuma**.
Hoje o assunto aparece só como um bloco dentro da home ("Do workshop pontual ao programa
contínuo") e como um item da lista de pilares no JSON-LD. Quem busca "treinamento de IA
para empresas" não tem onde cair.

Proposta em `docs/paginas-comerciais.md` (esqueleto) e detalhada na conversa de 17/09.

## 2. Situação das páginas-pilar

| Página | Palavras | Termo-alvo | Situação |
| --- | --- | --- | --- |
| `/` | 2.902 | consultoria em governança de IA | título mantido por decisão do Felipe |
| `/governanca-de-ia/` | 2.844 | governança de IA (topo de funil) | ok |
| `/politica-de-uso-de-ia/` | 2.596 | modelo de política de uso de IA | **35% das impressões do site** |
| `/shadow-ai/` | 2.446 | shadow AI: o que é | ok |
| `/lgpd-e-ia/` | 1.848 | LGPD e inteligência artificial | ok |
| `/ai-gateway/` | 2.353 | AI Gateway: o que é | ok |
| `/ai-gateway/comparativo/` | 7.367 | comparativo de AI Gateways | maior página do site |
| `/governanca-de-agentes/` | 2.387 | governança de agentes de IA | sem HowTo |
| `/iso-42001/` | 1.482 | ISO/IEC 42001 | 16% das impressões |
| `/pl-2338/` | 1.731 | Marco Legal da IA | conteúdo perecível: revisar a cada votação |
| `/llm-leaderboard/` | 3.524 | ranking de LLMs | título com 63 caracteres, corta no Google |
| `/diagnostico/` | 638 | teste de maturidade em IA | menor página; sem FAQ |
| `/sobre/` | 1.182 | Felipe Jacob | 14% das impressões, quase toda de marca |
| `/politica-de-privacidade/` | 1.735 | — | página de conformidade, não de busca |

Higiene técnica: **nenhum título ou descrição duplicado**, nenhuma página sem H1,
todas as descrições entre 110 e 160 caracteres. Quatro títulos passam de 62 caracteres
(`/llm-leaderboard/` e três posts) e são cortados no resultado.

## 3. Canibalização: três pares disputando o mesmo termo

O post e a página-pilar competem entre si na mesma busca. O Google escolhe um, quase
sempre o mais fraco, e os dois perdem.

| Pilar | Post concorrente | Encaminhamento |
| --- | --- | --- |
| `/ai-gateway/` | `/blog/o-que-e-um-ai-gateway/` | post assume o recorte "como explicar para a diretoria" e aponta para o pilar |
| `/politica-de-uso-de-ia/` | `/blog/politica-de-uso-de-ia-o-que-precisa-ter/` | post vira "os 7 itens", pilar fica com "modelo/template" |
| `/shadow-ai/` | `/blog/shadow-ai-o-problema-que-sua-empresa-ja-tem/` | post vira o caso narrativo, pilar fica com "o que é e como mapear" |

## 4. Radar (54 posts)

Média de 932 palavras, todos com descrição, só um abaixo de 400 palavras. Traz volume
e quase nenhum lead: o único clique orgânico do trimestre veio de um post sobre Rust e
Bevy. Decisão: manter publicando pelo custo baixo, **sem investir mais esforço** e sem
deixar o Radar puxar a autoridade do site para "notícias de tecnologia".

## 5. Lacunas de conteúdo, por pilar comercial

| Pilar | O que existe | O que falta |
| --- | --- | --- |
| Segurança | shadow-ai, lgpd-e-ia, governanca-de-agentes | página-mãe de "segurança em IA generativa" |
| Custo | trecho dentro de ai-gateway | página de custo: quanto custa IA na empresa, como reduzir gasto com modelo |
| Treinamento | nada | **página de treinamento corporativo em IA** |

As quatro páginas comerciais (`consultoria-governanca-de-ia`, `adequacao-lgpd-projetos-de-ia`,
`implementacao-iso-42001`, `quanto-custa-governanca-de-ia`) seguem como esqueleto `noindex`,
fora do sitemap e fora do deploy, esperando preço e caso aprovados.

## 6. Ordem recomendada

1. Página de treinamento (lacuna inteira, intenção comercial alta).
2. Resolver as três canibalizações — custo baixo, ganho imediato.
3. Página de custo de IA.
4. Preencher as quatro páginas comerciais.
5. Autoridade: links do Automations Cookbook e do LinkedIn. Sem isso, nenhuma
   das páginas sai da posição 40+, por melhor que seja o texto.
