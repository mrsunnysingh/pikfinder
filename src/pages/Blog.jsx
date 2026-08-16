import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';
import { getAllPosts } from '../lib/blog';

function formatDate(d) {
  if (!d) return '';
  // Firestore Timestamp → Date. Never return a raw object (crashes React render).
  if (typeof d === 'object') {
    if (typeof d.toDate === 'function') d = d.toDate();
    else if (typeof d.seconds === 'number') d = new Date(d.seconds * 1000);
    else return '';
  }
  const date = new Date(d);
  if (isNaN(date)) return typeof d === 'string' ? d : '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Blog() {
  const [posts, setPosts] = useState(null); // null = loading

  useEffect(() => {
    let alive = true;
    Promise.resolve(getAllPosts())
      .then((p) => { if (alive) setPosts(p || []); })
      .catch(() => { if (alive) setPosts([]); });
    return () => { alive = false; };
  }, []);

  useSeo({
    title: 'Blog — Guides for Creators | PikFinder',
    description: 'Practical guides on free stock media, image formats, licensing, and design — from the PikFinder team.',
    canonical: `${SITE_URL}/blog`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'PikFinder Blog',
      url: `${SITE_URL}/blog`,
    },
  });

  return (
    <>
      <header className="page-header">
        <span className="section-eyebrow">The PikFinder Blog</span>
        <h1>Guides for creators</h1>
        <p>Clear, practical writing on free media, formats, licensing, and design.</p>
      </header>

      {posts === null ? (
        <div className="blog-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="blog-card">
              <div className="blog-card-cover related-skeleton" style={{ aspectRatio: '16 / 9', borderRadius: 0 }} />
              <div className="blog-card-body">
                <div className="related-skeleton" style={{ height: 18, width: '80%', aspectRatio: 'auto' }} />
                <div className="related-skeleton" style={{ height: 12, width: '100%', aspectRatio: 'auto', marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="studio-empty" style={{ maxWidth: 480, margin: '0 auto' }}>
          <p>No articles published yet. Check back soon.</p>
        </div>
      ) : (
      <div className="blog-grid">
        {posts.filter(Boolean).map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
            {post.coverImage && (
              <div className="blog-card-cover">
                <img src={post.coverImage} alt="" loading="lazy" />
              </div>
            )}
            <div className="blog-card-body">
              {post.tags?.[0] && <span className="blog-card-tag">{post.tags[0]}</span>}
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <div className="blog-card-meta">
                <span>{formatDate(post.publishedAt)}</span>
                <span>·</span>
                <span>{post.readingMinutes} min read</span>
                <ArrowRight className="blog-card-arrow" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </>
  );
}
