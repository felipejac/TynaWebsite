---
title: "Consus: gateway de LLM para dados sensíveis em produção"
description: "O Consus promete rodar modelos de linguagem sobre dados privados sem expor informação a terceiros. O que muda para a governança de IA da empresa."
pubDate: "2026-10-27"
category: "governanca"
tags: ["ai-gateway","dados-sensiveis","lgpd","agentes-de-ia","governanca-de-ia"]
sourceName: "news.ycombinator.com"
originalUrl: "https://automationscookbook.com/blog/consus-llm-gateway-for-sensitive-data-in-production-20261013"
aeoSummary: "O Consus, startup da turma F24 da Y Combinator, lançou um gateway de LLM que fica entre os dados internos da empresa e o modelo, para que dados sensíveis não saiam da rede. Para a governança de IA, o ponto é o mesmo de qualquer AI Gateway: um caminho autorizado, com registro, para o dado que não pode ir a uma ferramenta pública."
draft: false
---

## O que aconteceu

O Consus, startup da turma F24 da Y Combinator, lançou um produto que atua como gateway de LLM para empresas que precisam manter dados privados sob controle. Segundo o anúncio, o serviço fica entre os repositórios internos de dados e o modelo de linguagem, roteando as requisições por um endpoint seguro, local ou em nuvem dedicada, e cuidando localmente de tokenização, inferência e leitura da resposta, de modo que dado bruto não saia da rede da empresa.

O lançamento foi comentado no Hacker News, onde a comunidade o considerou prático para empresas que não podem ou não querem enviar documentos sensíveis a APIs de terceiros. O produto declara suporte a modelos como GPT-4 e Llama e compatibilidade com fluxos de prompt já existentes. Os detalhes técnicos são os informados pelo fabricante.

## Por que isso importa

- **Soberania do dado:** fluxos com dado pessoal ou regulado podem rodar sem enviar o conteúdo a provedores externos de modelo.
- **Menos risco de conformidade:** sem tráfego de saída para APIs externas, caem preocupações de auditoria e de tratamento de dado ligadas a serviços de LLM em nuvem.
- **Custo previsível:** paga-se por infraestrutura, não por token, o que simplifica o orçamento de fluxos com milhões de tokens por mês.
- **Integração simples:** a interface é REST, e pode ser chamada de ferramentas como n8n ou de agentes próprios.

## A leitura da Tyna

O que o Consus mostra é uma tendência que já aparece nas conversas de governança: a pergunta deixou de ser "podemos usar IA?" e passou a ser "por onde o dado passa?". Um gateway é a resposta arquitetural para isso, e a ideia vale mesmo para quem não usa esse produto. Veja o que o conceito entrega em [AI Gateway](/ai-gateway/): um ponto único de acesso, custo, observabilidade e auditoria.

Duas ressalvas práticas. Primeiro, rodar dentro da rede não resolve sozinho a LGPD: ainda é preciso base legal por finalidade, dono por sistema e registro do que foi tratado, como detalhamos em [LGPD e inteligência artificial](/lgpd-e-ia/). Segundo, um gateway só vira ponto de controle se o tráfego real passar por ele. Se o time continuar usando contas pessoais por fora, o gateway cobre só a parte visível. O primeiro passo continua sendo mapear o que já está em uso, com o [checklist de shadow AI](/shadow-ai/).

## Perguntas frequentes

**P: O que é um gateway de LLM?**
R: É uma camada entre os sistemas da empresa e os modelos de linguagem. Centraliza o acesso e pode aplicar regras, como não deixar dado sensível sair, além de registrar o que foi enviado. Veja o guia de [AI Gateway](/ai-gateway/).

**P: O Consus faz ajuste fino (fine-tuning) dos modelos?**
R: Segundo o anúncio, a versão atual cobre só inferência, e o ajuste fino está planejado para uma atualização futura.

**P: Dá para rodar em Kubernetes?**
R: Sim. O serviço é distribuído como imagem de contêiner, o que permite implantação em ambientes orquestrados.

**P: Rodar o modelo dentro da rede basta para cumprir a LGPD?**
R: Não. Reduz a exposição, mas a empresa ainda precisa de base legal por finalidade, contrato com operadores quando houver, registro das operações e atendimento aos direitos dos titulares.
