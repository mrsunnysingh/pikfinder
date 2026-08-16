import React, { useState } from 'react';
import { SlidersHorizontal, X } from '@phosphor-icons/react';

// Filter definitions. Color/Style/Usage augment the search query;
// Orientation is applied client-side by image aspect ratio.
export const ORIENTATIONS = ['Landscape', 'Portrait', 'Square'];
export const COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#e5e7eb' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Purple', hex: '#8b5cf6' },
];
export const STYLES = ['Modern', 'Minimal', 'Corporate', 'Luxury', 'Creative'];
export const USAGES = ['Hero Section', 'Blog Banner', 'LinkedIn Post', 'Instagram Post', 'Website Background', 'Mobile App', 'Presentation'];

export default function FilterBar({ filters, setFilters }) {
  const [open, setOpen] = useState(false);

  const set = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const clearAll = () => setFilters({ orientation: '', color: '', style: '', usage: '' });
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="filter-bar">
      <div className="filter-bar-top">
        <button className={`filter-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
          <SlidersHorizontal weight="bold" />
          Filters
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </button>

        {/* Active filter chips (always visible) */}
        <div className="active-chips">
          {Object.entries(filters).filter(([, v]) => v).map(([key, val]) => (
            <button key={key} className="active-chip" onClick={() => set(key, val)}>
              {val} <X weight="bold" />
            </button>
          ))}
          {activeCount > 0 && (
            <button className="clear-all" onClick={clearAll}>Clear all</button>
          )}
        </div>
      </div>

      {open && (
        <div className="filter-panel">
          <div className="filter-group">
            <span className="filter-label">Orientation</span>
            <div className="filter-options">
              {ORIENTATIONS.map(o => (
                <button key={o} className={`filter-pill ${filters.orientation === o ? 'active' : ''}`} onClick={() => set('orientation', o)}>{o}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Color</span>
            <div className="filter-options">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  className={`color-swatch-btn ${filters.color === c.name ? 'active' : ''}`}
                  onClick={() => set('color', c.name)}
                  title={c.name}
                >
                  <span className="swatch-dot" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Style</span>
            <div className="filter-options">
              {STYLES.map(s => (
                <button key={s} className={`filter-pill ${filters.style === s ? 'active' : ''}`} onClick={() => set('style', s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Usage</span>
            <div className="filter-options">
              {USAGES.map(u => (
                <button key={u} className={`filter-pill ${filters.usage === u ? 'active' : ''}`} onClick={() => set('usage', u)}>{u}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Maps a "usage" selection to extra search keywords for better results.
export const USAGE_KEYWORDS = {
  'Hero Section': 'wide banner',
  'Blog Banner': 'banner',
  'LinkedIn Post': 'professional',
  'Instagram Post': 'square',
  'Website Background': 'background texture',
  'Mobile App': 'mobile screen',
  'Presentation': 'presentation slide',
};
