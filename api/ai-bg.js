// api/ai-bg.js — POST /api/ai-bg  { prompt, size }
// AI background / scene generator. Gated behind a provider key so it never ships a
// broken or surprise-cost path: if OPENAI_API_KEY is set, generates a PNG from the
// prompt; otherwise returns 501 with setup guidance. Returns raw PNG bytes on success.

import { applyCors, json, guardMethod } from './_lib/http.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';

const ALLOWED_SIZES = { '1024x1024': 1, '1536x1024': 1, '1024x1536': 1 };

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (guardMethod(req, res, ['POST'])) return;

  // Image generation is the most expensive call — throttle tightly per IP.
  const rl = rateLimit(clientIp(req), { limit: 8, windowMs: 60_000 });
  if (!rl.allowed) return json(res, 429, { ok: false, error: 'rate_limited', retryAfterMs: rl.resetMs });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return json(res, 501, {
      ok: false, error: 'not_configured',
      detail: 'AI backgrounds are off. Set OPENAI_API_KEY in the server env to enable, then redeploy.',
    });
  }

  const body = req.body || {};
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return json(res, 400, { ok: false, error: 'no_prompt', detail: 'Provide a prompt.' });
  const size = ALLOWED_SIZES[body.size] ? body.size : '1024x1024';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size, n: 1 }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return json(res, 502, { ok: false, error: 'provider_error', detail: (data && data.error && data.error.message) || `HTTP ${r.status}` });
    }
    const item = (data.data && data.data[0]) || {};
    let png;
    if (item.b64_json) {
      png = Buffer.from(item.b64_json, 'base64');
    } else if (item.url) {
      const img = await fetch(item.url, { signal: controller.signal });
      png = Buffer.from(await img.arrayBuffer());
    } else {
      return json(res, 502, { ok: false, error: 'empty_result', detail: 'Provider returned no image.' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(png);
  } catch (e) {
    return json(res, 504, { ok: false, error: 'ai_bg_failed', detail: String((e && e.message) || e) });
  } finally {
    clearTimeout(timer);
  }
}
