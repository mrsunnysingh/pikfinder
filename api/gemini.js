// api/gemini.js
// One serverless function that powers all of PikFinder's Gemini AI features,
// routed by a `task` field so we stay well under the Vercel function limit.
// The API key stays server-side only. Tasks: doc-text, suggest, design-tip, caption.

import { applyCors, json, guardMethod } from './_lib/http.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const PROMPTS = {
  // Fill a business-document field with concise professional text.
  'doc-text': (i) =>
    `You are filling a business document field. Write a concise, professional value for the field "${i.field || 'text'}"` +
    `${i.context ? ` on a "${i.context}" document` : ''}.` +
    `${i.hint ? ` Context/details: ${i.hint}.` : ''}` +
    ` Return ONLY the field value — no label, no quotes, no explanation. Keep it under 40 words.`,
  // Related search phrases from what the user typed (behaviour-aware suggestions).
  'suggest': (i) =>
    `A user searched "${i.query || ''}" for stock photos/media. Suggest 6 short, distinct related search phrases (2-3 words each) they'd likely want next. Return ONLY a comma-separated list.`,
  // One concrete design improvement tip.
  'design-tip': (i) =>
    `Give ONE short, specific, practical design-improvement tip (max 25 words) for a "${i.context || 'social media'}" design. No preamble.`,
  // Marketing captions/headlines for a design.
  'caption': (i) =>
    `Write 3 punchy marketing captions (max 12 words each) for a design titled "${i.title || ''}"${i.context ? ` (${i.context})` : ''}. Return each on its own line, no numbering, no quotes.`,
};

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (guardMethod(req, res, ['POST'])) return;

  // AI calls cost money/quota — throttle per IP.
  const rl = rateLimit(clientIp(req), { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return json(res, 429, { ok: false, error: 'rate_limited', retryAfterMs: rl.resetMs });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(res, 501, { ok: false, error: 'not_configured', detail: 'Set GEMINI_API_KEY in the server env, then redeploy.' });

  const b = req.body || {};
  const build = PROMPTS[String(b.task || '')];
  if (!build) return json(res, 400, { ok: false, error: 'unknown_task' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: build(b) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json(res, 502, { ok: false, error: 'gemini_error', detail: data?.error?.message || `HTTP ${r.status}` });
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return json(res, 200, { ok: true, text });
  } catch (e) {
    return json(res, 500, { ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}
