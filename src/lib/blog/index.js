// src/lib/blog/index.js
// Source-agnostic entry point. The UI imports ONLY from here and never learns
// where posts come from. Switch sources with VITE_BLOG_SOURCE
// (local | firebase | sanity | contentful | strapi). See BLOG_ARCHITECTURE.md.
//
// The local Markdown source is imported statically (it's the safe default and
// has bundled content). CMS adapters are loaded ON DEMAND so a misconfigured or
// failing adapter can never break the default blog or the app at import time —
// and their code isn't bundled unless that source is actually selected.

import * as local from './source.local';

const SOURCE = (import.meta.env.VITE_BLOG_SOURCE || 'local').toLowerCase();

const LOADERS = {
  // 'hybrid' keeps bundled Markdown posts AND adds CMS (Firestore) posts.
  hybrid: () => import('./source.hybrid'),
  firebase: () => import('./source.firebase'),
  sanity: () => import('./source.sanity'),
  contentful: () => import('./source.contentful'),
  strapi: () => import('./source.strapi'),
};

let adapterPromise;
function getAdapter() {
  if (SOURCE === 'local' || !LOADERS[SOURCE]) return Promise.resolve(local);
  if (!adapterPromise) {
    adapterPromise = LOADERS[SOURCE]().catch((err) => {
      console.error(`[blog] "${SOURCE}" source failed to load — falling back to local.`, err);
      return local;
    });
  }
  return adapterPromise;
}

export async function getAllPosts() {
  return (await getAdapter()).getAllPosts();
}
export async function getPost(slug) {
  return (await getAdapter()).getPost(slug);
}
export async function getPostsByTag(tag) {
  return (await getAdapter()).getPostsByTag(tag);
}
export async function getTags() {
  return (await getAdapter()).getTags();
}

/** JSON-LD for a blog post (BlogPosting), mirrors buildToolJsonLd in useSeo. */
export function buildArticleJsonLd(post, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage || undefined,
    author: { '@type': 'Organization', name: post.author || 'PikFinder' },
    publisher: { '@type': 'Organization', name: 'PikFinder' },
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    mainEntityOfPage: url,
  };
}
