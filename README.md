# Tyna — site institucional

Site estático em HTML/CSS/JS puro, sem dependências de runtime. O blog é gerado a partir de
markdown por um script Node próprio (`tools/build-blog.mjs`).

## Como publicar (o único jeito que funciona)

> **Produção NÃO sai do GitHub.** O site é hospedado no **Cloudflare Pages** (projeto
> `tyna-website`) por **upload direto** da pasta `dist/`. Dar `git push` versiona o código
> mas **não muda nada em produção** — os dois passos são independentes.
>
> O projeto está com `Git Provider: No` (confira em `npx wrangler pages project list`), ou seja,
> não existe build automático a partir do repositório. Isso já fez dois lotes de posts ficarem
> commitados e fora do ar por dias.

```bash
npm run deploy
```

Isso sincroniza `dist/` com os arquivos públicos da raiz e sobe para a Cloudflare. Se você
mexeu em posts do blog, use o comando que regenera o HTML antes de publicar:

```bash
npm run deploy:build
```

Depois publique também o código (não é opcional — sem isso o repositório fica atrás de produção):

```bash
git push origin main
```

Comandos disponíveis:

| Comando                | O que faz                                                    |
|------------------------|--------------------------------------------------------------|
| `npm run build`        | Regenera `blog/`, `sitemap.xml` e `rss.xml` a partir de `content/blog/*.md` |
| `npm run check`        | Valida os posts (frontmatter, slugs, links)                   |
| `npm run deploy`       | Sincroniza `dist/` e publica na Cloudflare Pages              |
| `npm run deploy:build` | `build` + `deploy` numa tacada                                |

`node tools/deploy.mjs --dry-run` monta `dist/` sem publicar, se você quiser conferir antes.

### Pré-requisitos do deploy

- Node 20+ e `npx` disponíveis.
- Estar autenticado no wrangler (`npx wrangler login`). A conta e o projeto ficam em
  `.wrangler/cache/pages.json` — conta `e985579164d8779fbc6d07ab5561c722`, projeto `tyna-website`.

### Conferir se foi ao ar

```bash
npx wrangler pages deployment list --project-name tyna-website
```

A primeira linha deve ser de agora. Se o commit listado for antigo, alguém esqueceu de publicar.
No navegador, use Ctrl+F5 ou aba anônima — a Cloudflare serve com `max-age=0` mas o cache local engana.

## Estrutura

```
tyna_website/
├── index.html          ← home (HTML + CSS + JS inline)
├── sobre/index.html    ← página Sobre
├── blog/               ← GERADO por tools/build-blog.mjs — não editar à mão
├── assets/             ← styles.css, blog.css, site.js, logo
├── content/blog/*.md   ← fonte real dos posts (markdown + frontmatter)
├── tools/
│   ├── build-blog.mjs  ← gerador do blog
│   ├── check-blog.mjs  ← validador dos posts
│   ├── scaffold-posts.mjs
│   └── deploy.mjs      ← sincroniza dist/ e publica
├── dist/               ← saída do deploy (gitignored, descartável)
├── rss.xml, sitemap.xml← GERADOS pelo build
└── CNAME               ← herança do GitHub Pages; a Cloudflare não usa
```

Os arquivos em `blog/` são commitados, mas são **saída de build**: edite o markdown em
`content/blog/` e rode `npm run build`. O gerador apaga e recria `blog/` inteiro.

## Editar conteúdo

- **Home e Sobre**: direto no HTML, organizados por seção com comentários (`<!-- SERVIÇOS -->`,
  `<!-- TRILHAS -->` etc.).
- **Posts**: markdown em `content/blog/`, com frontmatter (`title`, `description`, `date`,
  `category`, `tags`). `node tools/scaffold-posts.mjs` cria o esqueleto.

## Detalhes que já causaram problema

**CTA "Agendar conversa"** — todos os botões apontam para
`mailto:contato@tyna.com.br?subject=Agendamento%20reuni%C3%A3o%20Tyna`, que abre o cliente de
e-mail do dispositivo com o assunto preenchido. Cada um está envolvido em
`<!--email_off-->…<!--/email_off-->`: sem isso a **ofuscação de e-mail da Cloudflare**
(Scrape Shield) reescreve o `href` para `/cdn-cgi/l/email-protection#…` e o botão só funciona
depois que o JavaScript dela roda. Mantenha os comentários ao mexer nesses botões — no
`build-blog.mjs` isso está centralizado no helper `ctaAgendar()`.

**DNS** — `tyna.com.br` aponta para a Cloudflare, com o domínio customizado configurado no
projeto do Pages. Os registros A do GitHub Pages e o arquivo `CNAME` na raiz são resquício da
configuração antiga e não têm efeito.
