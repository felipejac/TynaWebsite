// Notifica o IndexNow (Bing, Yandex e outros participantes do protocolo) sobre as
// URLs publicadas, em vez de esperar o crawler decidir revisitar o site sozinho.
//
// Uso:
//   node tools/indexnow.mjs            → envia todas as URLs do sitemap.xml
//   node tools/indexnow.mjs <url> ...   → envia só as URLs passadas como argumento
//
// A chave é o arquivo <chave>.txt hospedado na raiz do site — ver comentário em
// tools/deploy.mjs. Se a chave mudar, atualize as três referências: o nome do
// arquivo, KEY abaixo e a lista PUBLISH do deploy.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'tyna.com.br';
const KEY = 'd3bf6674386c4a6e539f5bb870611a6c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const argsUrls = process.argv.slice(2);
const urlList = argsUrls.length
  ? argsUrls
  : [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

if (urlList.length === 0) {
  console.error('✗ nenhuma URL para enviar');
  process.exit(1);
}

console.log(`→ enviando ${urlList.length} URLs ao IndexNow (host: ${HOST})`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`→ resposta: ${res.status} ${res.statusText}`);
if (res.status === 200 || res.status === 202) {
  console.log('✓ aceito — Bing e demais motores do IndexNow foram notificados');
} else {
  console.error('✗ IndexNow rejeitou o envio:', await res.text().catch(() => ''));
  process.exit(1);
}
