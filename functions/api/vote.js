// Cloudflare Pages Function — /api/vote
// GET  /api/vote         → returns all vote counts as { "WD-001": 42, ... }
// POST /api/vote?id=X    → increments vote for prompt X, returns { id, votes }

const VOTES_KEY = 'votes';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tyna.com.br',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet({ env }) {
  const raw = await env.PROMPT_VOTES.get(VOTES_KEY);
  const votes = raw ? JSON.parse(raw) : {};
  return new Response(JSON.stringify(votes), {
    headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=15' },
  });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response('{"error":"missing id"}', { status: 400, headers: corsHeaders });

  const raw = await env.PROMPT_VOTES.get(VOTES_KEY);
  const votes = raw ? JSON.parse(raw) : {};
  votes[id] = (votes[id] || 0) + 1;
  await env.PROMPT_VOTES.put(VOTES_KEY, JSON.stringify(votes));

  return new Response(JSON.stringify({ id, votes: votes[id] }), {
    headers: corsHeaders,
  });
}
