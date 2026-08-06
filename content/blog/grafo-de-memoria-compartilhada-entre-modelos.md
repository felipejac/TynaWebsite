---
title: "Grafo de memória compartilhada entre Claude e ChatGPT"
description: "Estrutura em memória que guarda histórico e estado da tarefa, consultável por qualquer modelo — sem repassar contexto no prompt."
pubDate: "2026-07-31"
category: "ai-agents"
tags: ["memoria-compartilhada","agentes-de-ia","mcp","automacao","n8n"]
sourceName: "projeto de comunidade"
originalUrl: "https://automationscookbook.com/blog/shared-memory-graph-for-claude-chatgpt-over-mcp-20260731"
aeoSummary: "Um projeto de comunidade disponibilizou um grafo de memória compartilhada que roda sobre MCP e guarda histórico de conversa, estado da tarefa e dados de contexto em memória. Qualquer modelo participante consulta o grafo em vez de receber o contexto inteiro dentro do prompt, o que reduz o tamanho da carga e mantém coerência quando mais de um modelo atua na mesma tarefa."
draft: false
---

## O que aconteceu

A comunidade disponibilizou um grafo de memória compartilhada para Claude e ChatGPT, rodando sobre MCP. O grafo é uma estrutura leve, mantida em memória, que guarda histórico de conversa, estado da tarefa e dados de contexto. Qualquer modelo participante consulta esse grafo, o que dispensa repassar longas cadeias de contexto dentro do prompt. O resultado é resposta mais rápida e coerência preservada quando vários modelos atuam na mesma tarefa.

A implementação é de código aberto e se encaixa em pilhas existentes. Oferece uma API simples que fluxos de n8n, agentes próprios ou qualquer microsserviço podem chamar para ler ou escrever. Quem adotou cedo relata ganho perceptível ao coordenar dois modelos em um mesmo pipeline.

## Por que isso importa para quem constrói

- **Menos latência** — enviar o histórico inteiro como prompt infla a carga. O grafo mantém em memória só os nós relevantes, o que reduz o tamanho da requisição.
- **Estado consistente entre modelos** — vários modelos leem o mesmo retrato do grafo, o que garante que trabalhem sobre dados idênticos e corta alucinação causada por contexto defasado.
- **Fluxo mais simples de desenhar** — vários passos de envio de prompt viram um nó de leitura do grafo, e o editor visual fica mais limpo.
- **Colaboração em escala** — quem opera dezenas de agentes pode particionar ou replicar o grafo, escalando na horizontal sem duplicar contexto entre serviços.
- **Auditoria e depuração** — o grafo registra o momento de criação de cada nó e as relações de origem, o que torna direto rastrear como um modelo chegou a determinada decisão.

## A leitura da Tyna

O item de auditoria, listado por último, é o que mais deveria interessar a quem opera sob regulação — e conecta com um ponto que já levantamos ao falar de memória sem tokens: **contexto dentro do prompt é praticamente impossível de auditar depois.**

Quando o histórico viaja como texto dentro da requisição, reconstruir o que o modelo viu no momento da decisão exige guardar cada prompt inteiro, e ainda assim você tem um bloco de texto, não um registro estruturado. Com o grafo, cada leitura vira um nó com origem e carimbo de tempo. A diferença entre "acho que ele tinha essa informação" e "às 14h32 ele leu este nó" é a diferença entre passar e não passar numa auditoria.

Duas ressalvas antes de adotar.

A primeira é de contenção. Estado compartilhado entre modelos é estado compartilhado — com todos os problemas clássicos de concorrência. Dois agentes escrevendo no mesmo nó em paralelo é uma condição de corrida, e o material não deixa claro qual é a estratégia de resolução.

A segunda é de privacidade, e é a mais séria. Um grafo comum a Claude e ChatGPT significa que **dado colocado ali por um modelo é enviado ao outro fornecedor** quando o segundo consulta. Se o grafo carrega dado pessoal de cliente, você acabou de criar um compartilhamento entre dois operadores distintos. Isso precisa estar no mapeamento de tratamento, com base legal — não é detalhe de implementação.

## Perguntas frequentes

**P: Preciso de infraestrutura nova?**
R: Não. O grafo roda em memória na mesma máquina que hospeda seus agentes, e pode ser embutido no contêiner ou função que já roda sua instância de n8n.

**P: Funciona com outros modelos além de Claude e ChatGPT?**
R: A API é genérica. Qualquer modelo que aceite carga de contexto estruturada pode ser conectado, e a comunidade já experimenta com outros.

**P: Como manter o estado se o serviço reiniciar?**
R: O grafo pode ser serializado para um armazenamento leve, como Redis ou um arquivo JSON, no desligamento, e recarregado na inicialização. Mantém a velocidade da memória com durabilidade.
