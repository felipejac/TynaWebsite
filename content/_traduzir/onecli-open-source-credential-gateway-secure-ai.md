---
title: "TRADUZIR: OneCLI Launches Open‑Source Credential Gateway to Secure AI Agents"
description: "TRADUZIR: Learn how OneCLI’s OSS credential gateway keeps secrets out of AI agents and what it means for n8n and automation builders."
pubDate: "2026-07-24"
category: "dev-tools"
tags: ["agentes-de-ia","gestao-de-segredos","automacao","n8n","opensource"]
sourceUrl: "https://github.com/onecli/onecli"
sourceName: "github.com"
originalUrl: "https://automationscookbook.com/blog/onecli-launches-opensource-credential-gateway-to-secure-ai-a-20260724"
aeoSummary: "TRADUZIR: OneCLI released an open‑source credential gateway that isolates secrets from AI agents, letting them request credentials on demand. This design reduces token leakage risk and simplifies secret management for production automation and AI‑agent workflows."
draft: false
---

## O que aconteceu

<!-- traduzir -->

## Por que isso importa para quem constrói

<!-- traduzir os bullets -->

## A leitura da Tyna

<!-- OBRIGATÓRIO: análise própria, não existe no original -->

## Perguntas frequentes

**P: ?**
R:

<!-- ================= ORIGINAL (apagar ao terminar) =================

## What Happened

OneCLI released a credential gateway that sits between AI agents and secret stores. Agents no longer embed API keys, passwords, or tokens in prompts or workflow definitions. Instead, they call OneCLI’s CLI to fetch a credential at runtime. The gateway authenticates the request, pulls the secret from a configured vault (HashiCorp Vault, AWS Secrets Manager, etc.), and returns a short‑lived token. The GitHub repo (https://github.com/onecli/onecli) contains a small binary, a config schema, and examples for popular AI‑agent frameworks.

The goal is simple: keep secrets out of the prompt‑to‑LLM surface, a common attack vector when agents expose credentials in logs or responses. By centralizing credential access, OneCLI treats secret handling as a first‑class concern for developers building production‑grade AI automation.

## Why This Matters for Builders

- **Reduced Attack Surface**  
  Embedding credentials in workflow definitions or prompt strings can leak them through logging or hallucinations. With on‑demand retrieval, the secret never appears in the prompt. Exposure is limited to the narrow window of the API call.

- **Short‑Lived Tokens**  
  The gateway issues time‑bound tokens that expire after a single request or a few seconds. This aligns with cloud‑API best practices and cuts accidental reuse.

- **Unified Secret Management**  
  Teams using vault solutions can plug OneCLI into their existing store without duplicating secrets. The gateway abstracts the provider, letting agents stay agnostic about the secret’s location.

- **Simplified CI/CD Pipelines**  
  The lightweight binary can be invoked from any script. CI pipelines stay free of hard‑coded secrets. The workflow definition only needs the OneCLI command; the secret is injected at runtime in the execution environment.

- **Auditability**  
  Every credential request passes through a single point. Logging, monitoring, and auditing become straightforward, which is valuable for compliance‑heavy environments.

- **Compatibility with [n8n](/go/n8n) and Similar Orchestrators**  
  n8n nodes can call the OneCLI binary as a shell command or use a custom node that wraps the CLI. Replace static secret fields with dynamic calls, turning a static workflow into a more secure, mutable one without a major redesign.

## FAQ

**Q: How do I integrate OneCLI with an existing n8n workflow?**  
A: Add an "Execute Command" node that runs `onecli get --key my-api-key`. Capture the output and pass it to subsequent nodes. You can also create a reusable custom node that wraps this pattern for cleaner visual flows.

**Q: Does OneCLI add latency to my automation?**  
A: The extra round‑trip to the secret store adds a few hundred milliseconds, negligible for most batch or webhook‑driven workflows. For latency‑critical paths, cache the short‑lived token in memory for the duration of the request.

**Q: Can I enforce role‑based access for different agents?**  
A: Yes. OneCLI supports per‑agent identities and maps them to vault policies. Each agent presents its own identity (e.g., a JWT or service account) when calling the gateway, and the backend enforces the appropriate permissions.

================================================================ -->
