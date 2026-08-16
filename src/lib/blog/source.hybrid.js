// src/lib/blog/source.hybrid.js
// Best of both: keeps the bundled Markdown posts (src/content/blog/*.md) AND
// shows posts written in the admin CMS (Firestore `blogPosts`). Nothing you
// already published is lost. If a CMS post and a Markdown post share a slug, the
// CMS version wins (so you can override an old post from the dashboard).
//
// Select it with VITE_BLOG_SOURCE=hybrid.

import * as local from './source.local';
import * as firebase from './source.firebase';
import { byNewest } from './types';

async function merged() {
  const [l, f] = await Promise.all([
    Promise.resolve(local.getAllPosts()).catch(() => []),
    Promise.resolve(firebase.getAllPosts()).catch(() => []),
  ]);
  const bySlug = new Map();
  for (const p of l) bySlug.set(p.slug, p);   // bundled first…
  for (const p of f) bySlug.set(p.slug, p);   // …CMS overrides on slug clash
  return Array.from(bySlug.values()).sort(byNewest);
}

export async function getAllPosts() {
  return merged();
}

export async function getPost(slug) {
  return (await merged()).find((p) => p.slug === slug) || null;
}

export async function getPostsByTag(tag) {
  const t = String(tag).toLowerCase();
  return (await merged()).filter((p) => p.tags.some((x) => x.toLowerCase() === t));
}

export async function getTags() {
  const all = await merged();
  const counts = {};
  for (const p of all) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
