---
title: "Como criar um agente de IA para sua empresa, com segurança"
seoTitle: "Como criar um agente de IA para empresa com segurança"
description: "O que realmente protege os dados da empresa num agente de IA, o que não está protegido e o passo a passo da criação, campo por campo, com código pronto."
pubDate: "2026-09-18"
category: "governanca"
tags: ["agentes-de-ia","seguranca-da-informacao","governanca-de-ia","claude","api","lgpd"]
aeoSummary: "A proteção dos dados de uma empresa num agente de IA depende menos do fornecedor escolhido e mais de sob qual contrato a conta opera — termos de consumidor ou termos comerciais — e de como o agente foi configurado. Os cinco mecanismos que fazem o trabalho são isolamento por workspace, política de permissão por ferramenta, execução em sandbox gerenciado ou próprio, fixação da geografia de inferência e rastro de auditoria por evento. O erro mais comum é subir o agente com os padrões de fábrica: o conjunto de ferramentas já vem liberado para executar bash, escrever arquivos e buscar na web sem pedir aprovação a ninguém."
draft: false
---

A pergunta que todo diretor de tecnologia faz quando alguém propõe colocar um agente de IA para rodar sobre dados internos é sempre a mesma: para onde vão esses dados. A resposta depende menos de qual fornecedor você escolhe e mais de sob qual contrato a sua conta opera e de como o agente foi configurado.

Este artigo cobre as duas coisas. Primeiro, o que de fato protege os dados de uma empresa num agente construído no Claude Platform, incluindo o que não está protegido. Depois, o passo a passo da criação do agente, campo por campo.

## A linha que separa tudo não é entre fornecedores

O divisor decisivo é entre termos de consumidor e termos comerciais. Nas contas individuais — Free, Pro e Max — as atualizações de termos de consumidor se aplicam a esses planos, inclusive quando o Claude Code é usado a partir dessas contas, e não se aplicam aos serviços sob os Termos Comerciais, incluindo Claude for Work, Claude for Government, Claude for Education e o uso da API, inclusive via terceiros como Amazon Bedrock e Vertex AI. Nas contas comerciais, a regra é outra: por padrão, a Anthropic não usa entradas ou saídas de produtos comerciais para treinar modelos, e isso só muda se alguém reportar feedback explicitamente ou optar por permitir esse uso.

Essa diferença tem consequência prática. Um funcionário que cola um contrato de cliente no Claude a partir da conta pessoal dele está operando sob um regime de dados; o mesmo contrato processado por um agente na plataforma opera sob outro. A auditoria de [shadow AI](/shadow-ai/) — contas pessoais usadas para trabalho — costuma ser o achado mais desconfortável de qualquer diagnóstico de governança.

O ponto vale contra o marketing de qualquer fornecedor, inclusive o da Anthropic: não é o preço do plano que define a proteção. É o contrato.

## Os cinco mecanismos que fazem o trabalho

**Isolamento por workspace.** O workspace é a unidade de contenção da plataforma. Toda requisição roda em exatamente um workspace e só acessa recursos daquele workspace. Chaves de API podem ser limitadas a um único workspace, e arquivos, batches e skills são escopados por workspace. Os caches de prompt também são isolados. Cada workspace pode ter seu próprio teto de gasto mensal, seus próprios limites de taxa e papéis distintos por membro, de quem só usa o playground a quem administra.

**Políticas de permissão por ferramenta.** Aqui está o controle mais importante e o mais mal configurado. Cada conjunto de ferramentas do agente recebe uma política que decide se a ferramenta executa sozinha, pausa esperando aprovação ou é avaliada chamada a chamada pelo servidor. São três valores: `always_allow`, `always_ask` e `auto`. O detalhe que mais gera susto: o conjunto de ferramentas do agente tem `always_allow` como padrão, enquanto conjuntos MCP têm `always_ask`. Ou seja, um agente criado sem configuração explícita executa bash, escreve arquivos e busca na web sem pedir nada a ninguém.

**Execução em sandbox, própria ou da Anthropic.** As sessões rodam num sandbox na nuvem da Anthropic ou num sandbox auto-hospedado na infraestrutura da própria empresa. A segunda opção existe para requisitos de compliance e residência de dados, e muda o modelo de responsabilidade: no auto-hospedado, o conteúdo da conversa e as saídas das ferramentas passam pelo seu worker e permanecem no seu ambiente, e a Anthropic não tem visibilidade sobre o que o worker faz com esse conteúdo depois da entrega. Em troca, imagem do sandbox, controles de egresso de rede, armazenamento e rotação da chave de serviço e isolamento de cargas não confiáveis passam a ser seus.

**Fixação da geografia de inferência.** O agente pode ser fixado numa geografia com o campo `inference_geo`, que aceita `us` ou `global`. A validação é dura: o pin é checado quando o agente é salvo, quando uma sessão é criada e a cada turno servido, e nunca é dispensado, porque os workspaces dependem disso para compliance e residência de dados.

**Rastro de auditoria.** Cada evento de uso de ferramenta carrega `evaluated_permission`, com o resultado da checagem — allow, ask ou deny — e, na maioria dos casos, um objeto de avaliação que nomeia a política que produziu aquele resultado. Dá para reconstruir, depois do fato, por que cada ação aconteceu. Fora isso, o feed de atividade retém dados por seis anos e a Compliance API expõe transcrições e conteúdo organizacional.

## O que não está protegido

Três limitações precisam estar na mesa antes de qualquer decisão.

A primeira, e a mais relevante: o Managed Agents é stateful por desenho. As sessões são longas, retomam depois de pausas e armazenam histórico de conversa, estado do sandbox e saídas no servidor. Por isso, não é atualmente elegível a Zero Data Retention nem à cobertura de BAA de HIPAA. A contrapartida é que você mantém controle sobre esses dados e pode apagar sessões, e separadamente apagar arquivos enviados, a qualquer momento pela API. Se a sua exigência regulatória é retenção zero, o caminho é a Messages API com o seu próprio loop de agente.

A segunda: a política `auto` não é um ponto de controle humano. A documentação é explícita ao dizer que, se o servidor determinar que a chamada é segura, ela roda antes que qualquer pessoa veja, e os efeitos podem não ser reversíveis. Quando uma pessoa precisa revisar antes, o valor correto é `always_ask`.

A terceira: intenção declarada pesa na avaliação. O que você envia em eventos `user.message` conta como sua intenção e pode levar o servidor a permitir uma chamada que negaria de outro modo. O servidor não toma instruções de resultados de ferramentas, páginas buscadas ou respostas de servidores MCP, mas, se você repassa entrada de usuário final não confiável dentro de `user.message`, essa entrada é lida como sua intenção. Para agentes expostos a usuários externos, isso significa configurar `always_ask` nas ferramentas que você não deixaria aquele usuário executar sem revisão.

## Comparação direta

| | Conta individual | Claude Code | Agente no Claude Platform |
| --- | --- | --- | --- |
| Contrato | Termos de consumidor | Depende da conta | Termos comerciais |
| Treinamento nos seus dados | Controlado por configuração | Não sob termos comerciais | Não por padrão |
| Onde o código executa | Não executa código da empresa | Máquina do desenvolvedor | Sandbox gerenciado ou próprio |
| Controle de permissão | Do usuário, na hora | Do desenvolvedor, na hora | Declarado na configuração |
| Isolamento administrativo | Nenhum | Workspace criado automaticamente | Workspace com papéis e tetos |
| Quem responde pelo dado | O funcionário | O desenvolvedor | A organização |

A diferença que mais importa está na penúltima linha. No Claude Code, quem decide se um comando roda é a pessoa sentada na frente do terminal, no momento em que a pergunta aparece. No agente de plataforma, essa decisão é tomada antes, por escrito, versionada, e passa a valer para todas as execuções. É a diferença entre confiar no julgamento individual e codificar uma política.

## Criando o agente, campo por campo

O exemplo é um extrator estruturado: recebe texto bruto e devolve JSON validado contra um schema. É um bom caso de uso inicial porque o escopo é estreito e o critério de sucesso é objetivo.

Antes de começar, três pré-requisitos: uma chave de API, o cabeçalho de beta `managed-agents-2026-04-01` em todas as requisições e acesso ao Managed Agents, que vem habilitado por padrão para contas de API. O recurso está em beta, e comportamentos podem ser refinados entre versões.

### Passo 1: criar o workspace antes do agente

Essa etapa costuma ser pulada e é a que mais custa depois. No console, em Settings › Workspaces, crie um workspace dedicado ao agente e defina teto de gasto e limites de taxa — só administradores da organização podem criar workspaces. Depois, gere uma chave escopada àquele workspace. É isso que impede que um erro de configuração consuma a cota de produção da empresa inteira ou acesse arquivos de outro projeto.

Adicione ao workspace apenas quem precisa, com o menor papel que resolve. Membros comuns da organização não entram automaticamente: precisam ser adicionados um a um.

### Passo 2: escrever a definição do agente

O agente é uma configuração reutilizável e versionada que define persona e capacidades, reunindo modelo, prompt de sistema, ferramentas, servidores MCP e skills. Você cria uma vez e referencia por ID em cada sessão.

```yaml
name: Structured extractor
description: Parses unstructured text into a typed JSON schema.
model:
  id: claude-opus-5
  effort: low
system: |-
  You extract structured data from unstructured text. Given raw input
  (emails, PDFs, logs, transcripts, scraped HTML) and a target JSON schema:

  1. Read the schema first. Note required vs optional fields, enums, and
     format constraints (dates, currencies, IDs). The schema is the
     contract — never emit a key it doesn't define.
  2. Scan the input for each field. Prefer explicit values over inferred
     ones. If a required field is genuinely absent, use null rather than
     guessing. If the schema itself is absent, do not guess it either:
     propose one and ask before you extract.
  3. Normalize as you extract: trim whitespace, coerce dates to ISO 8601,
     strip currency symbols into numeric + code, collapse enum synonyms
     to their canonical value.
  4. Emit a single JSON object (or array, if the schema is a list) that
     validates against the schema. No prose, no markdown fences — just
     the JSON.

  When the input is ambiguous, pick the most conservative interpretation
  and note the ambiguity in a top-level "_extraction_notes" field only if
  the schema allows additionalProperties.
tools:
  - type: agent_toolset_20260401
    default_config:
      permission_policy:
        type: auto
metadata:
  template: structured-extractor
```

**name** é obrigatório e é o nome legível do agente. Vale tratar como identificador operacional: quem for ler um log de auditoria seis meses depois precisa saber do que se trata sem abrir a configuração. Não pode ser limpo depois.

**description** descreve o que o agente faz. É opcional e pode ser limpo passando `null`. Num ambiente com vários agentes, é o que distingue "Structured extractor" de "Invoice parser" para quem não escreveu nenhum dos dois.

**model** é obrigatório e aceita uma string com o ID ou um objeto. São suportados os modelos Claude 4.5 e posteriores. A forma de objeto é o que libera os campos `speed`, `effort` e `inference_geo`, e por isso é a forma que vale usar por padrão em contexto corporativo: sem ela, não há como fixar geografia de inferência.

**model.effort** controla o nível de esforço e aceita `low`, `medium`, `high`, `xhigh` ou `max`, como string ou objeto. O exemplo usa `low` porque extração estruturada contra um schema conhecido é tarefa de execução, não de raciocínio aberto: esforço alto aqui gasta mais e não melhora o resultado. Existe uma armadilha na atualização — se você mudar o `id` do modelo e omitir `effort`, o valor volta ao padrão do novo modelo. Se o `id` continua o mesmo, omitir `effort` preserva o que estava lá.

**system** é o prompt de sistema que define comportamento e persona, e é distinto das mensagens de usuário, que descrevem o trabalho a ser feito. A separação importa mais do que parece: o que você põe em `system` vale para todas as sessões e não muda; o que a aplicação envia como evento de usuário é a tarefa específica. Prompt de sistema que descreve uma tarefa é erro de arquitetura, não de redação.

O prompt do exemplo faz três coisas que valem copiar. Ele estabelece um contrato explícito: o schema manda, nunca emita uma chave que ele não defina. Ele dá uma instrução de fallback para dado ausente, `null` em vez de chute, que é a regra que separa extração confiável de alucinação educada. E ele manda o agente parar e perguntar quando o próprio schema não veio, em vez de inventar um.

**tools** define as ferramentas disponíveis, combinando o conjunto pré-construído, ferramentas MCP e ferramentas customizadas. O `agent_toolset_20260401` é o conjunto pré-construído: bash, operações de arquivo, busca e fetch na web.

O bloco `default_config.permission_policy` é o campo de segurança da configuração. O exemplo usa `auto`, que faz o servidor avaliar cada chamada considerando a ferramenta, a entrada e o conteúdo da sessão até aquele ponto, com três desfechos: a chamada roda, é negada ou pausa esperando aprovação. Quando é negada, o agente recebe um resultado de erro e o seu cliente não pode sobrepor a negação. Nenhum conjunto de ferramentas usa `auto` por padrão: é preciso pedir.

**metadata** aceita pares chave-valor arbitrários para rastreamento próprio. O exemplo marca `template: structured-extractor`, o que permite agrupar agentes criados a partir do mesmo molde. Metadados são mesclados por chave na atualização: chaves enviadas são adicionadas ou atualizadas, chaves omitidas são preservadas, e para apagar uma chave você a define como `null`.

### Passo 3: apertar as permissões

A configuração acima é razoável para um extrator que só lê texto. Para qualquer agente com acesso a sistemas reais, o padrão que recomendo é liberar o conjunto por avaliação e exigir confirmação humana nas ferramentas de efeito irreversível:

```yaml
tools:
  - type: agent_toolset_20260401
    default_config:
      permission_policy:
        type: auto
    configs:
      - name: bash
        permission_policy:
          type: always_ask
```

O array `configs` sobrescreve o padrão para ferramentas individuais. Sessões em execução mantêm a configuração com que foram criadas; mudanças valem para sessões criadas depois. Isso significa que endurecer a política não interrompe o que está rodando — e também que não adianta apertar a configuração no meio de um incidente.

Quando uma chamada pausa, a sessão emite um evento de uso de ferramenta e para com status `requires_action`, aguardando indefinidamente. A resposta vai num evento `user.tool_confirmation` com `allow` ou `deny`, e `deny_message` para explicar a recusa — texto que chega ao agente e orienta a próxima tentativa.

### Passo 4: escolher o formato

O YAML acima não é o único jeito de criar o agente, e a escolha do formato tem implicação organizacional.

**YAML pela CLI.** Há duas variantes. O comando `ant beta:agents create` aceita YAML puro via heredoc. Já o `ant apply` trabalha com um arquivo Markdown que traz a configuração em frontmatter e o prompt de sistema no corpo, abaixo dos três traços:

```markdown
---
name: Structured extractor
model:
  id: claude-opus-5
  effort: low
tools:
  - type: agent_toolset_20260401
---

You extract structured data from unstructured text...
```

Esse é o formato que faz sentido para uma equipe: o arquivo vive no repositório, passa por pull request e é aplicado por um job de CI. Com `ant apply`, você edita o arquivo e roda o comando de novo, e o apply cuida do controle de versão.

**cURL.** É a forma canônica, útil para entender o que está acontecendo e para ambientes sem SDK:

```bash
curl -fsSL https://api.anthropic.com/v1/agents \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: managed-agents-2026-04-01" \
  -H "content-type: application/json" \
  -d '{
    "name": "Structured extractor",
    "model": {"id": "claude-opus-5", "effort": "low"},
    "system": "You extract structured data from unstructured text...",
    "tools": [{
      "type": "agent_toolset_20260401",
      "default_config": {"permission_policy": {"type": "auto"}}
    }]
  }'
```

**Python.**

```python
agent = client.beta.agents.create(
    name="Structured extractor",
    model={"id": "claude-opus-5", "effort": "low"},
    system="You extract structured data from unstructured text...",
    tools=[{
        "type": "agent_toolset_20260401",
        "default_config": {"permission_policy": {"type": "auto"}},
    }],
)
```

**TypeScript.**

```typescript
const agent = await client.beta.agents.create({
  name: "Structured extractor",
  model: { id: "claude-opus-5", effort: "low" },
  system: "You extract structured data from unstructured text...",
  tools: [{
    type: "agent_toolset_20260401",
    default_config: { permission_policy: { type: "auto" } }
  }]
});
```

Há SDKs também para C#, Go, Java, PHP e Ruby. A recomendação prática: use YAML em arquivo para a definição que a empresa mantém, e SDK para o código que cria sessões. Configuração declarativa em repositório e chamada imperativa em runtime resolvem problemas diferentes.

### Passo 5: versionar e arquivar

A resposta da criação devolve `id`, `version`, `created_at`, `updated_at` e preenche com os padrões os campos de modelo que você omitiu. A versão começa em 1 e sobe a cada atualização que muda a configuração. Se a atualização não produz mudança, nenhuma versão nova é criada.

Duas regras de atualização merecem atenção. Campos de array — `tools`, `mcp_servers`, `skills` — são substituídos por inteiro pelo novo array: enviar um `tools` incompleto não adiciona ferramentas, apaga as que faltaram. E o campo `version` é opcional — enviá-lo garante concorrência otimista, com erro 409 se alguém mudou o agente no intervalo; omiti-lo aplica a atualização incondicionalmente, e a escrita mais recente substitui qualquer outra em silêncio. Para quem edita pelo console ou por script interativo, enviar a versão é o padrão certo.

Arquivar torna o agente somente leitura e não pode ser desfeito. Sessões existentes continuam rodando; novas sessões não podem mais referenciá-lo. É o mecanismo de aposentadoria controlada: tira o agente de circulação sem derrubar o que está em execução.

### Passo 6: o ambiente e a primeira sessão

Com o agente pronto, falta definir onde ele roda. O ambiente configura isso: sandbox na nuvem da Anthropic ou sandbox auto-hospedado na sua infraestrutura. A sessão é a instância em execução, dentro de um ambiente, cumprindo uma tarefa.

Para quem está avaliando, o caminho pragmático é começar no sandbox gerenciado com dados sintéticos ou já públicos, validar a configuração de permissões observando o campo `evaluated_permission` nos eventos e só então decidir se o caso justifica auto-hospedagem. A auto-hospedagem resolve residência de dados e retenção, e transfere para você a responsabilidade por imagem, rede, chaves e isolamento — uma troca que vale a pena quando há exigência regulatória, e que é custo puro quando não há.

## O que eu faria antes de colocar em produção

Três verificações, nesta ordem.

Confirme sob quais termos a conta opera e se alguém da equipe já ativou o programa de parceiros de desenvolvimento. Treinamento desligado por padrão em produto comercial é o comportamento documentado, mas o padrão pode ter sido alterado por decisão interna.

Leia a configuração de permissões como se fosse uma política de acesso, porque é isso que ela é. Se nenhuma ferramenta está em `always_ask`, você tem um agente que age sozinho em tudo. Isso pode ser aceitável. Precisa ser uma escolha.

Decida se a persistência de sessão é compatível com o seu requisito de retenção. Como o Managed Agents não é elegível a ZDR nem a HIPAA, uma política interna de retenção zero exige apagar sessões e arquivos por API como rotina, não como exceção.

Nada disso é complicado. O que costuma dar errado não é a configuração do agente: é o agente que entrou em produção com os padrões de fábrica porque ninguém leu qual era o padrão.

## Perguntas frequentes

**P: Os dados da minha empresa são usados para treinar o modelo?**
R: Em produtos comerciais — Claude for Work e uso da API, inclusive via Bedrock e Vertex — a Anthropic não usa entradas e saídas para treinar modelos por padrão. Isso muda se alguém reportar feedback explicitamente ou optar por permitir esse uso. Nas contas individuais Free, Pro e Max valem os termos de consumidor, que são outro regime. Por isso a primeira verificação de segurança não é técnica: é saber sob qual contrato cada conta da empresa opera.

**P: Qual é o erro de configuração mais comum em agente de IA corporativo?**
R: Subir com os padrões de fábrica. O conjunto de ferramentas do agente vem com `always_allow`, o que significa executar bash, escrever arquivos e buscar na web sem pedir aprovação. Um agente com acesso a sistemas reais deveria usar avaliação por chamada no conjunto e `always_ask` nas ferramentas de efeito irreversível.

**P: Dá para usar agente de IA em dado sensível com exigência de retenção zero?**
R: Não com o Managed Agents. Ele é stateful por desenho — guarda histórico de conversa, estado do sandbox e saídas no servidor — e por isso não é elegível a Zero Data Retention nem à cobertura de BAA de HIPAA. Para retenção zero, o caminho é a Messages API com loop de agente próprio. A alternativa intermediária é apagar sessões e arquivos por API como rotina.

**P: Quando vale a pena hospedar o sandbox na própria infraestrutura?**
R: Quando há exigência regulatória de residência de dados ou de retenção. No sandbox auto-hospedado, o conteúdo da conversa e as saídas de ferramentas permanecem no seu ambiente, e a Anthropic não tem visibilidade sobre o que acontece depois da entrega. Em troca, imagem do sandbox, egresso de rede, armazenamento, rotação de chave e isolamento de cargas não confiáveis passam a ser responsabilidade sua. Sem exigência regulatória, é custo sem retorno.

## A leitura da Tyna

A configuração de permissões de um agente é uma política de acesso escrita em outro formato. Ela decide o que a IA pode fazer sozinha, o que exige um humano e o que fica registrado para auditoria depois — as mesmas três perguntas que a [governança de agentes de IA](/governanca-de-agentes/) responde no nível da empresa: escopo de autonomia, escalonamento humano e trilha de auditoria.

Dois cuidados fecham o assunto. O primeiro é que a decisão sobre contrato e conta precede qualquer configuração técnica: enquanto houver time usando conta pessoal para trabalho, o agente bem configurado protege só a parte do fluxo que passa por ele — o resto é [shadow AI](/shadow-ai/). O segundo é a LGPD: dado pessoal que entra num prompt, num arquivo de contexto ou no estado de uma sessão precisa de base legal mapeada por finalidade, e a persistência do agente é exatamente o tipo de armazenamento que ninguém declara no inventário. O caminho está no guia de [LGPD em fluxos de IA](/lgpd-e-ia/).
