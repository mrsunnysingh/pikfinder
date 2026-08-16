import React, { useEffect, useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, TrendUp, MagicWand } from '@phosphor-icons/react';
import Gallery from '../components/Gallery';
import { AppContext } from '../context/AppContext';
import { optimizeQuery } from '../lib/mediaApi';
import { trackSearch } from '../lib/analytics';
import { useToast } from '../components/Toast';

import SearchFilters from '../components/SearchFilters';
import ProviderStatus from '../components/ProviderStatus';

const TRENDING = ['Minimal', 'Nature', 'Neon', 'Architecture', 'Ocean', 'Space', 'Vintage', 'Gradient'];
const CATEGORIES = [
  { label: 'Nature', q: 'nature landscape', emoji: '🌿', color: '#10b981' },
  { label: 'Technology', q: 'technology computer', emoji: '💻', color: '#3b82f6' },
  { label: 'Business', q: 'business office', emoji: '💼', color: '#a855f7' },
  { label: 'Travel', q: 'travel landscape', emoji: '✈️', color: '#0ea5e9' },
  { label: 'Food', q: 'food cuisine', emoji: '🍽️', color: '#f59e0b' },
  { label: 'Abstract', q: 'abstract pattern', emoji: '🎨', color: '#ec4899' },
  { label: 'Animals', q: 'animals wildlife', emoji: '🦊', color: '#ef4444' },
  { label: 'Architecture', q: 'architecture building', emoji: '🏛️', color: '#06b6d4' },
];

export default function DashboardSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const initialFilters = {
    orientation: searchParams.get('orientation') || undefined,
    color: searchParams.get('color') || undefined,
    sort: searchParams.get('sort') || undefined,
    sources: searchParams.get('sources') || undefined,
  };
  const type = searchParams.get('type') || 'photo';

  const setType = (newType) => {
    if (query) setSearchParams({ ...Object.fromEntries(searchParams.entries()), type: newType });
  };
  const setFilters = (updater) => {
    if (!query) return;
    const nextFilters = typeof updater === 'function' ? updater(initialFilters) : updater;
    const newParams = { ...Object.fromEntries(searchParams.entries()), ...nextFilters };
    Object.keys(newParams).forEach(k => { if (newParams[k] === undefined) delete newParams[k]; });
    setSearchParams(newParams);
  };
  const filters = initialFilters;

  const { logSearch } = useContext(AppContext);
  const toast = useToast();

  const [isAiMode, setIsAiMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    if (query) { logSearch(query); trackSearch(query); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const submit = async (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value.trim();
    if (!q) return;

    const newParams = { q, type, ...filters };

    if (!isAiMode) {
      setAiResult(null);
      setSearchParams(newParams);
      return;
    }

    // AI mode: optimize the prompt into keywords + detected facets, then search.
    setIsGenerating(true);
    setAiResult(null);
    try {
      const result = await optimizeQuery(q);
      setAiResult(result);
      // Apply the AI-detected orientation for a more precise result set.
      const aiFilters = { ...filters };
      const o = String(result.orientation || 'any').toLowerCase();
      if (['landscape', 'portrait', 'square'].includes(o)) aiFilters.orientation = o.charAt(0).toUpperCase() + o.slice(1);
      setSearchParams({ q: result.primary_query || q, type, ...aiFilters });
      if (result._source === 'local') toast('AI unavailable — used the smart keyword optimizer', 'info');
    } catch (err) {
      // /api not reachable (e.g. plain vite dev) — fall back to a direct search.
      console.error(err);
      toast('AI search unavailable — running a direct search', 'info');
      setSearchParams({ ...newParams, q });
    } finally {
      setIsGenerating(false);
    }
  };

  const run = (q) => setSearchParams({ q, type, ...filters });

  return (
    <div className="dashboard-search-page">
      <form className="dashboard-search" onSubmit={submit} style={{ maxWidth: '700px', marginBottom: '20px' }} key={query}>
        <MagnifyingGlass />
        <input name="q" type="text" defaultValue={query}
          placeholder={isAiMode ? 'Describe what you need in plain words…' : 'Search millions of free photos & videos…'} autoFocus />
        <button type="button" title="AI Magic Search"
          className={`btn-outline ${isAiMode ? 'active' : ''}`}
          onClick={() => setIsAiMode((v) => !v)}
          style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: isAiMode ? '2px solid var(--accent)' : '1px solid transparent',
            background: isAiMode ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent' }}>
          <MagicWand size={20} weight={isAiMode ? 'fill' : 'regular'} color={isAiMode ? 'var(--accent)' : 'currentColor'} />
        </button>
        <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }} disabled={isGenerating}>
          {isGenerating ? 'Thinking…' : 'Search'}
        </button>
      </form>

      {aiResult && (
        <div className="ai-search-insights" style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 12 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MagicWand size={16} weight="fill" color="var(--accent)" />
            {aiResult._source === 'local' ? 'Smart keyword optimizer' : 'AI search insights'}
          </h4>

          {/* Optimized keyword suggestions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(aiResult.search_queries || []).map((sq) => (
              <button key={sq} className="history-chip" onClick={() => run(sq)}>{sq}</button>
            ))}
            {(aiResult.synonyms || []).map((syn) => (
              <button key={syn} className="history-chip" style={{ opacity: 0.8 }} onClick={() => run(syn)}>{syn}</button>
            ))}
          </div>

          {/* Detected facets */}
          {(aiResult.colors?.length || aiResult.orientation || aiResult.subjects?.length) ? (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {aiResult.orientation && aiResult.orientation !== 'any' && <span>Orientation: <strong>{aiResult.orientation}</strong></span>}
              {aiResult.colors?.length > 0 && <span>Colors: <strong>{aiResult.colors.slice(0, 4).join(', ')}</strong></span>}
              {aiResult.subjects?.length > 0 && <span>Subjects: <strong>{aiResult.subjects.slice(0, 4).join(', ')}</strong></span>}
            </div>
          ) : null}
        </div>
      )}

      {query ? (
        <>
          <SearchFilters filters={filters} setFilters={setFilters} type={type} setType={setType} />
          <Gallery initialQuery={query} type={type} filters={filters} />
        </>
      ) : (
        <div className="search-explore">
          <div className="explore-block">
            <div className="explore-head"><TrendUp weight="fill" /> Trending searches</div>
            <div className="search-suggestions">
              {TRENDING.map((t) => (
                <button key={t} className="history-chip" onClick={() => run(t.toLowerCase())}>{t}</button>
              ))}
            </div>
          </div>

          <div className="explore-block">
            <div className="explore-head">Browse by category</div>
            <div className="explore-grid">
              {CATEGORIES.map((c) => (
                <button key={c.label} className="explore-tile" onClick={() => run(c.q)} style={{ '--tile': c.color }}>
                  <span className="explore-emoji" style={{ background: `${c.color}1a` }}>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: '40px' }}>
            <ProviderStatus />
          </div>
        </div>
      )}
    </div>
  );
}
