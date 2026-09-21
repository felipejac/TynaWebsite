---
title: "TRADUZIR: AutoGen Is in Maintenance Mode — Migrating to Agent Framework"
description: "TRADUZIR: Microsoft merged AutoGen and Semantic Kernel into Agent Framework in October 2025. Here's what actually changes and how to plan the move."
pubDate: "2026-07-21"
category: "ai-agents"
tags: ["autogen","microsoft-agent-framework","semantic-kernel","agent-frameworks","migration"]
sourceUrl: "https://learn.microsoft.com/agent-framework"
sourceName: "learn.microsoft.com"
originalUrl: "https://automationscookbook.com/blog/autogen-to-microsoft-agent-framework-migration-guide"
aeoSummary: "TRADUZIR: In October 2025, Microsoft merged AutoGen and Semantic Kernel into a single Microsoft Agent Framework, and AutoGen is now in maintenance mode. Teams on AutoGen should plan a migration rather than start new work on it, though the merge preserves most of AutoGen's core multi-agent conversation concepts under a new SDK."
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

## What happened

Microsoft folded [AutoGen](/go/autogen) — its research-driven multi-agent conversation framework — into [Semantic Kernel](/go/semantic-kernel), its enterprise agent SDK, and shipped the result as a single [Microsoft Agent Framework](/go/microsoft-agent-framework) in October 2025. AutoGen is now in maintenance mode: it still gets security patches, but new features and new projects are directed to Agent Framework instead.

This isn't a rename. AutoGen and Semantic Kernel had genuinely different design centers — AutoGen optimized for flexible, research-friendly multi-agent conversations; Semantic Kernel optimized for enterprise SDK consistency across Python, C#, and Java, with tighter Azure integration. Agent Framework is Microsoft's attempt to keep AutoGen's conversation patterns while giving them Semantic Kernel's production and governance story.

## Why this matters if you're building agents now

If you're starting a new project today, start on Agent Framework, not AutoGen — you'd otherwise be building on a track Microsoft has already said is winding down. If you have an existing AutoGen system in production, you don't need to panic-migrate; maintenance mode means it keeps working and keeps getting patched. But budget the migration as planned technical debt rather than something to revisit "eventually" — the gap between AutoGen and current tooling only grows.

The practical risk isn't that AutoGen stops working overnight. It's that the ecosystem — tutorials, community answers, third-party integrations — increasingly assumes Agent Framework, which makes debugging an aging AutoGen system slower every quarter you wait.

## What to actually check before migrating

- **Multi-agent conversation patterns**: AutoGen's group-chat and nested-conversation patterns have Agent Framework equivalents, but the API surface is different enough that this isn't a find-and-replace job — plan to re-test conversation flows, not just re-import.
- **Azure dependencies**: if you're already deep in Azure AI Foundry, Agent Framework's tighter integration is a net win, not just a migration cost.
- **Language spread**: if your team ships agents in more than one of Python/C#/Java, Agent Framework's whole pitch is consistency across those — evaluate whether that consistency is worth the migration effort for your specific stack.
- **Third-party tool integrations**: audit which AutoGen-specific plugins or tool-calling patterns you depend on before assuming they carry over unchanged.

If your agent logic is simple enough that it's really just an LLM call wrapped in retry logic — no multi-agent conversation, no complex state — it may be cheaper to rebuild that piece directly than to migrate a heavier framework's worth of scaffolding for it. That's a case where moving the logic into an [n8n workflow](/guides/ai-workflow-automation) that calls the model directly can be simpler than carrying framework-specific abstractions forward at all.

## FAQ

**Q: Do I have to migrate off AutoGen immediately?**
A: No. Maintenance mode means it keeps receiving security patches. Migrate on your own timeline, but don't start new projects on it.

**Q: Does Agent Framework replace Semantic Kernel too?**
A: Yes — it's the merger of both AutoGen and Semantic Kernel into one framework, so Semantic Kernel projects are also moving toward it over time.

**Q: Is the migration mostly automated, or a rewrite?**
A: Expect a partial rewrite. Core concepts carry over, but the API surface differs enough that conversation flows and tool integrations need re-testing, not just re-importing.

================================================================ -->
