import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { Heart, DownloadSimple, ArrowSquareOut, X, Palette } from '@phosphor-icons/react';
import { searchMedia } from '../lib/mediaApi';
import { trackDownload } from '../lib/analytics';
import { AppContext } from '../context/AppContext';
import { useToast } from './Toast';

// Provider labels for the source-filter chips.
const SOURCE_LABELS = ['Unsplash', 'Pexels', 'Pixabay', 'Openverse'];

const USAGE_KEYWORDS = {
  'Hero Section': 'wide banner',
  'Blog Banner': 'banner',
  'LinkedIn Post': 'professional',
  'Instagram Post': 'square',
  'Website Background': 'background texture',
  'Mobile App': 'mobile screen',
  'Presentation': 'presentation slide',
};

// Map a normalized API item to the legacy shape used by favorites/collections,
// so those existing surfaces keep rendering through ImageCard unchanged.
function toLegacy(item) {
  return {
    id: item.id,
    urls: { regular: item.preview || item.thumbnail, full: item.downloadUrl || item.preview || item.thumbnail },
    alt_description: item.title,
    width: item.width, height: item.height,
    user: { name: item.creator, username: item.creator, profile_image: { medium: item.sourceLogo } },
    license: item.license,
    // keep the full normalized record too, for future migration
    _normalized: item,
  };
}

export default function Gallery({ initialQuery = 'mountains', type: propType, filters = {} }) {
  const { toggleFavorite, isFavorite, logDownload } = useContext(AppContext);
  const toast = useToast();

  const [localType] = useState('photo'); // 'photo' | 'video'
  const type = propType || localType;
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);            // { message, code }
  const [activeSources, setActiveSources] = useState(new Set()); // empty = all
  const [selected, setSelected] = useState(null);

  const fetchPage = useCallback(async (baseQuery, mediaType, pageNum, filterOpts) => {
    setIsFetching(true);
    setError(null);
    try {
      let query = baseQuery;
      if (filterOpts.usage && filterOpts.usage !== 'any' && USAGE_KEYWORDS[filterOpts.usage]) {
        query += ` ${USAGE_KEYWORDS[filterOpts.usage]}`;
      }
      if (filterOpts.style && filterOpts.style !== 'any') {
        query += ` ${filterOpts.style}`;
      }
      let { results } = await searchMedia(query, { type: mediaType, page: pageNum, perPage: 24, ...filterOpts });

      // Auto-broaden: a long, specific phrase (e.g. an AI-expanded "Man plane
      // waving") often returns nothing from stock providers. On the first page,
      // progressively drop trailing words until we get results, so the user
      // always sees relevant images instead of an empty state.
      if (pageNum === 1 && results.length === 0) {
        const words = baseQuery.trim().split(/\s+/);
        for (let n = words.length - 1; n >= 1 && results.length === 0; n--) {
          const broader = words.slice(0, n).join(' ');
          try {
            const retry = await searchMedia(broader, { type: mediaType, page: 1, perPage: 24, ...filterOpts });
            if (retry.results.length) { results = retry.results; break; }
          } catch { /* keep trying broader terms */ }
        }
      }

      setItems((prev) => (pageNum === 1 ? results : [...prev, ...results]));
      setHasMore(results.length > 0);
    } catch (err) {
      setHasMore(false);
      if (pageNum === 1) setItems([]);
      setError({ message: err.message, code: err.code });
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Refetch on query, media-type or filters change.
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setActiveSources(new Set());
    fetchPage(initialQuery, type, 1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, type, JSON.stringify(filters)]);

  // Load subsequent pages.
  useEffect(() => {
    if (page > 1) fetchPage(initialQuery, type, page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Client-side source filtering (dedupe already happened server-side).
  const displayed = useMemo(() => {
    if (activeSources.size === 0) return items;
    return items.filter((i) => activeSources.has(i.source));
  }, [items, activeSources]);

  const sourcesPresent = useMemo(() => {
    const set = new Set(items.map((i) => i.source));
    return SOURCE_LABELS.filter((s) => set.has(s));
  }, [items]);

  const toggleSource = (src) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      next.has(src) ? next.delete(src) : next.add(src);
      return next;
    });
  };

  // Infinite scroll (auto-load a few pages, then require a click).
  const AUTO_LOAD_LIMIT = 4;
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || page >= AUTO_LOAD_LIMIT) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) setPage((p) => p + 1);
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching, page]);

  const download = async (item, e) => {
    e?.stopPropagation();
    const url = item.downloadUrl || item.preview;
    if (!url) return;
    try {
      logDownload?.(toLegacy(item));
      trackDownload(item.source, item.type);
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = item.type === 'video' ? 'mp4' : item.type === 'icon' ? 'svg' : 'jpg';
      a.href = objUrl;
      a.download = `pikfinder-${(item.title || 'media').replace(/[^a-z0-9]+/gi, '_').slice(0, 50).toLowerCase()}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objUrl);
      toast('Download started');
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <main className="gallery-container">
      <div className="gallery-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <h2 id="galleryTitle" style={{ fontSize: '1.5rem', fontWeight: '700' }}>{initialQuery ? `Results for “${initialQuery}”` : 'Discover'}</h2>
      </div>

      {/* Source filters */}
      {sourcesPresent.length > 1 && (
        <div className="source-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', marginBottom: '24px' }}>
          {sourcesPresent.map((src) => (
            <button key={src} onClick={() => toggleSource(src)}
              aria-pressed={activeSources.has(src)}
              style={{
                padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 500,
                border: activeSources.has(src) ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: activeSources.has(src) ? 'rgba(139,92,246,0.1)' : 'var(--bg-color)',
                color: activeSources.has(src) ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}>
              {src}
            </button>
          ))}
          {activeSources.size > 0 && (
            <button onClick={() => setActiveSources(new Set())}
              style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Empty / error states */}
      {!isFetching && displayed.length === 0 && (
        <div style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)', padding: '60px 20px' }}>
          {error?.code === 'no_providers'
            ? `No ${type} providers are configured yet. Add provider API keys in your Vercel environment to enable ${type} search. (Openverse photos work without a key.)`
            : error
              ? `Couldn't reach the search service. If you're running locally, use "vercel dev" so the /api routes are available.`
              : `No ${type} results for “${initialQuery}”. Try a broader term.`}
        </div>
      )}

      {/* Grid */}
      <div className="image-grid">
        {displayed.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            favorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(toLegacy(item))}
            onDownload={(e) => download(item, e)}
            onOpen={() => setSelected(item)}
          />
        ))}
      </div>

      {isFetching && (
        <div className="loader"><div className="spinner"></div><p>Searching providers…</p></div>
      )}

      {!isFetching && hasMore && items.length > 0 && (
        <div className="load-more-container" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <button className="btn-outline" onClick={() => setPage((p) => p + 1)}>Load more</button>
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} onDownload={(e) => download(selected, e)} onSelect={setSelected} />}
    </main>
  );
}

// A single result card: media + attribution (creator, source badge, license).
function MediaCard({ item, favorite, onToggleFavorite, onDownload, onOpen }) {
  return (
    <div className="image-card" onClick={onOpen} style={{ cursor: 'zoom-in' }}>
      <div className={`image-card-media${item.type === 'icon' ? ' is-icon' : ''}`} style={{ position: 'relative' }}>
        {item.type === 'video' ? (
          <video
            src={item.preview} poster={item.thumbnail || undefined}
            muted loop playsInline preload="metadata"
            onMouseOver={(e) => e.currentTarget.play().catch(() => {})}
            onMouseOut={(e) => e.currentTarget.pause()}
            style={{ width: '100%', display: 'block', borderRadius: 'inherit' }}
          />
        ) : (
          <img src={item.thumbnail || item.preview} alt={item.title} loading="lazy" style={{ width: '100%', display: 'block' }} />
        )}

        {/* Source badge */}
        <span className="source-badge" style={badgeStyle}>
          {item.sourceLogo && <img src={item.sourceLogo} alt="" width={14} height={14} style={{ borderRadius: 3 }} />}
          {item.source}
        </span>

        {/* Hover actions */}
        <div className="image-card-actions" style={actionsStyle}>
          <button title={favorite ? 'Remove favorite' : 'Save'} onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} style={iconBtn}>
            <Heart size={18} weight={favorite ? 'fill' : 'regular'} color={favorite ? '#ef4444' : 'currentColor'} />
          </button>
          <button title="Download" onClick={onDownload} style={iconBtn}><DownloadSimple size={18} /></button>
          {item.originalUrl && (
            <a title="Open at source" href={item.originalUrl} target="_blank" rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()} style={iconBtn}><ArrowSquareOut size={18} /></a>
          )}
        </div>
      </div>

      {/* Attribution row */}
      <div className="image-card-meta" style={{ padding: '10px 12px', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {item.creatorProfile ? (
            <a href={item.creatorProfile} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.creator}
            </a>
          ) : (
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.creator}</span>
          )}
        </div>
        <a href={item.licenseUrl || '#'} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => e.stopPropagation()}
          style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>
          {item.license}{item.attributionRequired ? ' · attribution required' : ''}
        </a>
      </div>
    </div>
  );
}

// Short keyword query for "related" media from the item's title/tags.
function relatedQueryFor(item) {
  const src = (item?.title || (item?.tags && item.tags[0]) || item?.source || 'nature');
  const q = String(src).split(/[\s_,-]+/).filter(Boolean).slice(0, 3).join(' ');
  return q || 'nature';
}

function MediaModal({ item, onClose, onDownload, onSelect }) {
  const { isFavorite, toggleFavorite } = useContext(AppContext);
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Fetch related media of the SAME type (image → images, video → videos).
  useEffect(() => {
    if (!item?.id) return;
    if (item.type === 'icon') { setRelated([]); return; } // icons have no "related" strip
    let alive = true;
    setRelatedLoading(true);
    searchMedia(relatedQueryFor(item), { type: item.type === 'video' ? 'video' : 'photo', perPage: 12 })
      .then(({ results }) => { if (alive) setRelated((results || []).filter(r => String(r.id) !== String(item.id)).slice(0, 8)); })
      .catch(() => { if (alive) setRelated([]); })
      .finally(() => { if (alive) setRelatedLoading(false); });
    return () => { alive = false; };
  }, [item?.id, item?.type]);

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}><X /></button>
        <div className={`modal-image-container${item.type === 'icon' ? ' is-icon' : ''}`}>
        {item.type === 'video'
          ? <video src={item.preview} poster={item.thumbnail || undefined} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <img src={item.preview || item.thumbnail} alt={item.title} />}
        </div>
        <div className="modal-info" style={{ padding: '24px', flex: '0 0 340px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div className="photographer" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              {item.sourceLogo && <img src={item.sourceLogo} alt={item.creator} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.creatorProfile
                    ? <a href={item.creatorProfile} target="_blank" rel="noopener noreferrer nofollow" style={{color: 'inherit', textDecoration: 'none'}}>{item.creator}</a>
                    : item.creator}
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.source}</span>
              </div>
            </div>

            <button
              onClick={() => toggleFavorite(toLegacy(item))}
              title="Add to Favorites"
              aria-label="Add to Favorites"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', flexShrink: 0, borderRadius: '50%', background: isFavorite(item.id) ? 'rgba(244,63,94,0.12)' : 'var(--bg-color)', border: '1px solid var(--border)', color: isFavorite(item.id) ? 'var(--favorited)' : 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Heart size={22} weight={isFavorite(item.id) ? 'fill' : 'regular'} />
            </button>
          </div>

          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{item.title || 'Untitled Image'}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button className="btn-primary" onClick={onDownload} style={{ width: '100%', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <DownloadSimple size={18} /> Download Free
            </button>
            {item.type !== 'video' && (
              <a href={`/studio?img=${encodeURIComponent(item.preview || item.thumbnail)}`}
                 target="_blank" rel="noopener noreferrer" className="btn-outline"
                 style={{ width: '100%', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Palette weight="regular" size={18} /> Edit in Studio
              </a>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Resolution:</span> <strong>{item.width && item.height ? `${item.width} × ${item.height}` : 'Original'}</strong>
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>License:</span> <strong>{item.license || 'Free'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Source:</span> 
              <div style={{ display: 'flex', gap: '8px' }}>
                {item.licenseUrl && <a href={item.licenseUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>License</a>}
                {item.originalUrl && <a href={item.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Original</a>}
              </div>
            </div>
          </div>

          {/* Related media (same type) */}
          <div className="related-strip">
            <h5 className="related-title">Related {item.type === 'video' ? 'videos' : 'images'}</h5>
            {relatedLoading ? (
              <div className="related-grid">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="related-skeleton" />)}
              </div>
            ) : related.length > 0 ? (
              <div className="related-grid">
                {related.map((r) => (
                  <button key={r.id} className="related-thumb" onClick={() => onSelect?.(r)} title={r.title || 'Open'}>
                    <img src={r.thumbnail || r.preview} alt={r.title || ''} loading="lazy" />
                    {r.type === 'video' && <span className="related-play">▶</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="related-empty">No related {item.type === 'video' ? 'videos' : 'images'} found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const badgeStyle = { position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 20 };
const actionsStyle = { position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 };
const iconBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer' };
