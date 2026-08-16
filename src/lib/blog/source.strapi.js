// src/lib/blog/source.strapi.js
// Strapi-backed blog via the REST API. Use a READ-ONLY API token. Prefer
// build/prerender-time use; for client use the token is exposed in the bundle.
//
// Env: VITE_STRAPI_URL (e.g. https://cms.example.com), VITE_STRAPI_TOKEN.
// Collection `articles` with fields:
//   title, slug, description, cover (media), tags (csv or relation names),
//   author, publishedAt, updatedAt, body (markdown / rich text as markdown).

import { readingMinutes, normalizeTags } from './types';

const BASE = (import.meta.env.VITE_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

async function rest(path) {
  if (!BASE) return { data: [] };
  const res = await fetch(`${BASE}/api/${path}`, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined);
  if (!res.ok) throw new Error(`Strapi ${res.status}`);
  return res.json();
}

function mediaUrl(cover) {
  const u = cover?.data?.attributes?.url || cover?.url || '';
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `${BASE}${u}`;
}

function toPost(entry) {
  // Strapi v4 wraps fields in `attributes`; v5 is flat. Support both.
  const a = entry.attributes || entry;
  const body = a.body || '';
  return {
    slug: a.slug || String(entry.id),
    title: a.title || 'Untitled',
    description: a.description || '',
    coverImage: mediaUrl(a.cover),
    tags: normalizeTags(a.tags),
    author: a.author || 'PikFinder',
    publishedAt: a.publishedAt || '',
    updatedAt: a.updatedAt || a.publishedAt || '',
    readingMinutes: readingMinutes(body),
    body,
  };
}

export async function getAllPosts() {
  const json = await rest('articles?populate=*&sort=publishedAt:desc&pagination[pageSize]=100');
  return (json.data || []).map(toPost);
}

export async function getPost(slug) {
  const json = await rest(`articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&pagination[pageSize]=1`);
  const e = (json.data || [])[0];
  return e ? toPost(e) : null;
}

export async function getPostsByTag(tag) {
  const all = await getAllPosts();
  const t = String(tag).toLowerCase();
  return all.filter((p) => p.tags.some((x) => x.toLowerCase() === t));
}

export async function getTags() {
  const all = await getAllPosts();
  const counts = {};
  for (const p of all) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
