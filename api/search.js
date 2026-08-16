// api/search.js — GET /api/search?q=...&type=photo&page=1&per_page=20&sources=unsplash,pexels
// Server-side media search. Keeps every provider key secret and returns results
// already normalized + deduplicated. `type` is 'photo' (default) or 'video'.

import { guardMethod, applyCors, json, validateQuery, clampInt } from './_lib/http.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';
import { searchProviders, activeProviders } from './_lib/providers.js';

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (guardMethod(req, res, ['GET'])) return;

  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 30, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rl.resetMs / 1000)));
    return json(res, 429, { error: 'rate_limited', retryAfterMs: rl.resetMs });
  }

  const check = validateQuery(req.query.q, { max: 100 });
  if (!check.ok) return json(res, 400, { error: 'invalid_query', detail: check.error });

  const type = req.query.type === 'video' ? 'video' : 'photo';
  const page = clampInt(req.query.page, { min: 1, max: 50, fallback: 1 });
  const perPage = clampInt(req.query.per_page, { min: 1, max: 40, fallback: 20 });
  const only = typeof req.query.sources === 'string'
    ? req.query.sources.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;
  
  // Advanced filters
  const orientation = req.query.orientation || undefined;
  const color = req.query.color || undefined;
  const license = req.query.license || undefined;
  const sort = req.query.sort || undefined;

  const available = activeProviders(type);
  if (available.length === 0) {
    return json(res, 503, {
      error: 'no_providers_configured',
      detail: type === 'video'
        ? 'Video search needs PEXELS_API_KEY or PIXABAY_API_KEY set in server env.'
        : 'Set provider keys in server env (UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, PIXABAY_API_KEY). Openverse needs none.',
    });
  }

  try {
    const { results, errors, sources } = await searchProviders(check.value, { page, perPage, type, only, orientation, color, license, sort });
    return json(res, 200, {
      query: check.value, type, page, perPage, sources,
      count: results.length, results,
      ...(Object.keys(errors).length ? { providerErrors: errors } : {}),
    }, { cache: 's-maxage=300, stale-while-revalidate=600' });
  } catch (err) {
    console.error('[api/search] fatal:', err?.message || err);
    return json(res, 502, { error: 'search_failed' });
  }
}
