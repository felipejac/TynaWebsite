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

Nenhuma dessas quatro depende de código. São contas e decisões.

1. **Desligar o "managed robots.txt" no painel da Cloudflare.**
   Security → Settings → Bot traffic → desligar "Set your preference to block
   training in robots.txt". Enquanto estiver ligado, a Cloudflare sobrescreve o
   `robots.txt` do repositório na borda, e os 8 crawlers de treinamento continuam
   bloqueados na prática — todo o trabalho de AEO listado acima fica pronto e
   inacessível até esse toggle mudar. É a pendência de maior alavancagem da lista
   inteira: zero esforço, destrava um trabalho já feito.

2. **Decidir sobre os 12 posts pausados** em `content/blog/` (não versionados).
   Mais conteúdo indexável, mais entradas de cauda longa para busca — mas a decisão
   de manter pausado é sua e não mexo nisso sem sinal verde.

3. **Consentimento de cookies para o GA4** (Consent Mode v2 ou métrica sem cookie).
   O site roda GA4 sem camada de consentimento — grava identificador no navegador
   do visitante sem aviso prévio. Sensível especialmente aqui: a Tyna vende
   adequação à LGPD, e um lead de compliance que abrir o DevTools percebe.

4. **Perfil de organização consistente** — LinkedIn da empresa e Google Business
   com o mesmo nome, descrição e URL que o `ai.json` declara. Consistência entre
   fontes é o que os motores de busca e de resposta usam para confiar na entidade.

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

### Este mês (esforço médio, efeito composto)

5. **Resolver o consentimento de cookies** (pendência #3) — antes de qualquer
   campanha paga ou remarketing, que dependem dessa infraestrutura de qualquer jeito.
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

10. **Cadência de publicação** — mesmo pausada por ora, retomar 1–2 posts/semana
    quando fizer sentido mantém o sitemap vivo e dá ao IndexNow algo para notificar.
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
