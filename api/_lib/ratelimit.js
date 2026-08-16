// api/_lib/ratelimit.js
// Lightweight per-IP sliding-window rate limiter.
//
// NOTE ON SCALE: serverless instances are ephemeral and not shared, so this
// in-memory limiter is per-instance (a soft guard against casual abuse and
// runaway loops). For real, global rate limiting across all instances, back
// this with Vercel KV or Upstash Redis — swap the Map for a Redis INCR+EXPIRE.
// The function signature stays the same, so callers don't change.

const buckets = new Map(); // ip -> number[] (timestamps, ms)

/**
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function rateLimit(ip, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const key = ip || 'unknown';
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const resetMs = windowMs - (now - hits[0]);
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, resetMs };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the Map doesn't grow unbounded on a warm instance.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { allowed: true, remaining: limit - hits.length, resetMs: windowMs };
}

/** Best-effort client IP from Vercel's forwarding headers. */
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}
