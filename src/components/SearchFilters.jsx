import React, { useState } from 'react';
import {
  Faders,
  X,
  CaretDown,
  SquaresFour,
  Rows,
  Sparkle,
  Image as ImageIcon,
  Check,
  Funnel,
} from '@phosphor-icons/react';

const MEDIA_TYPES = [
  { value: 'photo', label: 'All Images' },
  { value: 'video', label: 'Videos' },
  { value: 'icon', label: 'Icons & 3D' },
];

const LICENSES = [
  { value: 'all', label: 'All Licenses' },
  { value: 'commercial', label: 'Commercial Safe' },
  { value: 'cc0', label: 'CC0 Public Domain' },
  { value: 'editorial', label: 'Editorial Only' },
];

const AI_OPTIONS = [
  { value: 'all', label: 'AI & Photography' },
  { value: 'ai', label: 'AI-Generated' },
  { value: 'real', label: 'Authentic Photo' },
];

const ORIENTATIONS = [
  { value: 'all', label: 'All Orientations' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
];

const COLORS = [
  { value: 'any', label: 'All Colors', hex: null },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'white', label: 'White', hex: '#ffffff' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
];

const PEOPLE_OPTIONS = [
  { value: 'any', label: 'All People' },
  { value: 'with_people', label: 'With People' },
  { value: 'no_people', label: 'Without People' },
];

const FILE_TYPES = [
  { value: 'all', label: 'All File Types' },
  { value: 'png', label: 'PNG (Transparent)' },
  { value: 'jpg', label: 'JPG (High-Res)' },
  { value: 'svg', label: 'SVG (Vector)' },
  { value: 'webp', label: 'WebP (Optimized)' },
];

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'downloads', label: 'Most Downloaded' },
];

export default function SearchFilters({ filters, setFilters, type, setType, title = "Finder Images" }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewMode, setViewMode] = useState('masonry');

  const updateFilter = (key, val) => {
    setFilters((prev) => ({
      ...prev,
      [key]: val === 'all' || val === 'any' || val === 'relevance' ? undefined : val,
    }));
    setOpenDropdown(null);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const activeSort = SORTS.find((s) => s.value === (filters.sort || 'relevance'))?.label || 'Relevance';
  const activeMedia = MEDIA_TYPES.find((m) => m.value === type)?.label || 'All Images';
  const activeOrientation = ORIENTATIONS.find((o) => o.value === (filters.orientation || 'all'))?.label || 'Orientation';
  const activeColor = COLORS.find((c) => c.value === (filters.color || 'any'))?.label || 'Color';
  const activePeople = PEOPLE_OPTIONS.find((p) => p.value === (filters.people || 'any'))?.label || 'People';
  const activeFileType = FILE_TYPES.find((f) => f.value === (filters.fileType || 'all'))?.label || 'File type';
  const activeAi = AI_OPTIONS.find((a) => a.value === (filters.ai || 'all'))?.label || 'AI-generated';
  const activeLicense = LICENSES.find((l) => l.value === (filters.license || 'all'))?.label || 'License';

  return (
    <div className="magnific-filters-container">
      {/* Top Header Row with Title and Sorting */}
      <div className="magnific-filters-header">
        <h2 className="magnific-filters-title">{title}</h2>

        <div className="magnific-filters-right">
          {/* Sort Dropdown */}
          <div className="filter-pill-dropdown-wrap">
            <button
              type="button"
              className="filter-sort-btn"
              onClick={() => toggleDropdown('sort')}
            >
              <span>{activeSort}</span>
              <CaretDown size={13} weight="bold" />
            </button>

            {openDropdown === 'sort' && (
              <div className="filter-dropdown-menu right-aligned">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`dropdown-item ${filters.sort === s.value || (!filters.sort && s.value === 'relevance') ? 'active' : ''}`}
                    onClick={() => updateFilter('sort', s.value)}
                  >
                    <span>{s.label}</span>
                    {(filters.sort === s.value || (!filters.sort && s.value === 'relevance')) && <Check size={14} weight="bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pill-shaped Floating Filter Strip */}
      <div className="magnific-pills-row">
        {/* Media Type / All Images */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${type !== 'photo' ? 'active' : ''}`}
            onClick={() => toggleDropdown('media')}
          >
            <SquaresFour size={15} weight="duotone" />
            <span>{activeMedia}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'media' && (
            <div className="filter-dropdown-menu">
              {MEDIA_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`dropdown-item ${type === m.value ? 'active' : ''}`}
                  onClick={() => { setType(m.value); setOpenDropdown(null); }}
                >
                  <span>{m.label}</span>
                  {type === m.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* License Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.license ? 'active' : ''}`}
            onClick={() => toggleDropdown('license')}
          >
            <span>{activeLicense}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'license' && (
            <div className="filter-dropdown-menu">
              {LICENSES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  className={`dropdown-item ${filters.license === l.value ? 'active' : ''}`}
                  onClick={() => updateFilter('license', l.value)}
                >
                  <span>{l.label}</span>
                  {filters.license === l.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI-Generated Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.ai ? 'active' : ''}`}
            onClick={() => toggleDropdown('ai')}
          >
            <Sparkle size={14} weight="duotone" />
            <span>{activeAi}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'ai' && (
            <div className="filter-dropdown-menu">
              {AI_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={`dropdown-item ${filters.ai === a.value ? 'active' : ''}`}
                  onClick={() => updateFilter('ai', a.value)}
                >
                  <span>{a.label}</span>
                  {filters.ai === a.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orientation Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.orientation ? 'active' : ''}`}
            onClick={() => toggleDropdown('orientation')}
          >
            <span>{activeOrientation}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'orientation' && (
            <div className="filter-dropdown-menu">
              {ORIENTATIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`dropdown-item ${filters.orientation === o.value ? 'active' : ''}`}
                  onClick={() => updateFilter('orientation', o.value)}
                >
                  <span>{o.label}</span>
                  {filters.orientation === o.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.color ? 'active' : ''}`}
            onClick={() => toggleDropdown('color')}
          >
            <span>{activeColor}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'color' && (
            <div className="filter-dropdown-menu color-dropdown">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`dropdown-item color-item ${filters.color === c.value ? 'active' : ''}`}
                  onClick={() => updateFilter('color', c.value)}
                >
                  {c.hex && <span className="color-dot" style={{ backgroundColor: c.hex }} />}
                  <span>{c.label}</span>
                  {filters.color === c.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* People Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.people ? 'active' : ''}`}
            onClick={() => toggleDropdown('people')}
          >
            <span>{activePeople}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'people' && (
            <div className="filter-dropdown-menu">
              {PEOPLE_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`dropdown-item ${filters.people === p.value ? 'active' : ''}`}
                  onClick={() => updateFilter('people', p.value)}
                >
                  <span>{p.label}</span>
                  {filters.people === p.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File Type Pill */}
        <div className="filter-pill-dropdown-wrap">
          <button
            type="button"
            className={`magnific-filter-pill ${filters.fileType ? 'active' : ''}`}
            onClick={() => toggleDropdown('fileType')}
          >
            <span>{activeFileType}</span>
            <CaretDown size={11} weight="bold" />
          </button>
          {openDropdown === 'fileType' && (
            <div className="filter-dropdown-menu">
              {FILE_TYPES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`dropdown-item ${filters.fileType === f.value ? 'active' : ''}`}
                  onClick={() => updateFilter('fileType', f.value)}
                >
                  <span>{f.label}</span>
                  {filters.fileType === f.value && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Toggle Icon Button */}
        <div className="filter-layout-toggle">
          <button
            type="button"
            className={`layout-toggle-btn ${viewMode === 'masonry' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'masonry' ? 'grid' : 'masonry')}
            title="Toggle Grid / Masonry"
          >
            <SquaresFour size={18} weight={viewMode === 'masonry' ? 'fill' : 'bold'} />
          </button>
        </div>
      </div>
    </div>
  );
}
