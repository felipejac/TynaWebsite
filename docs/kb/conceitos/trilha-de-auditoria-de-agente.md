---
titulo: Trilha de auditoria de decisão de agente
id: trilha-de-auditoria-de-agente
tipo: conceito
tags: [agentes, compliance, lgpd, risco]
resumo: Trilha de auditoria de agente é o registro recuperável do que o agente leu, decidiu e executou, reconstruído depois do fato.
publico: [compliance, juridico, ti]
fonte: https://tyna.com.br/ (FAQ publicado)
atualizado: 2026-08-14
confianca: alta
---

# Trilha de auditoria de decisão de agente

## Resposta curta

Trilha de auditoria de agente é o registro recuperável de **o que o agente leu, o que
decidiu e o que executou**, reconstruível depois do fato. É o que permite responder,
semanas depois, por que o agente de IA negou aquele pedido ou prometeu aquele prazo.
Sem ela, a empresa tem um sistema tomando decisões em seu nome sem conseguir explicar
nenhuma delas.

## Os três registros, e por que os três

**O que leu** — quais documentos, registros e trechos entraram no contexto daquela
decisão. Sem isso não dá para distinguir alucinação de dado errado na base: o agente
inventou, ou leu corretamente uma informação desatualizada?

**O que decidiu** — a saída e, quando existir, o critério ou o grau de confiança.

**O que executou** — a ação efetiva no sistema. A decisão e a execução podem divergir
quando há falha de integração, e essa divergência é invisível sem os dois registros.

## Onde isso vira exigência

É a peça que sustenta a defesa em [[lgpd-em-fluxos-de-ia]] e um dos pontos
verificados em auditoria de [[iso-42001]]. Também é o que separa "temos um agente"
de "temos um agente governado" numa due diligence de cliente grande.

## Um cuidado que costuma escapar

A trilha guarda conversa, e conversa costuma ter dado pessoal. O registro criado para
auditoria vira, ele mesmo, um tratamento de dado que precisa de base legal, prazo de
retenção e controle de acesso.

## Relacionado

- [[governanca-de-agentes-autonomos]]
- [[lgpd-em-fluxos-de-ia]]
- [[iso-42001]]
