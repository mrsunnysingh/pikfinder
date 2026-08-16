// src/lib/blog/source.firebase.js
// Firestore-backed blog. Reuses the app's existing Firebase — no new service.
// Collection `blogPosts`, one doc per post (doc id OR a `slug` field is the slug).
// Reads are public for published posts (see firestore.rules); writes are admin.
//
// Doc fields: title, description, coverImage, tags[], author, publishedAt,
// updatedAt, body (markdown), published (bool).

import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { readingMinutes, normalizeTags, byNewest } from './types';

// Firestore Timestamp / Date → ISO string. Prevents a raw {seconds,nanoseconds}
// object from ever reaching the UI (which would crash React on render).
function toStr(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
  if (v instanceof Date) return v.toISOString();
  return '';
}

function toPost(id, d) {
  const body = d.body || '';
  return {
    slug: d.slug || id,
    title: d.title || id,
    description: d.description || '',
    coverImage: d.coverImage || '',
    tags: normalizeTags(d.tags),
    author: d.author || 'PikFinder',
    publishedAt: toStr(d.publishedAt),
    updatedAt: toStr(d.updatedAt) || toStr(d.publishedAt),
    readingMinutes: readingMinutes(body),
    body,
  };
}

async function fetchPublished() {
  if (!db) return [];
  // Ordering is best-effort; if the composite index is missing we fall back to
  // an unordered read and sort client-side.
  try {
    const q = query(collection(db, 'blogPosts'), where('published', '==', true), orderBy('publishedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => toPost(doc.id, doc.data()));
  } catch {
    const snap = await getDocs(query(collection(db, 'blogPosts'), where('published', '==', true), limit(100)));
    return snap.docs.map((doc) => toPost(doc.id, doc.data())).sort(byNewest);
  }
}

export async function getAllPosts() {
  return fetchPublished();
}

export async function getPost(slug) {
  const all = await fetchPublished();
  return all.find((p) => p.slug === slug) || null;
}

export async function getPostsByTag(tag) {
  const t = String(tag).toLowerCase();
  const all = await fetchPublished();
  return all.filter((p) => p.tags.some((x) => x.toLowerCase() === t));
}

export async function getTags() {
  const all = await fetchPublished();
  const counts = {};
  for (const p of all) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
