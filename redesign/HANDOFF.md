# Tyna — redesign da home (handoff para Claude Code)

## Objetivo
Substituir a home atual de tyna.com.br pelo novo layout. O site é HTML/CSS/JS puro, publicado via GitHub Pages + Cloudflare. Não introduza framework nem etapa de build.

## Conteúdo deste pacote
- `desktop.html`: layout aprovado em 1440 px. É a fonte da verdade para copy, ordem das seções, cores e espaçamentos.
- `mobile.html`: layout aprovado em 390 px (versão resumida, mostra o comportamento mobile esperado).
- `logo-tyna-sm.png`: logo oficial (211×68). Se existir SVG no repositório, prefira o SVG.

Os arquivos de referência usam estilo inline e largura fixa porque vieram de uma ferramenta de design. **Não copie assim para produção.**

## O que implementar
1. Reescrever o `index.html` da raiz seguindo a ordem de seções do desktop:
   nav → hero (com console animado) → logos → métricas → riscos + CTA diagnóstico → diferencial (tabela, fundo claro) → controles de agente → serviços → faixa ISO 42001 → cases (fundo claro) → formatos → quem conduz → FAQ → CTA final → footer.
2. Extrair os estilos para CSS com classes (ex.: `css/home.css`), usando custom properties:
   - `--bg #0E0D12`, `--surface #121118`, `--surface-2 #17151F`, `--line #24212E`, `--line-2 #2E2A3A`
   - `--text #F2F0F5`, `--muted #B9B3C6`, `--subtle #8E889C`
   - `--accent #B79CFF`, `--violet-bg #1B1628`, `--violet-line #3B2F5C`, `--brand-violet #5B2A86`
   - `--cta #FF6A3D` (texto do botão `#140A05`)
   - claro: `--light-bg #F4F2EE`, `--light-text #141217`, `--light-muted #4A4553`
   - status: `#4ADE80` permitido, `#FBBF24` mascarado, `#F87171` bloqueado
3. Fontes via Google Fonts: Bricolage Grotesque (600/700, títulos), IBM Plex Sans (400/500/600, texto), JetBrains Mono (400/500, rótulos). Mantenha fallbacks.
4. Responsivo, mobile-first, com breakpoints sugeridos em 640 / 960 / 1280. Largura máxima do conteúdo 1248 px, com padding lateral 20 px no mobile e 96 px no desktop.
   - Grids de 4 e 3 colunas passam para 2 e depois 1 coluna.
   - A tabela "diferencial" vira cards empilhados abaixo de 960 px.
   - Títulos usam `clamp()`: h1 de 48 a 84 px, h2 de 34 a 56 px.
   - O console do hero vai para baixo dos CTAs no mobile. Abaixo de 640 px, esconder as colunas HORA e ORIGEM.
   - Nav mobile com botão hambúrguer acessível (`aria-expanded`), abrindo menu com os mesmos links.
   - Barra fixa de WhatsApp no rodapé só no mobile (ver `mobile.html`).
5. Console animado do AI Gateway: copie as regras `.tyna-log-viewport`, `.tyna-log-track`, `@keyframes tyna-log-scroll`, `.tyna-live` e o bloco `prefers-reduced-motion` do `<style>` de `desktop.html`.
   - A trilha tem 8 linhas duplicadas (16 no total) de 42 px cada. O keyframe desloca de 42 em 42 px até −336 px. Se mudar a altura da linha, recalcule os valores.
   - Adicione `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` nas células para nenhuma linha quebrar.
6. FAQ: já está com `<details>/<summary>`, sem JS. Manter assim.
7. Links:
   - Todos os CTAs de conversa apontam para o WhatsApp com mensagem pré-preenchida (ver `href` nos arquivos).
   - Os CTAs secundários apontam para `/diagnostico/`.
   - Nos links internos, use caminhos relativos em vez de `https://tyna.com.br/...`.
8. Preservar o que já existe no repositório: meta tags, SEO/Open Graph, schema.org, analytics, favicon, widget de WhatsApp (remova se duplicar a barra mobile) e as demais páginas (guias, blog, diagnóstico etc.). Se o header e o footer forem compartilhados com outras páginas, aplique o novo visual de forma consistente ou isole o CSS da home com uma classe no `<body>`.
9. Pendências de conteúdo, a confirmar com o Felipe antes do deploy:
   - Foto real na seção "Quem conduz". Hoje há um placeholder "FOTO".
   - Selo "Mais procurado" no card AI Gateway.
   - Revisar a acentuação do texto do hero ("Defina politicas" → "políticas").

## Critérios de aceite
- Sem scroll horizontal em 360, 390, 768, 1024, 1440 px.
- Contraste AA em textos. Foco visível em links e botões. Alvos de toque de pelo menos 44 px.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
- Animação pausa no hover e fica estática com `prefers-reduced-motion`.
- Abrir o branch em preview e comparar visualmente com `desktop.html` antes do merge.
