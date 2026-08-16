import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass } from '@phosphor-icons/react';
import Gallery from '../components/Gallery';
import SearchFilters from '../components/SearchFilters';
import AdBanner from '../components/AdBanner';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';

// Public search results page. Reached when a visitor searches from the homepage
// hero (navigates to /search?q=…). Reuses the existing Gallery + SearchFilters.
export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [term, setTerm] = useState(q);
  const [filters, setFilters] = useState({});
  const [type, setType] = useState(params.get('type') === 'video' ? 'video' : 'photo');

  useEffect(() => { setTerm(q); }, [q]);

  useSeo({
    title: q ? `${q} — Search | PikFinder` : 'Search Free Images & Videos | PikFinder',
    description: 'Search millions of free, copyright-safe images and videos across Unsplash, Pexels, Pixabay, and Openverse — with clear licensing.',
    canonical: `${SITE_URL}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  });

  const submit = (e) => {
    e.preventDefault();
    const next = term.trim();
    if (!next) return;
    setParams({ q: next, type });
  };

  return (
    <div className="search-page">
      <div className="search-page-bar">
        <form className="search-input-wrapper search-page-input" onSubmit={submit}>
          <MagnifyingGlass className="search-icon" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search free images & videos…"
            aria-label="Search"
            autoComplete="off"
          />
          <button type="submit" className="search-submit-btn" aria-label="Search">
            <MagnifyingGlass weight="bold" />
          </button>
        </form>
      </div>

      <div className="search-page-body">
        <div className="search-page-head">
          <h1>{q ? <>Results for <span className="text-gradient">“{q}”</span></> : 'Search free media'}</h1>
        </div>

        <SearchFilters filters={filters} setFilters={setFilters} type={type} setType={setType} />

        {q ? (
          <Gallery initialQuery={q} type={type} filters={filters} />
        ) : (
          <div className="studio-empty" style={{ maxWidth: 460, margin: '40px auto' }}>
            <MagnifyingGlass size={28} />
            <p>Start typing above to search millions of free images and videos.</p>
          </div>
        )}

        <AdBanner slot="" />
      </div>
    </div>
  );
}
