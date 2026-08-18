---
titulo: Estratégia de SEO e AEO do site da Tyna
id: seo-aeo
tipo: operacao
tags: [seo, site]
resumo: O site é otimizado tanto para busca tradicional quanto para citação por mecanismos de resposta, com llms.txt, ai.json e FAQ visível espelhando o schema.
publico: [interno]
fonte: Repositório tyna_website — llms.txt, ai.json, docs/estrategia-seo-aeo.md
atualizado: 2026-08-14
confianca: alta
---

# Estratégia de SEO e AEO do site da Tyna

## Resposta curta

O site tyna.com.br é otimizado para duas audiências de máquina: buscadores
tradicionais e mecanismos de resposta por Inteligência Artificial. Os ativos centrais
são `llms.txt` (fatos curados em texto), `ai.json` (grafo de conhecimento em JSON-LD)
e um FAQ **visível** que espelha exatamente o schema FAQPage.

## A regra que não pode ser quebrada

**Todo dado estruturado precisa ter texto visível correspondente na página.** Schema
de FAQ sem a pergunta visível viola as diretrizes do Google, e mecanismos de resposta
só citam o que está visível.

Existe um verificador no repositório que confere esse espelhamento. Rode-o depois de
mexer em FAQ ou schema.

## Os três arquivos de AEO

`llms.txt` — resumo curado da Tyna em texto, para consumo direto por modelo.
`ai.json` — grafo JSON-LD com Organization, Person, Service, Dataset e FAQPage.
`sitemap.xml` — inventário canônico das URLs.

## Princípio de escrita que vale para o site e para esta base

Resposta primeiro, contexto depois. É o mesmo princípio da regra 2 de [[convencoes]]:
tanto um mecanismo de resposta quanto um recuperador de RAG pegam o primeiro bloco.
Introdução no topo desperdiça a única chance de ser citado.

## Cuidados de meta

Meta description entre 135 e 155 caracteres. Toda página com Open Graph completo.
Sufixo de título padronizado em `| Tyna`.

## Relacionado

- [[deploy]]
- [[convencoes]]
