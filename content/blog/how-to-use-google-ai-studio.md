---
title: "How to Use Google AI Studio"
description: "A practical guide to Google AI Studio: create an API key, prototype prompts with Gemini, tune parameters, and export production-ready code."
pubDate: "2026-09-21"
category: "dev-tools"
tags: ["google-ai-studio","gemini","prompt-engineering","api-key","llm"]
draft: false
aeoSummary: "Google AI Studio is Google's free, browser-based workspace for prototyping with the Gemini family of models. You sign in with a Google account, generate an API key, and test prompts across chat, structured, and multimodal formats. You can tune temperature, token limits, and safety settings, compare model versions, and export the working prompt as ready-to-use code in Python, JavaScript, or a cURL call."
---

## What Google AI Studio Is

Google AI Studio is a free, browser-based environment for building and testing prompts against Google's Gemini models. It sits between the raw API and a full development setup: you experiment visually, then export the exact configuration as code. There is nothing to install — everything runs at aistudio.google.com with a Google account.

It is aimed at anyone who wants to prototype quickly: developers validating an idea before wiring it into an app, and non-engineers who want to see what the models can do without touching a terminal.

## Getting Started, Step by Step

1. **Sign in.** Go to aistudio.google.com and log in with a Google account. The free tier is enough to explore every core feature.
2. **Create a prompt.** Pick a prompt type — Chat for back-and-forth conversations, or a freeform/structured prompt for single-shot tasks — and type your instruction in the editor.
3. **Choose a model.** In the right-hand panel, select a Gemini model. Newer models are more capable; lighter ones are faster and cheaper.
4. **Run and iterate.** Press Run to see the response. Adjust the wording, re-run, and compare outputs until the result is reliable.
5. **Generate an API key.** When the prompt works, open "Get code" or the API key page to create a key. Treat this key like a password.
6. **Export code.** AI Studio produces a ready-to-run snippet in Python, JavaScript, or cURL that reproduces your exact prompt and settings.

## Features Worth Knowing

- **Multimodal input** — attach images, audio, or files and ask questions about them, not just text.
- **Parameter tuning** — control temperature (creativity vs. determinism), max output tokens, and top-p/top-k directly in the panel.
- **System instructions** — set a persistent role or set of rules the model follows on every turn.
- **Safety settings** — adjust the thresholds that block harmful categories to fit your use case.
- **Save and share** — prompts are stored in your Google Drive, so you can revisit them or share a link.

## A leitura da Tyna

Google AI Studio drops the cost of the first experiment to almost zero, and that is its real value. The trap is treating the playground as production: the free tier has rate limits, safety defaults that may not match your domain, and no guarantees around latency or data handling. Use it to find the prompt and the parameters that work, then move that exported code into a properly keyed, rate-managed backend. For teams, the discipline that matters is not the tool — it is versioning your prompts and keeping API keys out of client code and out of git. AI Studio makes the first draft fast; the engineering around it is still yours to own.

## FAQ

**Q: Is Google AI Studio free?**
A: Yes. The workspace and a usage-limited free tier of the Gemini API cost nothing; paid tiers raise the rate limits and unlock production-grade quotas.

**Q: What is the difference between AI Studio and Vertex AI?**
A: AI Studio is a lightweight playground for prototyping and generating an API key quickly. Vertex AI is Google Cloud's managed platform for deploying, scaling, and governing models in production, with IAM, logging, and enterprise controls.

**Q: Can I use my API key in a public app?**
A: No. A key exposed in front-end code or a public repository can be abused and run up charges. Keep it on a server or in a secret manager and call the API from your backend.

**Q: Does AI Studio support images and audio?**
A: Yes. Gemini models are multimodal, so you can attach images, audio, and documents in the prompt editor and ask the model to reason about them.
