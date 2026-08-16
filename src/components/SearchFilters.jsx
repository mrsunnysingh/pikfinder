import React, { useState } from 'react';
import { Faders, X } from '@phosphor-icons/react';

const ORIENTATIONS = ['all', 'landscape', 'portrait', 'square'];
const COLORS = ['any', 'black', 'white', 'blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink'];
const SORTS = ['relevance', 'newest'];
const PROVIDERS = ['all', 'unsplash', 'pexels', 'pixabay', 'openverse', 'wikimedia'];
const STYLES = ['any', 'Modern', 'Minimal', 'Corporate', 'Luxury', 'Creative'];
const USAGES = ['any', 'Hero Section', 'Blog Banner', 'LinkedIn Post', 'Instagram Post', 'Website Background', 'Mobile App', 'Presentation'];

export default function SearchFilters({ filters, setFilters, type, setType }) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val === 'all' || val === 'any' || val === 'relevance' ? undefined : val }));
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== 'all' && v !== 'any' && v !== 'relevance').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      <div className="search-filters-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '50px', padding: '4px', flexWrap: 'nowrap' }}>
          <button
            type="button"
            onClick={() => setType('photo')}
            style={{ padding: '6px 16px', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: type === 'photo' ? 'var(--primary)' : 'transparent', color: type === 'photo' ? '#fff' : 'var(--text-muted)' }}>
            Photos
          </button>
          <button
            type="button"
            onClick={() => setType('video')}
            style={{ padding: '6px 16px', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: type === 'video' ? 'var(--primary)' : 'transparent', color: type === 'video' ? '#fff' : 'var(--text-muted)' }}>
            Videos
          </button>
          <button
            type="button"
            onClick={() => setType('icon')}
            style={{ padding: '6px 16px', borderRadius: '40px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: type === 'icon' ? 'var(--primary)' : 'transparent', color: type === 'icon' ? '#fff' : 'var(--text-muted)' }}>
            Icons
          </button>
        </div>

        <button className="btn-outline" onClick={() => setShowFilters(!showFilters)}
          style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderRadius: '50px' }}>
          <Faders size={16} /> Filters {activeFiltersCount > 0 && <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeFiltersCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="search-filters-panel"
          style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', margin: 0 }}>Advanced Filters</h4>
            <button onClick={() => setShowFilters(false)} style={{ color: 'var(--text-muted)' }}><X size={16}/></button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            <FilterSelect label="Orientation" value={filters.orientation || 'all'} onChange={(v) => updateFilter('orientation', v)}>
              {ORIENTATIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </FilterSelect>

            <FilterSelect label="Color" value={filters.color || 'any'} onChange={(v) => updateFilter('color', v)}>
              {COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </FilterSelect>

            <FilterSelect label="Sort By" value={filters.sort || 'relevance'} onChange={(v) => updateFilter('sort', v)}>
              {SORTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </FilterSelect>

            <FilterSelect label="Provider" value={filters.sources || 'all'} onChange={(v) => updateFilter('sources', v)}>
              {PROVIDERS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </FilterSelect>

            <FilterSelect label="Style" value={filters.style || 'any'} onChange={(v) => updateFilter('style', v)}>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>

            <FilterSelect label="Usage" value={filters.usage || 'any'} onChange={(v) => updateFilter('usage', v)}>
              {USAGES.map(u => <option key={u} value={u}>{u}</option>)}
            </FilterSelect>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      <select className="sf-select" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px' }}>
        {children}
      </select>
    </div>
  );
}
