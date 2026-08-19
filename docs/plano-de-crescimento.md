# Plano de crescimento — tyna.com.br

Documento vivo. Criado em 13/08/2026, junto com o Felipe. É a memória compartilhada
de estratégia e resultados do site: o que já foi feito, o que falta, e por que
cada próxima ação está na ordem em que está. Atualizar a cada sessão de trabalho —
não deixar virar só um registro histórico.

Não é o lugar para detalhe técnico de implementação (isso fica nas mensagens de
commit e nos comentários do código). É o lugar para responder três perguntas:
**o que fizemos, o que falta, o que fazer primeiro.**

---

## 1. Onde o site está agora

Contexto que muda a leitura de qualquer métrica: o site foi reconstruído do zero
nesta janela de trabalho (12–13/08/2026), a partir de um site institucional simples
que já existia. Antes disso, **zero histórico de SEO** — o domínio é conhecido do
Bing desde 2022 (resquício de era anterior, GitHub Pages), mas sem crawl bem
sucedido registrado. Ou seja: qualquer número de tráfego orgânico que aparecer nas
próximas semanas é crescimento a partir de uma base zero, não recuperação.

O público-alvo (C-level, jurídico e compliance de empresas médias/grandes que já
usam IA sem estrutura formal) não é um público de alto volume de busca. Ninguém
faz cinquenta buscas por dia por "consultoria de governança de IA". Isso muda a
prioridade: **SEO e AEO são motores de longo prazo, não a alavanca principal de
visitante nas próximas semanas.** A alavanca principal é distribuição ativa —
rede do Felipe, LinkedIn, o diagnóstico como isca compartilhável — com SEO/AEO
compondo por trás, para quando alguém do ICP finalmente procurar.

---

## 2. O que foi feito

### Páginas e conversão

- **Home reestruturada**: diferencial explícito contra consultoria só de política,
  quatro pilares de governança com entregáveis, FAQ visível (7 perguntas, também em
  JSON-LD), prova social, casos com números reais e fonte, formatos de contratação.
- **`/iso-42001/`** — página de venda da certificação: o que é a norma, por que
  agora, as seis etapas até a prontidão, prazos de mercado, FAQ (4 perguntas).
- **`/diagnostico/`** — ferramenta interativa de dez perguntas sobre maturidade de
  governança. Pontuação, faixa (Exposta / Em construção / Estruturada), lacunas
  nomeadas uma a uma, cada uma ligada a um serviço da Tyna. Zero formulário: o CTA
  monta um e-mail com a pontuação e as dez respostas já escritas — o lead chega
  qualificado e com contexto. É o principal ativo de distribuição disponível hoje.
- **`/shadow-ai/`** (17/08/2026) — página-pilar do tema que abre a conversa comercial.
  Traz o **checklist de mapeamento em 12 passos publicado inteiro**, na ordem que
  funciona (rastro financeiro antes de log, rastro técnico, declaração com anistia por
  escrito, consolidação em inventário), com botão de copiar em texto puro e evento
  `checklist_copiado` no GA4. FAQ visível com 5 perguntas, espelhada em JSON-LD, mais
  schema `HowTo`. É a única página do segmento que entrega o método completo em vez de
  só o alerta — a aposta é que ferramenta circula e alerta não.
- **`/pl-2338/`** (17/08/2026) — status honesto do Marco Legal da IA, com data e fonte
  conferível. **Verificado na API de dados abertos da Câmara**, não em notícia: aprovado
  no Senado em 10/12/2024, na Câmara desde 17/03/2025, comissão especial sob relatoria
  de Aguinaldo Ribeiro (PP-PB), situação "Aguardando Parecer", última movimentação em
  17/06/2026. A página traz as duas fontes primárias linkadas para o leitor conferir
  sozinho, o que o texto aprovado no Senado prevê, e as seis frentes que independem da
  votação. Muito conteúdo do segmento dá a entender que a lei já vigora; dizer o
  contrário com link é o diferencial da página.
- **`/ai-gateway/`** (18/08/2026) — a página que faltava para fechar o caminho: a de
  shadow AI promete uma alternativa segura ao atalho, e agora ela tem para onde
  apontar. Traz o que o gateway unifica, as três perguntas que a empresa passa a
  conseguir responder, **os três casos em que ele não faz sentido** (dizer isso é o
  que diferencia de material de fornecedor), a comparação entre camada fina, produto
  de mercado e construção própria, e os quatro números que dizem se funcionou.
- **`/governanca-de-agentes/`** (18/08/2026) — os quatro controles que a política de
  uso não cobre, com os números reais do case Stellantis no hero (84,2% de
  assertividade, 80% de resolutividade, 86,8% de NPS, fonte blip.ai). Absorve o item 6
  da seção 8: o argumento de que **não existe agente com 100% de acerto** vira seção
  própria. Leva um segundo ativo copiável: dez perguntas para revisão antes de um
  agente ir ao ar, com evento `roteiro_agente_copiado` no GA4.
- **`/politica-de-uso-de-ia/`** (18/08/2026) — item 8 da seção 8, o de maior intenção
  comercial da categoria: quem procura template de política está montando a política
  agora. Publica o **template inteiro, copiável**, com a regra que decide adesão —
  toda proibição vem com a alternativa autorizada no mesmo parágrafo — e classificação
  de dado em três níveis. Evento `politica_copiada` no GA4.
- **`/lgpd-e-ia/`** (18/08/2026) — as três portas por onde o dado pessoal entra num
  fluxo de IA sem passar por registro: prompt, base de conhecimento e log de
  observabilidade. Nenhuma se parece com banco de dados, e é por isso que não aparecem
  em inventário. Mais o erro estrutural de definir base legal por sistema quando ela é
  por finalidade. Fecha uma lacuna de busca grande: "LGPD" é termo muito mais procurado
  que "governança de IA".
- **Hub de guias na home** (18/08/2026), em `/#guias` — seis cartões ligando a página
  mais forte do site aos cinco guias e ao diagnóstico. Menu e rodapé padronizados em
  todas as páginas, com coluna "Guias" inclusive nas 57 páginas geradas do blog, e
  bloco de fecho por categoria ligando cada listagem aos guias.
- **`/404.html`** própria — corrigiu um soft-404 do Cloudflare Pages que devolvia a
  home (status 200) para qualquer URL inexistente, inclusive slug de post digitado
  errado. Sem isso o Google indexava lixo como conteúdo duplicado.
- **Tema claro** (fundo branco, acento roxo para identidade / laranja para ação,
  fonte de sistema) substituindo o tema escuro original. Rodapé continua escuro,
  de propósito — é a única faixa escura do site.
- **Botão de WhatsApp flutuante** em todas as páginas, com pulso periódico.
- Menu em negrito, favicon unificado entre site principal e blog (eram diferentes).

### Confiabilidade do CTA principal

Achado real, não cosmético: **"Agendar conversa" não fazia nada** em máquina sem
cliente de e-mail padrão configurado — o caso comum de C-level usando Gmail ou
Outlook direto no navegador. Reproduzido em MacBook. Corrigido com um painel de
alternativas (Gmail, Outlook, WhatsApp, endereço copiável) que só aparece quando o
`mailto:` de fato não abre nada. Isso protegia diretamente o único canal de
conversão do site antes do diagnóstico existir.

### Medição

- **GA4 instalado** em todas as páginas (`G-DQS0KMDT3G`), confirmado funcionando via
  Tempo real. Havia duas propriedades na conta (a certa é "Tyna.com.br", não
  "Automations Cookbook") — fácil de confundir, vale renomear o stream de "Meu
  site" para algo identificável.
- Eventos customizados: `diagnostico_concluido` (com pontuação e faixa),
  `diagnostico_lead`, `cta_email_clique`, `cta_email_sem_cliente`. Este último mede
  quantos visitantes caem no painel alternativo — se a taxa for alta, vale promover
  o WhatsApp a CTA principal.

### Busca — Google e Bing

- **Google Search Console**: propriedade verificada, sitemap enviado (46 URLs).
- **Bing Webmaster Tools**: domínio verificado, sitemap processado com sucesso.
  Bing acusou `meta description` fora do padrão (183–221 caracteres; o limite
  prático é 160) nas quatro páginas escritas à mão — corrigido para 135–149
  caracteres. Confirmado depois via inspeção ao vivo: "No SEO/GEO issues found".
- **Open Graph completo** adicionado em home, Sobre e ISO 42001 — não tinham
  nenhuma tag. Sem isso, compartilhar o link no LinkedIn ou WhatsApp caía sem
  título, descrição ou imagem no preview.
- **`lastmod` do sitemap** corrigido para vir de data real (data de modificação do
  arquivo, ou do post mais recente de uma listagem) em vez do timestamp do build —
  sitemap que muda a cada deploy sem o conteúdo ter mudado perde credibilidade com
  o Google.
- **IndexNow configurado e automatizado**: chave gerada e hospedada, protocolo
  ligado. `tools/indexnow.mjs` compara o que mudou desde o último commit e notifica
  só as URLs afetadas (ou o site inteiro, se um CSS/JS/template compartilhado
  mudar). Roda sozinho ao fim de todo `npm run deploy` — não é mais um passo manual.

### AEO — motores de resposta (ChatGPT, Perplexity, Gemini, AI Overviews)

- **`robots.txt`** do repositório liberando explicitamente os 8 crawlers de
  treinamento que estavam bloqueados (GPTBot, ClaudeBot, Google-Extended, CCBot,
  Bytespider, Amazonbot, Applebot-Extended, meta-externalagent), mais os de busca e
  citação. **Ainda não vale em produção** — ver pendência #1 abaixo.
- **`llms.txt`** — índice curado no formato llmstxt.org: fatos verificáveis,
  resultados de caso com fonte, posicionamento, mapa de páginas.
- **`ai.json`** — grafo de conhecimento em JSON-LD: Organization, Person, 7
  serviços, 4 pilares, Dataset com 11 métricas de caso citando a fonte, FAQ com 13
  perguntas.
- **JSON-LD embutido** na home e no ISO 42001, espelhando texto que está
  **visível** na página — corrigiu um erro anterior em que o schema de FAQ existia
  sem o texto correspondente aparecer para quem visita (o Google exige que o rich
  result reflita conteúdo visível; motor de resposta também só cita o que lê no
  corpo da página, não o que só existe dentro de um `<script>`).

### Limpeza técnica de SEO

- Favicon unificado (o blog usava cores diferentes do resto do site — inconsistência
  de marca visível na aba do navegador e no favicon que o Google mostra no SERP).
- Sufixo de título dos posts encurtado (`" — Blog Tyna"`, 12 caracteres →
  `" | Tyna"`, 7 caracteres): títulos acima de 60 caracteres caíram de 22 para 7.
- `canonical` adicionado em home e Sobre, que não tinham.
- Auditoria completa das 46 URLs do sitemap: status, título, descrição, H1,
  canonical, JSON-LD — todas dentro do padrão hoje.

---

## 3. O que falta — e só você resolve

Duas das quatro que estavam aqui já foram decididas em 13/08/2026 — registro o
resultado, não ficam mais como pendência em aberto:

- ~~Decidir sobre os 12 posts pausados~~ **Decidido: pausados para sempre.** Não é
  "por enquanto" — não voltar a levantar o assunto.
- ~~Consentimento de cookies para o GA4~~ **Decidido: não implementar agora.** O
  site segue rodando GA4 sem Consent Mode, por decisão explícita do Felipe.

Uma terceira saiu da lista em 18/08/2026, conferida em produção:

- ~~Desligar o "managed robots.txt" no painel da Cloudflare~~ **Resolvido.** O
  `robots.txt` servido em `tyna.com.br/robots.txt` hoje é **byte a byte igual ao do
  repositório**, o que significa que a Cloudflare não está mais sobrescrevendo nada.
  Os 8 crawlers de treinamento estão liberados na prática, e não só no arquivo
  versionado. Conferido também por requisição real: `/ai-gateway/` responde 200 para
  Googlebot, Bingbot, GPTBot e PerplexityBot. **Todo o trabalho de AEO listado na
  seção 2 passou a valer de fato** — era a pendência de maior alavancagem do
  documento, e ela caiu.

Resta uma, mais o registro histórico do que era a #1:

1. ~~**Desligar o "managed robots.txt" no painel da Cloudflare.**~~ *(feito — ver
   acima; o texto abaixo fica como registro do porquê da decisão.)*
   Security → Settings → Bot traffic → "Set your preference to block training in
   robots.txt". Enquanto estivesse ligado, a Cloudflare sobrescrevia o `robots.txt`
   do repositório na borda, e os 8 crawlers de treinamento seguiam bloqueados na
   prática — todo o trabalho de AEO ficava pronto e inacessível.
   **Por que isso é positivo, direto ao ponto:** `robots.txt` é um pedido, não um
   cadeado — scraper mal-intencionado ignora o arquivo de qualquer jeito, com ou
   sem o bloqueio. Quem *respeita* `robots.txt` são exatamente as empresas sérias
   (OpenAI, Anthropic, Google), porque é reputação delas cumprir a regra. Bloquear
   não impede ninguém ruim de copiar o site; só impede o ChatGPT e o Claude de
   *aprenderem* que a Tyna existe. O conteúdo bloqueado aqui é texto de blog e copy
   de marketing — feito para ser lido, não segredo industrial nem dado de cliente.
   Contraponto honesto: quem vende conteúdo como produto (jornalismo, e-books)
   tem razão real para bloquear treino, porque é a matéria-prima do negócio. Não é
   o caso da Tyna — o negócio é consultoria, o conteúdo existe para gerar
   visibilidade, não licenciamento. Ver seção 6 para a resposta completa.

2. **Perfil de organização consistente** — LinkedIn da empresa e Google Business
   Profile com o mesmo nome, descrição e URL que o `ai.json` declara. Consistência
   entre fontes é o que os motores de busca e de resposta usam para confiar na
   entidade. O conteúdo pronto para colar está na seção 7 — a criação da conta em
   si (LinkedIn, Google) precisa ser feita por você; não crio conta em nome de
   terceiros.

---

## 4. Plano de crescimento — o que fazer, em ordem

### Esta semana (baixo esforço, alto impacto)

1. ~~Desligar o robots.txt gerenciado da Cloudflare~~ **Feito, confirmado em
   produção em 18/08/2026.** Ver a seção 3.
2. **Distribuir o diagnóstico ativamente no LinkedIn.** É o ativo de maior
   potencial de conversão que existe hoje, e ainda não foi promovido fora do site.
   Post pessoal do Felipe com o gancho do resultado (não da ferramenta em si) +
   mensagem direta para ~20 contatos C-level da rede (Blip, Yalo, Zenvia) pedindo
   leitura, não venda — "você faria em 3 minutos e me diria se alguma pergunta está
   mal formulada?" converte muito melhor que pitch direto.
3. **Enviar indexação manual das páginas novas** no Search Console e no Bing
   Webmaster Tools (Inspeção de URL → Solicitar indexação) para `/iso-42001/` e
   `/diagnostico/` — antecipa a primeira visita do crawler em vez de esperar o
   sitemap ser relido sozinho.
4. **Renomear o stream do GA4** de "Meu site" para "Tyna — site institucional" —
   evita confundir com a propriedade Automations Cookbook de novo.
5. **Criar o perfil de organização** (LinkedIn Company + Google Business Profile)
   com o conteúdo pronto na seção 7 — fecha a pendência #2 da seção 3.

### Este mês (esforço médio, efeito composto)

6. **Adicionar um prompt de compartilhamento ao fim do diagnóstico** — "Compartilhe
   seu resultado" com texto pré-pronto para LinkedIn. Transforma a ferramenta num
   loop: quem responde tem motivo de postar o próprio resultado, o que traz mais
   gente para responder.
7. ~~Duas ou três páginas-pilar novas~~ **Concluído. Quatro publicadas**, todas no
   padrão da ISO 42001 (FAQ visível + JSON-LD espelhando o texto): `/shadow-ai/` e
   `/pl-2338/` em 17/08/2026, `/ai-gateway/` e `/governanca-de-agentes/` em
   18/08/2026. Com a ISO 42001, são cinco guias, reunidos em `/#guias` na home.
   **O que falta agora não é página, é link de fora**: o site tem estrutura interna
   boa e nenhum backlink — ver item 8.
8. **Backlinks reais.** Virou estudo próprio em 18/08/2026:
   [backlinks-estudo.md](backlinks-estudo.md), com a lista operacional em
   [backlinks-alvos.json](backlinks-alvos.json) e o ciclo automatizado em
   `npm run backlinks`. **Linha de base medida: zero link seguido.** A conclusão que
   muda a prioridade: criação automática de backlink em massa é link scheme, e o risco
   é alto justamente porque o domínio não tem histórico. O que se automatizou foi o
   ciclo (prospectar, verificar, cobrar, medir) mais a sindicação com canonical, que é
   a única fonte legitimamente automática. Ordem recomendada, por retorno por hora:
   diretórios de `llms.txt`, perfis de entidade, um artigo assinado em IT Forum ou TI
   Inside, pedido de crédito aos parceiros de case, artigo jurídico em JOTA ou
   Migalhas.
9. **Repurposing do blog para LinkedIn** — os 37 posts já publicados viram matéria-
   prima para post/carrossel, distribuição praticamente grátis.

### Contínuo (compõe com o tempo)

10. ~~Cadência de publicação~~ **Removido em 13/08/2026.** Os 12 posts pausados
    ficam pausados para sempre (decisão definitiva) — este item não se aplica mais.
11. **Acompanhar Search Console e Bing Webmaster Tools semanalmente** nas primeiras
    semanas — página indexada vs. enviada, consulta com impressão sem clique,
    posição média. É o sinal mais cedo de que algo está ou não funcionando.
12. **Revisar os eventos do GA4 mensalmente** — taxa de conclusão do diagnóstico,
    proporção de lead por WhatsApp vs. e-mail, `cta_email_sem_cliente` como já
    citado. Iterar a ferramenta e a copy com base no que os dados mostrarem, não em
    achismo.
13. **Teste manual de citação em motor de resposta** — lista fixa de 10 perguntas
    que um cliente faria, rodada uma vez por mês em ChatGPT/Perplexity, registrando
    se a Tyna aparece. É rudimentar, mas é o único método honesto disponível hoje
    (não existe rank tracker confiável para AEO).

---

## 5. Como decidir o que entra na lista

Critério para adicionar algo aqui: **muda o número de visitante qualificado, ou
muda o número de lead a partir do visitante que já chega.** Trabalho de estética,
correção de bug pontual e pedido avulso do Felipe continuam acontecendo — só não
entram nesta lista, que é para o que move a agulha de crescimento.

Quando uma ação da seção 4 for concluída, mover para a seção 2 com a data, não
apagar — é assim que o documento também vira o registro do que já foi tentado.

---

## 6. Por que desligar o robots.txt gerenciado da Cloudflare é positivo

Pergunta que o Felipe fez direto, em 13/08/2026: por que isso ajudaria? Resposta
sem enrolação, com o contraponto incluído — não é decisão óbvia, é uma aposta com
lado bom e lado ruim, e a decisão final é dele.

**O que o toggle faz de fato.** `robots.txt` é um pedido educado, não uma trava
técnica. Um scraper mal-intencionado — o que rouba conteúdo para revender, treinar
modelo pirata, alimentar spam — **ignora `robots.txt` sempre**, com ou sem o
bloqueio ligado. Ele não lê o arquivo por educação. Quem *de fato* respeita
`robots.txt` são as empresas grandes e com reputação a zelar: OpenAI, Anthropic,
Google, Microsoft. Cumprir o protocolo é literalmente a prova pública de que
seguem regra. Então o bloqueio atual não protege a Tyna de ninguém desonesto — ele
só impede as empresas idôneas de fazerem o que pediram educadamente para fazer.

**O que se perde mantendo bloqueado.** Cada vez mais, C-level e jurídico perguntam
para o ChatGPT ou o Gemini antes de pesquisar no Google — "quem faz governança de
IA no Brasil com experiência real de produção?". Um modelo só cita o que está nos
dados que ele aprendeu (treino) ou consegue ler ao vivo (busca/citação — essa parte
já está liberada de qualquer forma). Bloquear treino não afeta a busca ao vivo, mas
afeta se a Tyna vai estar "na cabeça" do modelo por padrão, sem precisar de busca
nenhuma. Hoje, tyna.com.br não está.

**O contraponto honesto — quando faria sentido manter bloqueado.** Empresa cujo
modelo de negócio é o conteúdo em si — jornalismo, curso pago, base de dados
proprietária — tem motivo real para bloquear: é a matéria-prima do produto, e
treino de modelo sem compensação é concorrência desleal direta. **Não é o caso da
Tyna.** O site vende consultoria; o blog e a copy existem para gerar confiança e
lead, não para serem vendidos como conteúdo. Não há segredo de cliente nem IP
proprietário nas páginas públicas — o que está lá é, por definição, o que a Tyna já
decidiu tornar público.

**O tamanho real da aposta.** Não há garantia de que "estar no treino" vira lead —
ninguém tem prova disso hoje, para nenhuma empresa. É uma aposta de custo zero
(o conteúdo já é público, já pode ser lido por qualquer humano ou máquina) com
upside potencial (aparecer como resposta em vez de nunca aparecer) e sem downside
real identificável, dado que o modelo de negócio da Tyna não é conteúdo. Por isso
a recomendação é desligar — mas se o motivo for outro (ex.: desconforto em geral
com IA treinando em texto próprio, independente de cálculo de negócio), essa é uma
razão legítima e a decisão continua sendo do Felipe.

---

## 7. Perfil de organização consistente — conteúdo pronto para publicar

Pendência #2 da seção 3. **A criação da conta em si precisa ser feita pelo
Felipe** — não crio conta em nome de terceiros em LinkedIn, Google ou qualquer
outra plataforma. O que seguiu abaixo é o conteúdo pronto, consistente com o que
`ai.json` já declara publicamente no site, para colar direto nos dois perfis.

### LinkedIn — Company Page

Se ainda não existe uma página de empresa "Tyna" no LinkedIn (distinta do perfil
pessoal do Felipe, `linkedin.com/in/felipelj`): criar em
`linkedin.com/company/setup/new/`.

| Campo | Conteúdo |
|---|---|
| Nome | Tyna |
| URL pública | `linkedin.com/company/tyna` (ou o mais próximo disponível) |
| Site | `https://tyna.com.br` |
| Setor | Consultoria de TI e Serviços / Business Consulting and Services |
| Tamanho da empresa | 1 |
| Tipo | Privately Held |
| Tagline (até 120 caracteres) | `IA em produção, sob controle.` |
| Descrição (About) | `A Tyna é uma consultoria de governança e estratégia de Inteligência Artificial que atua junto à liderança executiva para estruturar a adoção de IA generativa e de agentes de IA com segurança — política interna, adequação à LGPD, AI Gateway e capacitação de lideranças e times. A governança vem de quem já colocou agente de IA em produção para Coca-Cola, Hering, iFood, Stellantis, Yalo e Banco do Brasil, e não de quem apenas audita.` |
| Logo | `assets/logo-tyna-dark.png` (fundo claro) do repositório |
| Localização | Brasil |

Depois de criado, adicionar o Felipe como administrador da página e linkar o
perfil pessoal dele como "Onde trabalho" para reforçar a associação.

### Google Business Profile

Criar em `business.google.com`. Único ponto de atenção real: o Google normalmente
pede endereço físico ou área de atendimento e verificação (cartão postal, telefone
ou e-mail, dependendo da categoria) — para uma consultoria sem loja física, usar
**"Área de atendimento"** em vez de endereço público, e categoria de negócio
**"Consultor de gestão"** ou **"Consultoria"**.

| Campo | Conteúdo |
|---|---|
| Nome da empresa | Tyna |
| Categoria principal | Consultor de gestão (Management consultant) |
| Site | `https://tyna.com.br` |
| Telefone / WhatsApp | +55 11 99722-8945 (o mesmo do botão flutuante do site) |
| Descrição curta | `Consultoria de governança e estratégia de Inteligência Artificial. Política interna, adequação à LGPD, AI Gateway e capacitação de lideranças e times.` |
| Área de atendimento | Brasil (ou a região específica que fizer sentido) |

### Depois de criados

Me passe as duas URLs finais (`linkedin.com/company/...` e o link do perfil do
Google) para eu adicionar como `sameAs` no `ai.json` e no JSON-LD da home — é isso
que fecha o círculo de consistência entre fontes que motor de busca e motor de
resposta usam para confiar na entidade.

---

## 8. Plano de conteúdo para 7 dias — GA4 + pesquisa de mercado, 16/08/2026

### O que o GA4 diz

Primeira leitura com dado real. O GA4 tem **4 dias de coleta** (12 a 15 de agosto);
o que segue é a janela inteira que existe.

| Métrica | Valor |
| --- | --- |
| Sessões | 36 |
| Usuários | 20 |
| Visualizações | 308 |
| **Busca orgânica** | **0** |
| **Social** | **0** |
| **Referência** | **0** |
| Direto | 36 (100%) |

Por cidade, 22 das 36 sessões saem de **Votorantim** — nós testando. Outras 6 vêm de
Boardman, Ashburn, Denver e Las Vegas, regiões de datacenter: robô, não gente. Sobram
**cerca de 8 sessões de tráfego externo em 4 dias**.

### Os dois achados que mudam a conversa

**1. O site tem 50 posts e zero tráfego orgânico. Conteúdo não é o gargalo.**
Publicar o post 51 não muda o número de sete dias. Falta caminho até o site, não texto
dentro dele.

**2. O blog fala com quem a Tyna não vende.** Das 50 páginas: 20 em LLMs, 16 em Agentes
de IA, 12 em Ferramentas de Dev, 1 em Automação e **1 em Governança de IA**. O ICP é
C-level, jurídico e compliance. O blog é escrito para desenvolvedor.

### Sobre quadruplicar em uma semana

É alcançável, mas não por SEO. Conteúdo novo leva de semanas a meses para ranquear.
O que move o número em sete dias é **distribuição**. E a base é tão baixa que 4x é um
número pequeno: de ~14 sessões externas por semana para ~56.

### A munição que a pesquisa trouxe

Números de terceiros, com fonte nomeada, publicados agora. É com isto que o conteúdo
desta semana é escrito.

| Dado | Fonte |
| --- | --- |
| **76%** das empresas brasileiras já têm agentes de IA em produção — acima dos EUA (67%) e da média mundial (62%) | Sinch, *The AI Production Paradox* |
| **80%** das organizações brasileiras já interromperam ou reverteram uma implementação de IA (média mundial 74%) | Sinch |
| Em **39%** desses casos houve vazamento de dados ou de informações pessoais | Sinch |
| A taxa de reversão sobe para **81%** entre as organizações **mais maduras** | Sinch |
| **98%** das empresas vão aumentar investimento em IA em 2026 | Sinch |
| Só **27%** no Brasil afirmam ter modelos de governança maduros | Deloitte, *State of AI in the Enterprise* 2026 |
| **95%** das organizações brasileiras já usam IA | EY, maio de 2026 |

Base da Sinch: 2.527 executivos seniores, dez países, seis setores.

**A tese da Tyna, em números de terceiros:** o Brasil lidera o mundo em colocar agente
de IA em produção e tem 27% de governança madura. Oito em cada dez já tiveram que
puxar algo de volta, e em quatro de cada dez dessas vezes vazou dado.

E o detalhe que derruba a objeção mais comum: **a reversão é MAIOR entre as empresas
mais maduras (81%)**. "Nós somos maduros, está sob controle" para de funcionar como
resposta.

### A janela que está aberta agora

O recorte Brasil desse estudo saiu na imprensa técnica em **13 e 14 de agosto** — Olhar
Digital, TI Inside. Procurei e **nenhuma consultoria de governança de IA do segmento
publicou análise disso.** A cobertura é toda de imprensa, factual, sem leitura de
governança. Essa janela dura poucos dias.

### A lista, em ordem de retorno por hora gasta

Cada item traz o canal. Conteúdo sem canal não entra — é o erro que produziu 50 posts
sem leitor.

**1. Análise do estudo Sinch, com o recorte que ninguém fez.** A imprensa noticiou o
número; ninguém explicou por que a reversão é maior nas empresas mais maduras. A
resposta é a tese da Tyna: madura em TI não é madura em IA, e quem opera mais agentes
descobre mais cedo o que falta. Post no blog em Governança de IA + post no LinkedIn.
*Esforço: 3 horas. É o item de maior retorno e o único com prazo.*

**2. "76% contra 27%" como peça visual.** Um gráfico, duas barras, duas fontes: o Brasil
lidera em produção e fica em 27% de governança. Post de LinkedIn que se explica sem
texto. *Esforço: 1 hora.*

**3. O diagnóstico vira post.** Já existe em `/diagnostico/`: 10 perguntas, resultado na
hora. Melhor ativo do site e ninguém sabe que existe. Post com as 3 perguntas mais
desconfortáveis e o link. *Esforço: 1 hora.*

**4. ~~"Onde o PL 2338 realmente está."~~ Publicado em 17/08/2026** — `/pl-2338/`.
Status reconferido na API de dados abertos da Câmara no dia da publicação (situação
"Aguardando Parecer", última movimentação em 17/06/2026), as duas fontes primárias
linkadas, e as seis frentes que independem da votação. A página carrega a data da
última conferência: **quando o projeto andar, ela precisa ser atualizada** — é o único
conteúdo do site com prazo de validade embutido.

**5. ~~Checklist de mapeamento de Shadow AI.~~ Publicado em 17/08/2026** —
`/shadow-ai/`. O método da seção "A leitura da Tyna" virou os 12 passos em quatro
frentes, com botão de copiar e evento `checklist_copiado` no GA4 para medir se a
página está sendo usada como ferramenta ou só lida.

**6. ~~"84,2% de assertividade" como post.~~ Virou seção de página em 18/08/2026** —
o argumento está em `/governanca-de-agentes/`, na seção "O número que derruba a
fantasia", com a tabela do case e a leitura de que o NPS alto não vem da ausência de
erro, e sim de o escalonamento funcionar. Como página, tem cauda longa que post de
blog não tem. **O post de LinkedIn continua valendo** e ainda não foi publicado.

**7. Página "Quanto custa governança de IA".** Ninguém publica preço no segmento. É a
pergunta mais feita e menos respondida. **Publique as faixas da Tyna, não as do
mercado** — as faixas de mercado que levantei estão marcadas como estimativa e não
sustentam publicação. *Esforço: meio dia.*

**8. ~~Template de política de uso de IA.~~ Publicado em 18/08/2026** —
`/politica-de-uso-de-ia/`. O template está na página inteiro e copiável, em vez de
atrás de formulário: mesma escolha do diagnóstico e do checklist de shadow AI. Quem
copia leva o documento pronto; quem precisa adaptar à operação é exatamente o lead
que interessa.

**9. Os 12 posts recém-publicados viram 12 posts de LinkedIn.** Um por dia útil, com o
recorte de governança que o texto original não tem. Conteúdo já pago, distribuição zero.
*Esforço: 3 horas pelos 12.*

### O item que não é conteúdo, e que responde pela maior parte do resultado

**Vinte mensagens diretas para o ICP com o link do diagnóstico.** Em sete dias isso
produz mais visita qualificada do que qualquer um dos nove itens acima. Os conteúdos
existem para dar motivo à mensagem, não para substituí-la.

E segue valendo o que está na seção 3: **LinkedIn Company Page e Google Business Profile
não existem.** Sem eles não há superfície onde esse conteúdo circule sozinho.

### Leitura de Semrush — 18/08/2026

Primeira análise com dado de terceiro: [analise-seo-semrush.md](analise-seo-semrush.md).
Três coisas que mudam prioridade:

1. **O domínio tem 94 domínios de referência, todos spam** — rede de venda de PBN,
   anterior à reconstrução. Não é "zero backlinks", é pior: zero editorial com lixo em
   volta. Ação: Backlink Audit e conferir ação manual no Search Console.
2. **Falta a página do termo-cabeça.** `governança de ia` tem 260 buscas/mês, KD 26
   ("Easy"), e a sexta posição da SERP é ocupada por uma página com autoridade **zero**.
   São sete guias publicados e nenhum ataca o termo que nomeia a categoria.
3. **`/pl-2338/` mira o maior cluster do mercado** (4.330 buscas/mês somando variantes),
   mas o título lidera com "Marco Legal da IA", que tem 90. Correção de uma linha.

Duas afirmações minhas foram corrigidas ali: LGPD+IA é cluster pequeno (240/mês, não
maior que governança de IA), e "política de uso de IA" tem 20 buscas/mês.

### O que está no ar, e desde quando

Em 18/08/2026 o site foi publicado com as quatro páginas-pilar novas, o hub de guias
e a limpeza de SEO. Estado verificado na hora da publicação, para servir de marco:

| Verificação | Resultado |
| --- | --- |
| Páginas no sitemap | 65, todas respondendo 200 |
| Auditoria de SEO em produção (`npm run seo`) | **Nenhum problema encontrado** — sem erro e sem aviso |
| `robots.txt` em produção | idêntico ao do repositório; managed robots.txt desligado |
| Acesso de crawler a `/ai-gateway/` | 200 para Googlebot, Bingbot, GPTBot e PerplexityBot |
| IndexNow | sitemap inteiro notificado no fim do deploy, resposta 200 OK |
| Search Console via `npm run seo:gsc` | **indisponível nesta máquina** — o comando depende do `gcloud`, que não está instalado |

O único passo de indexação que continua manual é **pedir indexação das cinco páginas
novas no Search Console** (Inspeção de URL → Solicitar indexação). O IndexNow cobre
Bing, Yandex e outros; o Google não usa o protocolo, e só descobre pelo sitemap, que
já foi atualizado e relido, ou por esse pedido manual, que antecipa dias de espera.

### O canal das quatro páginas publicadas

Os textos de LinkedIn das duas páginas estão prontos em
[distribuicao-paginas-pilar.md](distribuicao-paginas-pilar.md), com ordem sugerida
(shadow AI primeiro, PL 2338 dois ou três dias depois) e o que medir. **Página
publicada sem post é a mesma armadilha dos 50 posts sem leitor** — o trabalho de
escrita está feito, o de distribuição não.

### O que verificar antes de produzir qualquer coisa

Zero orgânico pode ser duas coisas diferentes: o site não está indexado, ou está
indexado e não ranqueia. **Confira a cobertura no Search Console primeiro** — se o
problema for indexação, nada nesta lista resolve.

### Fontes

- Sinch, *The AI Production Paradox*: https://sinch.com/news/sinch-releases-ai-production-paradox/
- Recorte Brasil: https://olhardigital.com.br/2026/08/14/inteligencia-artificial/brasil-supera-eua-na-adocao-de-agentes-de-ia-pelas-empresas/
- Deloitte, *State of AI in the Enterprise* 2026: https://www.deloitte.com/br/pt/about/press-room/state-of-ai-2026.html
- EY, adoção de IA no Brasil: https://www.ey.com/pt_br/newsroom/2026/05/ia-brasil-esta-entre-lideres-ranking-adocao-tecnologia
- PL 2338/2023 no Senado: https://www25.senado.leg.br/web/atividade/materias/-/materia/157233
