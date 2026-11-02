---
title: "BACEN e IA: o que os bancos brasileiros precisam saber em 2026"
description: "O Banco Central já sinaliza que sistemas de decisão automatizada entram no escopo da Resolução 4.557. O que isso significa para bancos e fintechs que usam IA."
pubDate: "2026-11-02"
category: "governanca"
tags: ["bacen","governanca-de-ia","setor-financeiro","ia-em-bancos","gestao-de-risco"]
aeoSummary: "A Resolução 4.557 do Banco Central, que regulamenta o gerenciamento de riscos em instituições financeiras, já alcança sistemas de IA que tomam decisões de crédito, compliance e atendimento. O BACEN exige documentação de como o modelo decide, monitoramento de desvios e capacidade de explicar uma decisão a um cliente ou ao próprio regulador. Bancos que não documentam seus sistemas de IA correm risco em auditorias e na Ouvidoria."
draft: false
---

Quando o tema é regulação de IA no Brasil, a maior parte das discussões se concentra na LGPD e no PL 2.338. O Banco Central raramente aparece nessa conversa — e deveria.

A Resolução CMN nº 4.557, que regulamenta a estrutura de gerenciamento de riscos de instituições financeiras, tem uma implicação direta para qualquer banco ou fintech que usa modelos de machine learning ou IA generativa em processos de decisão: **esses sistemas são parte da estrutura de gestão de risco**, e o regulador espera que sejam tratados como tal.

Não há uma circular específica sobre IA. O que há é uma exigência geral de que as instituições identifiquem, avaliem, monitorem e controlem os riscos a que estão expostas — e IA é um vetor de risco novo, com características que o framework tradicional não cobria.

## O que o BACEN já espera, mesmo sem circular de IA

Quando um modelo decide se aprova ou rejeita um crédito, ele está no escopo da política de risco de crédito. Quando classifica uma operação como suspeita de lavagem de dinheiro, está no risco operacional e no compliance PLD/FT. Quando um chatbot de atendimento toma uma decisão que afeta o cliente — mesmo que seja encaminhar para um humano —, ele está no risco operacional.

Em todos esses casos, o BACEN espera que a instituição consiga responder a três perguntas:

**Quem aprovou esse sistema?** Não quem assinou o papel de go-live, mas quem é o responsável pela política que define o que o modelo pode e não pode decidir.

**Como o sistema é monitorado?** Derivação de performance, viés em subgrupos de clientes, taxa de erro em diferentes cenários — o regulador quer ver que alguém está olhando.

**O que acontece quando erra?** Qual é o processo para identificar, corrigir e comunicar uma decisão automatizada errada? Isso inclui a Ouvidoria e, em alguns casos, o próprio BACEN.

## O risco específico das decisões de crédito por IA

O CDC e a regulação do BACEN estabelecem que o consumidor tem o direito de saber os motivos da recusa de crédito. Quando um modelo de score automatizado rejeita uma solicitação e a instituição não consegue explicar por quê em termos inteligíveis — seja para o cliente ou para o regulador —, há um problema duplo: regulatório e operacional.

O ponto não é que IA generativa ou modelos complexos sejam proibidos. O ponto é que a opacidade não é aceitável. Um modelo pode ser complexo internamente e ainda assim produzir uma explicação plausível da decisão. O que não é aceitável é que a resposta para "por que o crédito foi negado" seja "o modelo decidiu assim".

## Open Finance e os novos dados que o modelo processa

O Open Finance ampliou o conjunto de dados que bancos podem usar para decisões de crédito. Isso criou uma nova camada de risco que poucos mapearam: quando um modelo usa dados de portabilidade para tomar uma decisão, ele está processando dados que o cliente autorizou compartilhar para uma finalidade específica.

Usar esses dados além da finalidade autorizada é um problema da LGPD. Mas o BACEN também tem interesse, porque a confiança no Open Finance depende de que os dados sejam usados da forma que o cliente autorizou.

Documentar a base de dados de cada modelo — de onde vêm os inputs, qual é a base legal para usá-los, qual é o propósito da decisão — é parte do que um framework de governança de IA precisa cobrir em instituições financeiras.

## Por onde começar

A maioria dos bancos e fintechs médios não tem um inventário completo dos sistemas de IA em uso. O ponto de partida é entender o que existe antes de decidir o que regular.

O segundo passo é mapear quais desses sistemas tomam decisões que afetam clientes diretamente — crédito, compliance, atendimento — e documentar quem é o responsável por cada um.

O terceiro passo é definir como cada sistema é monitorado e o que acontece quando apresenta desvio de performance ou comportamento inesperado.

Isso não requer uma circular específica do BACEN. Requer que a instituição aplique ao IA o mesmo rigor que já aplica, por exigência regulatória, a outros processos de decisão.

---

*Se você quer entender onde a sua instituição está nesse caminho, o [diagnóstico de maturidade de governança de IA](https://tyna.com.br/diagnostico/) da Tyna devolve uma avaliação em minutos. Ou leia mais sobre [IA no setor financeiro](https://tyna.com.br/ia-no-setor-financeiro/) no nosso guia completo.*
