// api/health.js — GET /api/health
// Lightweight liveness + configuration probe. Confirms the serverless functions
// are actually executing (not being swallowed by the SPA rewrite) and reports
// which provider keys are configured in the server environment. Reports booleans
// only — never the key values.

import { guardMethod, applyCors, json } from './_lib/http.js';

export default function handler(req, res) {
  applyCors(req, res);
  if (guardMethod(req, res, ['GET'])) return;

  return json(res, 200, {
    status: 'ok',
    time: new Date().toISOString(),
    providers: {
      unsplash: Boolean(process.env.UNSPLASH_ACCESS_KEY),
      pexels: Boolean(process.env.PEXELS_API_KEY),
      pixabay: Boolean(process.env.PIXABAY_API_KEY),
      openverse: true, // no key required
      gemini: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}
