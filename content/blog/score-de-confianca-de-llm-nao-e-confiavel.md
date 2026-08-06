---
title: "Score de confiança de LLM não é confiável"
description: "Modelos são treinados para gerar texto fluente, não probabilidade calibrada. Fluxo que decide por limiar está apoiado em ruído."
pubDate: "2026-07-28"
category: "llm"
tags: ["llm","scores-de-confianca","automacao","agentes-de-ia","boas-praticas"]
sourceName: "análise publicada"
originalUrl: "https://automationscookbook.com/blog/llm-confidence-scores-why-theyre-unreliable-for-production-w-20260728"
aeoSummary: "Modelos de linguagem não produzem scores de confiança confiáveis porque são treinados para gerar texto fluente, não probabilidade calibrada. Quando se pede um valor de confiança, o modelo devolve uma heurística interna sem significado estatístico. Fluxos que decidem por limiar — do tipo 'se confiança maior que 0,8, prossiga' — estão apoiados em ruído."
draft: false
---

## O que aconteceu

Uma análise recente sustenta que modelos de linguagem não conseguem produzir scores de confiança confiáveis. O argumento é direto: esses modelos são treinados para gerar texto fluente, não probabilidade calibrada. Quando o desenvolvedor pede um valor de confiança, o que volta é uma heurística interna, não uma métrica estatisticamente significativa.

O texto cita falhas concretas: um bot de atendimento que confiou em resposta de baixa confiança, um pipeline que marcou como errado um registro correto, e um script de automação que tomou decisão cara com base em um pico falso de confiança. Nos três casos, o score foi mais ruído do que sinal.

## Por que isso importa para quem constrói

- **Integridade da decisão** — fluxos frequentemente usam limiar do tipo "se confiança maior que 0,8, prossiga". Score não confiável quebra a cadeia inteira.
- **Tratamento de erro** — construir contingência em torno de uma checagem de confiança não ajuda se o valor de base é falho: a contingência herda o defeito.
- **Desperdício** — valor inflado dispara chamada de API, escrita em banco ou escalonamento humano desnecessários.
- **Risco de conformidade** — em ambiente regulado, métrica de confiança não verificada pode descumprir requisito de auditoria ou mascarar a incerteza real do modelo.

### O que fazer no lugar

1. **Evite limiar rígido sobre saída de LLM.** Cruze com verificação por regra, validação de esquema ou um segundo modelo.
2. **Faça checagem de sanidade.** Se o modelo declara 0,95 mas a resposta tem erro factual evidente, encaminhe para revisão humana.
3. **Combine sinais.** Agregar saídas de prompts ou modelos diferentes reduz a dependência de um número só.
4. **Degrade com elegância.** Diante de incerteza, recorra a um padrão seguro ou peça esclarecimento em vez de prosseguir.
5. **Registre e monitore.** Guarde o score e a decisão que veio depois, para expor descalibração sistemática ao longo do tempo.

## A leitura da Tyna

Este é o post mais importante do lote, e o motivo é desconfortável: **o padrão criticado aqui é o que quase todo agente em produção usa hoje.**

O apelo do limiar é fácil de entender. Quem vem de aprendizado de máquina clássico está habituado a classificadores que devolvem probabilidade de fato calibrada — treinada para isso, validada contra frequência observada. Aplicar o mesmo raciocínio a LLM parece natural e é uma armadilha: o número tem a mesma aparência e não tem a mesma origem. É texto gerado, não estatística.

Há um agravante que o texto não menciona e que vemos com frequência. O score não é aleatório — ele é **confiantemente errado de forma correlacionada**. O modelo tende a declarar confiança alta justamente onde a resposta soa plausível, e resposta plausível e errada é o pior caso possível. Ou seja, o sinal falha exatamente onde você mais precisava dele.

Para quem tem fluxo rodando com limiar hoje, o roteiro de saída não exige reescrever tudo. Comece registrando o score junto com o resultado verificado por algumas semanas. Se a distribuição mostrar que 0,9 acerta tanto quanto 0,6, você tem o dado para justificar internamente a mudança — e provavelmente vai encontrar exatamente isso.

E o mais valioso: em muitos casos, ao tentar substituir o score por uma verificação objetiva, o time descobre que a verificação sozinha resolve. Se dá para validar o CNPJ, conferir o esquema ou checar a regra, o modelo não precisava opinar sobre a própria certeza.

## Perguntas frequentes

**P: Dá para usar score de confiança se eu calibrar o modelo?**
R: Calibração ajuda, mas exige volume de dado e monitoramento contínuo. Em muitos cenários de produção, o custo supera o benefício, sobretudo quando existe verificação mais simples disponível.

**P: Que alternativas existem para medir incerteza?**
R: Perplexidade em nível de token, repetição do prompt ou um modelo secundário de verificação. Combinar sinais costuma render estimativa mais robusta.

**P: Como migrar um fluxo que hoje depende de limiar?**
R: Reordene a lógica para aplicar verificação por regra primeiro e recorrer ao modelo só depois. Substitua o limiar rígido por controle que inclua revisão humana ou verificação adicional.
