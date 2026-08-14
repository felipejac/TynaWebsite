---
titulo: Como o site da Tyna vai ao ar
id: deploy
tipo: operacao
tags: [site, meta]
resumo: O site vai ao ar por npm run deploy, que faz upload direto para o Cloudflare Pages; git push não publica nada.
publico: [interno]
fonte: Repositório tyna_website, tools/deploy.mjs
atualizado: 2026-08-14
confianca: alta
---

# Como o site da Tyna vai ao ar

## Resposta curta

O site tyna.com.br é publicado por **`npm run deploy`**, que faz upload direto para o
Cloudflare Pages. **`git push` não publica nada** — o repositório e a produção são
independentes.

## A regra que mais importa

Existe uma lista explícita de arquivos e pastas publicáveis em `tools/deploy.mjs`.
**Arquivo que não está nessa lista nunca chega à produção**, por mais que exista no
repositório. Todo arquivo novo na raiz exige entrada nessa lista.

É por isso que `docs/` — inclusive esta base de conhecimento — não vai ao ar.

## Restrição permanente

Não usar `npm run build` nem `deploy:build`. Existem 12 posts de blog pausados **em
definitivo**, e esses comandos os publicariam.

## Depois do deploy

O deploy dispara IndexNow automaticamente, notificando Bing e Yandex das URLs
alteradas. Falha nessa etapa não afeta o que já foi publicado.

## Armadilha conhecida

Cache de borda do Cloudflare e propagação de domínio produzem falso negativo logo
após o deploy: a página parece errada ou some por alguns minutos. Verifique com
cache-buster ou pela URL específica do deployment antes de concluir que algo quebrou.

## Relacionado

- [[seo-aeo]]
