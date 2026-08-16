// src/lib/blog/source.contentful.js
// Contentful-backed blog via the Content Delivery API. The CDA token is
// read-only; still, prefer using it at build/prerender time. For client use it
// is exposed in the bundle (acceptable for read-only, per BLOG_ARCHITECTURE.md).
//
// Env: VITE_CONTENTFUL_SPACE_ID, VITE_CONTENTFUL_DELIVERY_TOKEN,
//      VITE_CONTENTFUL_ENVIRONMENT (default 'master').
// Content type `blogPost` with fields:
//   title, slug, description, coverImage (Asset), tags[], author,
//   publishedAt, updatedAt, body (Long text / markdown).

import { readingMinutes, normalizeTags } from './types';

const SPACE = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
const TOKEN = import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN;
const ENV = import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || 'master';

async function cda(params) {
  if (!SPACE || !TOKEN) return { items: [], includes: {} };
  const url = new URL(`https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}/entries`);
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('content_type', 'blogPost');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Contentful ${res.status}`);
  return res.json();
}

// Resolve a linked asset URL from the response `includes.Asset` table.
function assetUrl(link, includes) {
  const id = link?.sys?.id;
  const asset = (includes?.Asset || []).find((a) => a.sys.id === id);
  const file = asset?.fields?.file?.url;
  return file ? (file.startsWith('//') ? `https:${file}` : file) : '';
}

function toPost(entry, includes) {
  const f = entry.fields || {};
  const body = f.body || '';
  return {
    slug: f.slug || entry.sys.id,
    title: f.title || 'Untitled',
    description: f.description || '',
    coverImage: typeof f.coverImage === 'string' ? f.coverImage : assetUrl(f.coverImage, includes),
    tags: normalizeTags(f.tags),
    author: f.author || 'PikFinder',
    publishedAt: f.publishedAt || entry.sys.createdAt || '',
    updatedAt: f.updatedAt || entry.sys.updatedAt || '',
    readingMinutes: readingMinutes(body),
    body,
  };
}

export async function getAllPosts() {
  const data = await cda({ order: '-fields.publishedAt', limit: '100' });
  return (data.items || []).map((e) => toPost(e, data.includes));
}

export async function getPost(slug) {
  const data = await cda({ 'fields.slug': slug, limit: '1' });
  const e = (data.items || [])[0];
  return e ? toPost(e, data.includes) : null;
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
