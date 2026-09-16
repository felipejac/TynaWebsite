---
title: "O que é um AI Gateway (e o que ele resolve)"
description: "AI Gateway não é mais uma ferramenta — é o ponto único de acesso, custo e auditoria por onde as outras passam. O que ele resolve, na prática."
pubDate: "2026-09-11"
category: "governanca"
tags: ["ai-gateway","governanca-de-ia","shadow-ai","custo-de-ia","auditoria"]
aeoSummary: "Um AI Gateway é a camada técnica que centraliza o acesso a modelos e ferramentas de IA numa empresa, unificando autenticação, controle de custo por time, observabilidade do que está sendo usado e trilha de auditoria do que foi enviado e recebido. Ele resolve o problema que política sozinha não resolve: fazer o caminho autorizado ser tão conveniente quanto o atalho, o que é a única forma de shadow AI parar de crescer sem proibir nada."
draft: false
---

"AI Gateway" virou um dos termos mais usados e menos explicados na conversa de governança de IA. Aparece em toda proposta de consultoria e em toda RFP de segurança, e na maioria das vezes ninguém para para dizer, em uma frase, o que é: um ponto único por onde todo acesso a modelo e ferramenta de IA passa, em vez de cada time contratar e configurar o seu.

## O problema que ele resolve

Sem gateway, o padrão em qualquer empresa de porte médio para cima é o mesmo: cada área assina a ferramenta que resolve o problema dela, com a chave de API de alguém, no cartão de alguém, sem que ninguém centralize o que está sendo gasto, o que está sendo enviado ou quem tem acesso a quê. Quando dá para somar — e raramente dá, sem gateway — o número de ferramentas em uso costuma ser bem maior do que a lista formal que TI apresenta. É o mesmo fenômeno que tratamos no [mapeamento de shadow AI](/shadow-ai/): o problema não é imaginário, é só invisível até alguém procurar.

Um AI Gateway resolve isso tecnicamente, não só documentando a regra. Toda chamada a um modelo — da OpenAI, da Anthropic, do Google ou de um modelo aberto rodando internamente — passa por um único ponto, com uma única credencial gerenciada pela empresa, não pela pessoa.

## O que ele entrega, na prática

**Acesso unificado.** Uma credencial da empresa por trás de todos os modelos contratados, em vez de uma chave de API por pessoa ou por time — o que também resolve o problema de uma pessoa sair da empresa levando o acesso, literalmente, no próprio cadastro pessoal.

**Custo por time, por projeto, por modelo.** A pergunta que toda diretoria eventualmente faz — quanto a empresa está gastando com IA — só tem resposta com um ponto único de medição. Sem gateway, a resposta é uma soma de faturas de cartão corporativo, incompleta por definição.

**Observabilidade real.** Não apenas quanto foi gasto, mas o quê foi enviado, para qual modelo, por qual time — a diferença entre saber que a ferramenta existe e saber o que está de fato passando por ela.

**Trilha de auditoria.** Cada chamada fica registrada e é recuperável depois. Quando um cliente questiona uma decisão automatizada, ou uma auditoria pergunta o que um agente fez em um caso específico, essa é a diferença entre reconstruir a resposta e não ter como reconstruir nada.

**Guardrail aplicado no ponto de passagem.** Como todo tráfego passa pelo mesmo lugar, é o ponto natural para aplicar o controle — bloquear um tipo de dado saindo para um modelo específico, por exemplo — sem depender de cada ferramenta implementar isso por conta própria.

## Quando faz sentido implementar um

Não é questão de tamanho de empresa — é de quantas ferramentas e modelos diferentes já estão em uso, mesmo que informalmente. Se a resposta honesta para "quantas ferramentas de IA a empresa usa hoje" é "não sei ao certo", esse já é o sinal. Empresas que ainda usam uma ou duas ferramentas homologadas, com contrato único, sentem menos essa dor — mas esse número costuma crescer mais rápido do que qualquer outra categoria de software já cresceu, então a pergunta não é se vai ser necessário, é quando.

## A leitura da Tyna

O erro mais comum ao avaliar AI Gateway é tratá-lo como projeto de TI, isolado da política de uso. Os dois são a mesma decisão em duas camadas: a [política de uso de IA](/blog/politica-de-uso-de-ia-o-que-precisa-ter/) diz o que pode e o que não pode; o gateway é onde essa regra vira algo que roda de verdade, em vez de depender de alguém lembrar dela. Implementar o gateway sem revisar a política produz uma ferramenta tecnicamente robusta aplicando uma regra que ninguém atualizou. Escrever a política sem o gateway produz exatamente o padrão que vemos com mais frequência: o documento existe, ninguém tem como verificar se está sendo seguido.

Vale reduzir a expectativa em um ponto: gateway não elimina shadow AI sozinho. Ele reduz o motivo de existir, porque o caminho autorizado passa a ser tão rápido quanto o atalho — e essa é a única condição, na nossa experiência, que muda o comportamento de forma duradoura. Proibir sem oferecer alternativa conveniente historicamente não funciona; tratamos disso com mais detalhe [no texto sobre shadow AI](/shadow-ai/).

## Perguntas frequentes

**P: AI Gateway é a mesma coisa que um provedor de modelo, tipo a API da OpenAI direto?**
R: Não — o gateway fica entre a empresa e os provedores de modelo, unificando o acesso a vários deles sob uma única credencial, um único ponto de custo e uma única trilha de auditoria, em vez de a empresa se conectar a cada provedor separadamente.

**P: Um AI Gateway substitui a necessidade de uma política de uso de IA?**
R: Não substitui — ele é onde a política vira algo aplicado tecnicamente. A política decide o que é permitido; o gateway é o ponto por onde dá para verificar, e em parte aplicar, se essa regra está sendo seguida na prática.

**P: Pequenas e médias empresas também precisam de AI Gateway, ou é só para empresa grande?**
R: Depende de quantas ferramentas de IA diferentes já estão em uso, não do tamanho da empresa — uma empresa média com meia dúzia de ferramentas sem controle central tem o mesmo problema de visibilidade e custo que uma empresa grande, só que descoberto mais tarde, porque tem menos gente perguntando.
