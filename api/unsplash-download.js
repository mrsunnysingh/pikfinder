// api/unsplash-download.js
// Registers an Unsplash download event, as required by the Unsplash API
// Guidelines: "when your application performs something similar to a download
// (e.g. when a user chooses an image), you must send a request to the photo's
// download_location endpoint." Fire-and-forget from the client on real download.
// The Client-ID is server-side only (never exposed to the browser).

import { applyCors, json, guardMethod } from './_lib/http.js';

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (guardMethod(req, res, ['POST'])) return;

  const key = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY;
  const location = (req.body && req.body.location) || '';

  // Only accept genuine Unsplash download_location URLs.
  if (!key || !/^https:\/\/api\.unsplash\.com\/photos\/[\w-]+\/download/.test(location)) {
    return json(res, 200, { ok: false, skipped: true }); // never block the user's download
  }
  try {
    const url = `${location}${location.includes('?') ? '&' : '?'}client_id=${encodeURIComponent(key)}`;
    await fetch(url, { headers: { 'Accept-Version': 'v1' } });
    return json(res, 200, { ok: true });
  } catch {
    return json(res, 200, { ok: false }); // best-effort; download already happened client-side
  }
}
