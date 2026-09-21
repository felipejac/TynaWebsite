# Biblioteca de Prompts — instruções de implementação

Página nova do site da Tyna, publicada em **https://tyna.com.br/biblioteca-prompts/**.

Este arquivo é para o Claude Code e para quem mantiver a página depois. Leia inteiro antes de mexer em qualquer arquivo.

---

## 0. Como ficou implementado (21/09/2026) — leia antes das seções 3 e 4

O pacote original previa GitHub Pages e barra de topo própria. Na
implementação, a página foi adaptada ao código e ao deploy reais do site. Onde este
bloco e as seções abaixo discordarem, **vale este bloco**.

- **Deploy:** o site não sai do GitHub. Produção é upload direto para o Cloudflare
  Pages com `npm run deploy` (ver `tools/deploy.mjs`). `git push` só versiona. A pasta
  `biblioteca-prompts` está na lista `PUBLISH` do deploy; `scripts/` e este `.md` não
  são publicados.
- **Moldura:** a página usa o cabeçalho, o menu, o rodapé, as fontes (Space Grotesk e
  IBM Plex Mono, servidas pelo próprio site) e o `assets/styles.css` da Tyna. A barra de
  topo própria e o Google Fonts saíram. A busca (`id="q"`) e o botão de tema
  (`id="theme"`) ficam lado a lado dentro da barra de stacks.
- **Cores e escopo:** `assets/biblioteca.css` foi reescrito com a paleta da Tyna (roxo
  identifica, laranja é ação) e tudo fica sob `.bib`. Os tokens usam prefixo `--b-`
  porque o site já usa `--accent`, `--line` e `--ink` com outro sentido.
- **Tema claro e escuro:** segue o sistema de quem não escolheu e lembra a escolha do
  botão (`localStorage`, chave `tyna-biblioteca-theme`); um script no `<head>` aplica o
  tema antes da pintura, para a página não piscar clara. O escuro vale também para o
  cabeçalho e o menu do site, mas só nesta página: `biblioteca.css` redefine as
  variáveis do site (`--ink`, `--text`, `--line`) e troca o logo pela versão clara. As
  cores escuras estão em dois blocos idênticos no fim do CSS (um para o botão, outro
  para o sistema) — ao mudar uma cor, mude nos dois.
- **Posições:** o cabeçalho do site tem 77px e é sticky. A barra de stacks gruda logo
  abaixo dele no desktop e deixa de grudar abaixo de 720px, para sobrar tela no celular.
- **Menu:** o item no menu de todas as páginas é "Prompts" (curto, para caber); no
  rodapé, "Biblioteca de Prompts". O espaçamento do menu foi ajustado em
  `assets/styles.css` para caber entre 901px e 1440px.
- **Versões:** os assets da biblioteca estão em `?v=2.2`; os do site, em `?v=22`
  (`ASSET_V` em `tools/build-blog.mjs`). Ao mudar arquivo de `assets/`, suba o número.
- **Sitemap:** entra pelo gerador (`tools/build-blog.mjs`), não editando `sitemap.xml`
  à mão — o arquivo é regravado a cada build.
- **Medição:** a página tem o GA4 do site, com o mesmo bloqueio em localhost.

---

## 1. O que é

Uma página única, em HTML/CSS/JS puro, sem framework e sem build — o mesmo modelo do resto do site. Ela contém:

- **145 prompts** de imagem e vídeo para equipes de marketing: 29 casos de uso escritos para 5 stacks (Autoral, Google, OpenAI, Adobe, Open source).
- Seletor de stack, filtros por bloco e formato, busca (atalho `/`), botão de copiar e alternância entre **Modelo** e **Exemplo** preenchido.
- Referência de sintaxe de cada stack, consistência de marca, erros comuns, direitos, protocolo de teste e fontes.
- Tema claro e escuro, com a escolha lembrada no navegador.

A página já foi testada servida a partir de uma pasta, do jeito que o GitHub Pages serve: `/biblioteca-prompts` redireciona para `/biblioteca-prompts/`, todos os arquivos carregam, nenhum erro de JavaScript, sem rolagem horizontal no celular.

---

## 2. Arquivos do pacote

```
tyna_website/                         ← raiz do projeto
├── BIBLIOTECA-PROMPTS.md             ← este arquivo
├── biblioteca-prompts/               ← vira tyna.com.br/biblioteca-prompts/
│   ├── index.html                    ← marcação da página e <head> com SEO
│   └── assets/
│       ├── biblioteca.css            ← todos os estilos da página, isolados
│       ├── data.js                   ← stacks, casos de uso e os 145 prompts
│       ├── examples.js               ← valores do exemplo preenchido
│       └── app.js                    ← referência por stack e lógica da página
└── scripts/
    └── lint-prompts.mjs              ← verificador de regras dos prompts
```

A ordem dos scripts no `index.html` importa: `data.js` → `examples.js` → `app.js`. Não reordene.

Todos os caminhos de arquivo são **absolutos** (`/biblioteca-prompts/assets/...`). Isso é proposital: com caminho relativo, quem acessasse a URL sem a barra final receberia a página sem estilo. Não troque por relativo.

---

## 3. Passo a passo para o Claude Code

### 3.1 Confirmar de onde o GitHub Pages serve o site

Antes de mover qualquer coisa, descubra qual pasta é publicada:

- Procure o arquivo `CNAME` (conteúdo `tyna.com.br`) e o `index.html` principal.
- Se estiverem na **raiz** do repositório, a pasta `biblioteca-prompts/` fica na raiz. Nada a mover.
- Se estiverem em **`docs/`**, mova `biblioteca-prompts/` para `docs/biblioteca-prompts/`. `scripts/` e este `.md` continuam na raiz, e aí é preciso corrigir o caminho em `scripts/lint-prompts.mjs` (linha que monta `assets`) para `'..', 'docs', 'biblioteca-prompts', 'assets'`.

Se houver arquivo `_config.yml` com lista `exclude`, confirme que `biblioteca-prompts` não está excluída. Pastas que começam com `_` são ignoradas pelo Jekyll do GitHub Pages — esta não começa, então não há problema.

### 3.2 Colocar o favicon da Tyna

Em `biblioteca-prompts/index.html` há um comentário `<!-- FAVICON: ... -->`. Copie para esse lugar exatamente as mesmas tags `<link rel="icon" ...>` (e `apple-touch-icon`, se houver) do `index.html` da raiz, mantendo caminhos absolutos.

### 3.3 Linkar a página no menu do site

O site não tem componente compartilhado, então o menu está repetido em cada página. Para cada `.html` do site que tenha o menu principal, adicione o item:

```html
<a href="/biblioteca-prompts/">Biblioteca de Prompts</a>
```

Siga a marcação e as classes que o menu já usa em cada página — não copie o exemplo acima literalmente se o menu usar `<li>` ou classes próprias. Se o rodapé tiver lista de links, adicione lá também.

### 3.4 Atualizar o sitemap

Se existir `sitemap.xml`, adicione:

```xml
<url>
  <loc>https://tyna.com.br/biblioteca-prompts/</loc>
  <changefreq>monthly</changefreq>
</url>
```

A URL canônica já está no `<head>` da página com a barra final. Use a mesma forma no sitemap e no menu.

### 3.5 Testar localmente

No PowerShell, na raiz do projeto (o caminho tem espaço, por isso as aspas):

```powershell
cd "C:\Users\Felipe Lourenzo\tyna_website"
py -m http.server 8000
```

Abra `http://localhost:8000/biblioteca-prompts/` e confira a lista da seção 5. Se o `py` não existir, `npx serve .` funciona igual. Se o site for servido de `docs/`, rode o servidor de dentro de `docs/`.

Abrir o `index.html` com duplo clique **não funciona** — os caminhos absolutos precisam de um servidor.

### 3.6 Rodar o verificador

```powershell
node scripts/lint-prompts.mjs
```

Precisa terminar com `problemas: 0`. O comando sai com código 1 se encontrar problema, então dá para usar em CI.

### 3.7 Publicar

```powershell
git add biblioteca-prompts scripts BIBLIOTECA-PROMPTS.md
git add -u
git commit -m "Adiciona a Biblioteca de Prompts em /biblioteca-prompts"
git push
```

O `git add -u` leva junto as páginas em que o menu foi alterado e o `sitemap.xml`.

Depois do deploy, se a página nova não aparecer ou aparecer sem estilo, limpe o cache no Cloudflare: **Caching → Configuration → Purge Cache → Custom Purge**, com `https://tyna.com.br/biblioteca-prompts/`.

---

## 4. Integração visual com a marca Tyna

A página tem identidade própria (cinza técnico com acento rubi) e barra de topo própria. A marca no canto esquerdo da barra é um link para `/`, então ninguém fica preso na página.

### Trocar as cores pelas da Tyna

Todas as cores estão como variáveis no começo de `assets/biblioteca.css`, em **três blocos** que precisam ser editados juntos:

1. `:root { ... }` — tema claro
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` — escuro pelo sistema
3. `:root[data-theme="dark"] { ... }` — escuro escolhido no botão

Os blocos 2 e 3 têm os mesmos valores. Editar só um deixa o tema escuro inconsistente.

| Variável | Papel | Valor atual (claro) |
|---|---|---|
| `--accent` | botão de stack ativo, variáveis, links, destaques | `#A8003C` |
| `--accent-soft` / `--accent-line` | fundo e borda dos chips de variável | `#F6E3EA` / `#E3B9C8` |
| `--bg` | fundo da página | `#E9E9E6` |
| `--surface` | fundo dos cards | `#FBFBFA` |
| `--ink` | texto principal | `#16161A` |
| `--display` / `--sans` / `--mono` | fontes de título, texto e prompt | Archivo, IBM Plex Sans, IBM Plex Mono |

Se trocar as fontes, troque também o `<link>` do Google Fonts no `<head>` do `index.html`.

### Se quiser usar o cabeçalho do site em vez da barra própria

Dá para fazer, mas quatro valores de posicionamento em `biblioteca.css` dependem da altura da barra atual (~58 px) e precisam ser recalculados com a altura do cabeçalho da Tyna:

| Seletor | Propriedade | Valor atual | Novo valor |
|---|---|---|---|
| `.topbar` | `top` | `env(safe-area-inset-top, 0px)` | remover a regra, se a barra própria sair |
| `.stackbar` | `top` | o `58px` dentro do `calc()` | altura do cabeçalho da Tyna |
| `.rail` | `top` | o `74px` dentro do `calc()` | altura do cabeçalho + 16 px |
| `section` | `scroll-margin-top` | `150px` | altura do cabeçalho + ~90 px |

A busca e o botão de tema moram na barra própria. Se ela sair, mova os dois para dentro da página, mantendo os `id`s `q` e `theme` — o `app.js` procura por eles.

---

## 5. Checklist de aceite

- [ ] `https://tyna.com.br/biblioteca-prompts` abre e redireciona para a versão com barra.
- [ ] A página carrega com estilo, fontes e o contador em **29 prompts**.
- [ ] Os 5 botões de stack trocam os cards e a seção "Referência".
- [ ] Filtros de bloco e formato funcionam; a busca filtra; `/` foca a busca e `Esc` limpa.
- [ ] **Modelo / Exemplo** alterna o texto do card; **Copiar prompt** copia a versão exibida.
- [ ] O botão de tema alterna claro/escuro, e a escolha continua depois de recarregar.
- [ ] Sem rolagem horizontal em 390 px de largura.
- [ ] A marca "Biblioteca de Prompts" no topo leva para a home.
- [ ] O favicon é o da Tyna.
- [ ] O item de menu aparece em todas as páginas do site.
- [ ] `node scripts/lint-prompts.mjs` → `problemas: 0`.

O botão de copiar depende de HTTPS. Em produção funciona; em `localhost` também. Em outro endereço HTTP, ele tenta um método alternativo e, se falhar, avisa para copiar com Ctrl+C.

---

## 6. Como manter o conteúdo

### Estrutura dos dados

**`data.js`**

- `STACKS` — as 5 stacks: `id`, `name`, ferramenta de imagem (`img`), de vídeo (`vid`) e a frase que aparece abaixo do seletor (`blurb`).
- `CASES` — os 29 casos de uso: `id` (ex. `KV-01`), `kind` (`Imagem` ou `Vídeo`), `fmt` (formato, vira filtro), `title` e `out` (resultado esperado).
- `PROMPTS[stackId][caseId]` — um prompt:
  - `tool` — nome da ferramenta mostrado no card
  - `p` — o prompt; variáveis entre chaves em CAIXA ALTA: `{PRODUTO}`, ou com dica: `{AÇÃO_1: um gesto contado}`
  - `c` — parâmetros ou container
  - `neg` — negative prompt (**só para Veo 3.1**; o verificador acusa em qualquer outra ferramenta)
  - `n` — nota de uso (pode ser `''`)

**`examples.js`** — `EXAMPLES[caseId]` com um valor para cada variável usada naquele caso, em qualquer stack. A função `fill()` troca as variáveis e já contrai "de o" → "do", "em a" → "na" etc.

**`app.js`** — no topo, `REF[stackId]` com o texto de abertura (`lede`) e o HTML da seção "Referência" de cada stack. O resto do arquivo é a lógica da página.

### Tarefas comuns

**Editar um prompt:** mude o `p`, o `c` ou o `n` no `data.js`. Rode o verificador.

**Criar uma variável nova num prompt:** adicione o valor dela no `EXAMPLES` do mesmo caso, em `examples.js`. Sem isso, o modo Exemplo mostra `{VARIÁVEL}` crua — o verificador acusa como `[exemplo]`.

**Adicionar um caso de uso:** crie a entrada em `CASES`, escreva o prompt nas 5 stacks em `PROMPTS` e os valores em `EXAMPLES`. O verificador acusa `[cobertura]` se faltar alguma stack. Depois, atualize os números do topo da página no `index.html` (bloco `.stats`: 145 prompts, 29 casos de uso, 29 exemplos).

**Adicionar uma stack:** entrada em `STACKS`, 29 prompts em `PROMPTS[novaStack]`, bloco em `REF` no `app.js`. Se a ferramenta for nova, acrescente as regras dela no `scripts/lint-prompts.mjs`, seguindo o padrão das outras. Atualize os números do topo.

### Toda vez que mudar um arquivo de `assets/`

1. Rode `node scripts/lint-prompts.mjs`.
2. Suba o número de versão no `index.html`: os quatro `?v=2.0` (um CSS e três JS) viram `?v=2.1`. É o que obriga o navegador e o Cloudflare a buscar o arquivo novo em vez do antigo em cache.

---

## 7. O que o verificador checa

Em cada um dos 145 prompts:

- os 29 casos existem em todas as stacks;
- chaves balanceadas, variáveis em caixa alta, e toda variável tem valor de exemplo;
- negative prompt só onde a ferramenta tem o campo (Veo 3.1);
- **Midjourney:** parâmetros no fim, espaço antes dos traços, sem pontuação no bloco de parâmetros, `--s` 0–1000, `--c` 0–100, `--sw` 0–1000;
- **Gemini Image:** nenhuma flag, proporção escrita no texto e dentro da lista suportada, resolução com K maiúsculo;
- **GPT Image:** lados até 3840 e múltiplos de 16, proporção até 3:1, total de pixels na faixa permitida;
- **Firefly:** proporções que existem (imagem: 4:3, 3:4, 1:1, 16:9, 9:16 só no Image 4 e 4 Ultra; vídeo: 16:9, 9:16, 1:1), vídeo com 8 palavras ou mais e até 1.800 caracteres;
- **FLUX:** sem sintaxe de peso `(x:1.4)`, guidance até 5.0, entre 25 e 90 palavras;
- **Runway Gen-4:** nenhuma frase negativa ("sem", "não", "nenhum");
- **Sora 2:** duração e tamanho válidos, resoluções altas só no `sora-2-pro`;
- **Veo 3.1:** duração, proporção e resolução válidas, 8 s quando usa `referenceImages`, negative prompt sem negação.

O verificador garante que o prompt **roda** na ferramenta. Não garante que o resultado seja bom — isso só se sabe gerando, e é o que o protocolo descrito na própria página resolve.

As regras refletem a documentação oficial de cada fabricante verificada em setembro de 2026. Quando uma ferramenta mudar de versão, revise as regras e os prompts dela juntos.

---

## 8. Prompt sugerido para o Claude Code

Cole isto no Claude Code, com o projeto `tyna_website` aberto:

> Leia o arquivo `BIBLIOTECA-PROMPTS.md` na raiz do projeto e implemente a Biblioteca de Prompts seguindo a seção 3, na ordem. Antes de mover arquivos, me diga se o site é servido da raiz ou de `docs/`. Não altere nada dentro de `biblioteca-prompts/assets/` além do que o documento pede. Ao final, rode `node scripts/lint-prompts.mjs`, suba um servidor local e percorra o checklist da seção 5, me dizendo o resultado de cada item. Não faça commit nem push sem eu confirmar.
