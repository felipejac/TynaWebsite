---
title: "Projetos no Claude: o que colocar em instruções, contexto, memória e tarefas programadas"
seoTitle: "Projetos no Claude: instruções, contexto, memória e tarefas"
description: "Instruções, contexto, memória e tarefas programadas têm funções diferentes nos projetos do Claude. O que vai em cada campo, com modelos prontos para adaptar."
pubDate: "2026-09-16"
category: "automation"
tags: ["claude","claude-cowork","projetos","engenharia-de-prompt","tarefas-programadas","automacao"]
aeoSummary: "Um projeto no Claude tem quatro campos com funções distintas: instruções definem como o Claude trabalha e só devem conter regras permanentes; contexto reúne o material de referência que ele consulta; memória guarda as decisões tomadas durante o trabalho e vale só para aquele projeto; e tarefas programadas executam trabalhos recorrentes na nuvem, com conectores e arquivos da conta Claude. Misturar essas funções é o que faz as respostas ficarem genéricas com o tempo."
draft: false
---

Quase todo mundo começa um projeto no Claude do mesmo jeito: cola um parágrafo no campo de instruções, sobe dois ou três PDFs e começa a conversar. Na primeira semana, funciona. Na terceira, as respostas estão genéricas, o Claude repete perguntas que você já respondeu e os documentos de referência ficaram desatualizados sem que ninguém percebesse.

O problema quase nunca está no modelo. Está na configuração. Um projeto tem quatro campos, e cada um cumpre uma função diferente. Quando essas funções se misturam — regras no contexto, briefing nas instruções —, o Claude perde a noção do que é norma, do que é consulta e do que é histórico.

Este guia explica o que vai em cada campo e traz modelos prontos para adaptar.

## Onde ficam esses campos

No Claude Cowork, os projetos reúnem tarefas relacionadas em espaços de trabalho próprios, cada um com seus arquivos, contexto, instruções e memória. Eles funcionam da mesma forma no Cowork e no chat do Claude, mas é no Cowork que os quatro campos aparecem juntos. O recurso exige a versão mais recente do Claude Desktop, segundo a [central de ajuda da Anthropic](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork).

Quem já tem projetos no chat não precisa recomeçar: na importação, o Cowork copia os arquivos e as instruções do projeto existente para o novo. Uma divisão que costuma funcionar bem é usar o chat para pensar e pesquisar, e o Cowork para produzir.

## Instruções: como o Claude deve trabalhar

Neste campo você define tom, formatação e regras que valem para todas as tarefas do projeto. Como o texto acompanha cada conversa, ele só deve conter o que não muda. Descrição de cliente, lista de serviços e histórico de negociação ficam fora daqui.

Um bom texto de instruções responde a cinco perguntas: qual é o papel do Claude, qual é o objetivo do projeto, quem vai ler o resultado, como deve ser o texto e o que ele nunca deve fazer. Escreva em frases imperativas e específicas. "Seja claro" não orienta ninguém. "Abra cada documento com a tese principal em até duas frases" orienta.

O modelo abaixo é de um projeto de consultoria em IA voltado a prospecção e propostas comerciais:

```
Papel
Você atua como consultor sênior de estratégia em IA para empresas B2B brasileiras de médio porte. Seu trabalho é apoiar a prospecção, o diagnóstico e a elaboração de propostas.

Objetivo
Transformar conversas iniciais em propostas com escopo fechado e valor de negócio mensurável.

Público
Diretores de operações, marketing e vendas: pouco técnicos, com pouco tempo e que decidem com base em impacto, prazo e risco.

Estilo
- Português brasileiro, prosa direta e frases declarativas.
- Todo documento abre com a tese principal em até duas frases.
- Sem emoji e sem jargão vazio.
- Termos técnicos só quando necessários, explicados na primeira ocorrência.

Padrões de entrega
- Propostas seguem esta ordem: contexto, problema, solução, escopo, fora do escopo, cronograma, premissas e investimento.
- Todo benefício citado vem acompanhado da métrica que vai medi-lo.
- Prazos são apresentados em faixas, com as premissas explícitas.

Regras
- Não invente dados, cases ou números. Se faltar informação, pergunte antes de redigir.
- Sinalize riscos de LGPD sempre que a solução envolver dados pessoais.
- Quando uma recomendação não tiver base sólida, diga isso.
- Consulte os arquivos de contexto antes de citar serviços, preços ou metodologia.
```

A última regra é a mais importante: ela liga as instruções ao contexto e impede que o Claude preencha lacunas com suposições.

## Contexto: o que o Claude deve consultar

Aqui entram as referências. O campo aceita uma pasta do computador, um projeto do chat vinculado ou uma URL colada. Portfólio, tabela de preços, metodologia, cases, guia de marca e modelos de documento ficam neste campo.

Duas práticas fazem diferença. A primeira é manter um assunto por arquivo, com nome descritivo: um PDF de 60 páginas com tudo junto é mais difícil de consultar do que sete arquivos curtos. A segunda é criar um arquivo-índice que explique o que existe e qual fonte prevalece em caso de conflito:

```
00-LEIA-PRIMEIRO.md

Material de referência oficial da consultoria. Em caso de conflito entre arquivos, vale o de data mais recente.

- 01-portfolio-servicos.md: serviços, entregáveis e formatos de contratação
- 02-tabela-precos-2026.md: faixas de investimento. Não cite valores fora desta tabela.
- 03-metodologia.md: etapas do diagnóstico e da implementação, com duração típica
- 04-cases.md: projetos autorizados para citação, com resultados
- 05-icp.md: perfil de cliente ideal e critérios de desqualificação
- 06-modelo-proposta.md: estrutura de proposta aprovada
- 07-objecoes.md: objeções comuns e respostas validadas

Revisão trimestral de preços e cases. Última revisão: [data].
```

Outro detalhe útil: a pasta que guarda o contexto não precisa ser a mesma em que os resultados são salvos. Isso ajuda quando vários projetos consultam a mesma pasta de referência e cada um entrega em um lugar diferente, como mostra [este guia do The Signal](https://thesignal.substack.com/p/how-to-setup-projects-in-claude).

## Memória: o que já foi decidido

A memória guarda o contexto do trabalho feito dentro do projeto. Ela vale só para aquele projeto e vem ativada por padrão. Diferentemente das instruções, esse campo não é preenchido de uma vez: ele se forma com o uso.

Você influencia a memória pelo que diz durante o trabalho. Pedidos explícitos geram registros mais úteis do que deixar o Claude deduzir:

```
Registre: a Empresa X tem ciclo de aprovação de 45 dias e exige parecer jurídico antes da assinatura.

Registre como padrão deste projeto: propostas acima de [valor] sempre incluem uma fase-piloto paga.

Corrija: o serviço de governança agora se chama "Programa de Governança de IA".

Esqueça a negociação com a Empresa Y. O processo foi encerrado.
```

Vale registrar decisões, padrões aprovados, correções que você repete com frequência e o status de clientes em andamento. Não vale registrar rascunhos, dados sensíveis ou qualquer coisa que já esteja nos arquivos de contexto: informação duplicada em dois lugares acaba divergindo.

Como a memória não passa de um projeto para outro, clientes e frentes de trabalho diferentes devem ter projetos separados.

## Tarefas programadas: o que roda sem você

Com as tarefas programadas, você descreve um trabalho uma vez e o Claude o executa no horário definido, entregando relatórios, briefings e resumos. Dentro de um projeto, essas tarefas pertencem só àquele projeto.

Antes de configurar, vale conhecer três características do recurso, descritas na [documentação de tarefas programadas](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork):

- **Rodam na nuvem.** A tarefa executa no horário marcado mesmo com o computador em repouso ou o Claude Desktop fechado.
- **Trabalham com conectores e arquivos da conta.** Elas não podem ser vinculadas a uma pasta do computador, e uma tarefa que dependa de arquivos ou aplicativos locais só roda localmente. Por isso, arquivos citados nos prompts, como `05-icp.md`, precisam estar salvos na sua conta Claude.
- **Exigem plano pago.** O recurso está disponível nos planos Pro, Max, Team e Enterprise, com frequência por hora, diária, semanal, em dias úteis ou manual.

Como ninguém acompanha a execução, o prompt precisa se sustentar sozinho: deve dizer o que pesquisar, em quais fontes, em que formato entregar e o que ignorar. Três exemplos:

### Radar semanal de mercado (segunda-feira, 8h)

```
Pesquise as notícias dos últimos 7 dias sobre adoção de IA generativa em empresas brasileiras, regulação de IA no Brasil e lançamentos de ferramentas de IA para atendimento, vendas e marketing.

Entregue no máximo 8 itens. Para cada um: o fato em uma frase, a fonte com link e uma linha sobre como isso afeta a conversa com clientes.

Ignore conteúdo promocional, rankings sem metodologia e notícias com mais de 7 dias. Se um tema não tiver novidade na semana, informe isso em uma linha.
```

### Lista de prospecção (quarta-feira, 9h)

```
Com base em 05-icp.md, identifique até 10 empresas brasileiras com sinais recentes de interesse em IA: vagas na área, expansão, rodada de investimento ou declarações de executivos nos últimos 14 dias.

Para cada empresa, informe: nome, setor, porte estimado, sinal encontrado (com link) e um gancho de abordagem em uma frase.

Exclua as empresas que se enquadrem nos critérios de desqualificação. Não invente contatos nem dados que não estejam em fontes públicas.
```

### Revisão de objeções (sexta-feira, 10h)

```
Leia 07-objecoes.md e pesquise argumentos recentes sobre custo, risco e retorno de projetos de IA.

Sugira até 3 ajustes nas respostas existentes e até 2 objeções novas, cada uma com a fonte que motivou a sugestão.

Não altere o arquivo. Entregue as sugestões para aprovação.
```

A última linha do terceiro exemplo segue uma boa regra para qualquer tarefa automática: tudo o que altera material oficial passa por aprovação humana.

## Como os quatro campos se completam

Cada campo responde a uma pergunta:

- **Instruções:** como trabalhar.
- **Contexto:** o que consultar.
- **Memória:** o que já foi decidido.
- **Tarefas programadas:** o que acontece sem você.

Quando uma informação parece caber em dois campos, pergunte com que frequência ela muda. Regras permanentes vão para as instruções. Material de referência vai para o contexto. Fatos que surgem do trabalho diário ficam na memória.

Nenhuma dessas configurações fica certa na primeira versão. Leia os resultados das primeiras execuções, anote o que faltou e o que sobrou, e ajuste. Um projeto bem configurado é resultado de três ou quatro rodadas desse ajuste.

## A leitura da Tyna

Os quatro campos de um projeto são uma versão em miniatura do que uma empresa precisa para usar IA com controle. As instruções equivalem à [política de uso de IA](/politica-de-uso-de-ia/): regras escritas, que valem para toda tarefa. O contexto é a fonte oficial, com dono e data de revisão. A memória é o registro de decisões. E as tarefas programadas são automação — o ponto em que, sem revisão humana, o erro se repete toda semana sem ninguém ver, como tratamos em [governança de agentes de IA](/governanca-de-agentes/).

Dois cuidados valem para qualquer time que adote esse modelo. O primeiro é a LGPD: memória e arquivos de contexto são lugares por onde dado pessoal entra sem que ninguém decida, como nome de contato, telefone e detalhes de negociação. A regra de não registrar dados sensíveis deve valer também para dados pessoais de clientes, e o assunto está detalhado em [LGPD e IA](/lgpd-e-ia/). O segundo é a responsabilidade: quando o projeto vira ferramenta do time, alguém precisa responder pela revisão trimestral do contexto. Sem dono, o arquivo-índice envelhece e o Claude passa a citar preço antigo com toda a confiança.
