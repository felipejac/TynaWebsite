---
titulo: Escalonamento humano
id: escalonamento-humano
tipo: conceito
tags: [agentes, governanca, risco]
resumo: Escalonamento humano é o caminho pelo qual o agente de IA para e transfere a decisão para uma pessoa, com critério definido antes da produção.
publico: [ti, c-level]
fonte: https://tyna.com.br/ (conteúdo publicado sobre governança de agentes)
atualizado: 2026-08-14
confianca: alta
---

# Escalonamento humano

## Resposta curta

Escalonamento humano é o caminho pelo qual um agente de IA para e transfere a decisão
para uma pessoa. Governança séria define **o critério que dispara isso antes de o
agente ir a produção** — e não depois do primeiro incidente. Sem esse caminho, o
agente ou trava o cliente numa repetição, ou decide sozinho o que não deveria.

## Os três gatilhos que valem a pena definir

**Por confiança** — o agente não está seguro da resposta. Exige que o sistema tenha
alguma medida de confiança, e que ela seja calibrada com casos reais.

**Por escopo** — o assunto está fora do que o agente pode tratar, por definição
prévia. Ver [[guardrail]].

**Por pedido do cliente** — a pessoa pediu para falar com gente. Este é inegociável,
e é o gatilho mais desrespeitado em implementação ruim: o agente que insiste em
resolver depois do pedido explícito de humano gera mais dano que o erro que ele
estava tentando evitar.

## O que costuma dar errado

Escalonar para uma fila que ninguém atende é pior que não escalonar — o cliente
esperou duas vezes. O desenho do escalonamento inclui **para quem vai, em que canal e
com que SLA**, ou não está desenhado.

## Relacionado

- [[governanca-de-agentes-autonomos]]
- [[guardrail]]
- [[case-stellantis]]
