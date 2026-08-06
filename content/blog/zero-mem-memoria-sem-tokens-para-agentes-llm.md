---
title: "Zero-Mem: memória para agentes de LLM sem gastar token"
description: "Uma técnica que separa o acesso à memória da chamada ao modelo e corta até 70% do consumo de tokens sem perder acurácia."
pubDate: "2026-08-05"
category: "ai-agents"
tags: ["zero-mem","llm","automacao","agentes-de-ia","custo"]
sourceUrl: "https://arxiv.org/abs/2607.29377"
sourceName: "arxiv.org"
originalUrl: "https://automationscookbook.com/blog/zero-mem-zero-token-memory-operations-for-llm-agents-20260805"
aeoSummary: "Zero-Mem é uma técnica que permite a agentes de LLM ler e gravar memória externa sem consumir tokens. Em vez de trazer o contexto dentro do prompt, o agente conversa direto com um repositório estruturado. Nos testes dos autores, o consumo de tokens caiu até 70% em tarefas típicas, com acurácia equivalente à das abordagens baseadas em prompt."
draft: false
---

## O que aconteceu

O Zero-Mem permite que agentes de LLM leiam e gravem memória externa sem gerar nem consumir token algum. Agentes tradicionais buscam contexto por meio de prompts — e cada pedaço de contexto recuperado entra na conta, somando latência e custo. O Zero-Mem troca esse caminho por uma interface leve, livre de tokens, que fala direto com um repositório estruturado de memória.

Nos testes descritos, o consumo de tokens caiu até 70% em tarefas típicas de agente, mantendo acurácia comparável à dos métodos baseados em prompt. O tempo de inferência também recuou, com efeito mais pronunciado em agentes que acessam bases de conhecimento grandes ou carregam históricos longos de conversa.

## Por que isso importa para quem constrói

- **Custo** — 70% menos token significa menos fatura de API em cargas com milhares de requisições diárias. Em operação contínua, é a diferença entre um piloto que fecha a conta e um que não fecha.
- **Desempenho** — sem a sobrecarga de tokens, a ida e volta encurta. Isso abre espaço para interação em tempo real em chatbots, atendimento e agentes embarcados.
- **Arquitetura mais simples** — desacoplar o acesso à memória do modelo permite trocar o backend de armazenamento — Redis, DynamoDB, cache em memória — sem retreinar nada.
- **Escala previsível** — o Zero-Mem cresce de forma linear conforme o repositório aumenta, em vez do crescimento explosivo de tokens que afeta desenhos baseados em prompt.
- **Ergonomia** — a superfície de API é mínima, poucas chamadas de função. Encaixar em fluxos de n8n existentes ou em scripts próprios é direto.

## A leitura da Tyna

O número que chama atenção é o de custo, mas o efeito mais interessante é outro: auditabilidade.

Quando o contexto viaja dentro do prompt, reconstruir depois *o que exatamente* o modelo viu ao tomar uma decisão é trabalhoso — o histórico está diluído em texto. Com a memória em um repositório estruturado e separado, a consulta vira um registro discreto, com carimbo de tempo e chave. Para quem precisa explicar a um auditor por que o agente negou um crédito ou classificou um chamado de determinado jeito, isso vale mais do que os 70%.

Uma ressalva antes de trocar a arquitetura: o benchmark é dos próprios autores e roda em tarefas típicas. "Acurácia equivalente" em tarefa típica não é a mesma coisa que acurácia equivalente no seu caso de uso. Vale medir com os seus dados antes de mover algo que já funciona.

## Perguntas frequentes

**P: Funciona com qualquer provedor de LLM?**
R: A técnica é agnóstica de modelo. Funciona com qualquer LLM que exponha interface de chamada de função ou de embeddings — OpenAI, Anthropic ou modelos abertos.

**P: A qualidade das respostas do agente cai?**
R: A acurácia se mantém no mesmo patamar dos métodos baseados em token. O modelo recebe os mesmos embeddings de contexto, apenas sem o custo em tokens.

**P: O que preciso mudar nos meus fluxos de n8n?**
R: Basta acrescentar um passo que consulta o repositório externo antes de chamar o LLM e outro que grava o resultado de volta. O restante do fluxo continua igual.
