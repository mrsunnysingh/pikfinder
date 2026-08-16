// src/lib/blog/types.js
// The stable Post contract every source adapter maps into. Keeping this shape
// fixed is what lets us swap local Markdown for a CMS later without touching
// any component, route, or SEO code.
//
// Post = {
//   slug, title, description, coverImage, tags: string[], author,
//   publishedAt, updatedAt, readingMinutes, body   // body is raw markdown
// }

/** Rough reading time from a body string (~200 wpm). */
export function readingMinutes(body = '') {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Normalize a tag list (string or array) into a clean string[]. */
export function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

/** Newest-first comparator on publishedAt. */
export function byNewest(a, b) {
  return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
}
