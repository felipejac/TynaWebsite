---
title: "Riscos de privacidade em agentes de IA conversacionais"
description: "Estudo sobre apps e sites com agentes de IA conversacionais aponta envio de identificadores e consultas a APIs de terceiros. O que a empresa deve revisar."
pubDate: "2026-10-27"
category: "governanca"
tags: ["privacidade","lgpd","agentes-de-ia","dados-pessoais","governanca-de-ia"]
sourceName: "jorgegarciaherrero.com"
originalUrl: "https://automationscookbook.com/blog/privacy-risks-of-web-mobile-conversational-ai-agents-20260929"
aeoSummary: "Uma análise de privacidade de agentes conversacionais em sites e apps aponta que muitos enviam identificadores, localização e o texto completo das consultas a APIs de terceiros, frequentemente sem criptografia adequada ou consentimento claro. Para a empresa, o recado é inventariar para onde o dado vai e aplicar o mínimo necessário nos prompts."
draft: false
---

## O que aconteceu

Jorge Garcia-Herrero publicou *A Privacy Analysis of Web and Mobile Conversational AI Agents*. O relatório mostra que muitas páginas e apps enviam identificadores de usuário, dados de localização e o texto completo das consultas a APIs de terceiros. Padrões de tráfego, cabeçalhos de requisição e conteúdo dos prompts revelam transmissão frequente de dados pessoais, e a maior parte das implementações analisadas não teria criptografia ou mecanismos de consentimento adequados. A auditoria cobriu vários sites e apps de alto tráfego e conclui que o componente de conversa funciona como um "widget de fachada" que encaminha dados a serviços em nuvem sem controles de privacidade apropriados. Os achados são os do estudo citado.

## Por que isso importa

- **Vazamento sem perceber:** fluxos que levam a entrada do usuário a um agente de IA podem enviar esse dado a APIs externas sem que a equipe saiba.
- **Consentimento e transparência:** é preciso um fluxo claro de consentimento antes de enviar dados a serviços externos.
- **Transporte e armazenamento:** TLS entre os fluxos e os serviços de IA e criptografia do que for guardado.
- **Auditoria:** registrar e monitorar as requisições de saída para saber para onde o dado vai.
- **Dado mínimo:** retirar do prompt o contexto não essencial antes de enviar.

## A leitura da Tyna

Esse tipo de estudo costuma ser lido como problema de quem constrói o chat. Para a empresa que *contrata* ou *incorpora* agentes conversacionais, a pergunta útil é outra: que dado pessoal entra em cada fluxo e para qual fornecedor ele vai? Na prática, o dado pessoal entra por três portas que o inventário tradicional não enxerga: o prompt, a base de conhecimento e o log. Detalhamos cada uma em [LGPD e inteligência artificial](/lgpd-e-ia/).

Três providências que cabem em uma semana: listar os fluxos de IA com dado pessoal e o fornecedor de cada um, conferir os termos de retenção e de uso do conteúdo para treinamento, e decidir quando o fluxo merece um [relatório de impacto](/relatorio-de-impacto-lgpd-ia/). A [política de uso de IA](/politica-de-uso-de-ia/) deve dizer qual dado pode entrar em qual ferramenta.

## Perguntas frequentes

**P: Como evitar que um fluxo vaze dado de usuário para um serviço externo de IA?**
R: Use uma camada que limpe o prompt antes do envio, aplique criptografia em trânsito, registre todo tráfego de saída e peça consentimento explícito antes de enviar dados.

**P: Modelos hospedados localmente resolvem o problema de privacidade?**
R: Reduzem o tráfego para terceiros, mas exigem infraestrutura e manutenção, e a empresa continua responsável por base legal, retenção e acesso.

**P: O que verificar no processo de entrega do agente?**
R: Análise estática dos modelos de prompt, checagens em execução para dado pessoal e testes automáticos de que o dado não sai do ambiente controlado sem autorização.

**P: Isso vale para empresas brasileiras?**
R: Sim. A LGPD se aplica a qualquer tratamento de dado pessoal, inclusive o que passa por agentes conversacionais. Veja [LGPD e IA](/lgpd-e-ia/).
