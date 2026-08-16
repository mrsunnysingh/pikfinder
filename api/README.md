# PikFinder — Server-Side API (Vercel Functions)

Additive backend that keeps provider secrets off the client. Nothing here changes
the existing Wikimedia-based Gallery; wire it in when ready via `src/lib/mediaApi.js`.

## Endpoints
- `GET  /api/search?q=<term>&page=1&per_page=20&sources=unsplash,pexels`
  Fans out across configured providers, returns results normalized to one schema.
- `POST /api/ai-search`  body: `{ "prompt": "warm ivory paper texture" }`
  Server-side Gemini optimizer with a deterministic local fallback.

## Why this satisfies the brief's Priority-1 security item
Provider keys live in **server env vars without the `VITE_` prefix**, so they are
never bundled into the browser. The client only ever calls your own same-origin
`/api/*` routes. Adding a keyed provider = one entry in `api/_lib/providers.js`.

## Setup
1. Set env vars in Vercel → Settings → Environment Variables (see `.env.example`):
   `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `GEMINI_API_KEY`.
   Openverse needs none. With zero keys set, only Openverse runs.
2. Deploy. Test: `curl "https://<your-domain>/api/search?q=mountains&sources=openverse"`

## Built-in protections
- Per-IP rate limiting (in-memory; back with Vercel KV/Upstash for global limits).
- Input validation + length caps + control-char stripping on all user input.
- Method guards + CORS preflight handling; CORS locked to same-origin by default.
- Per-provider timeouts and isolation — one slow provider can't sink the response.
- No secrets in responses; edge caching only on non-personalized search pages.

## Files
- `api/search.js` — media search endpoint
- `api/ai-search.js` — AI query optimizer endpoint
- `api/_lib/providers.js` — provider abstraction (add providers here)
- `api/_lib/normalize.js` — canonical media shape + license metadata
- `api/_lib/http.js` — CORS, validation, JSON helpers
- `api/_lib/ratelimit.js` — sliding-window limiter
