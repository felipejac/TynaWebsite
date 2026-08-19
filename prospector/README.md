# Motor de prospecção da Tyna — Fase 1

Descobre, qualifica e armazena empresas aderentes ao ICP em **São Paulo (capital),
Sorocaba e Campinas**. Fase 1 do sistema maior; as fases seguintes (copy, conversa,
enriquecimento de contato) consomem o que este módulo grava, e não o contrário.

Não faz parte do build do site. `tools/deploy.mjs` publica apenas o que está na lista
`PUBLISH`, então este diretório não vai para produção.

---

## A restrição que define a arquitetura

Uma consultoria que vende governança de IA não pode ter um pipeline de prospecção que
viole os princípios que ela cobra do cliente. Isso não é preciosismo — é a diferença
entre um ativo de vendas e um passivo em auditoria. Três consequências práticas:

**1. Empresa e pessoa são coisas diferentes no modelo de dados.** `CompanyData` descreve
pessoa jurídica a partir de registro público — não é dado pessoal. `LeadProfile` descreve
pessoa natural, e carrega base legal, referência à avaliação de legítimo interesse (LIA),
prazo de retenção e campo de oposição. Tabelas separadas, retenção só na segunda.

**2. Não existe raspador de LinkedIn aqui, e não vai existir.** Os termos de uso da
plataforma proíbem coleta automatizada. Para contato nominal o caminho é a interface
oficial operada por gente, ou página institucional publicada pela própria empresa. O
domínio está na lista `DOMINIOS_PROIBIDOS` do guardrail, junto com Facebook, Instagram,
X e Glassdoor — negado em execução, não por convenção.

**3. Sem LIA registrada, o pipeline recusa rodar.** `PROSPECTOR_LIA_REF` vazio faz
`prospector rodar` abortar antes da primeira requisição. Legítimo interesse sem avaliação
documentada não é base legal, é alegação.

---

## Arquitetura

```
planejar ──► buscar ──► extrair ──► validar ──► armazenar ──► fim
   │           │           │           │            │
   │           │           │           │            └─ SQLite + purga de retenção
   │           │           │           └─ icp.pontuar() — determinístico, sem LLM
   │           │           └─ regex barato; LLM só quando há sinal
   │           └─ API de busca + site próprio (robots.txt)
   └─ ICP versionado gera as SearchQuery

        ▲ guardrail conferido na ENTRADA de cada nó
```

**O LLM é um nó, não o motorista.** Ele extrai evidência de texto coletado e devolve um
schema validado. Quem decide se a empresa entra na lista é `icp.pontuar()`, aritmética
sobre critérios com peso fixo. Isso torna a decisão comercial reproduzível, testável sem
rede e explicável linha a linha — que é exatamente o que a Tyna exige dos clientes em
[/governanca-de-agentes/](https://tyna.com.br/governanca-de-agentes/).

**Nós são funções puras `(RunState) -> RunState`** — a mesma assinatura de nó do
LangGraph. Portar é registrar as funções num `StateGraph`; nenhuma lógica muda. Enquanto
o fluxo for linear e sem ramificação condicional, o grafo não paga o próprio custo.

### Fontes

| Fonte | O que dá | Legitimidade |
| --- | --- | --- |
| **CNPJ aberto** (Receita Federal via BrasilAPI) | município, CNAE, porte, capital social, situação | dado público de registro empresarial, gratuito |
| **API de busca** (Brave ou Tavily) | descoberta de sinal de uso de IA | API oficial, não raspagem de SERP |
| **Site da empresa** | confirmação de sinal e trecho citável | `robots.txt` respeitado, 2s entre requisições, UA identificado |

**Limitação conhecida:** a BrasilAPI resolve um CNPJ por vez — ela não busca por
município e CNAE. Para varredura por praça, a fonte é o dump de dados abertos da Receita
(`dados.gov.br`), carregado uma vez num banco local. Enquanto esse bootstrap não existe,
a descoberta entra pelo domínio (busca web) e o CNPJ é resolvido depois. As empresas
descobertas por domínio recebem CNPJ sintético começando em `00`, que não existe em CNPJ
válido — assim ninguém confunde candidato com empresa identificada.

---

## Guardrails

| Classe | O que impede |
| --- | --- |
| **Orçamento** | teto de chamadas de LLM, de requisições HTTP, de dólares e de duração por rodada — conferido **antes** de cada nó, não depois do gasto |
| **Educação de robô** | `robots.txt`, intervalo mínimo por host, User-Agent que diz quem é e como falar com a gente |
| **Escopo** | plataformas cujos termos proíbem coleta são negadas em execução |
| **LGPD** | lista de supressão consultada antes de armazenar, minimização por campo vedado, retenção com purga automática |

Falha isolada: erro em uma empresa vira `Incidente` registrado e a rodada segue. Falha de
guardrail aborta a rodada inteira — e isso é o comportamento certo.

**Ponto de parada humano:** `--seco` executa tudo sem gravar nada; `--revisar` interrompe
antes de armazenar e devolve o estado para conferência.

---

## Uso

```bash
cd prospector
python -m pip install -e ".[dev]"
cp .env.example .env    # preencha PROSPECTOR_LIA_REF e a chave de busca
```

```bash
prospector rodar --seco                      # ensaio completo, nada gravado
prospector rodar --praca campinas --revisar  # para antes de armazenar
prospector listar --faixa prioritario
prospector opor --email pessoa@empresa.com   # oposição do titular, art. 18 da LGPD
prospector purgar                            # apaga dado pessoal com retenção vencida
```

Testes (nenhum toca rede ou LLM):

```bash
PYTHONPATH=src python -m pytest tests -q
```

---

## A régua do ICP

Fonte: `docs/kb/posicionamento/icp.md` do repositório da Tyna. O ICP escrito diz que o
sinal que qualifica **não é interesse em IA, é uso já acontecendo sem regra** — e os pesos
codificam exatamente isso:

| Critério | Peso | Por quê |
| --- | --- | --- |
| `usa_ia` | 25 | o sinal que qualifica; vale mais que qualquer firmografia |
| `porte` | 15 | abaixo de média não há o que governar |
| `sem_governanca` | 15 | usa IA **e** não publica política, comitê ou norma — a lacuna que a Tyna vende |
| `praca` · `setor_forte` · `ia_em_produto` · `gatilho_lgpd` · `dor_declarada` | 10 cada | |
| `setor_medio` · `ativa` · `site` | 5 cada | |

Faixas por percentual: **prioritário** ≥75, **qualificado** ≥50, **observar** ≥25, abaixo
disso descartado. Toda nota vem com o boletim completo (`ScoredCompany.explicar()`), então
sempre dá para responder por que um lead entrou.

Mudar peso significa mudar `icp.VERSAO`. Sem isso, um lead pontuado em agosto e outro em
outubro não são comparáveis e ninguém percebe.

---

## O que a fase 1 não faz

- Não descobre nome e cargo de pessoas automaticamente. `LeadProfile` existe e está
  validado, mas o preenchimento é manual ou por fonte oficial — é a decisão da seção
  anterior, não uma pendência.
- Não envia nada. Nenhum e-mail, nenhuma mensagem, nenhum formulário preenchido.
- Não resolve domínio → CNPJ com confiabilidade; depende do bootstrap do dump da Receita.
- Não escreve copy. É a fase 2.

## Estrutura

```
prospector/
├── src/prospector/
│   ├── models.py       ← a especificação: LeadProfile, CompanyData, SearchQuery, RunState
│   ├── icp.py          ← ICP versionado, pontuação determinística, plano de busca
│   ├── guardrails.py   ← orçamento, robots.txt, supressão, minimização, retenção
│   ├── sources.py      ← CNPJ aberto, API de busca, site da empresa
│   ├── extract.py      ← o único nó com LLM, com escopo de autonomia escrito
│   ├── storage.py      ← SQLite; empresa e pessoa em tabelas separadas
│   ├── harness.py      ← o loop, os guardrails por nó e o botão de parada
│   └── cli.py
└── tests/              ← 54 testes, nenhum toca rede
```
