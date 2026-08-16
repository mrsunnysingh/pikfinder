import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import GetStarted from '../components/GetStarted';
import {
  MagnifyingGlass, Heart, FolderSimple, DownloadSimple, ClockCounterClockwise,
  ArrowRight, PaintBrush, FolderPlus, UploadSimple, Wrench, Sparkle, TrendUp,
  Leaf, Briefcase, Cpu, UsersThree, Palette, PawPrint, Buildings, ForkKnife,
  AirplaneTilt, Barbell, Stack, GraduationCap,
} from '@phosphor-icons/react';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const POPULAR = ['Business', 'Nature', 'Background', 'Technology', 'People'];

const CATEGORIES = [
  { label: 'Nature', count: '1.2M+', icon: Leaf, q: 'nature landscape' },
  { label: 'Business', count: '856K+', icon: Briefcase, q: 'business office' },
  { label: 'Technology', count: '623K+', icon: Cpu, q: 'technology' },
  { label: 'People', count: '934K+', icon: UsersThree, q: 'people portrait' },
  { label: 'Abstract', count: '512K+', icon: Palette, q: 'abstract' },
  { label: 'Animals', count: '342K+', icon: PawPrint, q: 'animals wildlife' },
  { label: 'Architecture', count: '421K+', icon: Buildings, q: 'architecture' },
  { label: 'Food', count: '289K+', icon: ForkKnife, q: 'food' },
  { label: 'Travel', count: '678K+', icon: AirplaneTilt, q: 'travel' },
  { label: 'Sports', count: '267K+', icon: Barbell, q: 'sports fitness' },
  { label: 'Textures', count: '381K+', icon: Stack, q: 'texture pattern' },
  { label: 'Education', count: '195K+', icon: GraduationCap, q: 'education' },
];

// Curated fallback when the user has little/no search history yet.
const TRENDING_DEFAULT = [
  { label: 'Summer beach', note: 'Popular', q: 'summer beach' },
  { label: 'Abstract gradient', note: 'Popular', q: 'abstract gradient' },
  { label: 'Business meeting', note: 'Popular', q: 'business meeting' },
  { label: 'Minimal background', note: 'Popular', q: 'minimal background' },
  { label: 'Work from home', note: 'Popular', q: 'work from home' },
];

export default function DashboardHome() {
  const { user, favorites, searchHistory, downloadHistory } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [term, setTerm] = useState('');

  const firstName = useMemo(() => (user?.name || 'there').split(' ')[0], [user]);

  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const goSearch = (q) => {
    const query = (q ?? term).trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const quickActions = [
    { label: 'Start searching', sub: 'Find the perfect asset', icon: MagnifyingGlass, onClick: () => navigate('/search') },
    { label: 'Open Studio', sub: 'Create something new', icon: PaintBrush, onClick: () => navigate('/studio') },
    { label: 'Create collection', sub: 'Organize your assets', icon: FolderPlus, onClick: () => navigate('/collections?create=1') },
    { label: 'Upload files', sub: 'Add your own assets', icon: UploadSimple, onClick: () => navigate('/studio') },
  ];

  const stats = [
    { label: 'Saved images', value: favorites.length, icon: Heart, color: '#f43f5e', onClick: () => navigate('/favorites') },
    { label: 'Collections', value: 24, icon: FolderSimple, color: '#8b5cf6', onClick: () => navigate('/collections') },
    { label: 'Downloads', value: downloadHistory.length, icon: DownloadSimple, color: '#3b82f6', onClick: () => navigate('/dashboard#downloads') },
    { label: 'Searches', value: searchHistory.length, icon: ClockCounterClockwise, color: '#10b981', onClick: () => navigate('/dashboard#ai-search-history') },
    { label: 'Tools used', value: 12, icon: Wrench, color: '#f59e0b', onClick: () => navigate('/tools') },
  ];

  const recentAssets = favorites.slice(-5).reverse();

  // Trending is dynamic: built from the user's real recent searches, with a
  // curated fallback so the panel is never empty.
  const trending = useMemo(() => {
    const seen = new Set();
    const fromHistory = [];
    for (const q of searchHistory) {
      const key = (q || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      fromHistory.push({ label: q.trim(), note: 'Recent search', q: q.trim() });
      if (fromHistory.length >= 5) break;
    }
    if (fromHistory.length >= 3) return fromHistory;
    const extra = TRENDING_DEFAULT.filter((d) => !seen.has(d.q.toLowerCase()));
    return [...fromHistory, ...extra].slice(0, 5);
  }, [searchHistory]);

  return (
    <div className="dash-grid">
      <div className="dash-main">
        {/* Welcome hero */}
        <section className="dash-welcome">
          <div className="dash-welcome-copy">
            <h1>{greeting()}, {firstName} <span className="wave">👋</span></h1>
            <p>What will you design today?</p>
            <form className="dash-welcome-search" onSubmit={(e) => { e.preventDefault(); goSearch(); }}>
              <MagnifyingGlass />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search for photos, videos, vectors, illustrations…" />
              <button type="submit" className="btn-primary">Search</button>
            </form>
            <div className="dash-popular">
              <span>Popular:</span>
              {POPULAR.map((p) => (
                <button key={p} className="dash-pop-tag" onClick={() => goSearch(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="dash-welcome-glow" aria-hidden="true" />
        </section>

        <GetStarted />

        {/* Quick actions */}
        <section className="dash-section">
          <h2 className="dash-h2">Quick actions</h2>
          <div className="dash-quick-grid">
            {quickActions.map(({ label, sub, icon: Icon, onClick }) => (
              <button key={label} className="dash-quick-card" onClick={onClick}>
                <span className="dash-quick-icon"><Icon weight="bold" /></span>
                <span className="dash-quick-text">
                  <strong>{label}</strong>
                  <span>{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="dash-stats">
          {stats.map(({ label, value, icon: Icon, color, onClick }) => (
            <button key={label} className="dash-stat" onClick={onClick}>
              <span className="dash-stat-icon" style={{ color, background: `${color}1f` }}><Icon weight="fill" /></span>
              <span className="dash-stat-value">{value}</span>
              <span className="dash-stat-label">{label}</span>
            </button>
          ))}
        </section>

        {/* Recent assets */}
        <section className="dash-section" id="downloads">
          <div className="dash-section-head">
            <h2 className="dash-h2">Recent assets</h2>
            <button className="dash-viewall" onClick={() => navigate('/favorites')}>View all</button>
          </div>
          {recentAssets.length > 0 ? (
            <div className="dash-assets">
              {recentAssets.map((p) => (
                <button key={p.id} className="dash-asset" onClick={() => navigate('/favorites')}>
                  <img src={p.urls?.regular || p.urls?.full} alt={p.alt_description || 'Saved asset'} loading="lazy" />
                  <span className="dash-asset-title">{p.alt_description || 'Saved asset'}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Heart size={28} />
              <p>Assets you save will appear here.</p>
              <button className="btn-primary" onClick={() => navigate('/search')}>Start exploring</button>
            </div>
          )}
        </section>

        {/* Browse categories */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-h2">Browse categories</h2>
            <button className="dash-viewall" onClick={() => navigate('/collections')}>View all</button>
          </div>
          <div className="dash-cat-grid">
            {CATEGORIES.map(({ label, count, icon: Icon, q }) => (
              <button key={label} className="dash-cat" onClick={() => goSearch(q)}>
                <span className="dash-cat-icon"><Icon weight="duotone" /></span>
                <span className="dash-cat-text">
                  <strong>{label}</strong>
                  <span>{count} assets</span>
                </span>
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* Right rail */}
      <aside className="dash-rail">
        <div className="rail-card protip">
          <div className="protip-head"><Sparkle weight="fill" /> Pro tip</div>
          <p>Use AI Search to find exactly what you need.</p>
          <button className="btn-primary" onClick={() => navigate('/search')}>Try AI Search</button>
        </div>

        <div className="rail-card">
          <div className="rail-head">
            <h3><TrendUp weight="bold" /> Trending now</h3>
            <button className="dash-viewall" onClick={() => navigate('/search?q=trending')}>View all</button>
          </div>
          <ul className="trend-list">
            {trending.map((t, i) => (
              <li key={t.label}>
                <button className="trend-item" onClick={() => goSearch(t.q)}>
                  <span className={`trend-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                  <span className="trend-text">
                    <strong>{t.label}</strong>
                    <span>{t.note}</span>
                  </span>
                  <ArrowRight className="trend-arrow" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
