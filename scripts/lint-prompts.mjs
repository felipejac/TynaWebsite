// Verifica os 145 prompts contra as regras documentadas de cada ferramenta.
// Uso, na raiz do projeto:  node scripts/lint-prompts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'biblioteca-prompts', 'assets');
const src = fs.readFileSync(path.join(assets, 'data.js'), 'utf8')
          + '\n' + fs.readFileSync(path.join(assets, 'examples.js'), 'utf8');
const mod = new Function(src + '\nreturn {STACKS, CASES, PROMPTS, EXAMPLES, fill};')();
const {STACKS, CASES, PROMPTS, EXAMPLES, fill} = mod;

const issues = [];
const flag = (stack, id, rule, msg) => issues.push({stack, id, rule, msg});

const GEMINI_AR = ['1:1','3:2','2:3','3:4','4:3','4:5','5:4','9:16','16:9','21:9'];
const SORA_SIZES = ['720x1280','1280x720','1024x1792','1792x1024','1080x1920','1920x1080'];

for (const s of STACKS) {
  const bank = PROMPTS[s.id];

  // 1. cobertura: os 29 casos existem na stack
  for (const c of CASES) if (!bank[c.id]) flag(s.id, c.id, 'cobertura', 'caso ausente nesta stack');
  for (const k of Object.keys(bank)) if (!CASES.find(c => c.id === k)) flag(s.id, k, 'cobertura', 'prompt sem caso correspondente');

  for (const [id, d] of Object.entries(bank)) {
    const P = d.p, C = d.c || '';

    // 2. variáveis: chaves balanceadas e em CAIXA ALTA
    const opens = (P.match(/\{/g) || []).length, closes = (P.match(/\}/g) || []).length;
    if (opens !== closes) flag(s.id, id, 'variáveis', 'chaves desbalanceadas');
    for (const v of P.match(/\{[^}]+\}/g) || []) {
      const name = v.replace(/[{}]/g, '').split(':')[0].trim();
      if (name !== name.toUpperCase()) flag(s.id, id, 'variáveis', `variável fora de caixa alta: ${v}`);
    }

    // 2b. exemplo preenchido: toda variável precisa de valor em examples.js
    const sobra = fill(P, id).match(/\{[^}]+\}/g);
    if (sobra) flag(s.id, id, 'exemplo', `sem valor em examples.js para: ${sobra.join(', ')}`);

    // 3. campo de negativa só onde a ferramenta tem
    const hasNegField = d.tool === 'Veo 3.1';
    if (d.neg && !hasNegField) flag(s.id, id, 'negativa', `${d.tool} não tem campo de negative prompt`);

    // 4. MIDJOURNEY
    if (d.tool === 'Midjourney') {
      if (/--\w/.test(P)) {
        const firstFlag = P.search(/\s--\w/);
        if (P.slice(0, firstFlag).includes('--')) flag(s.id, id, 'midjourney', 'parâmetro antes do texto');
        const tail = P.slice(firstFlag).replace(/\d+:\d+/g, '');  // proporção usa ':' legitimamente
        if (/[,.;:]/.test(tail)) flag(s.id, id, 'midjourney', 'pontuação dentro do bloco de parâmetros');
        if (/\w--/.test(P)) flag(s.id, id, 'midjourney', 'falta espaço antes dos traços');
      }
      const st = P.match(/--s (\d+)/); if (st && (+st[1] < 0 || +st[1] > 1000)) flag(s.id, id, 'midjourney', `--s fora de 0–1000: ${st[1]}`);
      const ch = P.match(/--c (\d+)/); if (ch && +ch[1] > 100) flag(s.id, id, 'midjourney', `--c fora de 0–100: ${ch[1]}`);
      const sw = P.match(/--sw (\d+)/); if (sw && +sw[1] > 1000) flag(s.id, id, 'midjourney', `--sw fora de 0–1000: ${sw[1]}`);
    }

    // 5. GEMINI IMAGE — sem flags, proporção na frase, K maiúsculo
    if (d.tool === 'Gemini Image') {
      if (/--\w/.test(P)) flag(s.id, id, 'gemini', 'não existe flag no Gemini');
      const ar = P.match(/propor\u00e7\u00e3o (\d+:\d+)/i);
      if (!ar) flag(s.id, id, 'gemini', 'proporção não declarada no texto do prompt');
      else if (!GEMINI_AR.includes(ar[1])) flag(s.id, id, 'gemini', `proporção não suportada: ${ar[1]}`);
      if (/\b\dk\b/.test(P)) flag(s.id, id, 'gemini', 'resolução com k minúsculo');
    }

    // 6. GPT IMAGE — regras de tamanho
    if (d.tool === 'GPT Image') {
      const m = C.match(/(\d{3,4})x(\d{3,4})/);
      if (!m) flag(s.id, id, 'gpt-image', 'sem size no container');
      else {
        const w = +m[1], h = +m[2], px = w * h, ratio = Math.max(w,h) / Math.min(w,h);
        if (w > 3840 || h > 3840) flag(s.id, id, 'gpt-image', `lado acima de 3840: ${w}x${h}`);
        if (w % 16 || h % 16) flag(s.id, id, 'gpt-image', `lado não múltiplo de 16: ${w}x${h}`);
        if (ratio > 3.0001) flag(s.id, id, 'gpt-image', `proporção acima de 3:1: ${ratio.toFixed(2)}`);
        if (px < 655360 || px > 8294400) flag(s.id, id, 'gpt-image', `total de pixels fora da faixa: ${px}`);
      }
    }

    // 7. FIREFLY — proporções e mínimo de palavras no vídeo
    if (d.tool.startsWith('Firefly')) {
      const ar = C.match(/\b(\d+:\d+)\b/);
      const okImg = ['4:3','3:4','1:1','16:9','9:16'];
      const okVid = ['16:9','9:16','1:1'];
      const allow = d.tool === 'Firefly Video' ? okVid : okImg;
      if (ar && !allow.includes(ar[1])) flag(s.id, id, 'firefly', `proporção não suportada: ${ar[1]}`);
      if (ar && ar[1] === '9:16' && d.tool === 'Firefly Image' && /Image 5/.test(C))
        flag(s.id, id, 'firefly', '9:16 só existe no Image 4 e no 4 Ultra');
      if (d.tool === 'Firefly Video') {
        const words = P.trim().split(/\s+/).length;
        if (words < 8) flag(s.id, id, 'firefly', `prompt de vídeo com menos de 8 palavras: ${words}`);
        if (P.length > 1800) flag(s.id, id, 'firefly', `prompt acima de 1800 caracteres: ${P.length}`);
      }
    }

    // 8. FLUX — sem peso, sem negativa, guidance ≤ 5, 30–80 palavras
    if (d.tool === 'FLUX') {
      if (/\([^)]+:\s*\d/.test(P)) flag(s.id, id, 'flux', 'sintaxe de peso (x:1.4) degrada no FLUX');
      const g = C.match(/guidance ([\d.]+)/);
      if (g && +g[1] > 5) flag(s.id, id, 'flux', `guidance acima de 5.0 no dev: ${g[1]}`);
      const words = P.trim().split(/\s+/).length;
      if (words < 25) flag(s.id, id, 'flux', `prompt curto para FLUX (${words} palavras, ideal 30–80)`);
      if (words > 90) flag(s.id, id, 'flux', `prompt longo para FLUX (${words} palavras)`);
    }

    // 9. RUNWAY — nenhuma frase negativa
    if (d.tool === 'Runway Gen-4') {
      for (const bad of [/\bsem\s+\w/i, /\bnão\s+\w/i, /\bnenhum/i, /\bevit/i]) {
        if (bad.test(P)) flag(s.id, id, 'runway', `frase negativa no prompt: "${P.match(bad)[0]}…"`);
      }
    }

    // 10. SORA — duração e size válidos
    if (d.tool === 'Sora 2') {
      const sec = C.match(/seconds (\d+)/);
      if (sec && ![4,8,12,16,20].includes(+sec[1])) flag(s.id, id, 'sora', `seconds inválido: ${sec[1]}`);
      const sz = C.match(/(\d{3,4}x\d{3,4})/);
      if (sz && !SORA_SIZES.includes(sz[1])) flag(s.id, id, 'sora', `size inválido: ${sz[1]}`);
      if (/size (1920x1080|1080x1920|1024x1792|1792x1024)/.test(C) && !/sora-2-pro/.test(C))
        flag(s.id, id, 'sora', 'resolução só disponível no sora-2-pro');
    }

    // 11. VEO — duração, proporção, resolução
    if (d.tool === 'Veo 3.1') {
      const dur = C.match(/durationSeconds (\d+)/);
      if (dur && ![4,6,8].includes(+dur[1])) flag(s.id, id, 'veo', `durationSeconds inválido: ${dur[1]}`);
      const ar = C.match(/aspectRatio (\d+:\d+)/);
      if (ar && !['16:9','9:16'].includes(ar[1])) flag(s.id, id, 'veo', `aspectRatio inválido: ${ar[1]}`);
      const res = C.match(/resolution (\w+)/);
      if (res && !['720p','1080p'].includes(res[1])) flag(s.id, id, 'veo', `resolution inválida: ${res[1]}`);
      if (/referenceImages/.test(C) && dur && +dur[1] !== 8)
        flag(s.id, id, 'veo', 'com referenceImages a duração trava em 8s');
      if (d.neg && /\b(sem|não)\s/i.test(d.neg)) flag(s.id, id, 'veo', 'negative prompt escrito como negação');
    }
  }
}

const total = STACKS.reduce((a, s) => a + Object.keys(PROMPTS[s.id]).length, 0);
console.log(`prompts verificados: ${total}`);
console.log(`problemas: ${issues.length}\n`);
const byRule = {};
for (const i of issues) (byRule[i.rule] ||= []).push(i);
for (const [rule, list] of Object.entries(byRule)) {
  console.log(`[${rule}] ${list.length}`);
  for (const i of list) console.log(`   ${i.stack} ${i.id} — ${i.msg}`);
}

process.exitCode = issues.length ? 1 : 0;
