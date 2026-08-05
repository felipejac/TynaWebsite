# Tyna — site institucional

Site estático (HTML/CSS/JS puro, sem build) em `index.html`. Sem dependências — basta subir o arquivo em qualquer host estático.

## 1. Enviar para o repositório (felipejac/TynaWebsite)

O pacote já vem com o git inicializado, o commit feito e o remote `origin` configurado para
`https://github.com/felipejac/TynaWebsite.git`. Só falta autenticar e enviar:

```bash
cd tyna-site
git push -u origin main
```

Se o Git pedir usuário/senha, use seu usuário do GitHub e um **Personal Access Token** no lugar da senha
(Settings → Developer settings → Personal access tokens, no próprio GitHub). Se preferir SSH, troque o remote antes:

```bash
git remote set-url origin git@github.com:felipejac/TynaWebsite.git
git push -u origin main
```

Se o repositório `TynaWebsite` já tiver algum conteúdo (ex.: README criado pelo próprio GitHub), o push
pode ser rejeitado por divergência de histórico — nesse caso:

```bash
git pull origin main --allow-unrelated-histories
# resolva algum conflito se aparecer, depois:
git push -u origin main
```

## 2. Ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**
2. Em **Source**, selecione a branch `main` e a pasta `/ (root)`
3. Salve — o GitHub publica em `https://felipejac.github.io/TynaWebsite/`

O arquivo `CNAME` já está na raiz com `tyna.com.br` — o GitHub Pages vai reconhecer o domínio customizado automaticamente após o DNS ser configurado (passo 3).

## 3. Apontar o domínio (tyna.com.br) via Cloudflare

Como o domínio já está registrado, só falta apontar o DNS para o GitHub Pages:

**Registros a criar no painel DNS da Cloudflare:**

| Tipo  | Nome | Conteúdo             |
|-------|------|-----------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | SEU_USUARIO.github.io |

Deixe o proxy da Cloudflare (ícone da nuvem) **desativado (DNS only)** até confirmar que o site está no ar — depois pode reativar para usar CDN/SSL da Cloudflare.

## 4. Confirmar o domínio no GitHub

Volte em **Settings → Pages** do repositório, digite `tyna.com.br` no campo **Custom domain** e marque **Enforce HTTPS** assim que o certificado for emitido (pode levar até ~24h na primeira propagação).

## Estrutura

```
tyna-site/
├── index.html   ← site completo (HTML + CSS + JS inline)
├── CNAME        ← domínio customizado para o GitHub Pages
└── README.md
```

## Editar conteúdo

Todo o conteúdo (textos, cases, trilhas) está direto no `index.html`, em português, organizado por seção com comentários HTML (`<!-- SERVIÇOS -->`, `<!-- TRILHAS -->` etc.) para localizar rápido.
