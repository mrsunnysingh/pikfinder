// src/lib/blog/source.local.js
// Local Markdown source. Reads every file in src/content/blog/*.md at build
// time (Vite glob), parses YAML-ish frontmatter, and exposes the same four
// functions every adapter implements. Ships first; CMS adapters are drop-in.

import { readingMinutes, normalizeTags, byNewest } from './types';

// Eagerly import all posts as raw strings. Vite inlines these at build time.
// Root-absolute path is the most reliable form for import.meta.glob.
const files = import.meta.glob('/src/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Minimal, dependency-free frontmatter parser (--- key: value --- + body).
function parse(raw, filePath) {
  const slug = filePath.split('/').pop().replace(/\.md$/, '');
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { slug, title: slug, description: '', tags: [], body: raw, readingMinutes: readingMinutes(raw) };

  const [, fm, body] = match;
  const meta = {};
  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }

  return {
    slug,
    title: meta.title || slug,
    description: meta.description || '',
    coverImage: meta.coverImage || '',
    tags: normalizeTags(meta.tags),
    author: meta.author || 'PikFinder',
    publishedAt: meta.publishedAt || '',
    updatedAt: meta.updatedAt || meta.publishedAt || '',
    readingMinutes: readingMinutes(body),
    body: body.trim(),
  };
}

const POSTS = Object.entries(files)
  .map(([path, raw]) => parse(raw, path))
  .sort(byNewest);

// Async to match the CMS adapters (they fetch at runtime). The interface is
// uniform, so pages/SEO don't change when you swap sources.
export async function getAllPosts() {
  return POSTS;
}

export async function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export async function getPostsByTag(tag) {
  const t = String(tag).toLowerCase();
  return POSTS.filter((p) => p.tags.some((x) => x.toLowerCase() === t));
}

export async function getTags() {
  const counts = {};
  for (const p of POSTS) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
