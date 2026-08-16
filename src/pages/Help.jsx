import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlass, CaretDown, EnvelopeSimple, Rocket, PaintBrush, FilePdf, Buildings,
  Wrench, UserCircle, Sparkle, Code, X, ArrowRight,
} from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';
import { HELP_CATEGORIES, HELP_ARTICLES } from '../data/helpCenter';

const ICONS = { Rocket, MagnifyingGlass, PaintBrush, FilePdf, Buildings, Wrench, UserCircle, Sparkle, Code };

function Block({ b }) {
  if (b.t === 'p') return <p>{b.c}</p>;
  if (b.t === 'note') return <p className="help-note"><Sparkle size={14} weight="fill" /> {b.c}</p>;
  if (b.t === 'list') return <ul className="help-ul">{b.c.map((x, i) => <li key={i}>{x}</li>)}</ul>;
  if (b.t === 'steps') return <ol className="help-ol">{b.c.map((x, i) => <li key={i}>{x}</li>)}</ol>;
  if (b.t === 'code') return <pre className="help-code"><code>{b.c}</code></pre>;
  return null;
}

function Article({ a, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = HELP_CATEGORIES.find(c => c.id === a.cat);
  return (
    <div className={`help-article ${open ? 'open' : ''}`}>
      <button className="help-article-q" onClick={() => setOpen(o => !o)}>
        <span>{a.title}</span>
        <span className="help-article-meta">{cat && <em>{cat.label}</em>}<CaretDown className="help-caret" /></span>
      </button>
      {open && <div className="help-article-a">{a.blocks.map((b, i) => <Block key={i} b={b} />)}</div>}
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');

  useSeo({
    title: 'Help Center — Guides, Best Practices & API | PikFinder',
    description: 'Learn how to use PikFinder: searching free media, the Creator Studio, PDF editor, Document Generator & Zoho, free tools, best practices, and the developer API. Searchable guides.',
    canonical: `${SITE_URL}/help`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HELP_ARTICLES.slice(0, 12).map(a => ({
        '@type': 'Question', name: a.title,
        acceptedAnswer: { '@type': 'Answer', text: a.blocks.map(b => Array.isArray(b.c) ? b.c.join(' ') : b.c).join(' ') },
      })),
    },
  });

  const q = query.trim().toLowerCase();
  const results = useMemo(() => HELP_ARTICLES.filter(a => {
    if (cat !== 'all' && a.cat !== cat) return false;
    if (!q) return true;
    const hay = (a.title + ' ' + (a.tags || []).join(' ') + ' ' + a.blocks.map(b => Array.isArray(b.c) ? b.c.join(' ') : b.c).join(' ')).toLowerCase();
    return hay.includes(q);
  }), [q, cat]);

  return (
    <div className="helpc">
      <header className="helpc-hero">
        <h1>How can we help?</h1>
        <p>Guides, best practices and developer docs for everything in PikFinder.</p>
        <div className="helpc-search">
          <MagnifyingGlass size={20} />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search help articles… (e.g. export, crop, Zoho, API)" aria-label="Search help" />
          {query && <button className="helpc-search-x" onClick={() => setQuery('')} aria-label="Clear"><X size={16} /></button>}
        </div>
      </header>

      {/* Category grid (hidden while searching) */}
      {!q && cat === 'all' && (
        <div className="helpc-cats">
          {HELP_CATEGORIES.map(c => {
            const Icon = ICONS[c.icon] || Rocket;
            return (
              <button key={c.id} className="helpc-cat" onClick={() => setCat(c.id)}>
                <span className="helpc-cat-ic"><Icon size={24} weight="duotone" /></span>
                <strong>{c.label}</strong>
                <span>{c.blurb}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter chips */}
      <div className="helpc-chips">
        <button className={cat === 'all' ? 'active' : ''} onClick={() => setCat('all')}>All</button>
        {HELP_CATEGORIES.map(c => (
          <button key={c.id} className={cat === c.id ? 'active' : ''} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>

      {/* Results */}
      <div className="helpc-results">
        {results.length === 0 && (
          <div className="helpc-empty">
            <p>No articles match “{query}”.</p>
            <Link to="/contact" className="btn-primary"><EnvelopeSimple size={16} /> Ask support</Link>
          </div>
        )}
        {results.map((a, i) => <Article key={a.id} a={a} defaultOpen={!!q && i < 3} />)}
      </div>

      <div className="helpc-footer">
        <div>
          <h3>Still need a hand?</h3>
          <p>Can’t find your answer? Our team is one message away.</p>
        </div>
        <div className="helpc-footer-actions">
          <Link to="/contact" className="btn-primary"><EnvelopeSimple size={16} /> Contact support</Link>
          <Link to="/tools" className="btn-outline">Explore tools <ArrowRight size={15} /></Link>
        </div>
      </div>
    </div>
  );
}
