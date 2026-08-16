// src/lib/mediaApi.js
// Client for the server-side media API (/api/search, /api/ai-search). Provider
// keys stay server-side; the browser only calls same-origin /api/* routes.
//
// Every result matches the canonical shape:
//   { id, type, title, thumbnail, preview, source, sourceLogo, creator,
//     creatorProfile, originalUrl, downloadUrl, license, licenseUrl,
//     attributionRequired, width, height, tags }

/**
 * Search media across configured providers.
 * @param {string} query
 * @param {{ type?: 'photo'|'video', page?: number, perPage?: number, sources?: string[], signal?: AbortSignal }} [opts]
 * @returns {Promise<{ results: object[], sources: string[], count: number, type: string, providerErrors?: object }>}
 */
export async function searchMedia(query, opts = {}) {
  // Icons come from Iconify (free, open-source, 200k+ icons, CORS-enabled) — no
  // provider key and no server round-trip needed.
  if (opts.type === 'icon') return searchIcons(query, opts);
  const { type = 'photo', page = 1, perPage = 24, sources, orientation, color, sort, signal } = opts;
  const params = new URLSearchParams({ q: query, type, page: String(page), per_page: String(perPage) });
  // `sources` may be a single provider string (e.g. 'pexels') or an array.
  const src = Array.isArray(sources) ? sources.filter(Boolean).join(',') : (sources || '');
  if (src) params.set('sources', src);
  // Forward the advanced filters the backend understands.
  if (orientation && orientation !== 'all') params.set('orientation', orientation);
  if (color && color !== 'any') params.set('color', color);
  if (sort && sort !== 'relevance') params.set('sort', sort);

  const res = await fetch(`/api/search?${params.toString()}`, { signal });
  if (res.status === 429) throw new Error('Too many searches — please slow down a moment.');
  if (res.status === 503) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || 'No providers configured.');
    err.code = 'no_providers';
    throw err;
  }
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

/**
 * Turn a natural-language description into optimized keywords + detected facets.
 * Never throws on AI failure server-side — falls back to a local optimizer.
 * @returns {Promise<{ primary_query: string, search_queries: string[], synonyms: string[], colors?: string[], orientation?: string, subjects?: string[], _source?: 'ai'|'local' }>}
 */
export async function optimizeQuery(prompt, { signal } = {}) {
  const res = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) throw new Error(`AI optimize failed (${res.status})`);
  return res.json();
}

const ICONIFY = 'https://api.iconify.design';

/**
 * Search open-source icons via Iconify (free, 200k+ icons, CORS-enabled, no key).
 * Returns the same normalized item shape as the photo/video providers, with
 * type 'icon' and an SVG downloadUrl.
 */
export async function searchIcons(query, { perPage = 48, page = 1 } = {}) {
  const q = String(query || '').trim() || 'star';
  const limit = Math.min(120, perPage * page + perPage);
  const res = await fetch(`${ICONIFY}/search?query=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error(`Icon search failed (${res.status})`);
  const data = await res.json();
  const names = Array.isArray(data.icons) ? data.icons : [];
  const pageNames = names.slice((page - 1) * perPage, page * perPage);
  const results = pageNames.map((full) => {
    const [prefix, name] = full.split(':');
    const base = `${ICONIFY}/${prefix}/${encodeURIComponent(name)}.svg`;
    return {
      id: `iconify:${full}`,
      type: 'icon',
      title: (name || full).replace(/-/g, ' '),
      // Preview is tinted so it's visible on light AND dark cards.
      thumbnail: `${base}?height=180&color=%238b5cf6`,
      preview: `${base}?height=400&color=%238b5cf6`,
      downloadUrl: base, // raw SVG (currentColor) so the user can recolor it
      source: 'Iconify',
      sourceLogo: '',
      creator: prefix,
      creatorProfile: '',
      originalUrl: `https://icon-sets.iconify.design/${prefix}/${name}/`,
      license: 'Open-source icon',
      licenseUrl: 'https://iconify.design/docs/legal/',
      attributionRequired: false,
      width: 512, height: 512, tags: [],
    };
  });
  return { results, sources: ['Iconify'], count: results.length, type: 'icon' };
}
