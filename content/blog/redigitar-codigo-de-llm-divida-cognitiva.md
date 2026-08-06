---
title: "Redigitar o código que a IA escreveu: o antídoto contra dívida cognitiva"
description: "Um engenheiro passou a digitar à mão o código gerado por LLM em vez de copiar e colar. Os bugs em produção caíram."
pubDate: "2026-08-04"
category: "llm"
tags: ["automacao","llm","divida-cognitiva","boas-praticas","revisao-de-codigo"]
sourceUrl: "https://ankursethi.com"
sourceName: "ankursethi.com"
originalUrl: "https://automationscookbook.com/blog/manual-retyping-of-llm-code-to-avoid-cognitive-debt-20260804"
aeoSummary: "Redigitar manualmente o código gerado por LLM, em vez de copiar e colar, força o desenvolvedor a ler e entender cada linha. Um engenheiro relatou queda em incidentes após adotar a prática: o ato de digitar expôs importações faltando, peculiaridades de formatação e erros sutis de lógica que passariam despercebidos. O custo é alguns minutos a mais; o retorno é menos tempo de depuração depois."
draft: false
---

## O que aconteceu

Um engenheiro que trabalha em uma plataforma de automação com IA começou a encontrar bugs depois de publicar código gerado por LLM. A solução que adotou foi pouco tecnológica: em vez de copiar e colar, passou a redigitar o código à mão.

No processo, foram aparecendo peculiaridades de formatação, importações faltando e erros sutis de lógica que o modelo havia introduzido — e que sobreviveriam a uma leitura rápida. O resultado relatado foi queda nos incidentes após a publicação e atualizações posteriores mais rápidas, porque o código no repositório era código que alguém de fato tinha entendido.

## Por que isso importa para quem constrói

- **Detecção precoce de bug** — digitar obriga a ler e compreender cada linha, o que pega erro que ferramenta automatizada deixa passar.
- **Menos dívida cognitiva** — as premissas escondidas no código gerado por máquina vêm à tona, e a manutenção futura fica mais barata.
- **Integração mais tranquila de novos membros** — código escrito por humano comunica intenção com mais clareza para quem chega depois.
- **Ferramental funciona melhor** — código produzido conscientemente se encaixa melhor em linter, verificador de tipos e esteira de CI.
- **Mitigação de risco em produção** — a revisão manual evita que uma falha de automação vire uma cascata de indisponibilidade.

## A leitura da Tyna

O termo dívida cognitiva merece destaque, porque nomeia algo que times sentem antes de conseguir descrever.

Dívida técnica é código ruim que funciona. Dívida cognitiva é código que funciona e **ninguém entende** — e é uma dívida mais perigosa, porque não aparece em métrica nenhuma. O repositório passa nos testes, a cobertura está boa, o linter está limpo. O problema só se revela no dia em que algo quebra e a pessoa responsável descobre que não sabe explicar por que aquela função existe.

Geração por LLM acelera a criação dessa dívida de um jeito que nenhuma prática anterior conseguiu. Antes, escrever mil linhas por dia exigia entender mil linhas por dia. Esse acoplamento se rompeu.

A recomendação de redigitar tudo, porém, não escala — e o próprio relato admite isso ao sugerir a prática para módulos críticos. O princípio útil por trás dela é mais simples de aplicar: **ninguém publica código que não sabe explicar em voz alta**. Redigitar é uma das formas de chegar lá, não a única. Revisão em par sobre o código gerado, ou a obrigação de escrever o teste à mão antes de aceitar a implementação, produzem o mesmo efeito com menos atrito.

Para quem tem agente publicando código, o ponto vira governança: a barreira não é o LLM escrever, é quem assina embaixo.

## Perguntas frequentes

**P: Redigitar compensa em relação a rodar linter automático?**
R: Os minutos a mais no início costumam se pagar no tempo de depuração que você não gasta depois. Não é substituto de linter — pega uma classe diferente de erro, a de lógica e de premissa.

**P: Como encaixo isso na esteira de CI/CD?**
R: Trate a versão redigitada como a fonte de verdade e rode as ferramentas contra ela.

**P: É viável em base de código grande?**
R: Como prática geral, não. A recomendação é aplicar em módulos críticos e adotar uma abordagem híbrida no resto.
