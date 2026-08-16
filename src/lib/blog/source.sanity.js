// src/lib/blog/source.sanity.js
// Sanity-backed blog via the public query (GROQ) HTTP API. Best with a PUBLIC
// dataset (no token). If your dataset is private, front these reads with a
// build/prerender step rather than shipping a token to the browser.
//
// Env: VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET (default 'production'),
//      VITE_SANITY_API_VERSION (default '2024-01-01').
// Schema assumed: document type `post` with fields
//   title, slug{current}, description, coverImage (url string), tags[],
//   author, publishedAt, updatedAt, body (markdown string).

import { readingMinutes, normalizeTags } from './types';

const PROJECT = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const API = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

async function groq(query, params = {}) {
  if (!PROJECT) return [];
  const url = new URL(`https://${PROJECT}.apicdn.sanity.io/v${API}/data/query/${DATASET}`);
  url.searchParams.set('query', query);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Sanity ${res.status}`);
  const { result } = await res.json();
  return result || [];
}

function toPost(d) {
  const body = d.body || '';
  return {
    slug: d.slug?.current || d.slug || d._id,
    title: d.title || 'Untitled',
    description: d.description || '',
    coverImage: d.coverImage || '',
    tags: normalizeTags(d.tags),
    author: d.author || 'PikFinder',
    publishedAt: d.publishedAt || '',
    updatedAt: d.updatedAt || d.publishedAt || d._updatedAt || '',
    readingMinutes: readingMinutes(body),
    body,
  };
}

const FIELDS = `{ _id, _updatedAt, title, "slug": slug.current, description, "coverImage": coverImage, tags, author, publishedAt, updatedAt, body }`;

export async function getAllPosts() {
  const rows = await groq(`*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) ${FIELDS}`);
  return rows.map(toPost);
}

export async function getPost(slug) {
  const rows = await groq(`*[_type == "post" && slug.current == $slug][0...1] ${FIELDS}`, { slug });
  return rows[0] ? toPost(rows[0]) : null;
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
