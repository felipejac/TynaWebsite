---
titulo: Shadow AI
id: shadow-ai
tipo: conceito
tags: [shadow-ai, risco, governanca]
resumo: Shadow AI é o uso de ferramentas de IA por times da empresa fora de qualquer política, sem visibilidade para TI, jurídico ou segurança.
publico: [c-level, ti, juridico, compliance]
fonte: https://tyna.com.br/ (FAQ publicado)
atualizado: 2026-08-14
confianca: alta
---

# Shadow AI

## Resposta curta

Shadow AI é o uso de ferramentas de Inteligência Artificial por times da empresa fora
de qualquer política, sem visibilidade para TI, jurídico ou segurança. Não é um time
mal-intencionado: é gente resolvendo o próprio trabalho com a ferramenta que estava à
mão. O problema não é o uso — é que ninguém sabe qual dado saiu, para onde foi, nem
sob que contrato.

## Os três riscos concretos

**Vazamento de dados e exposição regulatória.** Contrato, base de clientes e código
proprietário colados em ferramenta pública viram dado fora do perímetro, muitas vezes
sob termos que permitem uso para treinamento.

**Alucinação sem guardrail em agente que já atende cliente.** Quando o uso não
passou por revisão, não existe [[guardrail]] nem [[escalonamento-humano]]. O erro
chega ao cliente antes de chegar a qualquer pessoa da empresa.

**Ferramentas fragmentadas.** Cada área com o próprio acesso a modelos, sem custo,
uso e risco consolidados. Ninguém consegue responder quanto a empresa gasta com IA.

## Por que proibir não funciona

A proibição empurra o uso para o celular pessoal, onde não há log nenhum. O ganho de
produtividade é real e o time não vai abrir mão dele — vai só parar de contar.
Proibição converte um problema visível em um problema invisível.

## Como a Tyna trata

Mapeia as ferramentas não autorizadas em uso, estabelece diagnóstico de maturidade e
cria política de uso aceitável **com alternativa segura no lugar** — instâncias
privadas de LLM sob um [[ai-gateway]] que unifica acesso, custo, observabilidade e
auditoria. Endereça shadow AI por controle, não por proibição.

Serviços correspondentes: [[servico-ai-gateway]] e [[politica-interna-de-ia]].

## Relacionado

- [[ai-gateway]]
- [[politica-interna-de-ia]]
- [[lgpd-em-fluxos-de-ia]]
- [[icp]]
