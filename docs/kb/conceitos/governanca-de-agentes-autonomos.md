---
titulo: Governança de agentes autônomos
id: governanca-de-agentes-autonomos
tipo: conceito
tags: [agentes, governanca, risco]
resumo: Governança de agente autônomo trata de sistemas que decidem e agem sozinhos, e não de quem pode usar ferramentas de IA; a pergunta passa a ser até onde o agente vai sem um humano.
publico: [c-level, ti, compliance]
fonte: https://tyna.com.br/ (FAQ publicado)
atualizado: 2026-08-14
confianca: alta
---

# Governança de agentes autônomos

## Resposta curta

Governança de agente autônomo trata de sistemas que decidem e agem sozinhos —
respondem ao cliente, aprovam, cobram, vendem. É diferente de política de uso de IA,
que trata de quem pode usar ferramentas como o ChatGPT dentro da empresa. A pergunta
deixa de ser *quem pode usar* e passa a ser **até onde o agente vai sem um humano**.

## A diferença que muda tudo

Política de uso de IA governa **pessoas** usando uma ferramenta. Se alguém escreve um
prompt ruim, uma pessoa lê a resposta ruim e descarta.

Governança de agente governa **um sistema agindo em nome da empresa**. Não há leitor
intermediário. O agente responde ao cliente, altera um registro, libera um crédito.
O erro vira ato antes de virar informação.

## Os quatro controles que isso exige

**Escopo de autonomia** — a lista do que o agente pode decidir sozinho, e o que exige
aprovação. Escrito antes de ir a produção, não depois do primeiro incidente.

**[[guardrail]] em produção** — limite aplicado em execução, não recomendação em
documento.

**[[escalonamento-humano]]** — o caminho pelo qual o agente para e chama gente, e o
critério que dispara isso.

**[[trilha-de-auditoria-de-agente]]** — o que o agente leu, decidiu e executou,
recuperável depois do fato.

## Por que a origem da regra importa

Regra escrita por quem nunca operou um agente descreve o comportamento que se
*imagina*. O comportamento real aparece em produção: onde o agente hesita, onde
inventa, onde o cliente reformula a pergunta de um jeito que quebra o fluxo. Ver
[[diferencial]].

## Relacionado

- [[guardrail]]
- [[escalonamento-humano]]
- [[trilha-de-auditoria-de-agente]]
- [[case-stellantis]]
