# Páginas comerciais — esqueletos e checklist de publicação

Quatro páginas de intenção comercial existem no repositório como esqueleto: estrutura,
H1, subtítulos, marcação, links internos e CTA, com o corpo em `TODO`. O briefing de cada
uma está no comentário do topo do próprio arquivo.

Elas **não vão ao ar** enquanto o texto não existir: têm `noindex`, estão fora do
`sitemap.xml` e fora da lista `PUBLISH` de `tools/deploy.mjs`. Por isso os guias ainda não
linkam para elas — link para página não publicada seria link quebrado em produção.

| Página | Guias que passam a linkar para ela |
| --- | --- |
| `/consultoria-governanca-de-ia/` | `/governanca-de-ia/`, `/governanca-de-agentes/`, `/shadow-ai/`, `/politica-de-uso-de-ia/`, `/ai-gateway/` |
| `/adequacao-lgpd-projetos-de-ia/` | `/lgpd-e-ia/`, `/pl-2338/`, `/politica-de-uso-de-ia/` |
| `/implementacao-iso-42001/` | `/iso-42001/`, `/governanca-de-ia/` |
| `/quanto-custa-governanca-de-ia/` | `/governanca-de-ia/`, `/consultoria-governanca-de-ia/`, seção de formatos da home |

## Para publicar uma página

1. Escrever o corpo no lugar de todo `TODO` (inclusive `title`, `meta description` e o CTA final). `grep -n TODO <slug>/index.html` precisa voltar vazio, exceto o comentário do briefing.
2. Remover a linha `<meta name="robots" content="noindex">`.
3. Se a página tiver FAQ, adicionar `FAQPage` no JSON-LD com as mesmas perguntas e respostas visíveis. Se tiver etapas ordenadas, `HowTo` com o mesmo texto.
4. Incluir o slug na lista `PUBLISH` de `tools/deploy.mjs` e uma entrada em `staticPages` de `tools/build-blog.mjs`.
5. Adicionar, ao final de cada guia da tabela acima, um cartão para a página comercial na seção `#relacionados`.
6. Incluir a página no `llms.txt` (seção Páginas).
7. Rodar `node tools/check-jsonld.mjs`, `node tools/check-links.mjs` e `npm run seo:local`; publicar com `npm run deploy:build`.
