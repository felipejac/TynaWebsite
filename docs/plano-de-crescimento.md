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

Restam duas, e a primeira é a de maior alavancagem de todo o documento:

1. **Desligar o "managed robots.txt" no painel da Cloudflare.**
   Security → Settings → Bot traffic → desligar "Set your preference to block
   training in robots.txt". Enquanto estiver ligado, a Cloudflare sobrescreve o
   `robots.txt` do repositório na borda, e os 8 crawlers de treinamento continuam
   bloqueados na prática — todo o trabalho de AEO listado acima fica pronto e
   inacessível até esse toggle mudar. Zero esforço, destrava um trabalho já feito.
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

1. **Desligar o robots.txt gerenciado da Cloudflare** (pendência #1 acima). Sem
   custo, destrava trabalho já pronto.
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
7. **Duas ou três páginas-pilar novas**, além de ISO 42001 — candidatas que já
   estão implícitas no que a Tyna vende: "Governança de agentes autônomos",
   "Shadow AI: como mapear e controlar", "AI Gateway: o que é e quando faz
   sentido". Cada uma no mesmo padrão da ISO 42001 (FAQ visível + JSON-LD
   espelhando o texto).
8. **Backlinks reais**: pedir que Hering, Yalo ou outro case linkem de volta a
   partir do próprio canal (case study, post) quando for natural; diretórios
   brasileiros de consultoria/IA; pauta com veículo de tecnologia sobre o
   diferencial "governança de quem implementa".
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
