---
titulo: Guardrail em produção
id: guardrail
tipo: conceito
tags: [agentes, risco, governanca]
resumo: Guardrail é o limite aplicado ao agente em tempo de execução, e não a recomendação escrita em política.
publico: [ti, compliance]
fonte: https://tyna.com.br/ (conteúdo publicado sobre governança de agentes)
atualizado: 2026-08-14
confianca: alta
---

# Guardrail em produção

## Resposta curta

Guardrail é o limite aplicado ao agente de IA **em tempo de execução** — no código,
no prompt de sistema, na camada de validação — e não a recomendação escrita em
política. A diferença é operacional: política é lida por pessoas e pode ser ignorada;
guardrail é executado pela máquina e não admite exceção silenciosa.

## Os tipos que aparecem na prática

**De escopo** — o agente responde sobre pedido e entrega, e recusa qualquer outro
assunto. Impede que um agente de atendimento vire conselheiro jurídico.

**De ação** — o agente consulta, mas não altera. Ou altera até um limite de valor,
e acima disso exige [[escalonamento-humano]].

**De dado** — o agente não recebe o campo que não precisa ver. O controle mais barato
de todos, porque o dado que não trafega não vaza. Ver [[lgpd-em-fluxos-de-ia]].

**De saída** — validação da resposta antes de ela chegar ao cliente: formato, presença
de dado sensível, coerência com o catálogo real.

## Por que política sozinha não substitui

Um documento que diz "o agente não deve prometer prazo de entrega" não impede nada.
O agente não lê a política. O guardrail correspondente é a validação que barra a
resposta contendo data quando o prazo não veio do sistema de logística.

## Relacionado

- [[governanca-de-agentes-autonomos]]
- [[escalonamento-humano]]
- [[politica-interna-de-ia]]
