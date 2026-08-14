---
title: "AutoGen em modo de manutenção: quando migrar"
description: "A Microsoft fundiu AutoGen e Semantic Kernel em um framework único. O antigo segue recebendo correção, não recursos novos."
pubDate: "2026-07-21"
category: "ai-agents"
tags: ["autogen","frameworks","agentes-de-ia","migracao","divida-tecnica"]
sourceName: "Microsoft"
originalUrl: "https://automationscookbook.com/blog/autogen-to-microsoft-agent-framework-migration-guide"
aeoSummary: "A Microsoft fundiu o AutoGen, seu framework de pesquisa para conversas multiagente, com o Semantic Kernel, seu SDK corporativo, e passou a distribuir o resultado como um framework único. O AutoGen entrou em modo de manutenção: continua recebendo correção de segurança, mas recursos novos e projetos novos são direcionados ao sucessor."
draft: true
---

## O que aconteceu

A Microsoft fundiu o AutoGen — seu framework de pesquisa para conversas multiagente — com o Semantic Kernel, seu SDK corporativo de agentes, e passou a distribuir o resultado como um framework único. O AutoGen entrou em modo de manutenção: continua recebendo correção de segurança, mas recursos novos e projetos novos são direcionados ao sucessor.

Não é uma troca de nome. Os dois projetos tinham centros de gravidade distintos. O AutoGen otimizava para conversas multiagente flexíveis, voltadas a pesquisa. O Semantic Kernel otimizava para consistência de SDK entre Python, C# e Java, com integração mais próxima do Azure. O framework unificado é a tentativa de preservar os padrões de conversa do primeiro dando a eles a história de produção e governança do segundo.

## O que isso significa se você constrói agentes hoje

Para projeto novo, comece pelo sucessor. Começar pelo AutoGen seria construir sobre um caminho que a própria fornecedora já anunciou que está encerrando.

Para sistema em produção, não há motivo para migração de emergência. Modo de manutenção significa que continua funcionando e continua recebendo correção. Mas vale orçar a migração como dívida técnica planejada, e não como algo a revisitar um dia — a distância entre o framework antigo e o ferramental atual só aumenta.

O risco prático não é o AutoGen parar de funcionar de repente. É o ecossistema em volta — tutorial, resposta de comunidade, integração de terceiro — passar a assumir o sucessor, o que torna depurar um sistema antigo mais lento a cada trimestre de espera.

## O que verificar antes de migrar

- **Padrões de conversa multiagente** — os padrões de conversa em grupo e aninhada têm equivalentes no sucessor, mas a superfície de API é diferente o bastante para não ser substituição automática. Planeje reexecutar os testes de fluxo de conversa, não só reimportar.
- **Dependências de Azure** — se o time já está imerso no ecossistema, a integração mais próxima é ganho líquido, não só custo de migração.
- **Distribuição entre linguagens** — se o time entrega agentes em mais de uma linguagem, a consistência é exatamente a proposta do sucessor. Avalie se esse ganho paga o esforço na sua pilha.
- **Integrações de terceiro** — audite de quais plugins ou padrões específicos você depende antes de supor que atravessam a migração sem alteração.

Se a lógica do seu agente é simples o bastante para ser, na prática, uma chamada de modelo envolvida em repetição de tentativa — sem conversa multiagente, sem estado complexo —, pode sair mais barato reconstruir essa peça do que migrar todo o andaime de um framework mais pesado.

## A leitura da Tyna

O trecho final é o mais valioso do texto e o que mais costuma ser ignorado: **boa parte do que se chama de agente em produção não precisa de framework de agente.**

Vale o teste honesto. Se o seu sistema faz uma chamada de modelo, trata erro e grava o resultado, ele é um script — e um framework multiagente ali dentro é peso morto que agora virou dívida de migração. Frameworks de agente resolvem coordenação entre vários agentes, controle fino de transição de estado e retomada de execução. Se você não tem nenhum desses três problemas, está pagando o custo sem receber o benefício.

Esse episódio deveria servir de lembrete de custo. **Escolher framework é assumir o cronograma de outra empresa.** Quem construiu sobre o AutoGen tomou uma decisão razoável na época e agora tem trabalho não planejado. Isso não é erro de julgamento; é o preço normal da dependência — e é um preço que vale pagar quando o framework resolve um problema real, e não quando ele foi adotado por ser o que apareceu no tutorial.

Para quem tem sistema em AutoGen rodando hoje, a decisão prática não é "migrar ou não". É **separar o que precisa do framework do que não precisa.** Frequentemente a parte que justifica a migração é pequena, e o resto sai mais barato reescrito direto.

## Perguntas frequentes

**P: Preciso migrar imediatamente?**
R: Não. Modo de manutenção significa que continua recebendo correção de segurança. Migre no seu tempo, mas não comece projeto novo sobre ele.

**P: O framework novo substitui também o Semantic Kernel?**
R: Sim. É a fusão dos dois em um só, então projetos de Semantic Kernel também caminham para lá ao longo do tempo.

**P: A migração é automatizada ou é reescrita?**
R: Espere reescrita parcial. Os conceitos centrais atravessam, mas a superfície de API difere o suficiente para exigir novo teste dos fluxos de conversa e das integrações.
