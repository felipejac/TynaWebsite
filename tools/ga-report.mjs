// Consulta a Google Analytics Data API (GA4) usando a conta de serviço.
//
// A chave da conta de serviço NÃO fica no repositório — vive em
// ~/.config/tyna-website/ga-service-account.json (fora do git, permissão 600).
// Essa conta de serviço precisa estar adicionada como Leitor em
// Administrador → Acesso à propriedade, na propriedade GA4 de tyna.com.br.
//
// Uso:
//   node tools/ga-report.mjs                    → últimos 7 dias, métricas básicas
//   node tools/ga-report.mjs --days 30           → últimos 30 dias
//   GA_PROPERTY_ID=123456789 node tools/ga-report.mjs

import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

const KEY_PATH = process.env.GA_SERVICE_ACCOUNT_KEY
  || join(homedir(), '.config', 'tyna-website', 'ga-service-account.json');
const PROPERTY_ID = process.env.GA_PROPERTY_ID || '549773896'; // propriedade GA4 de tyna.com.br

const args = process.argv.slice(2);
const daysFlag = args.indexOf('--days');
const DAYS = daysFlag !== -1 ? Number(args[daysFlag + 1]) : 7;

/* ---------- 1. autentica a conta de serviço (JWT → access token) ---------- */

const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(key.private_key).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`token: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

/* ---------- 2. consulta o relatório ---------- */

async function runReport(token) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  });
  if (!res.ok) throw new Error(`runReport: ${res.status} ${await res.text()}`);
  return res.json();
}

const token = await getAccessToken();
const report = await runReport(token);

console.log(`→ tyna.com.br — últimos ${DAYS} dias (usuários ativos / sessões / visualizações)\n`);
for (const row of report.rows ?? []) {
  const [date] = row.dimensionValues.map(v => v.value);
  const [users, sessions, views] = row.metricValues.map(v => v.value);
  const d = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  console.log(`  ${d}   ${users.padStart(5)} usuários   ${sessions.padStart(5)} sessões   ${views.padStart(5)} views`);
}
if (!report.rows) console.log('  (sem dados no período)');
