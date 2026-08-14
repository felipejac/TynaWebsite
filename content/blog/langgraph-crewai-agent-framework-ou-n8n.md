---
title: "LangGraph, CrewAI, Agent Framework ou n8n?"
description: "Quatro caminhos para construir agentes, com critérios de escolha que dependem menos da tecnologia e mais de quem vai manter."
pubDate: "2026-07-21"
category: "ai-agents"
tags: ["frameworks","langgraph","crewai","n8n","arquitetura"]
sourceName: "análise comparativa"
originalUrl: "https://automationscookbook.com/blog/langgraph-vs-crewai-vs-microsoft-agent-framework-vs-n8n-2026"
aeoSummary: "LangGraph serve quando é preciso controlar exatamente como o agente transita entre etapas e repete tentativas. CrewAI serve para modelar um time de agentes especialistas com papéis claros. O Microsoft Agent Framework serve a organizações já imersas na pilha Microsoft e Azure que precisam de um SDK único. O n8n serve quando quem mantém o fluxo não é engenheiro de software, ou quando o agente precisa conviver com centenas de integrações de negócio."
draft: true
---

## A resposta curta

Escolha **LangGraph** quando precisar controlar exatamente como o agente transita entre etapas e repete tentativas. Escolha **CrewAI** quando estiver modelando um time de agentes especialistas com papéis claros e quiser que essa estrutura continue legível. Escolha o **Microsoft Agent Framework** quando a organização já vive na pilha Microsoft e Azure e precisa de um SDK único e suportado entre Python, C# e Java. Escolha **n8n** quando quem constrói e mantém o fluxo não é primariamente engenheiro de software, ou quando o agente precisa conviver com centenas de integrações de negócio que você já opera.

Eles não são excludentes. Um padrão comum em produção é o n8n orquestrar o gatilho de negócio — um webhook, um formulário, um agendamento — e chamar um serviço em LangGraph ou CrewAI para a parte que realmente exige raciocínio em várias etapas.

## Para que serve cada um

### LangGraph — máquina de estados para agentes

Modela o agente como um grafo explícito: nós são etapas, arestas são transições e o estado é um objeto tipado que circula entre elas. Isso dá duas coisas que laços de controle implícitos não dão: pausar, inspecionar e retomar a execução em qualquer nó, e garantir que certas transições nunca aconteçam. Quem adota costuma ter batido no limite da abordagem mais simples de chamar o modelo em laço.

### CrewAI — times multiagente por papel

A abstração central é a equipe: um conjunto de agentes, cada um com papel, objetivo e contexto, trabalhando por uma sequência de tarefas. A leitura se aproxima mais de um organograma que de uma máquina de estados, o que facilita entregar a configuração a alguém que não está imerso no código — o arquivo genuinamente descreve o que o sistema faz.

### Microsoft Agent Framework — o sucessor do AutoGen

É para onde vai quem construiu sobre o AutoGen. A proposta é consistência: os mesmos conceitos de orquestração entre os SDKs de Python, C# e Java, integrados ao restante da pilha corporativa da Microsoft. É o padrão pragmático quando compras, revisão de segurança e suporte de longo prazo já apontam para lá.

### n8n — a camada que conversa com todos

O n8n não tenta ser um framework de raciocínio. Ele tenta ser a camada de fluxo que dispara, sequencia e conecta o resto — inclusive chamadas a serviços em LangGraph ou CrewAI. A vantagem é a largura: centenas de integrações prontas que, numa pilha só de código, seriam trabalho sob medida. Quando a lógica do agente é simples — classificar, resumir, encaminhar — mas o processo em volta toca uma dúzia de sistemas, costuma ser o caminho mais rápido até produção.

## Como decidir de verdade

Pergunte **quem mantém isso depois que você entregar**.

Se for alguém de operações, e não um engenheiro, o fluxo visual vence mesmo sendo menos flexível. Se for um time de engenharia que precisa de controle fino sobre estado e repetição, LangGraph justifica a complexidade. Se o modelo mental é "um time de especialistas com funções diferentes", CrewAI mantém essa estrutura honesta conforme o sistema cresce. Se a organização já tem relação de compras, segurança e suporte com a Microsoft, o Agent Framework remove uma categoria de atrito de aprovação que os outros não removem.

## A leitura da Tyna

O critério proposto — quem mantém depois — é o certo, e vale radicalizá-lo: **essa é praticamente a única pergunta que importa.**

A escolha de framework quase nunca fracassa por limitação técnica. Fracassa porque a pessoa que construiu saiu, mudou de time ou foi alocada em outra prioridade, e quem ficou não consegue mexer. Um sistema em LangGraph impecável mantido por uma equipe de operações é um sistema congelado: ninguém altera, porque ninguém entende, e ele vai apodrecendo até alguém decidir refazer.

Para a realidade da empresa brasileira média, isso tem uma implicação desconfortável. **Times de engenharia dedicados a manter agente são raros.** O que existe é um time de produto que também cuida de automação, ou uma pessoa de operações que aprendeu a plataforma. Nesse cenário, escolher a ferramenta mais poderosa é escolher a que vai parar de evoluir primeiro.

Vale acrescentar uma pergunta ao critério: **quando esse framework for descontinuado, quanto do meu sistema vai junto?** Não é hipótese remota — o AutoGen acabou de mostrar como isso acontece com um projeto grande e bem financiado. O padrão híbrido citado no início é a melhor defesa contra isso: manter a lógica de negócio no fluxo, que muda devagar, e isolar o raciocínio em um serviço substituível. Assim a troca de framework atinge uma peça, não o sistema.

## Perguntas frequentes

**P: Ainda vale aprender AutoGen?**
R: Só se você mantém um sistema existente. O desenvolvimento novo migrou para o sucessor, e o AutoGen está em modo de manutenção.

**P: Dá para usar n8n e LangGraph juntos?**
R: Sim, é padrão comum. O n8n cuida de gatilho, integrações e o processo em volta; um serviço em LangGraph cuida da parte que exige raciocínio com estado, chamado por um nó HTTP.

**P: Qual é mais fácil de manter para quem não é engenheiro?**
R: n8n, com folga — o editor visual foi feito para isso. A configuração por papéis do CrewAI é a segunda mais legível sem base sólida de programação.
