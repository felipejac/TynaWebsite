// Biblioteca de Prompts — Tyna · referência por stack e lógica da página
// ---------------------------------------------------------------- reference per stack
const REF = {
autoral:{
 lede:'Midjourney para imagem, Sora 2 e Veo 3.1 para vídeo. Controle fino de estilo, ao custo de aprender sintaxe de parâmetros.',
 html:`
<div class="panel">
  <h3>Midjourney · parâmetro no fim, espaço antes, sem pontuação</h3>
  <div class="codeblock"><pre>retrato em estúdio de uma ceramista, luz de janela difusa <span class="blk">--ar 4:5 --s 250</span></pre></div>
  <div class="vs">
    <div class="bad"><span class="tag">Quebra</span><code>ceramista--ar 4:5 → sem espaço
--ar 4:5, → pontuação no parâmetro
--ar 4:5 ceramista → texto depois</code></div>
    <div class="good"><span class="tag">Funciona</span><code>ceramista em estúdio --ar 4:5 --s 250 --raw</code></div>
  </div>
</div>
<div class="panel">
  <h3>Os parâmetros que importam</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Parâmetro</th><th>Faixa</th><th>Padrão</th><th>Para que serve</th></tr></thead>
  <tbody>
  <tr><td><code>--ar</code></td><td>16:9, 4:5, 9:16</td><td>1:1</td><td>Formato da peça</td></tr>
  <tr><td><code>--s</code></td><td>0 a 1000</td><td>100</td><td>0 obedece o prompt; 1000 vira arte e desvia do briefing</td></tr>
  <tr><td><code>--c</code></td><td>0 a 100</td><td>0</td><td>Variedade entre as quatro imagens da grade</td></tr>
  <tr><td><code>--no</code></td><td>lista de itens</td><td>—</td><td>Exclusão explícita</td></tr>
  <tr><td><code>--raw</code></td><td>flag</td><td>—</td><td>Menos estilização automática</td></tr>
  <tr><td><code>--seed</code></td><td>número</td><td>aleatório</td><td>Reprodutibilidade em teste</td></tr>
  <tr><td><code>--sref</code> / <code>--sw</code></td><td>código ou URL / 0 a 1000</td><td>— / 100</td><td>Referência de estilo e sua força</td></tr>
  <tr><td><code>--tile</code></td><td>flag</td><td>—</td><td>Padrão repetível sem emenda</td></tr>
  <tr><td><code>--v</code></td><td>versão</td><td>V8.2</td><td>Padrão desde 24 jul 2026</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Multi-prompt com <span class="mono-inline">::</span> e pesos numéricos parou na 6.1. Em V8.2 a ênfase vai escrita na frase. Anexar Omni Reference no site força a geração para V7, independente da versão configurada.</p>
</div>
<div class="panel">
  <h3>Style Reference: a consistência de marca</h3>
  <p>O <span class="mono-inline">--sref</span> captura cor, textura, luz e meio. Não copia objetos nem pessoas. A orientação oficial é contraintuitiva: mantenha o texto simples e descreva o conteúdo, nunca a instrução.</p>
  <div class="vs">
    <div class="bad"><span class="tag">Não funciona</span><code>a cara dessa imagem mas com um cachorro</code></div>
    <div class="good"><span class="tag">Funciona</span><code>retrato detalhado de um cachorro</code></div>
  </div>
</div>
<div class="panel">
  <h3>Sora 2 e Veo 3.1 · o container</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Ferramenta</th><th>Campo</th><th>Valores</th></tr></thead>
  <tbody>
  <tr><td>Sora 2</td><td><code>seconds</code></td><td>4, 8, 12, 16, 20 — padrão 4</td></tr>
  <tr><td>Sora 2</td><td><code>size</code></td><td>720x1280, 1280x720; o pro sobe até 1920x1080</td></tr>
  <tr><td>Sora 2</td><td><code>characters</code></td><td>até 2 personagens, de clipe de 2 a 4 s</td></tr>
  <tr><td>Veo 3.1</td><td><code>durationSeconds</code></td><td>4, 6 ou 8; com <code>referenceImages</code> trava em 8</td></tr>
  <tr><td>Veo 3.1</td><td><code>generateAudio</code></td><td>obrigatório nos modelos Veo 3</td></tr>
  <tr><td>Veo 3.1</td><td><code>negativePrompt</code></td><td>descrição do que evitar, nunca negação</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">O guia do Sora recomenda emendar <b>dois clipes de 4 segundos</b> em vez de gerar um de 8. Plano curto segue instrução com mais fidelidade — e isso muda orçamento de edição.</p>
</div>`},

google:{
 lede:'Gemini Image para imagem, Veo 3.1 para vídeo. Não existe flag: proporção, resolução e tudo mais vão escritos na própria frase.',
 html:`
<div class="panel">
  <h3>Prosa narrativa, não lista de palavras-chave</h3>
  <p>A orientação oficial é escrever descritivamente em cinco dimensões — estilo, sujeito, cenário, ação e composição — e não empilhar tags. Quanto mais detalhe na frase, mais perto do que você imaginou.</p>
  <div class="vs">
    <div class="bad"><span class="tag">Fraco</span><code>produto, estúdio, luz suave, 4k, profissional</code></div>
    <div class="good"><span class="tag">Forte</span><code>Fotografia de produto de um frasco âmbar sobre mármore. Um softbox à esquerda cria luz suave e reflexo alongado. Fundo bege em degradê. Proporção 4:5, resolução 4K.</code></div>
  </div>
</div>
<div class="panel">
  <h3>Texto dentro da imagem</h3>
  <p>É a vantagem real desta stack. Coloque a frase entre aspas e descreva a tipografia: <span class="mono-inline">escreva "Semana do Consumidor" em sans-serif pesada</span>. Confira acento e cedilha mesmo assim — português acentuado ainda escorrega.</p>
</div>
<div class="panel">
  <h3>Modelos, proporções e referências</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Modelo</th><th>Resolução</th><th>Referências</th><th>Quando usar</th></tr></thead>
  <tbody>
  <tr><td><code>gemini-3-pro-image</code></td><td>1K, 2K, 4K</td><td>6 objetos + 5 personagem + 3 estilo</td><td>Peça final, consistência de campanha</td></tr>
  <tr><td><code>gemini-3.1-flash-image</code></td><td>512px, 1K, 2K, 4K</td><td>10 objetos + 4 personagem</td><td>Volume, exploração, variação rápida</td></tr>
  <tr><td><code>gemini-3.1-flash-lite-image</code></td><td>1K</td><td>14 objetos</td><td>Rascunho e teste de conceito</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Proporções aceitas: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9 e 21:9. Não há 3:1 — para outdoor, use 21:9 e recorte. Escreva o K maiúsculo: <span class="mono-inline">2K</span>, não <span class="mono-inline">2k</span>.</p>
</div>
<div class="panel">
  <h3>Veo 3.1 · o container</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Campo</th><th>Valores</th></tr></thead>
  <tbody>
  <tr><td><code>durationSeconds</code></td><td>4, 6 ou 8 — padrão 8; com <code>referenceImages</code> trava em 8</td></tr>
  <tr><td><code>aspectRatio</code></td><td>16:9 ou 9:16</td></tr>
  <tr><td><code>resolution</code></td><td>720p ou 1080p</td></tr>
  <tr><td><code>generateAudio</code></td><td>obrigatório nos modelos Veo 3</td></tr>
  <tr><td><code>negativePrompt</code></td><td>descrição do que evitar</td></tr>
  <tr><td><code>personGeneration</code></td><td>controle de geração de pessoas e rostos</td></tr>
  </tbody></table></div>
  <div class="vs">
    <div class="bad"><span class="tag">Negativa errada</span><code>sem iluminação de teto, não use cores berrantes</code></div>
    <div class="good"><span class="tag">Negativa certa</span><code>iluminação de teto, cores berrantes, múltiplos carros</code></div>
  </div>
</div>`},

openai:{
 lede:'GPT Image para imagem, Sora 2 para vídeo. Prompt em seções rotuladas, sem sintaxe especial para decorar.',
 html:`
<div class="panel">
  <h3>Seções rotuladas vencem parágrafo corrido</h3>
  <p>A orientação oficial é usar prompts curtos, descrições, JSON ou tags — nunca uma sintaxe inventada. Na prática, uma linha por dimensão é o formato mais fácil de manter e de editar depois.</p>
  <div class="codeblock"><pre><span class="blk">Cena:</span> estúdio de produto, fundo bege em degradê
<span class="blk">Sujeito:</span> frasco âmbar sobre mármore, centralizado
<span class="blk">Estilo:</span> fotografia real de produto
<span class="blk">Luz:</span> softbox à esquerda, sombra curta sob a base
<span class="blk">Restrições:</span> nenhum outro objeto, sem texto</pre></div>
</div>
<div class="panel">
  <h3>Os sete princípios oficiais, em ordem de utilidade</h3>
  <div class="list">
    <div><h4>Diga o resultado, não a vibe</h4><p>Nomeie sujeito, uso pretendido, composição e restrições de posicionamento. “Aconchegante” não vira nada; “luz de abajur quente pela direita” vira.</p></div>
    <div><h4>Diga “fotografia real” quando for</h4><p>O modelo não assume fotorrealismo. Peça o meio explicitamente, junto com material, luz e cor.</p></div>
    <div><h4>Texto exato entre aspas</h4><p>E soletre nome próprio incomum letra por letra. Descreva também a posição dele no quadro.</p></div>
    <div><h4>Separe o que muda do que fica</h4><p>Ao editar, escreva “altere apenas X” e liste o que precisa ser preservado. É o que impede deriva ao longo das iterações.</p></div>
    <div><h4>Dê papel a cada referência</h4><p>Numere as imagens de entrada e diga o que fazer com cada uma. Referência sem papel atribuído vira cópia.</p></div>
  </div>
</div>
<div class="panel">
  <h3>Parâmetros</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Campo</th><th>Valores</th></tr></thead>
  <tbody>
  <tr><td><code>model</code></td><td><code>gpt-image-2.5-sunburst</code> (qualidade) ou <code>gpt-image-2.5-flare</code> (velocidade)</td></tr>
  <tr><td><code>size</code></td><td>1024x1024, 1536x1024, 1024x1536, 2048x2048, 3840x2160 ou medida própria</td></tr>
  <tr><td><code>quality</code></td><td>auto, low, medium, high, xhigh, max</td></tr>
  <tr><td><code>background</code></td><td>auto, opaque, transparent</td></tr>
  <tr><td><code>output_format</code></td><td>png, webp (preservam transparência) ou jpeg</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Medida própria: cada lado até 3.840px e múltiplo de 16, proporção máxima 3:1, entre 655.360 e 8.294.400 pixels no total. Qualidade mais alta não garante resultado melhor — suba um degrau por vez.</p>
</div>
<div class="panel">
  <h3>Sora 2 · o container</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Campo</th><th>Valores</th></tr></thead>
  <tbody>
  <tr><td><code>model</code></td><td>sora-2 ou sora-2-pro</td></tr>
  <tr><td><code>size</code></td><td>720x1280, 1280x720; o pro acrescenta 1024x1792, 1792x1024, 1080x1920, 1920x1080</td></tr>
  <tr><td><code>seconds</code></td><td>4, 8, 12, 16, 20 — padrão 4</td></tr>
  <tr><td><code>characters</code></td><td>até 2, criados de um clipe MP4 de 2 a 4 s</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Não existe campo de negativa. Para tirar algo da cena, reescreva a cena. Diálogo vai em bloco próprio, abaixo da prosa, com o falante sempre rotulado igual.</p>
</div>`},

adobe:{
 lede:'Firefly Image e Firefly Video. Uma frase só com oito elementos, e o resto resolvido em controle de interface.',
 html:`
<div class="panel">
  <h3>A fórmula de imagem</h3>
  <p>A Adobe recomenda uma frase única que encadeia oito elementos, nesta ordem:</p>
  <div class="codeblock"><pre><span class="blk">Tipo de imagem</span> + <span class="blk">Sujeito</span> (expressão, postura) + <span class="blk">Ação</span>
+ <span class="blk">Ângulo</span> + <span class="blk">Luz</span> + <span class="blk">Fundo</span> + <span class="blk">Paleta</span> + <span class="blk">Estilo</span></pre></div>
  <p style="margin-top:14px">Diferente do Midjourney, o refinamento não vem de mais texto: vem dos controles. Visual Intensity regula quanto de estilização o modelo aplica — baixa é o equivalente funcional do <span class="mono-inline">--raw</span>. Effects são presets de luz, textura e clima, disponíveis no Image 5 e no 4.</p>
</div>
<div class="panel">
  <h3>Qual modelo usar</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Modelo</th><th>Melhor para</th></tr></thead>
  <tbody>
  <tr><td>Firefly Image 5</td><td>Fotorrealismo em 4MP nativo. Packshot e retrato que vão para peça final</td></tr>
  <tr><td>Firefly Image 4 Ultra</td><td>Cenas complexas, retratos e grupos médios</td></tr>
  <tr><td>Firefly Image 4</td><td>Conteúdo simples, ilustração e objeto isolado</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Referências: <b>Style Reference</b> transfere cor, luz e tom para um sujeito novo; <b>Composition Reference</b> guia layout, enquadramento e hierarquia. São o caminho de consistência desta stack.</p>
</div>
<div class="panel">
  <h3>A fórmula de vídeo</h3>
  <div class="codeblock"><pre><span class="blk">Estilo visual</span> + <span class="blk">Shot Size</span> + <span class="blk">Camera Angle</span> + <span class="blk">Camera Motion</span>
+ <span class="blk">Sujeito</span> + <span class="blk">Luz</span> + <span class="blk">Ação</span> + <span class="blk">Local</span> + <span class="blk">Estética</span></pre></div>
  <p style="margin-top:14px">Mínimo de oito palavras, até 1.800 caracteres. Shot Size, Camera Angle e Camera Motion também existem como dropdown — escolher no controle costuma sair mais estável que descrever no texto. Proporções: 16:9, 9:16 e 1:1; trabalhe direto em 1080p.</p>
</div>
<div class="panel">
  <h3>Por que uma agência escolhe esta stack</h3>
  <p>A Adobe declara que os modelos Firefly são comercialmente seguros, treinados apenas em conteúdo que ela tem permissão de usar — Adobe Stock, domínio público e material licenciado — e que o conteúdo criado ou enviado ao Firefly não treina os modelos dela. Para cliente grande com jurídico exigente, isso costuma pesar mais que qualquer ganho de qualidade nas outras stacks.</p>
  <p>O custo é de controle: sem código de estilo numérico, sem campo de negativa, sem diálogo sincronizado no vídeo. Áudio e fala entram no Premiere.</p>
</div>`},

oss:{
 lede:'FLUX em ComfyUI para imagem, Runway Gen-4 para vídeo. Controle máximo e a consistência de marca mais forte das cinco — se houver alguém técnico no time.',
 html:`
<div class="panel">
  <h3>FLUX quer frase, não tag</h3>
  <p>O encoder de texto entende gramática e parágrafo, então frase completa rende mais que lista de palavras-chave. Mire entre 30 e 80 palavras, descrevendo relação espacial e ação composta.</p>
  <div class="vs">
    <div class="bad"><span class="tag">Hábito de SDXL</span><code>(rosto:1.4), 8k, masterpiece, best quality, trending on artstation</code></div>
    <div class="good"><span class="tag">FLUX</span><code>Uma fotografia de um frasco âmbar sobre mármore claro, com luz de softbox entrando pela esquerda e um reflexo alongado na lateral do vidro. Foco nítido, acabamento publicitário.</code></div>
  </div>
  <p style="margin-top:14px">Sintaxe de peso como <span class="mono-inline">(rosto:1.4)</span> degrada o resultado no FLUX. A ênfase vai escrita na frase.</p>
</div>
<div class="panel">
  <h3>Guidance, não CFG</h3>
  <div class="tbl-wrap"><table>
  <thead><tr><th>Valor</th><th>Quando usar</th></tr></thead>
  <tbody>
  <tr><td><code>2.5</code></td><td>Liberdade criativa, exploração de conceito</td></tr>
  <tr><td><code>3.5</code></td><td>Padrão equilibrado do FLUX.1 dev</td></tr>
  <tr><td><code>4.0</code></td><td>Prompt com muita restrição simultânea, como packshot</td></tr>
  <tr><td><code>0</code></td><td>FLUX.1 schnell, que é desenhado sem guidance</td></tr>
  </tbody></table></div>
  <p style="margin-top:14px">Não passe de 5.0 no dev: a qualidade desaba rápido. Base de trabalho: 24 steps com sampler Euler. E não existe negative prompt oficial — algumas variantes do ComfyUI aceitam, com resultado inconsistente. Escreva positivamente o que você quer.</p>
</div>
<div class="panel">
  <h3>LoRA é a vantagem desta stack</h3>
  <p>Uma LoRA treinada nas peças aprovadas da marca, com peso entre 0.7 e 0.9 e seed fixa, entrega a consistência mais forte das cinco stacks — mais estável que código de estilo, referência de imagem ou Style Reference. É também a única que exige treino, disco e alguém que saiba operar o ComfyUI.</p>
</div>
<div class="panel">
  <h3>Runway Gen-4 · comece simples e itere</h3>
  <p>A orientação oficial é partir de um prompt base com o movimento essencial e acrescentar um elemento por vez, nesta ordem: movimento do sujeito, movimento de câmera, movimento de cena, descritores de estilo.</p>
  <div class="vs">
    <div class="bad"><span class="tag">Não faça</span><code>sem movimento de câmera
uma cena emocionante e nostálgica
oi, você pode fazer o produto girar?
primeiro na praia, depois no estúdio</code></div>
    <div class="good"><span class="tag">Faça</span><code>câmera travada
o sujeito dá três passos e para
poeira sobe atrás dele
uma cena por geração</code></div>
  </div>
  <p style="margin-top:14px">Gen-4 parte de uma imagem e gera 5 ou 10 segundos. Não redescreva o que já está no still — descreva só o que se move. Para múltiplos sujeitos, use linguagem posicional: “o sujeito à esquerda caminha, o da direita permanece parado”. Não há áudio: som e fala entram na edição.</p>
</div>`}
};

// ---------------------------------------------------------------- app
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const varsOf = t => [...new Set((t.match(/\{[^}]+\}/g) || []).map(v => v.replace(/[{}]/g,'').split(':')[0].trim()))];

function markup(text){
  return esc(text)
    .replace(/\{[^}]+\}/g, m => '<var>' + m + '</var>')
    .replace(/(--[a-z]+(?: [^\s]+)?)/g, '<b>$1</b>')
    .replace(/^(Cinematography:|Actions:|Dialogue:|Background Sound:|Cena:|Sujeito:|Sujeitos:|Estilo:|Luz:|Detalhes:|Texto:|Composição:|Restrições:|Ação:|Câmera:|Lente:|Movimento:|Ambiência:|Áudio:|Paleta:|Tarefa:|Preservar da referência:|Não copiar da referência:|Alterar:|Referência 1:)/gm, '<b>$1</b>');
}

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const live = document.getElementById('live');
const qEl = document.getElementById('q');
const fmtChips = document.getElementById('fmtchips');
const stackRow = document.getElementById('stackrow');
const stackBlurb = document.getElementById('stackblurb');
const refBox = document.getElementById('ref');
const refH2 = document.getElementById('refh2');
const refLede = document.getElementById('reflede');

let state = {stack:'autoral', kind:'all', fmt:'all', q:'', cat:'all', lang:'all'};

// ---- all distinct categories (PT + EN) ----
const ALL_CATS_PT = ['Imagem','Vídeo'];
const ALL_CATS_EN = [...new Set(Object.values(CSV_PROMPTS).map(d => d.categoria))].sort();
const ALL_CATS = [...ALL_CATS_PT, ...ALL_CATS_EN];

// stack buttons
STACKS.forEach(s => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'stackbtn';
  b.dataset.stack = s.id;
  b.setAttribute('aria-pressed', String(s.id === state.stack));
  b.innerHTML = '<b>' + esc(s.name) + '</b><span>' + esc(s.img) + ' · ' + esc(s.vid) + '</span>';
  b.addEventListener('click', () => {
    state.stack = s.id;
    document.querySelectorAll('.stackbtn').forEach(o => o.setAttribute('aria-pressed', String(o.dataset.stack === s.id)));
    paintStack();
    render();
    live.textContent = 'Stack ' + s.name + ' selecionada.';
  });
  stackRow.appendChild(b);
});

// format chips
const FMTS = [...new Set(CASES.map(c => c.fmt))];
function buildFmtChips(){
  fmtChips.replaceChildren();
  const all = document.createElement('button');
  all.type = 'button'; all.className = 'chip'; all.dataset.f = 'fmt'; all.dataset.v = 'all';
  all.textContent = 'Todos';
  fmtChips.appendChild(all);
  FMTS.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.f = 'fmt'; b.dataset.v = f;
    b.textContent = f;
    fmtChips.appendChild(b);
  });
  syncChips();
  fmtChips.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    state.fmt = c.dataset.v; syncChips(); render();
  }));
}
function syncChips(){
  document.querySelectorAll('.chip').forEach(c =>
    c.setAttribute('aria-pressed', String(state[c.dataset.f] === c.dataset.v)));
}

function paintStack(){
  const s = STACKS.find(x => x.id === state.stack);
  stackBlurb.textContent = s.blurb;
  refH2.textContent = 'Referência · ' + s.name;
  refLede.textContent = REF[s.id].lede;
  refBox.innerHTML = REF[s.id].html;
}

function card(c, d){
  const el = document.createElement('article');
  el.className = 'card';
  const vars = varsOf(d.p);
  const long = d.p.length > 300;
  const tcls = c.kind === 'Vídeo' ? 'vid' : 'img';
  el.innerHTML =
    '<div class="card-top">' +
      '<div class="card-meta">' +
        '<span class="id">' + c.id + '</span>' +
        '<span class="tool ' + tcls + '">' + esc(d.tool) + '</span>' +
        '<span class="fmt">' + esc(c.fmt) + '</span>' +
      '</div><h3>' + esc(c.title) + '</h3></div>' +
    '<div class="modebar">' +
      '<button class="modebtn" type="button" data-mode="tpl" aria-pressed="true">Modelo</button>' +
      '<button class="modebtn" type="button" data-mode="ex" aria-pressed="false">Exemplo</button>' +
      '<span class="exnote"></span></div>' +
    '<div class="pbox"><pre class="pbody' + (long ? '' : ' open') + '">' + markup(d.p) + '</pre>' +
      (long ? '<div class="fade"></div>' : '') + '</div>' +
    (long ? '<button class="expand" type="button">Mostrar prompt completo</button>' : '') +
    '<div class="card-body">' +
      '<div class="kv"><span class="k">Variáveis</span><div class="vars">' +
        (vars.length ? vars.map(v => '<span>' + esc(v) + '</span>').join('') : '<span>nenhuma</span>') + '</div></div>' +
      '<div class="kv"><span class="k">' + (c.kind === 'Vídeo' ? 'Container' : 'Parâmetros') + '</span>' +
        '<span class="v mono">' + esc(d.c) + '</span></div>' +
      (d.neg ? '<div class="kv neg"><span class="k">Negative prompt</span><span class="v mono">' + esc(d.neg) + '</span></div>' : '') +
      '<div class="kv"><span class="k">Resultado esperado</span><span class="v">' + esc(c.out) + '</span></div>' +
      (d.n ? '<div class="kv"><span class="k">Nota de uso</span><span class="v">' + esc(d.n) + '</span></div>' : '') +
    '</div>' +
    '<div class="card-foot"><button class="copy" type="button">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
      'Copiar prompt</button>' +
      '<span class="hint">' + vars.length + (vars.length === 1 ? ' variável' : ' variáveis') + '</span></div>';

  const ex = el.querySelector('.expand');
  if (ex) ex.addEventListener('click', () => {
    const body = el.querySelector('.pbody');
    const open = body.classList.toggle('open');
    ex.textContent = open ? 'Recolher prompt' : 'Mostrar prompt completo';
  });

  const filled = fill(d.p, c.id);
  let mode = 'tpl';
  const body = el.querySelector('.pbody');
  const exnote = el.querySelector('.exnote');
  el.querySelectorAll('.modebtn').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    el.querySelectorAll('.modebtn').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    body.innerHTML = mode === 'ex' ? markup(filled) : markup(d.p);
    exnote.textContent = mode === 'ex' ? 'valores fictícios · Serra Alta' : '';
  }));

  el.querySelector('.copy').addEventListener('click', e =>
    copyText(mode === 'ex' ? filled : d.p, e.currentTarget, c.id));
  return el;
}

function copyText(text, btn, label){
  const original = btn.innerHTML;
  const done = () => {
    btn.classList.add('done');
    btn.textContent = 'Copiado';
    live.textContent = 'Prompt ' + label + ' copiado.';
    setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = original; }, 1600);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
  } else fallback(text, done);
}
function fallback(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly','');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); }
  catch(_) { live.textContent = 'Não foi possível copiar. Selecione o texto e use Ctrl+C.'; }
  document.body.removeChild(ta);
}

// ---- card for CSV prompts (no CASES metadata) ----
function csvCard(id, d){
  const el = document.createElement('article');
  el.className = 'card';
  const long = d.p.length > 300;
  el.innerHTML =
    '<div class="card-top">' +
      '<div class="card-meta">' +
        '<span class="id">' + id + '</span>' +
        '<span class="tool">' + esc(d.tool) + '</span>' +
        '<span class="fmt">' + esc(d.categoria) + '</span>' +
      '</div><h3>' + esc(d.n) + '</h3></div>' +
    '<div class="pbox"><pre class="pbody' + (long ? '' : ' open') + '">' + markup(d.p) + '</pre>' +
      (long ? '<div class="fade"></div>' : '') + '</div>' +
    (long ? '<button class="expand" type="button">Mostrar prompt completo</button>' : '') +
    '<div class="card-body">' +
      '<div class="kv"><span class="k">Idioma</span><span class="v">English</span></div>' +
      '<div class="kv"><span class="k">Ferramenta</span><span class="v">' + esc(d.tool) + '</span></div>' +
    '</div>' +
    '<div class="card-foot"><button class="copy" type="button">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
      'Copiar prompt</button>' +
      '<span class="hint">EN · ' + esc(d.categoria) + '</span></div>';

  const ex = el.querySelector('.expand');
  if (ex) ex.addEventListener('click', () => {
    const body = el.querySelector('.pbody');
    const open = body.classList.toggle('open');
    ex.textContent = open ? 'Recolher prompt' : 'Mostrar prompt completo';
  });

  el.querySelector('.copy').addEventListener('click', e =>
    copyText(d.p, e.currentTarget, id));
  return el;
}

function render(){
  const bank = PROMPTS[state.stack];
  const q = state.q.trim().toLowerCase();
  const cards = [];

  // --- Existing PT prompts ---
  if (state.lang === 'all' || state.lang === 'pt') {
    const list = CASES.filter(c => {
      const d = bank[c.id];
      if (!d) return false;
      if (state.kind !== 'all' && c.kind !== state.kind) return false;
      if (state.fmt !== 'all' && c.fmt !== state.fmt) return false;
      if (state.cat !== 'all' && d.categoria !== state.cat) return false;
      if (!q) return true;
      const hay = (c.id + ' ' + c.title + ' ' + c.fmt + ' ' + c.out + ' ' + d.tool + ' ' + d.p + ' ' + d.c + ' ' + (d.n||'') + ' ' + (d.neg||'')).toLowerCase();
      return hay.includes(q);
    });
    cards.push(...list.map(c => card(c, bank[c.id])));
  }

  // --- CSV EN prompts ---
  if (state.lang === 'all' || state.lang === 'en') {
    // kind filter maps to CSV categories
    const kindCatMap = {'Imagem':'Image Generation','Vídeo':'Video Generation'};
    const entries = Object.entries(CSV_PROMPTS).filter(([id, d]) => {
      if (state.cat !== 'all' && d.categoria !== state.cat) return false;
      if (state.kind !== 'all' && d.categoria !== kindCatMap[state.kind]) return false;
      if (!q) return true;
      const hay = (id + ' ' + d.categoria + ' ' + d.tool + ' ' + d.p + ' ' + (d.n||'')).toLowerCase();
      return hay.includes(q);
    });
    cards.push(...entries.map(([id, d]) => csvCard(id, d)));
  }

  grid.replaceChildren(...cards);
  empty.hidden = cards.length > 0;
  count.textContent = cards.length + (cards.length === 1 ? ' prompt' : ' prompts');
}

document.querySelectorAll('.chip[data-f="kind"]').forEach(c =>
  c.addEventListener('click', () => { state.kind = c.dataset.v; syncChips(); render(); }));

qEl.addEventListener('input', () => { state.q = qEl.value; render(); });
document.getElementById('reset').addEventListener('click', () => {
  state.kind = 'all'; state.fmt = 'all'; state.q = ''; state.cat = 'all'; state.lang = 'all';
  qEl.value = ''; syncChips(); syncRailFilters(); render(); qEl.focus();
});
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== qEl && !/input|textarea/i.test(document.activeElement.tagName)) {
    e.preventDefault(); qEl.focus(); qEl.select();
  }
  if (e.key === 'Escape' && document.activeElement === qEl) { qEl.value = ''; state.q = ''; render(); }
});

const root = document.documentElement;
try { const saved = localStorage.getItem('tyna-biblioteca-theme'); if (saved) root.setAttribute('data-theme', saved); } catch(_) {}
document.getElementById('theme').addEventListener('click', () => {
  const dark = root.getAttribute('data-theme') === 'dark' ||
    (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  const next = dark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('tyna-biblioteca-theme', next); } catch(_) {}
});

const links = [...document.querySelectorAll('.rail a')];
const map = new Map(links.map(a => [a.dataset.spy, a]));
const obs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { links.forEach(a => a.classList.remove('on')); map.get(en.target.id)?.classList.add('on'); }
  });
}, {rootMargin:'-150px 0px -65% 0px', threshold:0});
document.querySelectorAll('main section[id]').forEach(s => { if (map.has(s.id)) obs.observe(s); });

// ---- Categoria + Idioma filters in rail ----
function buildRailFilters(){
  const catEl = document.getElementById('railcatfilter');
  const langEl = document.getElementById('raillangfilter');
  if (!catEl || !langEl) return;

  // count per category for labels
  const catCount = {};
  // PT existing prompts
  CASES.forEach(c => {
    // find categoria from any stack's prompt data
    const d = Object.values(PROMPTS).map(bank => bank[c.id]).find(Boolean);
    if (d && d.categoria) catCount[d.categoria] = (catCount[d.categoria]||0) + 1;
  });
  // EN CSV prompts
  Object.values(CSV_PROMPTS).forEach(d => {
    if (d.categoria) catCount[d.categoria] = (catCount[d.categoria]||0) + 1;
  });

  // Lang buttons
  [['all','Todos'],['pt','Português'],['en','English']].forEach(([val, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-filter-btn'; b.dataset.lang = val;
    b.setAttribute('aria-pressed', String(state.lang === val));
    b.textContent = label;
    b.addEventListener('click', () => {
      state.lang = val;
      syncRailFilters();
      render();
      live.textContent = 'Idioma: ' + label;
    });
    langEl.appendChild(b);
  });

  // Category buttons - "Todos" first, then all cats
  [['all','Todos ('+Object.values(catCount).reduce((a,b)=>a+b,0)+')'], ...ALL_CATS.map(cat => [cat, cat + (catCount[cat]?' ('+catCount[cat]+')':'')])].forEach(([val, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-filter-btn'; b.dataset.cat = val;
    b.setAttribute('aria-pressed', String(state.cat === val));
    b.textContent = label;
    b.addEventListener('click', () => {
      state.cat = val;
      syncRailFilters();
      render();
      live.textContent = 'Categoria: ' + label;
    });
    catEl.appendChild(b);
  });
}

function syncRailFilters(){
  document.querySelectorAll('.rail-filter-btn[data-lang]').forEach(b =>
    b.setAttribute('aria-pressed', String(state.lang === b.dataset.lang)));
  document.querySelectorAll('.rail-filter-btn[data-cat]').forEach(b =>
    b.setAttribute('aria-pressed', String(state.cat === b.dataset.cat)));
}

buildFmtChips();
buildRailFilters();
paintStack();
render();
