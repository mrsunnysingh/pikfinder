// api/proxy-image.js — GET /api/proxy-image?url=<encoded>
// Streams a remote image back through our own origin so the browser treats it as
// same-origin. That keeps the canvas UNTAINTED, so the Studio can edit AND export
// images that come from other URLs (e.g. Zoho record images, pasted links).
//
// Safety: only http(s), blocks localhost/private IPs (SSRF), image content-types
// only, 20 MB cap, 12s timeout. Read-only — never follows non-image responses.

import { applyCors, json, guardMethod } from './_lib/http.js';

import { rateLimit, clientIp } from './_lib/ratelimit.js';

const MAX_BYTES = 20 * 1024 * 1024;

function isBlockedHost(hRaw) {
  const h = String(hRaw || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h === '::1' || h === '0.0.0.0') return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  // IPv4 private / loopback / link-local / CGNAT
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;
  return false;
}

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (guardMethod(req, res, ['GET'])) return;

  // Throttle so the proxy can't be abused to burn bandwidth through your account.
  const rl = rateLimit(clientIp(req), { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return json(res, 429, { error: 'rate_limited', retryAfterMs: rl.resetMs });

  let target;
  try { target = new URL(String(req.query.url || '')); }
  catch { return json(res, 400, { error: 'bad_url' }); }
  if (!/^https?:$/.test(target.protocol)) return json(res, 400, { error: 'bad_protocol' });
  if (isBlockedHost(target.hostname)) return json(res, 403, { error: 'blocked_host' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    // Follow redirects manually, re-validating each hop's host — otherwise a
    // public URL could 302 to an internal IP (e.g. cloud metadata) and bypass
    // the SSRF checks above.
    let url = target;
    let r;
    for (let hop = 0; hop < 5; hop++) {
      r = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'PikFinder-ImageProxy/1.0', Accept: 'image/*' },
      });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) break;
        let next;
        try { next = new URL(loc, url); } catch { return json(res, 400, { error: 'bad_redirect' }); }
        if (!/^https?:$/.test(next.protocol)) return json(res, 400, { error: 'bad_protocol' });
        if (isBlockedHost(next.hostname)) return json(res, 403, { error: 'blocked_host' });
        url = next;
        continue;
      }
      break;
    }
    if (!r.ok) return json(res, 502, { error: 'fetch_failed', status: r.status });
    const ct = r.headers.get('content-type') || '';
    if (!/^image\//i.test(ct)) return json(res, 415, { error: 'not_an_image', contentType: ct });
    const declared = Number(r.headers.get('content-length') || 0);
    if (declared && declared > MAX_BYTES) return json(res, 413, { error: 'too_large' });

    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return json(res, 413, { error: 'too_large' });

    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buf);
  } catch (e) {
    return json(res, 504, { error: 'proxy_error', detail: String((e && e.message) || e) });
  } finally {
    clearTimeout(timer);
  }
}
