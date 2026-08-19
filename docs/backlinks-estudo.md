# Estudo de backlinks — tyna.com.br

Criado em 18/08/2026. Responde ao pedido de "uma forma automática de criar backlinks",
com a pesquisa de parceiros, portais e ferramentas, filtrada pelo ICP da Tyna: C-level,
jurídico e compliance de empresas médias e grandes que já usam IA sem estrutura formal.

Documento vivo. A lista operacional fica em [backlinks-alvos.json](backlinks-alvos.json),
o status conferido por robô em [backlinks-status.md](backlinks-status.md), e o ciclo roda
com `npm run backlinks`.

---

## 1. A parte desconfortável, primeiro

**Não existe forma legítima de criar backlink automaticamente em escala.** O que existe
é ferramenta que gera link em massa — comentário em blog, perfil descartável, rede
privada de sites (PBN), diretório de baixa qualidade, troca recíproca automatizada. Isso
tem nome nas diretrizes do Google: *link scheme*. A punição vai de desvalorização
silenciosa dos links a ação manual sobre o domínio inteiro.

Para a Tyna, o cálculo é pior que a média por um motivo específico: **o domínio tem zero
histórico de SEO**. Site reconstruído do zero em 12 e 13/08/2026, primeira indexação
acontecendo agora. Um perfil de links que aparece do nada, todo de uma vez, vindo de
lugares sem relação com governança de IA, é exatamente o padrão que sistemas antispam
procuram. O upside é pequeno e o downside é perder o trabalho todo de indexação que
acabou de começar.

Então este estudo separa duas coisas que costumam ser confundidas:

| | O que é | Automatizável? |
| --- | --- | --- |
| **Criar o link** | alguém decide publicar um link para a Tyna | **Não**, e não deveria ser |
| **O ciclo em volta** | descobrir alvo, verificar, cobrar, medir, repetir | **Sim**, e é o que foi construído |

Há uma exceção real, e só uma: **sindicação com canonical**. Republicar o próprio
conteúdo em plataforma que aponta `rel=canonical` de volta para o original é prática
aceita, automatizável por RSS, e gera link legítimo a cada publicação. Está na seção 4.

---

## 2. O que foi construído

### `npm run backlinks`

Roda o ciclo inteiro sobre a lista de alvos:

- baixa a página onde o link apareceria se a ação tivesse dado certo e procura por
  `tyna.com.br`;
- separa **link seguido** de **`rel=nofollow`**, porque só o primeiro transfere
  autoridade — e comemorar nofollow é o erro clássico de relatório de agência;
- marca como **"não verificável"** o alvo que responde 403 a robô, em vez de contar como
  ausência. Clutch, GoodFirms, Sortlist e Medium bloqueiam: a conferência desses é no
  navegador;
- escreve `docs/backlinks-status.md` com data, para o progresso virar registro e não
  memória;
- com `--bing` e a chave em `BING_WEBMASTER_API_KEY`, soma os backlinks que o Bing
  realmente enxerga (endpoint `GetLinkCounts` da API do Bing Webmaster Tools; a chave sai
  em Settings › API Access).

O que ele **não** faz, de propósito: não cria link, não preenche formulário, não posta
comentário, não dispara e-mail.

### Linha de base, medida hoje

Primeira execução, 18/08/2026: **0 link seguido, 0 nofollow, 24 pendentes, 5 não
verificáveis por robô.** É a base zero contra a qual todo o resto vai ser comparado.

---

## 3. O mapa de canais, ranqueado pelo ICP

O critério não é autoridade de domínio. É **quantos leitores daquele veículo se parecem
com quem contrata a Tyna**. Um link de portal de tecnologia genérico com muito tráfego
vale menos que um link do JOTA, porque quem lê JOTA é o jurídico que aprova o projeto.

### Nível 1 — o público é literalmente o ICP

| Canal | Por que entra | Esforço | Custo |
| --- | --- | --- | --- |
| **JOTA** | regulação e políticas públicas; leitor é jurídico e compliance de grande empresa. A página `/pl-2338/`, com status conferido na ficha da Câmara, é a credencial de entrada | alto | zero (editorial) |
| **Conjur** | leitura obrigatória do jurídico; o recorte de LGPD em fluxos de IA é publicável | alto | zero |
| **Migalhas** | mesma audiência, barreira de entrada menor que Conjur | médio | zero a baixo |
| **IT Forum (IT Mídia)** | reúne cerca de 180 CIOs de grandes empresas no evento anual; o link e a audiência valem o mesmo | médio | zero |
| **TI Inside** | já noticiou o recorte Brasil do estudo Sinch sem a leitura de governança — há gancho pronto | médio | zero |
| **Convergência Digital** | cobre regulação com profundidade; público de governo e grande empresa | médio | zero |

**Este nível é o que move a agulha.** Um único artigo assinado no JOTA ou no IT Forum
vale mais que os vinte diretórios da lista somados — em autoridade, em tráfego
qualificado e em prova social para a próxima conversa comercial.

### Nível 2 — parceiros de case: o link mais valioso que existe

Hering/Omnichat, Blip (Stellantis, Coca-Cola), Yalo. Os números que sustentam as páginas
da Tyna já são públicos e citados por esses parceiros. O pedido é de reciprocidade de
crédito: que o case publicado cite e linke quem conduziu.

É o link mais difícil de conseguir e o mais difícil de copiar — contextual, de quem viveu
o projeto, e prova de autoridade que diretório nenhum dá. Custa relacionamento, não
dinheiro. **É a segunda maior prioridade da lista inteira.**

### Nível 3 — entidades do ecossistema

| Canal | Observação |
| --- | --- |
| **ABRIA** — Associação Brasileira de IA | tem página pública de associados; é a entidade mais específica do tema no Brasil |
| **ABES** | participa das discussões do PL 2338 junto ao Ministério da Justiça; o site bloqueia robô, conferir no navegador |
| **Assespro** | peso institucional em TIC, menos específica de IA |

Link de associação é duradouro, contextual e vem com participação em discussão
regulatória — que é onde o ICP está.

### Nível 4 — entidade e presença (não é link, é existência)

LinkedIn Company Page, Google Business Profile, Crunchbase. Os links são `nofollow`, o
que não importa: o valor é **consistência de entidade**. É o que motor de busca e motor
de resposta usam para confiar que a Tyna existe, e é o que fecha o círculo com o
`ai.json` que o site já publica. Segue pendente desde 13/08 — conteúdo pronto para colar
na seção 7 do [plano de crescimento](plano-de-crescimento.md).

### Nível 5 — diretórios de IA (barato e aderente)

`llmstxt.site`, `llmstxthub.com`, `directory.llmstxt.cloud`: diretórios de sites que
publicam `llms.txt`. **A Tyna já tem o arquivo desde 12/08.** Submeter custa minutos,
é gratuito, e liga o site ao ecossistema que os motores de resposta rastreiam. É o melhor
retorno por minuto da lista.

### Nível 6 — diretórios B2B genéricos

Clutch, GoodFirms, Sortlist. Perfil gratuito, domínio forte, curadoria fraca. Vale como
citação de entidade e como presença onde comprador B2B procura — não como autoridade.
Fazer uma vez e esquecer.

### Nível 7 — fonte para jornalista (upside, não aposta)

O HARO original fechou em dezembro de 2024; a marca foi comprada pela Featured em abril
de 2025 e relançada gratuita, sustentada por patrocínio de newsletter. Alternativas:
Qwoted (gratuito, jornalistas verificados) e Source of Sources.

**Ressalva honesta:** a imprensa nessas plataformas é majoritariamente dos EUA e em
inglês. Rende link editorial de veículo forte, mas o leitor não é o ICP brasileiro.
Entra como upside de autoridade, não como canal de lead.

---

## 4. A única automação real: sindicação com canonical

Republicar o próprio conteúdo em plataforma que aponta `rel=canonical` de volta ao
original não é duplicação penalizada — é o mecanismo que essas plataformas oferecem
exatamente para isso.

**DEV Community (dev.to)** é o caso mais completo: aceita importação por RSS, e o site já
publica `tyna.com.br/rss.xml`. Ligado uma vez em Settings › Extensions, cada post novo
vira uma página no DEV com `canonical_url` apontando para o original. **Isso é backlink
criado automaticamente, sem ação humana, de forma legítima.**

**Medium** importa por artigo (não por feed) e define o canonical sozinho, mas os links
são majoritariamente `nofollow` — vale por alcance, não por autoridade. **Hashnode** tem
API de publicação e aceita canonical.

Ressalva de aderência: o público dessas três é técnico, não C-level. Os 50 posts de LLM e
ferramentas do blog se encaixam; as páginas-pilar de governança, menos. É volume e
consistência de domínio, não geração de lead.

---

## 5. O ativo que faz o link vir sozinho

A parte do plano que não depende de pedir nada a ninguém: **o site já publica três
materiais copiáveis que ninguém mais publica aberto** — o checklist de mapeamento de
shadow AI em 12 passos, o template de política de uso de IA e o roteiro de dez perguntas
antes de um agente ir ao ar.

Material assim é o que ganha link por conta própria, porque alguém escrevendo sobre o
tema precisa apontar para uma referência. Duas ações aumentam muito a chance disso
acontecer:

1. **Publicar como repositório no GitHub**, na organização da Tyna, com link de volta
   para cada página. Repositório útil entra em lista "awesome" e é citado sem pedido.
2. **Mandar para quem já escreveu sobre o assunto** — inclusive para a Sinch, autora do
   estudo cuja única leitura de governança publicada no Brasil foi a da Tyna.

---

## 6. A sequência, em ordem de retorno por hora

1. **Três diretórios de `llms.txt`** — minutos, gratuito, aderente ao trabalho de AEO já
   feito.
2. **LinkedIn Company Page e Google Business Profile** — pendência aberta desde 13/08,
   conteúdo pronto, e é pré-requisito de qualquer citação de entidade.
3. **Um artigo assinado, no IT Forum ou no TI Inside**, aproveitando o gancho do estudo
   Sinch que ainda ninguém do segmento analisou.
4. **Pedido de crédito aos parceiros de case** (Omnichat/Hering, Blip). Conversa, não
   e-mail frio.
5. **Um artigo jurídico**, JOTA ou Migalhas, sobre o status real do PL 2338 — o mesmo
   argumento que já está publicado em `/pl-2338/`.
6. **Sindicação no dev.to por RSS** — liga uma vez e passa a render sozinho.
7. **Associação à ABRIA**, se o custo fizer sentido.
8. **Diretórios B2B**, num único bloco de uma hora.
9. **GitHub com os materiais abertos.**
10. **Cadastro em HARO/Qwoted**, para quem tiver disciplina de responder chamadas.

---

## 7. Como medir, sem enganar a si mesmo

- **`npm run backlinks` semanalmente.** Linha de base de hoje: zero. Qualquer número
  acima disso é ganho real, e o script separa seguido de nofollow.
- **Bing Webmaster Tools** entrega backlinks conhecidos de graça — o modo `--bing` já
  está pronto para a chave.
- **Search Console** mostra links do Google, mas a leitura automática aqui depende do
  `gcloud`, que não está instalado nesta máquina.
- **A métrica que importa não é a contagem de links.** É impressão e clique orgânico nas
  páginas-pilar. Link é meio; se as impressões não subirem em quatro a seis semanas
  depois dos primeiros links, o problema está em outro lugar.

---

## 8. O que não fazer

- **Comprar backlink**, pacote de link, "guest post pago" em site de link farm. É o que
  mais aparece quando se pesquisa o assunto em português, e é link scheme declarado.
- **PBN** — rede privada de sites criada para linkar o principal.
- **Comentário automatizado** em blog e fórum.
- **Troca recíproca em massa** ("linko você, você me linka"), quando vira esquema.
- **Diretório genérico em volume** — dezenas de cadastros em sites sem relação com o
  tema, todos de uma vez, é o padrão que mais chama atenção negativa.

A regra prática que separa o legítimo do resto: **o link existiria se o Google não
existisse?** Artigo no JOTA existiria — alguém quer ler. Perfil na ABRIA existiria — a
Tyna é do ecossistema. Comentário em blog aleatório com link não existiria.

---

## Fontes

- Diretórios de `llms.txt`: <https://llmstxt.site/submit>, <https://llmstxthub.com/>,
  <https://directory.llmstxt.cloud/>
- Padrão `llms.txt`: <https://llmstxt.org/>
- API do Bing Webmaster Tools (`GetLinkCounts`, chave em Settings › API Access):
  <https://learn.microsoft.com/en-us/bingwebmaster/getting-started>
- HARO relançado pela Featured, e alternativas (Qwoted, Source of Sources):
  <https://www.presspulse.ai/blog/haro-alternatives>
- Sindicação com canonical no DEV: <https://dev.to/devteam/revamped-rss-feed-imports-3j1e>
- ABRIA — associados e associe-se: <https://abria.org.br/associados/>
- ABES, Brasscom e Assespro em discussão sobre o PL 2338 no Ministério da Justiça:
  <https://abes.com.br/en/abes-brasscom-e-assespro-se-reunem-com-estela-aranha-no-ministerio-da-justica-para-tratar-da-regulacao-da-ia/>
- Diretórios B2B com perfil gratuito: <https://www.goodfirms.co/>, <https://clutch.co/>
- Colunistas convidados no Mobile Time:
  <https://www.mobiletime.com.br/especial/19/12/2025/2026-colunistas/>
