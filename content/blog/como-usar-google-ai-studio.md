---
title: "Como usar Google AI Studio"
description: "Guia prático do Google AI Studio: crie uma chave de API, prototipe prompts com Gemini, ajuste parâmetros e exporte código pronto para produção."
pubDate: "2026-09-21"
category: "dev-tools"
tags: ["google-ai-studio","gemini","engenharia-de-prompt","chave-de-api","llm"]
draft: false
aeoSummary: "O Google AI Studio é o ambiente gratuito e baseado em navegador do Google para prototipar com a família de modelos Gemini. Você entra com uma conta Google, gera uma chave de API e testa prompts em formatos de chat, estruturados e multimodais. É possível ajustar temperatura, limite de tokens e configurações de segurança, comparar versões de modelos e exportar o prompt pronto como código em Python, JavaScript ou uma chamada cURL."
---

## O que é o Google AI Studio

O Google AI Studio é um ambiente gratuito, executado no navegador, para criar e testar prompts contra os modelos Gemini do Google. Ele fica entre a API pura e um setup de desenvolvimento completo: você experimenta de forma visual e depois exporta a configuração exata como código. Não há nada para instalar — tudo roda em aistudio.google.com com uma conta Google.

Ele serve para quem quer prototipar rápido: desenvolvedores validando uma ideia antes de integrá-la a um app, e pessoas não técnicas que querem ver o que os modelos fazem sem abrir um terminal.

## Primeiros passos, um a um

1. **Entre na conta.** Acesse aistudio.google.com e faça login com uma conta Google. O nível gratuito já basta para explorar todos os recursos principais.
2. **Crie um prompt.** Escolha o tipo de prompt — Chat para conversas de ida e volta, ou um prompt livre/estruturado para tarefas de resposta única — e digite sua instrução no editor.
3. **Escolha um modelo.** No painel à direita, selecione um modelo Gemini. Modelos mais novos são mais capazes; os mais leves são mais rápidos e baratos.
4. **Rode e itere.** Clique em Run para ver a resposta. Ajuste o texto, rode de novo e compare as saídas até o resultado ficar confiável.
5. **Gere uma chave de API.** Quando o prompt estiver funcionando, abra "Get code" ou a página de chave de API para criar uma. Trate essa chave como uma senha.
6. **Exporte o código.** O AI Studio gera um trecho pronto para rodar em Python, JavaScript ou cURL que reproduz exatamente o seu prompt e as configurações.

## Recursos que vale conhecer

- **Entrada multimodal** — anexe imagens, áudio ou arquivos e faça perguntas sobre eles, não só texto.
- **Ajuste de parâmetros** — controle temperatura (criatividade vs. determinismo), máximo de tokens de saída e top-p/top-k direto no painel.
- **Instruções de sistema** — defina um papel fixo ou um conjunto de regras que o modelo segue em cada turno.
- **Configurações de segurança** — ajuste os limiares que bloqueiam categorias nocivas conforme o seu caso de uso.
- **Salvar e compartilhar** — os prompts ficam guardados no seu Google Drive, então dá para revisitá-los ou compartilhar por link.

## A leitura da Tyna

O Google AI Studio derruba o custo do primeiro experimento para quase zero, e esse é o seu real valor. A armadilha é tratar o playground como produção: o nível gratuito tem limites de requisição, padrões de segurança que podem não bater com o seu domínio e nenhuma garantia de latência ou de tratamento de dados. Use-o para achar o prompt e os parâmetros que funcionam e depois leve esse código exportado para um backend com chave protegida e controle de requisições. Para times, a disciplina que importa não é a ferramenta — é versionar os prompts e manter as chaves de API fora do código do cliente e fora do git. O AI Studio deixa o primeiro rascunho rápido; a engenharia em volta continua sendo sua responsabilidade.

## Perguntas frequentes

**P: O Google AI Studio é gratuito?**
R: Sim. O ambiente e um nível gratuito com limite de uso da API do Gemini não custam nada; os planos pagos elevam os limites de requisição e liberam cotas de produção.

**P: Qual é a diferença entre o AI Studio e a Vertex AI?**
R: O AI Studio é um playground leve para prototipar e gerar uma chave de API rapidamente. A Vertex AI é a plataforma gerenciada do Google Cloud para implantar, escalar e governar modelos em produção, com IAM, logs e controles corporativos.

**P: Posso usar minha chave de API em um app público?**
R: Não. Uma chave exposta no código de front-end ou em um repositório público pode ser abusada e gerar cobranças. Mantenha-a em um servidor ou em um gerenciador de segredos e chame a API pelo seu backend.

**P: O AI Studio suporta imagens e áudio?**
R: Sim. Os modelos Gemini são multimodais, então você pode anexar imagens, áudio e documentos no editor de prompt e pedir que o modelo raciocine sobre eles.
