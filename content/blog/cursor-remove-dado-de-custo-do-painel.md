---
title: "Cursor remove o dado de custo do painel e do CSV"
description: "O painel agora mostra só contagem de tokens. Quem auditava gasto direto na plataforma vai precisar calcular por fora."
pubDate: "2026-08-02"
category: "dev-tools"
tags: ["cursor","controle-de-custo","automacao","faturamento","observabilidade"]
sourceName: "changelog do Cursor"
originalUrl: "https://automationscookbook.com/blog/cursor-removes-cost-data-from-usage-page-and-csv-export-20260802"
aeoSummary: "O Cursor retirou a coluna de custo do painel de uso e do arquivo CSV exportado. O que resta são contagem de tokens, carimbo de tempo e identificador de requisição, sem valor monetário. Quem usava a plataforma para auditar gasto precisa converter tokens em reais por conta própria, usando a tabela de preços ou uma ferramenta externa de rastreio de custo."
draft: false
---

## O que aconteceu

O Cursor retirou a coluna de custo do painel de uso e do arquivo CSV exportado. A nova visão traz apenas contagem de tokens, carimbo de tempo e identificador de requisição. O CSV manteve os mesmos campos, sem o valor monetário.

A equipe justificou a mudança como simplificação de interface e redução de redundância de dados. Quem usava o Cursor para ter transparência de gasto em fluxos de agentes em produção perde a forma mais direta de auditar o custo dentro da própria plataforma.

## Por que isso importa para quem constrói

- **Sem visibilidade de custo embutida** — não dá mais para ver quanto um fluxo ou nó específico está custando. É preciso puxar a contagem de tokens e calcular por fora, o que acrescenta trabalho.
- **Orçamento e alerta** — pipelines que disparavam alerta em limite financeiro perdem esse gatilho. Agora é necessário converter limite de token em valor e reescrever a lógica de alerta.
- **Consistência da exportação** — o CSV alimenta relatório e conformidade. Sem o campo de custo, relatórios precisam ser refeitos ou enriquecidos, e integrações existentes podem quebrar.
- **Espaço para rastreio próprio** — a mudança empurra os times para ferramenta externa de custo ou pós-processamento próprio, o que devolve visibilidade e traz mais flexibilidade.

## A leitura da Tyna

Vale registrar o padrão, porque ele vai se repetir: **métrica que a plataforma remove é métrica que você precisa passar a manter.**

Custo de IA é a rubrica mais volátil de um projeto de automação. Muda com troca de modelo, com mudança de preço do fornecedor, com um prompt que cresceu sem ninguém notar. Depender do painel do fornecedor para enxergar isso sempre foi frágil — não porque o fornecedor age de má-fé, mas porque a prioridade dele é a interface dele, não o seu controle orçamentário.

Quem já tinha o cálculo do lado de cá não sentiu essa mudança. Quem não tinha descobriu a dependência no pior momento, com relatório quebrado.

A recomendação prática: registre **tokens de entrada e de saída, modelo e identificador do fluxo** no seu próprio armazenamento, a cada chamada. Preço vira uma tabela sua, versionada. Isso resolve três problemas de uma vez — sobrevive a mudança de painel, permite atribuir custo por cliente ou por processo, e mantém o histórico quando o fornecedor reajusta o preço.

## Perguntas frequentes

**P: Ainda consigo ver custo no painel do Cursor?**
R: Não. O painel passou a exibir apenas contagem de tokens e metadados da requisição.

**P: Como recuperar o dado de custo dos meus fluxos?**
R: Exporte o CSV de uso de tokens e aplique a tabela de preços ou a sua própria fórmula de custo. Como alternativa, integre um serviço de rastreio que consuma a contagem de tokens.

**P: Isso muda a cobrança?**
R: Não. A cobrança continua baseada no uso de tokens. A mudança afeta apenas como você visualiza esse dado.
