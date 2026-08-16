// api/_lib/normalize.js
// Normalizes every provider's raw response into ONE canonical media shape so the
// client never needs provider-specific logic. Matches the Phase-1 schema exactly.
//
// Canonical shape (every field always present; unknowns null/[]):
// { id, type, title, thumbnail, preview, source, sourceLogo, creator,
//   creatorProfile, originalUrl, downloadUrl, license, licenseUrl,
//   attributionRequired, width, height, tags }

const SOURCE_LOGOS = {
  Unsplash: 'https://unsplash.com/favicon.ico',
  Pexels: 'https://www.pexels.com/favicon.ico',
  Pixabay: 'https://pixabay.com/favicon.ico',
  Openverse: 'https://openverse.org/favicon.ico',
  Wikimedia: 'https://commons.wikimedia.org/favicon.ico',
};

// Attribution/commercial facts per Creative Commons code (Openverse).
const CC = {
  'cc0': { name: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', attributionRequired: false },
  'pdm': { name: 'Public Domain', url: 'https://creativecommons.org/publicdomain/mark/1.0/', attributionRequired: false },
  'by': { name: 'CC BY', url: 'https://creativecommons.org/licenses/by/4.0/', attributionRequired: true },
  'by-sa': { name: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/', attributionRequired: true },
  'by-nd': { name: 'CC BY-ND', url: 'https://creativecommons.org/licenses/by-nd/4.0/', attributionRequired: true },
  'by-nc': { name: 'CC BY-NC', url: 'https://creativecommons.org/licenses/by-nc/4.0/', attributionRequired: true },
  'by-nc-sa': { name: 'CC BY-NC-SA', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', attributionRequired: true },
  'by-nc-nd': { name: 'CC BY-NC-ND', url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/', attributionRequired: true },
};

function base(source, type) {
  return {
    id: null, type, title: null, thumbnail: null, preview: null,
    source, sourceLogo: SOURCE_LOGOS[source] || null,
    creator: null, creatorProfile: null, originalUrl: null, downloadUrl: null,
    license: null, licenseUrl: null, attributionRequired: true,
    width: null, height: null, tags: [],
  };
}

// Unsplash API guideline: every link back to Unsplash (photo + photographer)
// must carry the app's UTM referral params.
const UNSPLASH_UTM = 'utm_source=pikfinder&utm_medium=referral';
const withUtm = (url) => (url ? `${url}${url.includes('?') ? '&' : '?'}${UNSPLASH_UTM}` : null);

export function normalizeUnsplash(p) {
  return {
    ...base('Unsplash', 'photo'),
    id: `unsplash:${p.id}`,
    title: p.description || p.alt_description || 'Untitled',
    thumbnail: p.urls?.small || p.urls?.thumb || null,
    preview: p.urls?.regular || p.urls?.full || null,
    creator: p.user?.name || 'Unknown',
    creatorProfile: withUtm(p.user?.links?.html),
    originalUrl: withUtm(p.links?.html),
    downloadUrl: p.urls?.full || p.urls?.raw || null,
    // Required by Unsplash to register a download event (pinged when a user
    // actually downloads — see /api/unsplash-download).
    downloadLocation: p.links?.download_location || null,
    license: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
    attributionRequired: false,
    width: p.width || null, height: p.height || null,
    tags: Array.isArray(p.tags) ? p.tags.map((t) => t.title).filter(Boolean).slice(0, 12) : [],
  };
}

export function normalizePexels(p) {
  return {
    ...base('Pexels', 'photo'),
    id: `pexels:${p.id}`,
    title: p.alt || 'Untitled',
    thumbnail: p.src?.medium || p.src?.small || null,
    preview: p.src?.large || p.src?.large2x || null,
    creator: p.photographer || 'Unknown',
    creatorProfile: p.photographer_url || null,
    originalUrl: p.url || null,
    downloadUrl: p.src?.original || p.src?.large2x || null,
    license: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    attributionRequired: false,
    width: p.width || null, height: p.height || null,
    tags: [],
  };
}

export function normalizePixabay(p) {
  return {
    ...base('Pixabay', 'photo'),
    id: `pixabay:${p.id}`,
    title: (p.tags || '').split(',')[0]?.trim() || 'Untitled',
    thumbnail: p.webformatURL || p.previewURL || null,
    preview: p.largeImageURL || p.webformatURL || null,
    creator: p.user || 'Unknown',
    creatorProfile: p.user ? `https://pixabay.com/users/${p.user}-${p.user_id}/` : null,
    originalUrl: p.pageURL || null,
    downloadUrl: p.largeImageURL || p.webformatURL || null,
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    attributionRequired: false,
    width: p.imageWidth || null, height: p.imageHeight || null,
    tags: (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
  };
}

export function normalizeOpenverse(p) {
  const code = String(p.license || '').toLowerCase();
  const meta = CC[code] || { name: (p.license || 'Unknown').toUpperCase(), url: p.license_url || null, attributionRequired: true };
  return {
    ...base('Openverse', 'photo'),
    id: `openverse:${p.id}`,
    title: p.title || 'Untitled',
    thumbnail: p.thumbnail || null,
    preview: p.url || null,
    creator: p.creator || 'Unknown',
    creatorProfile: p.creator_url || null,
    originalUrl: p.foreign_landing_url || p.url || null,
    downloadUrl: p.url || null,
    license: p.license_version ? `${meta.name} ${p.license_version}` : meta.name,
    licenseUrl: p.license_url || meta.url,
    attributionRequired: meta.attributionRequired,
    width: p.width || null, height: p.height || null,
    tags: Array.isArray(p.tags) ? p.tags.map((t) => t.name || t).filter(Boolean).slice(0, 12) : [],
  };
}

export function normalizeWikimedia(p) {
  const info = p.imageinfo?.[0] || {};
  const meta = info.extmetadata || {};
  
  // Clean up HTML tags from creator name which Wikimedia sometimes returns
  const creatorStr = meta.Artist?.value || 'Unknown';
  const cleanCreator = creatorStr.replace(/<[^>]*>?/gm, '').trim() || 'Unknown';

  return {
    ...base('Wikimedia', 'photo'),
    id: `wikimedia:${p.pageid}`,
    title: p.title?.replace(/^File:/, '')?.replace(/\.\w+$/, '')?.replace(/_/g, ' ') || 'Untitled',
    thumbnail: info.thumburl || info.url || null,
    preview: info.url || null,
    creator: cleanCreator,
    creatorProfile: null,
    originalUrl: info.descriptionurl || null,
    downloadUrl: info.url || null,
    license: meta.LicenseShortName?.value || 'Wikimedia Commons',
    licenseUrl: meta.LicenseUrl?.value || 'https://commons.wikimedia.org/',
    attributionRequired: true,
    width: info.width || null, height: info.height || null,
    tags: [],
  };
}

// ---- Videos ----

export function normalizePexelsVideo(v) {
  // Pick a mid-quality mp4 for inline preview and the largest for download.
  const files = (v.video_files || []).filter((f) => f.file_type === 'video/mp4');
  const byRes = [...files].sort((a, b) => (a.width || 0) - (b.width || 0));
  const preview = byRes.find((f) => (f.width || 0) >= 640) || byRes[0] || null;
  const best = byRes[byRes.length - 1] || null;
  return {
    ...base('Pexels', 'video'),
    id: `pexels-video:${v.id}`,
    title: (v.url || '').split('/').filter(Boolean).pop()?.replace(/-\d+$/, '').replace(/-/g, ' ') || 'Video',
    thumbnail: v.image || null,
    preview: preview?.link || null,
    creator: v.user?.name || 'Unknown',
    creatorProfile: v.user?.url || null,
    originalUrl: v.url || null,
    downloadUrl: best?.link || preview?.link || null,
    license: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    attributionRequired: false,
    width: v.width || null, height: v.height || null,
    tags: [],
  };
}

export function normalizePixabayVideo(v) {
  const vids = v.videos || {};
  const preview = vids.small || vids.tiny || vids.medium || null;
  const best = vids.large || vids.medium || vids.small || vids.tiny || null;
  return {
    ...base('Pixabay', 'video'),
    id: `pixabay-video:${v.id}`,
    title: (v.tags || '').split(',')[0]?.trim() || 'Video',
    // Pixabay video thumbnails are derived from the CDN picture id when present.
    thumbnail: v.picture_id ? `https://i.vimeocdn.com/video/${v.picture_id}_295x166.jpg` : null,
    preview: preview?.url || null,
    creator: v.user || 'Unknown',
    creatorProfile: v.user ? `https://pixabay.com/users/${v.user}-${v.user_id}/` : null,
    originalUrl: v.pageURL || null,
    downloadUrl: best?.url || preview?.url || null,
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    attributionRequired: false,
    width: best?.width || null, height: best?.height || null,
    tags: (v.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
  };
}
