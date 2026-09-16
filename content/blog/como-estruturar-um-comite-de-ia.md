---
title: "Como estruturar um comitê de IA"
description: "A maioria dos comitês de IA se reúne e não decide nada. O que separa um comitê com poder real de um que só documenta o que já foi decidido."
pubDate: "2026-09-11"
category: "governanca"
tags: ["governanca-de-ia","comite-de-ia","politica-de-uso-de-ia","compliance","gestao-de-risco"]
aeoSummary: "Um comitê de IA que funciona tem poder formal de aprovar e barrar um caso de uso antes de ele ir para produção, representantes de TI, jurídico ou compliance e das áreas de negócio que realmente usam IA, um prazo máximo de resposta definido por escrito, e um critério objetivo — não subjetivo — para decidir o que precisa passar por ele. Sem essas quatro condições, o comitê vira um rito que documenta decisões já tomadas em vez de uma instância que efetivamente decide."
draft: false
---

Quase toda empresa que leva governança de IA a sério em algum momento cria um comitê. E quase todo comitê de IA que vemos nos primeiros seis meses de um projeto tem o mesmo problema: se reúne, discute, e não decide nada que já não tivesse sido decidido antes da reunião. É um rito de validação, não uma instância de decisão — e a diferença entre os dois é o que determina se o comitê sobrevive ao segundo ano.

## O sintoma que aparece primeiro

O sinal mais claro de que um comitê não tem poder real é a pauta ser sempre sobre casos que já estão em produção. Se o comitê só toma conhecimento depois do fato, ele não está governando nada — está sendo informado. Um comitê de IA que funciona intercepta o caso de uso **antes** de ele ir ao ar, com autoridade real para barrar, não só para recomendar.

## As quatro condições que decidem

**Poder formal de aprovar e barrar.** Precisa estar escrito, em algum documento com peso — política interna, estatuto do comitê, o que for — que nenhum sistema de IA classificado como alto risco entra em produção sem passar pelo comitê. Sem isso escrito, a decisão vira opcional na prática, mesmo que ninguém admita isso em voz alta.

**Composição que cruza áreas.** TI sozinho aprova pela ótica técnica e perde o risco de negócio. Jurídico e compliance sozinhos aprovam pela ótica de exposição e travam qualquer coisa nova. O comitê que funciona tem as duas cadeiras, mais alguém da área de negócio que vai efetivamente usar o sistema — porque essa pessoa é quem sabe se o caso de uso descrito no papel é o que realmente vai acontecer.

**Prazo de resposta definido.** Comitê sem prazo escrito costuma responder em semanas, e a área que precisa da aprovação simplesmente não espera — o caso de uso vai ao ar sem passar por ninguém, e o comitê descobre depois, se descobrir. Um prazo curto e cumprido, mesmo que seja "resposta em cinco dias úteis", é o que mantém o processo formal mais rápido do que o atalho informal.

**Critério objetivo de triagem.** Nem todo uso de IA precisa passar pelo comitê inteiro — um assistente de escrita interno é categoria diferente de um agente que decide crédito. O critério de quando escalar precisa ser objetivo — toca dado pessoal sensível, decide algo sobre uma pessoa, tem contato direto com cliente externo — não "bom senso", porque bom senso é exatamente o que varia de pessoa para pessoa e é o que gera o caso que passa despercebido.

## O que colocar na pauta, de fato

Três tipos de item sustentam a maior parte do valor de um comitê de IA: aprovação de caso de uso novo classificado como risco médio ou alto; revisão periódica dos sistemas já aprovados, porque um agente que era simples no dia da aprovação pode ter ganhado escopo depois; e casos de exceção urgentes, com um processo mais rápido do que a reunião mensal padrão, para não empurrar ninguém a contornar o comitê por pressa.

## A leitura da Tyna

O erro que vemos com mais frequência não é a falta de comitê — é o comitê existir sem nenhuma das quatro condições acima, funcionando como uma reunião de alinhamento com nome de instância de governança. Isso não é inofensivo: dá à empresa uma falsa sensação de controle, que é pior do que a ausência de controle, porque adia a pergunta difícil.

O teste mais rápido para saber se um comitê de IA existente tem poder real: pergunte quando foi a última vez que ele barrou alguma coisa. Se a resposta for "nunca", ou ninguém lembra, o comitê provavelmente está aprovando o que já ia acontecer de qualquer forma — o que é útil para documentação, mas não é o mesmo que governar.

Comitê, política e [AI Gateway](/ai-gateway/) resolvem partes diferentes do mesmo problema, e nenhum sozinho é suficiente. A [política de uso de IA](/blog/politica-de-uso-de-ia-o-que-precisa-ter/) decide as regras gerais; o comitê decide o caso específico que a regra geral não cobre sozinha; o gateway é onde a decisão vira algo tecnicamente verificável depois. Empresa que tem só o primeiro item da lista tem um documento. As três juntas são o que sustenta, na prática, uma resposta de RFP ou uma pergunta de conselho sobre como a IA é decidida ali dentro.

## Perguntas frequentes

**P: Com que frequência um comitê de IA deveria se reunir?**
R: Depende do volume de casos novos, mas mensal costuma ser o mínimo funcional — abaixo disso, a fila de aprovação cresce mais rápido do que o comitê consegue esvaziar e vira o motivo pelo qual as áreas passam a contornar o processo.

**P: Todo sistema de IA precisa passar pelo comitê antes de entrar em produção?**
R: Não — só os classificados como risco médio ou alto por um critério objetivo definido de antemão, como tocar dado pessoal sensível, decidir sobre uma pessoa ou ter contato direto com cliente externo. Passar tudo pelo comitê, sem essa triagem, é o que mais rápido o transforma num gargalo que todo mundo aprende a evitar.

**P: Quem deveria presidir um comitê de IA — TI, jurídico ou a diretoria?**
R: Não há uma resposta universal, mas funciona melhor quando quem preside tem autoridade suficiente para que a decisão do comitê não precise ser reconfirmada em outra instância depois — geralmente alguém em nível de diretoria ou um C-level, com TI, jurídico ou compliance e negócio como membros votantes.
