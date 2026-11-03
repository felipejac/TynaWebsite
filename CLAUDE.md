# TynaWebsite

## Deploy (produção)

O site é publicado no Cloudflare Pages (projeto `tyna-website`, domínio tyna.com.br). A produção NÃO é publicada automaticamente pela Cloudflare a partir de um push (Git Provider: No) — o deploy é feito pelo script `tools/deploy.mjs`.

Duas formas de publicar:

1. **GitHub Actions (automático):** o workflow `.github/workflows/deploy.yml` roda `npm run deploy:build` em push na branch `main` e também pode ser disparado manualmente (workflow_dispatch, botão "Run workflow"). Requer estes secrets no repositório (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — token com permissão *Cloudflare Pages: Edit*
   - `CLOUDFLARE_ACCOUNT_ID` — ID da conta Cloudflare
2. **Local/manual:** com essas duas variáveis exportadas no ambiente, rodar `npm run deploy` (ou `npm run deploy:build` para rebuildar o blog antes de publicar).

O comando final de publicação é `npx wrangler pages deploy dist --project-name tyna-website --branch main`. Nunca commitar tokens — sempre via secrets/variáveis de ambiente.

## Criar uma nova página de conteúdo (pilar, artigo, guia)

Crie a pasta e o `index.html` na raiz do repositório. O sitemap e o deploy **descobrem automaticamente** qualquer pasta com `index.html` — **não edite** `tools/build-blog.mjs` nem `tools/deploy.mjs` para registrar a página.

**Obrigatório:** adicione pelo menos um link interno de uma página já existente para a nova página. Sem isso, o deploy aborta com "página órfã". Escolha a página existente mais relacionada e inclua o link numa seção "Leia também" ou no corpo do texto.
