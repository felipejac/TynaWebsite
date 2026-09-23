---
titulo: LGPD em fluxos de IA
id: lgpd-em-fluxos-de-ia
tipo: conceito
tags: [lgpd, compliance, risco]
resumo: Adequar IA à LGPD exige mapear os dados que trafegam nos fluxos, definir base legal de tratamento e prevenir vazamento em prompts e bases de conhecimento.
publico: [juridico, compliance, ti]
fonte: https://tyna.com.br/ (FAQ publicado)
atualizado: 2026-08-14
confianca: alta
---

# LGPD em fluxos de IA

## Resposta curta

Adequar Inteligência Artificial à LGPD exige três frentes: mapear os dados pessoais
que trafegam nos fluxos de IA, definir a base legal de tratamento para cada um, e
prevenir vazamento em prompts e bases de conhecimento. Em agentes autônomos soma-se
uma quarta: a [[trilha-de-auditoria-de-agente]] — o que o agente leu, decidiu e
executou, recuperável depois do fato.

## Onde o dado pessoal entra sem ninguém notar

**No prompt.** O time cola um caso real para pedir ajuda, e o caso real tem nome,
CPF e histórico.

**Na base de conhecimento.** Um RAG montado sobre a pasta compartilhada indexa tudo
que está lá, inclusive o que nunca deveria ser recuperável por qualquer pessoa que
faça uma pergunta.

**No log.** A observabilidade que se monta para depurar o agente guarda a conversa
inteira, e vira um repositório de dado pessoal que ninguém declarou.

## O ponto que costuma faltar

Base legal por finalidade, não por sistema. "Usamos IA no atendimento" não é
finalidade. Cada tratamento dentro do fluxo tem a sua, e a resposta muda se o dado
serve para responder ao cliente, para treinar modelo ou para análise interna.

## Como a Tyna trata

Serviço correspondente: [[adequacao-lgpd]]. O controle técnico que sustenta boa parte
disso é o [[ai-gateway]], que centraliza o registro do que trafega.

## Relacionado

- [[adequacao-lgpd]]
- [[trilha-de-auditoria-de-agente]]
- [[shadow-ai]]
