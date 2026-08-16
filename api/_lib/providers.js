// api/_lib/providers.js
// Provider abstraction layer. Each provider runs SERVER-SIDE ONLY and reads its
// secret from process.env (never a VITE_ var). Each declares a media `type`
// ('photo' | 'video') so the /api/search endpoint can serve photo/video tabs.
// Adding a provider = one entry here.

import {
  normalizeUnsplash, normalizePexels, normalizePixabay, normalizeOpenverse, normalizeWikimedia,
  normalizePexelsVideo, normalizePixabayVideo,
} from './normalize.js';

const TIMEOUT_MS = 8000;

async function getJson(url, options = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const providers = {
  unsplash: {
    type: 'photo',
    enabled: () => Boolean(process.env.UNSPLASH_ACCESS_KEY),
    async search(q, page, perPage, { orientation, color, sort } = {}) {
      let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`;
      if (orientation) url += `&orientation=${orientation === 'square' ? 'squarish' : orientation}`;
      if (color) url += `&color=${color}`;
      if (sort === 'newest') url += '&order_by=latest';
      const data = await getJson(url, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
      return (data.results || []).map(normalizeUnsplash);
    },
  },
  pexels: {
    type: 'photo',
    enabled: () => Boolean(process.env.PEXELS_API_KEY),
    async search(q, page, perPage, { orientation, color } = {}) {
      let url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`;
      if (orientation) url += `&orientation=${orientation}`;
      if (color) url += `&color=${color}`;
      const data = await getJson(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
      return (data.photos || []).map(normalizePexels);
    },
  },
  pixabay: {
    type: 'photo',
    enabled: () => Boolean(process.env.PIXABAY_API_KEY),
    async search(q, page, perPage, { orientation, color, sort } = {}) {
      let url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&safesearch=true&image_type=all`;
      if (orientation === 'landscape') url += '&orientation=horizontal';
      if (orientation === 'portrait') url += '&orientation=vertical';
      if (color) url += `&colors=${color}`;
      if (sort === 'newest') url += '&order=latest';
      const data = await getJson(url);
      return (data.hits || []).map(normalizePixabay);
    },
  },
  openverse: {
    type: 'photo',
    enabled: () => true, // no key required
    async search(q, page, perPage, { license } = {}) {
      let url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=${perPage}`;
      if (license) url += `&license=${license}`;
      // Openverse requires a descriptive User-Agent; anonymous requests without
      // one are rejected. A token raises the rate limit but isn't required.
      const headers = { 'User-Agent': 'PikFinder/1.0 (https://pikfinder.com; support@pikfinder.com)' };
      if (process.env.OPENVERSE_TOKEN) headers.Authorization = `Bearer ${process.env.OPENVERSE_TOKEN}`;
      const data = await getJson(url, { headers });
      return (data.results || []).map(normalizeOpenverse);
    },
  },
  wikimedia: {
    type: 'photo',
    enabled: () => true, // no key required
    async search(q, page, perPage, { sort } = {}) {
      // Wikimedia uses an offset (gsroffset), not page numbers.
      const offset = (page - 1) * perPage;
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=${perPage}&gsroffset=${offset}&prop=imageinfo&iiprop=url|extmetadata|dimensions&format=json&origin=*`;
      const data = await getJson(url, { headers: { 'User-Agent': 'PikFinder/1.0 (https://pikfinder.com)' } });
      const pages = data.query?.pages || {};
      let results = Object.values(pages).map(normalizeWikimedia);
      // Client sorting for newest could be done if timestamp available, but basic search has no sort param.
      return results;
    },
  },
  pexelsVideos: {
    type: 'video',
    enabled: () => Boolean(process.env.PEXELS_API_KEY),
    async search(q, page, perPage) {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`;
      const data = await getJson(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
      return (data.videos || []).map(normalizePexelsVideo);
    },
  },
  pixabayVideos: {
    type: 'video',
    enabled: () => Boolean(process.env.PIXABAY_API_KEY),
    async search(q, page, perPage) {
      const url = `https://pixabay.com/api/videos/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&safesearch=true`;
      const data = await getJson(url);
      return (data.hits || []).map(normalizePixabayVideo);
    },
  },
};

/** Providers usable right now (key present), optionally filtered by media type. */
export function activeProviders(type) {
  return Object.keys(providers).filter(
    (n) => providers[n].enabled() && (!type || providers[n].type === type)
  );
}

/**
 * Fan out a search in parallel across the requested providers. A failing/slow
 * provider never sinks the request. Results are de-duplicated and interleaved.
 * @returns {{ results: object[], errors: Record<string,string>, sources: string[] }}
 */
export async function searchProviders(q, { page = 1, perPage = 20, type, only, orientation, color, license, sort } = {}) {
  const names = (only && only.length ? only : activeProviders(type)).filter(
    (n) => providers[n] && providers[n].enabled() && (!type || providers[n].type === type)
  );

  const settled = await Promise.allSettled(names.map((n) => providers[n].search(q, page, perPage, { orientation, color, license, sort })));

  const flat = [];
  const errors = {};
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') flat.push(...s.value);
    else errors[names[i]] = String(s.reason?.message || s.reason);
  });

  // Deduplicate: same source id, or identical download/preview URL across sources.
  const seen = new Set();
  const deduped = [];
  for (const r of flat) {
    const key = r.id || r.downloadUrl || r.preview;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    deduped.push(r);
  }

  // Interleave by source so page 1 isn't dominated by one provider.
  const byProvider = {};
  for (const r of deduped) (byProvider[r.source] ||= []).push(r);
  const interleaved = [];
  let added = true;
  for (let i = 0; added; i++) {
    added = false;
    for (const src of Object.keys(byProvider)) {
      if (byProvider[src][i]) { interleaved.push(byProvider[src][i]); added = true; }
    }
  }

  return { results: interleaved, errors, sources: names };
}
