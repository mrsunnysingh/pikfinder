// api/_lib/http.js
// Small, dependency-free helpers shared by every Vercel Function.
// Keeps CORS, method-guarding, input validation, and JSON responses in one place.

/**
 * Resolve the allowed CORS origin. In production the API is same-origin, so we
 * echo the site origin from ALLOWED_ORIGIN (comma-separated allowlist). If a
 * request Origin isn't on the list, we simply omit the header (browser blocks it).
 */
export function applyCors(req, res, { anyOrigin = false } = {}) {
  // Public, unauthenticated endpoints (template catalogue, stock search, headless
  // render, AI background) are called cross-origin from the Zoho widget, whose origin
  // we can't predict. They carry no credentials and expose only public data, so we
  // allow any origin for those.
  if (anyOrigin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return;
  }

  const allowlist = (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;

  if (allowlist.length === 0) {
    // Same-origin deployments don't send an Origin header for same-site fetches,
    // so no ACAO header is needed. Leave it unset (most secure default).
  } else if (origin && allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/** Send a JSON response with sane no-store caching for API payloads. */
export function json(res, status, body, { cache } = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.status(status).send(JSON.stringify(body));
}

/** Guard the HTTP method; auto-handles the CORS preflight. Returns true if handled. */
export function guardMethod(req, res, allowed = ['GET']) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  if (!allowed.includes(req.method)) {
    json(res, 405, { error: 'method_not_allowed', allowed });
    return true;
  }
  return false;
}

/** Coerce + clamp an integer query param. */
export function clampInt(value, { min, max, fallback }) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Validate + sanitize a free-text search query.
 * Strips control chars, collapses whitespace, enforces a length ceiling.
 * Returns { ok, value, error }.
 */
export function validateQuery(raw, { max = 100 } = {}) {
  if (typeof raw !== 'string') return { ok: false, error: 'query must be a string' };
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return { ok: false, error: 'query is required' };
  if (cleaned.length > max) return { ok: false, error: `query too long (max ${max})` };
  return { ok: true, value: cleaned };
}
