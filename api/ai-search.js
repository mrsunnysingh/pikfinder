// api/ai-search.js  — POST /api/ai-search  { "prompt": "warm ivory paper texture ..." }
// Server-side AI query optimizer. The Gemini key stays in server env (GEMINI_API_KEY)
// and is NEVER shipped to the browser. If the key is missing or the call fails, we
// fall back to a deterministic local optimizer so AI search always returns useful
// keywords. The response `_source` field is "ai" or "local".
//
// It ONLY improves search queries — it never generates images and never touches
// license metadata.

import { guardMethod, applyCors, json, validateQuery } from './_lib/http.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';

const SYSTEM_PROMPT = `You are the query optimizer for PikFinder, a search engine over free stock
photos, videos and vectors. Turn a natural-language request into the SINGLE most precise
stock-search query, plus close alternatives. Optimize for how stock libraries actually tag images.

Rules — accuracy over creativity:
- PRESERVE specific entities EXACTLY as written: proper nouns, landmarks, places, brands, people,
  named objects (e.g. "Burj Khalifa", "Golden Gate Bridge", "Eiffel Tower"). Never generalize them
  into generic words. The specific name must appear in primary_query and search_queries.
- primary_query: the 2-4 word phrase most likely to return exactly what the user means. Concrete
  noun subject first, then at most one or two strong modifiers. No filler, no vague adjectives.
- search_queries: up to 6 precise alternatives, ordered best-first. Each must stay on the SAME
  subject — do NOT drift to loosely related topics.
- synonyms: up to 6 tight synonyms of the MAIN subject only.
- subjects: the core noun(s).
- colors: dominant colors only if implied, lowercase (e.g. "blue","teal","amber"). Else [].
- orientation: "landscape" | "portrait" | "square" | "any". Infer from intent (banner/hero/desktop
  → landscape; phone wallpaper/story/reel → portrait; profile/logo → square). Else "any".
- negative_keywords: terms to EXCLUDE to keep results on-topic.

Never generate images. Never invent or modify license info. Never add unrelated concepts.
Return JSON ONLY in this exact shape (no prose, no markdown):
{"primary_query":"","search_queries":[],"synonyms":[],"subjects":[],"colors":[],"orientation":"any","negative_keywords":[]}`;

const STOPWORDS = new Set(['a','an','the','with','and','or','of','in','on','for','to','that','this','these','those','some','subtle','soft','very','really','kind','sort','like','look','looking','want','need','please','image','images','photo','photos','picture','pictures','background','backgrounds']);

const EXPANSIONS = {
  paper: ['paper texture','parchment','cream paper','vintage paper','notebook paper'],
  texture: ['texture background','surface texture','grain texture'],
  ivory: ['ivory','cream','off white'],
  handwritten: ['handwriting','script','cursive'],
  gradient: ['gradient background','color gradient','mesh gradient'],
  minimal: ['minimalist','clean','simple'],
  nature: ['landscape','outdoors','scenery'],
  ocean: ['sea','waves','coast'],
  neon: ['neon lights','glow','cyberpunk'],
  vintage: ['retro','aged','antique'],
  wood: ['wood texture','timber','grain'],
  marble: ['marble texture','stone','granite'],
  city: ['urban','skyline','cityscape'],
  space: ['galaxy','stars','cosmos'],
  abstract: ['abstract pattern','geometric','shapes'],
};

function normalize(partial, prompt) {
  const b = { primary_query: prompt, search_queries: [], synonyms: [], subjects: [], colors: [], orientation: 'any', negative_keywords: [] };
  const m = { ...b, ...(partial || {}) };
  if (!m.primary_query) m.primary_query = prompt;
  return m;
}

function optimizeLocally(prompt) {
  const raw = String(prompt || '').toLowerCase();
  const tokens = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const uniq = [...new Set(tokens)];
  const queries = new Set();
  for (let i = 0; i < uniq.length - 1; i++) queries.add(`${uniq[i]} ${uniq[i + 1]}`);
  uniq.forEach((w) => { if (EXPANSIONS[w]) EXPANSIONS[w].forEach((e) => queries.add(e)); });
  const search_queries = [...queries].slice(0, 10);
  const primary = search_queries.find((q) => q.includes(' ')) || search_queries[0] || uniq.slice(0, 2).join(' ') || raw.trim() || prompt;
  return normalize({
    primary_query: primary,
    search_queries: search_queries.length ? search_queries : [primary],
    synonyms: uniq.slice(0, 10),
    subjects: uniq.slice(0, 6),
    _source: 'local',
  }, prompt);
}

function extractJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch { return null; }
}

async function optimizeWithGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.15, topP: 0.85 },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const parsed = extractJson(text);
    return parsed ? normalize({ ...parsed, _source: 'ai' }, prompt) : null;
  } catch (err) {
    console.warn('[api/ai-search] gemini failed:', err?.message || err);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (guardMethod(req, res, ['POST'])) return;

  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 15, windowMs: 60_000 });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rl.resetMs / 1000)));
    return json(res, 429, { error: 'rate_limited', retryAfterMs: rl.resetMs });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const check = validateQuery(body?.prompt, { max: 300 });
  if (!check.ok) return json(res, 400, { error: 'invalid_prompt', detail: check.error });

  const ai = await optimizeWithGemini(check.value);
  return json(res, 200, ai || optimizeLocally(check.value));
}
