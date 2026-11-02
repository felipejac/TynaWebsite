---
title: "IA em seguradoras: o que a SUSEP já espera"
description: "SUSEP e IA: o que a regulação atual já alcança, os riscos de precificação automatizada e o que seguradoras precisam documentar agora."
pubDate: "2026-11-02"
category: "governanca"
tags: ["susep","seguradoras","governanca-de-ia","setor-financeiro","gestao-de-risco"]
aeoSummary: "A SUSEP tem monitorado ativamente o uso de IA em seguradoras, especialmente em precificação de risco e análise de sinistros. A Circular SUSEP 662/2022, que regulamenta o gerenciamento de riscos operacionais, alcança sistemas de decisão automatizada. Seguradoras que usam IA para calcular prêmios ou decidir sobre sinistros precisam documentar como o modelo decide, garantir que o resultado não discrimine ilegalmente e manter trilha de auditoria das decisões."
draft: false
---

O setor de seguros foi um dos primeiros a adotar machine learning em larga escala no Brasil — precificação de risco, análise de sinistros, detecção de fraude. E por isso é também um dos primeiros a lidar com as perguntas que essa adoção gerou.

A SUSEP acompanha esse movimento. Não existe ainda uma circular específica sobre IA para o setor de seguros, mas o regulador já deixou claros alguns sinais do que espera — e o enquadramento existente já cobre boa parte dos sistemas de IA que as seguradoras operam hoje.

## O que a regulação atual já alcança

A Circular SUSEP nº 662/2022, que regulamenta os requisitos mínimos de gerenciamento de riscos operacionais, é o ponto de entrada mais direto. O risco operacional inclui perdas resultantes de falhas em sistemas — e um modelo de IA que toma decisões de subscrição ou sinistros é, para fins regulatórios, um sistema.

Isso significa que a seguradora precisa:

- Identificar os riscos operacionais associados a cada sistema de IA em uso
- Documentar os controles que mitigam esses riscos
- Monitorar indicadores de performance dos sistemas
- Ter um processo definido para quando um sistema apresenta comportamento inesperado

A Circular 662 não menciona IA explicitamente. Mas quando o diretor de riscos da SUSEP faz uma visita técnica e pergunta como a seguradora gerencia o risco de um modelo de precificação que foi atualizado há três meses, a resposta não pode ser "não sabemos".

## O risco específico da precificação por IA

Precificação de seguro é o caso de uso de IA com mais risco regulatório e reputacional no setor. O motivo é simples: o prêmio que o cliente paga é uma decisão diretamente ligada a dados pessoais, e o resultado pode ser discriminatório de formas que o regulador e a opinião pública não aceitam.

Um modelo que aprende padrões históricos de sinistralidade pode, sem que ninguém tenha projetado isso, cobrar mais de grupos com características específicas que não deveriam ser usadas como fator de precificação — e que às vezes nem aparecem diretamente nos dados, mas emergem como proxies.

A SUSEP ainda não publicou orientações específicas sobre uso de variáveis em modelos de precificação. Mas o CDC e a regulação de proteção ao consumidor do próprio setor financeiro já limitam o uso de certos dados para decisões que afetam o cliente. E mais importante: quando um sinistro é negado por um sistema automatizado, o cliente pode contestar, e a seguradora precisa ser capaz de explicar a decisão.

Não é necessário que o modelo seja interpretável de forma técnica. É necessário que a seguradora tenha uma política de explicabilidade — o que ela vai dizer, como vai dizer e para quem — quando uma decisão automatizada é questionada.

## Análise de sinistros: onde a pressão é mais imediata

Se a precificação é o caso de uso com mais risco no horizonte, a análise de sinistros é onde a pressão é mais imediata. Isso por uma razão simples: quando um sinistro é negado, o cliente tem meios de recurso — Ouvidoria, PROCON, SUSEP, Justiça.

Seguradoras que usam IA para triagem ou para suporte à decisão de sinistros precisam de três coisas:

**Documentação da decisão.** Mesmo que a decisão final seja de um ajustador humano, se um modelo contribuiu para ela, isso precisa estar no registro.

**Política de revisão humana.** Para quais tipos de sinistro o modelo decide sozinho? Para quais uma pessoa sempre revisa? O que dispara a revisão humana quando o modelo está incerto?

**Processo de contestação.** Quando o cliente recorre, quem analisa? Essa pessoa tem acesso ao que o modelo processou? Consegue explicar, em termos que o cliente entende, por que a decisão foi tomada?

## Por onde começar

O primeiro passo é o inventário. Quais sistemas de IA sua seguradora opera hoje, quais decisões cada um toma ou suporta, quais dados processam e quem é o responsável por cada um?

O segundo passo é verificar, para cada sistema, se existe documentação do processo de aprovação, da avaliação de risco e dos controles de monitoramento. Na maioria das seguradoras, os sistemas mais antigos nunca passaram por esse processo — eles chegaram a produção num momento em que ninguém fazia essas perguntas.

O terceiro passo é estabelecer um processo para sistemas novos — de modo que o próximo modelo que entrar em produção passe por avaliação antes de ir ao ar, não depois de um incidente.

---

*Para entender onde a sua seguradora está nesse processo, o [diagnóstico de maturidade de governança de IA](https://tyna.com.br/diagnostico/) da Tyna produz uma avaliação em minutos. Veja também o guia sobre [IA no setor financeiro](https://tyna.com.br/ia-no-setor-financeiro/) para o contexto regulatório completo.*
