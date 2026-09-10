# Dados do comparativo de AI Gateways

Fonte da tabela publicada em [/ai-gateway/comparativo/](../../ai-gateway/comparativo/).

| Arquivo | O que é |
| --- | --- |
| `ai-gateways-set-2026.json` | os 124 registros como saíram da planilha de origem, sem normalização |
| `comparativo-molde.html` | a página sem os dados, com os marcadores `__TBODY__` e `__SELECTS__` |
| `gerar-comparativo-gateways.py` | normaliza, escreve o CSV público e remonta a página |

```bash
python tools/dados/gerar-comparativo-gateways.py
```

Regrava dois arquivos: `ai-gateway/comparativo/ai-gateways-set-2026.csv` (o download
público) e `ai-gateway/comparativo/index.html`. A página inteira sai daqui — editar o
HTML publicado à mão faz a próxima execução do script apagar a edição. Texto novo vai
no molde.

**Por que a tabela vai no HTML e não é montada por JavaScript.** São 124 linhas de
dado mais 124 de detalhe, renderizadas pelo servidor. `assets/comparativo.js` só
esconde, mostra e reordena o que já está lá. Tabela montada no cliente é página vazia
para quem chega sem JS e para o rastreador que indexa antes de executar script — e o
valor desta página inteira é ser indexável.

**Normalização.** Cada campo filtrável ganha dois valores: o rótulo agrupado, que vira
o `data-*` do filtro, e o texto original da planilha, que fica visível na célula.
"Self-hosted (K8s)" filtra como `Self-hosted` sem que a célula reescreva a fonte.

**"A verificar" é ausência de informação confirmada**, não ausência de licença ou de
país — 62 licenças e 55 origens estão nesse estado. Preencher por estimativa
melhoraria a aparência da tabela e destruiria a única coisa que ela promete.

**Ao atualizar o corte:** troque o JSON, rode o script, e mude a data no molde em três
lugares — o `<title>` e a `<meta description>`, o `temporalCoverage` do
JSON-LD `Dataset`, e a linha "Corte:" acima da tabela. A entrada correspondente em
`ai.json` e `llms.txt` também cita os números da distribuição.
