// Modo de edição local: abre o site com os textos editáveis direto na página e grava
// as alterações de volta no HTML de origem (index.html, sobre/index.html...).
//
// Como funciona: ao servir uma página, o servidor marca com data-tyna-edit="N" cada
// elemento que tem texto próprio (e que não está dentro de outro já marcado) e guarda
// onde o conteúdo dele começa e termina no arquivo. Ao salvar, só o miolo dos
// elementos alterados é trocado no arquivo — o resto do HTML (JSON-LD, SVG, scripts,
// comentários, indentação) fica byte a byte como estava.
//
// Não publica nada: depois de editar, confira e rode `npm run deploy`.
//
// Uso:
//   node tools/editor.mjs          → http://localhost:4180
//   node tools/editor.mjs 4200     → outra porta

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.argv[2]) || 4180;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

const VAZIOS = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
// conteúdo que não é texto de leitura: nunca vira editável
const OPACOS = new Set(['script', 'style', 'svg', 'head', 'noscript', 'template', 'textarea', 'select']);
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 12);

/* ------------------------------------------------ mapeamento dos textos */

function mapear(html) {
  const tokens = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  const pilha = [];
  const elementos = [];
  let fimAnterior = 0;
  let m;

  const textoDireto = ate => {
    const topo = pilha[pilha.length - 1];
    if (topo && html.slice(fimAnterior, ate).replace(/&nbsp;/g, ' ').trim()) topo.temTexto = true;
  };

  while ((m = tokens.exec(html))) {
    textoDireto(m.index);
    fimAnterior = tokens.lastIndex;
    if (m[0].startsWith('<!--')) continue;

    const [bruto, fecha, nomeBruto, attrs] = m;
    const nome = nomeBruto.toLowerCase();

    if (!fecha) {
      if (VAZIOS.has(nome) || attrs.trim().endsWith('/')) continue;
      const el = { nome, abreIni: m.index, abreFim: tokens.lastIndex, temTexto: false, filhos: [] };
      if (pilha.length) pilha[pilha.length - 1].filhos.push(el);
      pilha.push(el);
      // script/style: pula até o fechamento, o conteúdo não é HTML
      if (nome === 'script' || nome === 'style') {
        const fim = html.toLowerCase().indexOf(`</${nome}`, tokens.lastIndex);
        tokens.lastIndex = fimAnterior = fim < 0 ? html.length : fim;
      }
      continue;
    }

    // fechamento: desempilha até achar o par (tolera HTML com tag esquecida)
    const idx = pilha.map(e => e.nome).lastIndexOf(nome);
    if (idx < 0) continue;
    while (pilha.length > idx) {
      const el = pilha.pop();
      el.fechaIni = el.nome === nome ? m.index : m.index;
      elementos.push(el);
    }
  }

  // raízes = elementos sem pai; desce marcando o primeiro com texto próprio em cada ramo
  const temPai = new Set(elementos.flatMap(e => e.filhos));
  const marcados = [];
  const descer = (el, dentroDeOpaco) => {
    const opaco = dentroDeOpaco || OPACOS.has(el.nome) || el.nome === 'title';
    if (!opaco && el.temTexto && el.fechaIni != null) { marcados.push(el); return; }
    for (const f of el.filhos) descer(f, opaco);
  };
  for (const el of elementos) if (!temPai.has(el)) descer(el, false);

  marcados.sort((a, b) => a.abreIni - b.abreIni);
  return marcados.map((el, i) => ({ id: i, ini: el.abreFim, fim: el.fechaIni, abreFim: el.abreFim, miolo: html.slice(el.abreFim, el.fechaIni) }));
}

function anotar(html, marcados) {
  // de trás para frente, para os offsets anteriores continuarem válidos
  let saida = html;
  for (const el of [...marcados].reverse()) {
    const antes = saida.slice(0, el.abreFim - 1).replace(/\s*\/?$/, '');
    saida = `${antes} data-tyna-edit="${el.id}">${saida.slice(el.abreFim)}`;
  }
  return saida;
}

/* ------------------------------------------------ interface injetada */

const EDITOR = (versao, arquivo) => `
<style id="tyna-editor-css">
  [data-tyna-edit]{outline:1px dashed transparent;outline-offset:3px;border-radius:2px;cursor:text;transition:outline-color .15s}
  [data-tyna-edit]:hover{outline-color:rgba(132,41,208,.55)}
  [data-tyna-edit]:focus{outline:2px solid #8429D0;background:rgba(132,41,208,.06)}
  [data-tyna-edit].tyna-sujo{outline:2px solid #C84C00}
  #tyna-barra{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;display:flex;gap:10px;align-items:center;
    background:#1c1024;color:#fff;font:14px/1.3 system-ui,sans-serif;padding:10px 12px 10px 16px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);max-width:calc(100vw - 32px);flex-wrap:wrap}
  #tyna-barra b{font-weight:600}
  #tyna-barra button{font:inherit;border:0;border-radius:8px;padding:7px 14px;cursor:pointer}
  #tyna-salvar{background:#C84C00;color:#fff}
  #tyna-salvar:disabled{background:#555;color:#aaa;cursor:default}
  #tyna-descartar{background:transparent;color:#ddd;border:1px solid #555 !important}
  #tyna-msg{color:#cfc0dc;font-size:13px}
  #waFab{display:none !important}
</style>
<div id="tyna-barra" role="region" aria-label="Modo de edição">
  <span><b>Modo edição</b> · ${arquivo}</span>
  <span id="tyna-msg">clique em qualquer texto para editar</span>
  <button id="tyna-descartar" type="button" hidden>Descartar</button>
  <button id="tyna-salvar" type="button" disabled>Salvar</button>
</div>
<script>
(() => {
  const VERSAO = ${JSON.stringify(versao)}, ARQUIVO = ${JSON.stringify(arquivo)};
  const els = [...document.querySelectorAll('[data-tyna-edit]')];
  const inicial = new Map();
  const sujos = new Set();
  const msg = document.getElementById('tyna-msg');
  const btSalvar = document.getElementById('tyna-salvar');
  const btDescartar = document.getElementById('tyna-descartar');

  const limpar = h => h.replace(/<br>\\s*$/, '').replace(/\\u00a0/g, '&nbsp;');

  els.forEach(el => {
    inicial.set(el, el.innerHTML);
    el.contentEditable = 'true';
    el.spellcheck = true;
    el.addEventListener('input', () => {
      const mudou = limpar(el.innerHTML) !== limpar(inicial.get(el));
      el.classList.toggle('tyna-sujo', mudou);
      mudou ? sujos.add(el) : sujos.delete(el);
      atualizar();
    });
    // Enter não cria <div>: Shift+Enter quebra linha, Enter sai do campo
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') el.blur();
    });
    // colar sempre como texto puro, para não trazer estilo de outro site
    el.addEventListener('paste', e => {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\\s+/g, ' '));
    });
  });

  // em modo edição, link e botão não navegam nem disparam nada
  document.addEventListener('click', e => {
    if (e.target.closest('#tyna-barra')) return;
    const alvo = e.target.closest('a, button, summary, label');
    if (alvo) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  function atualizar(texto) {
    const n = sujos.size;
    btSalvar.disabled = !n;
    btDescartar.hidden = !n;
    msg.textContent = texto || (n ? n + (n > 1 ? ' textos alterados' : ' texto alterado') : 'clique em qualquer texto para editar');
  }

  async function salvar() {
    if (!sujos.size) return;
    btSalvar.disabled = true;
    msg.textContent = 'salvando…';
    const edicoes = {};
    sujos.forEach(el => { edicoes[el.dataset.tynaEdit] = limpar(el.innerHTML); });
    try {
      const r = await fetch('/__salvar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arquivo: ARQUIVO, versao: VERSAO, edicoes }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || r.status);
      sujos.clear();
      sessionStorage.setItem('tyna-editor-aviso', j.aviso || '');
      location.reload();
    } catch (err) {
      atualizar('✗ ' + err.message);
      btSalvar.disabled = false;
    }
  }

  btSalvar.addEventListener('click', salvar);
  btDescartar.addEventListener('click', () => { if (confirm('Descartar as alterações não salvas?')) { sujos.clear(); location.reload(); } });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); } });
  window.addEventListener('beforeunload', e => { if (sujos.size) { e.preventDefault(); e.returnValue = ''; } });

  // reveal: mostra tudo de uma vez, sem esperar rolar a página
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));

  let aviso = null;
  try { aviso = sessionStorage.getItem('tyna-editor-aviso'); sessionStorage.removeItem('tyna-editor-aviso'); } catch {}
  if (aviso !== null) atualizar(aviso ? '✓ salvo · ' + aviso : '✓ salvo no arquivo');
})();
</script>
`;

/* ------------------------------------------------ servidor */

function arquivoDe(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const abs = normalize(join(ROOT, p));
  if (!abs.startsWith(ROOT + sep) && abs !== ROOT) return null;
  if (existsSync(abs) && statSync(abs).isDirectory()) return join(abs, 'index.html');
  return abs;
}

const relativo = abs => abs.slice(ROOT.length + 1).split(sep).join('/');

// o FAQ da home existe duas vezes: na página e no JSON-LD. Avisa se ficaram diferentes.
function conferirJsonLd(abs) {
  try {
    execFileSync(process.execPath, [join(ROOT, 'tools', 'check-jsonld.mjs'), relativo(abs)], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return '';
  } catch (e) {
    const saida = `${e.stdout || ''}${e.stderr || ''}`.trim();
    console.log(`\n⚠ check-jsonld depois de salvar ${relativo(abs)}:\n${saida}\n`);
    return 'atenção: o JSON-LD ficou diferente do texto (veja o terminal)';
  }
}

const servidor = createServer((req, res) => {
  const responder = (status, corpo, tipo = 'application/json; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
    res.end(typeof corpo === 'string' || Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo));
  };

  if (req.method === 'POST' && req.url === '/__salvar') {
    let corpo = '';
    req.on('data', c => { corpo += c; });
    req.on('end', () => {
      try {
        const { arquivo, versao, edicoes } = JSON.parse(corpo);
        const abs = arquivoDe('/' + arquivo);
        if (!abs || !abs.endsWith('.html') || !existsSync(abs)) return responder(400, { erro: 'arquivo inválido' });

        const html = readFileSync(abs, 'utf8');
        if (hash(html) !== versao) return responder(409, { erro: 'o arquivo mudou fora do editor — recarregue a página (suas alterações não salvas se perdem)' });

        const marcados = mapear(html);
        const trocas = Object.entries(edicoes).map(([id, novo]) => {
          const el = marcados[Number(id)];
          if (!el) throw new Error(`trecho ${id} não encontrado`);
          if (/<(script|style|iframe)|\son\w+=/i.test(novo)) throw new Error('conteúdo não permitido no texto');
          return { ...el, novo };
        }).sort((a, b) => b.ini - a.ini);

        let saida = html;
        for (const t of trocas) saida = saida.slice(0, t.ini) + t.novo + saida.slice(t.fim);
        writeFileSync(abs, saida);
        console.log(`✓ ${relativo(abs)}: ${trocas.length} texto(s) alterado(s)`);
        for (const t of trocas.reverse()) console.log(`   - ${t.miolo.replace(/\s+/g, ' ').trim().slice(0, 90)}\n   + ${t.novo.replace(/\s+/g, ' ').trim().slice(0, 90)}`);

        responder(200, { ok: true, aviso: conferirJsonLd(abs) });
      } catch (e) {
        responder(400, { erro: e.message });
      }
    });
    return;
  }

  const abs = arquivoDe(req.url);
  if (!abs || !existsSync(abs) || relativo(abs).startsWith('dist/')) return responder(404, 'não encontrado', 'text/plain; charset=utf-8');

  if (abs.endsWith('.html')) {
    const html = readFileSync(abs, 'utf8');
    const pagina = anotar(html, mapear(html)).replace(/<\/body>(?![\s\S]*<\/body>)/i, `${EDITOR(hash(html), relativo(abs))}</body>`);
    return responder(200, pagina, TIPOS['.html']);
  }
  responder(200, readFileSync(abs), TIPOS[extname(abs).toLowerCase()] || 'application/octet-stream');
});

// Porta ocupada: se quem está nela já é o editor, basta abrir o navegador; senão tenta a próxima.
servidor.on('error', async e => {
  if (e.code !== 'EADDRINUSE') throw e;
  const porta = servidor.portaTentada;
  try {
    const r = await fetch(`http://localhost:${porta}/`);
    if ((await r.text()).includes('id="tyna-barra"')) {
      console.log(`✓ o modo edição já está rodando: abra http://localhost:${porta}/ no navegador`);
      process.exit(0);
    }
  } catch { /* não é HTTP: segue para a próxima porta */ }
  if (porta >= PORTA + 10) { console.error(`✗ portas ${PORTA}–${porta} ocupadas`); process.exit(1); }
  console.log(`→ porta ${porta} ocupada por outro programa, tentando ${porta + 1}`);
  ouvir(porta + 1);
});

function ouvir(porta) {
  servidor.portaTentada = porta;
  servidor.listen(porta, () => {
    console.log(`Modo edição em http://localhost:${porta}/  (Ctrl+C para sair)`);
    console.log('As alterações são gravadas nos arquivos-fonte. Publicar continua sendo `npm run deploy`.');
  });
}
ouvir(PORTA);
