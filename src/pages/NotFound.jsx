import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlass, ArrowRight } from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';

// Friendly, on-brand 404. Helps people recover (search + key links) instead of
// a silent redirect, which is better for UX and for search engines.
export default function NotFound() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useSeo({
    title: 'Page not found (404) — PikFinder',
    description: 'That page doesn’t exist or has moved. Search millions of free photos and videos, or jump back into PikFinder.',
    canonical: `${SITE_URL}/404`,
  });

  const go = (e) => {
    e.preventDefault();
    const t = q.trim();
    navigate(t ? `/search?q=${encodeURIComponent(t)}` : '/');
  };

  return (
    <section className="notfound">
      <div className="nf-glow" aria-hidden="true" />
      <div className="nf-code">404</div>
      <h1>This page took a wrong turn</h1>
      <p>The link may be broken, or the page may have moved. Let’s get you back to creating.</p>

      <form className="nf-search" onSubmit={go}>
        <MagnifyingGlass size={18} className="nf-search-ic" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search free photos, videos, templates…"
          aria-label="Search PikFinder"
          autoFocus
        />
        <button type="submit" className="nf-search-btn"><ArrowRight weight="bold" size={16} /></button>
      </form>

      <div className="nf-actions">
        <Link to="/" className="btn-primary">Go to homepage</Link>
        <Link to="/templates" className="btn-outline">Browse templates</Link>
        <Link to="/studio" className="btn-outline">Open Studio</Link>
      </div>

      <div className="nf-suggest">
        <span>Popular:</span>
        <Link to="/search?q=nature">Nature</Link>
        <Link to="/backgrounds">Backgrounds</Link>
        <Link to="/tools">Free tools</Link>
        <Link to="/blog">Blog</Link>
      </div>
    </section>
  );
}
