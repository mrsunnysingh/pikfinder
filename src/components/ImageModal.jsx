import React, { useContext, useState, useEffect } from 'react';
import { X, Heart, Copy, Check, ArrowSquareOut, Palette } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import ColorPalette from './ColorPalette';
import FontPairing from './FontPairing';
import DownloadOptions from './DownloadOptions';
import { attributionText, commonsPageUrl } from '../lib/license';
import { searchMedia } from '../lib/mediaApi';

// Map a raw searchMedia result into the shape this modal renders.
function normalizeResult(it, fallbackLicense) {
  return {
    id: it.id,
    urls: { full: it.downloadUrl || it.preview || it.thumbnail, regular: it.preview || it.thumbnail },
    alt_description: it.title || 'Image',
    user: { name: it.author || it.source || 'Creator', profile_image: { medium: it.sourceLogo || it.thumbnail } },
    width: it.width, height: it.height,
    license: it.license ? { shortName: it.license, id: it.license, url: it.licenseUrl, requiresAttribution: !!it.attributionRequired } : fallbackLicense,
    source: it.source,
    originalUrl: it.originalUrl,
    creatorProfile: it.creatorProfile || null, // photographer profile link (UTM-tagged)
    downloadLocation: it.downloadLocation || null, // Unsplash download-event ping
  };
}

// Derive a short keyword query from the current image for "more like this".
function relatedQuery(p) {
  const base = (p?.alt_description || p?.source || 'nature')
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .split(/[\s_-]+/).filter(Boolean).slice(0, 3).join(' ');
  return base || 'nature';
}

export default function ImageModal({ photo: initialPhoto, onClose }) {
  const { isFavorite, toggleFavorite } = useContext(AppContext);
  const [current, setCurrent] = useState(initialPhoto);
  const [copied, setCopied] = useState(false);
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Sync when the parent opens a different image.
  useEffect(() => { setCurrent(initialPhoto); }, [initialPhoto]);

  // Lock background body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch "more like this" whenever the shown image changes.
  const currentId = current?.id;
  useEffect(() => {
    if (!currentId) return;
    let alive = true;
    setRelatedLoading(true);
    searchMedia(relatedQuery(current), { type: 'photo', perPage: 12 })
      .then(({ results }) => {
        if (!alive) return;
        setRelated((results || []).filter(r => String(r.id) !== String(currentId)).slice(0, 6));
      })
      .catch(() => { if (alive) setRelated([]); })
      .finally(() => { if (alive) setRelatedLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const photo = current;
  if (!photo) return null;

  const openRelated = (it) => setCurrent(normalizeResult(it, photo.license));

  const credit = attributionText(photo);
  const copyCredit = async () => {
    try {
      await navigator.clipboard.writeText(credit);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content image-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}><X /></button>
        <div className="modal-image-container">
          <img src={photo.urls.full} alt={photo.alt_description} />
        </div>
        <div className="modal-info">
          <div className="photographer">
            <img src={photo.user.profile_image.medium} alt={photo.user.name} />
            <div>
              {photo.creatorProfile
                ? <h4><a href={photo.creatorProfile} target="_blank" rel="noopener noreferrer">{photo.user.name}</a></h4>
                : <h4>{photo.user.name}</h4>}
              <span className="source-badge">{photo.source || 'Wikimedia Commons'}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className={`icon-btn-large ${isFavorite(photo.id) ? 'active' : ''}`}
              onClick={() => toggleFavorite(photo)}
              title="Add to Favorites"
            >
              <Heart weight={isFavorite(photo.id) ? 'fill' : 'regular'} />
            </button>
            <DownloadOptions photo={photo} />
            <a 
              href={`/studio?img=${encodeURIComponent(photo.urls.full)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary edit-studio-btn"
              style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', height: '52px', borderRadius: '50px' }}
            >
              <Palette weight="fill" /> Edit
            </a>
          </div>

          <div className="modal-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {photo.width && photo.height && (
              <div><strong>Resolution:</strong> {photo.width} × {photo.height} px</div>
            )}
            {photo.license && (
              <div><strong>License:</strong> {photo.license.shortName || photo.license.id}</div>
            )}
          </div>

          <div className="attribution-links" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14, fontSize: 13 }}>
            {photo.license?.url && <a href={photo.license.url} target="_blank" rel="noopener noreferrer nofollow">View License</a>}
            <a href={photo.originalUrl || commonsPageUrl(photo)} target="_blank" rel="noopener noreferrer nofollow">View Original Image</a>
          </div>

          {photo.license?.requiresAttribution ? (
            <div className="download-notice" style={{ margin: '14px 0', fontSize: 13, padding: '10px 12px', borderRadius: 10, background: 'rgba(234,179,8,0.12)', color: 'var(--text)' }}>
              <p style={{ margin: '0 0 8px' }}>This license requires attribution. Copy the credit below and include it wherever you use the image.</p>
              <button className="license-copy" onClick={copyCredit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, color: 'inherit', cursor: 'pointer' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span style={{textAlign: 'left'}}>{credit}</span>
              </button>
            </div>
          ) : (
            <p className="download-notice" style={{ margin: '14px 0', fontSize: 13, padding: '10px 12px', borderRadius: 10, background: 'rgba(234,179,8,0.12)', color: 'var(--text)' }}>
              Free to use without attribution, including commercial projects. Crediting the creator is appreciated.
            </p>
          )}

          <ColorPalette src={photo.urls.regular} />
          <FontPairing />

          {/* More like this — related media via the existing search API */}
          <div className="related-strip">
            <h5 className="related-title">More like this</h5>
            {relatedLoading ? (
              <div className="related-grid">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="related-skeleton" />)}
              </div>
            ) : related.length > 0 ? (
              <div className="related-grid">
                {related.map((it) => (
                  <button key={it.id} className="related-thumb" onClick={() => openRelated(it)} title={it.title || 'Open image'}>
                    <img src={it.thumbnail || it.preview} alt={it.title || ''} loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="related-empty">No related images found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
