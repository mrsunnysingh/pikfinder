import React, { useState, useContext } from 'react';
import { DownloadSimple, CaretDown, Sparkle } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { attributionText } from '../lib/license';

// Load an image with CORS enabled so we can draw it to a canvas.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw (optionally resized) to a canvas and export as the requested type/quality.
async function renderToBlob(src, { type, quality, maxWidth }) {
  const img = await loadImage(src);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (maxWidth && w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); } // JPG has no alpha
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), type, quality)
  );
}

// Unsplash API guideline: register a download event when the user actually
// downloads. Fire-and-forget, server-side ping (Client-ID stays secret).
// No-op for any non-Unsplash image or one without a download_location.
function pingUnsplashDownload(photo) {
  const loc = photo?.downloadLocation;
  if (!loc || photo?.source !== 'Unsplash') return;
  try {
    fetch('/api/unsplash-download', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc }), keepalive: true,
    }).catch(() => {});
  } catch { /* never block the download */ }
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

const OPTIONS = [
  { key: 'optimize', label: 'Optimize for Website', hint: 'Resized + WebP, smallest size', type: 'image/webp', quality: 0.8, maxWidth: 1600, ext: 'webp', star: true },
  { key: 'original', label: 'Original', hint: 'Full-resolution source file', ext: 'jpg' },
  { key: 'webp', label: 'WebP', hint: 'Modern format, great quality', type: 'image/webp', quality: 0.9, ext: 'webp' },
  { key: 'jpg', label: 'Compressed JPG', hint: 'Universal, smaller size', type: 'image/jpeg', quality: 0.7, ext: 'jpg' },
  { key: 'png', label: 'PNG', hint: 'Lossless, supports transparency', type: 'image/png', ext: 'png' },
];

export default function DownloadOptions({ photo }) {
  const { logDownload } = useContext(AppContext);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [showCredit, setShowCredit] = useState(false);

  const baseName = `pikfinder-${(photo.alt_description || 'image').replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40)}`;

  const downloadOriginal = async () => {
    const url = photo.urls.full;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error();
      saveBlob(await res.blob(), `${baseName}.jpg`);
    } catch {
      window.open(url, '_blank'); // fallback: open for manual save
    }
  };

  const handle = async (opt) => {
    setBusy(opt.key);
    setError(null);
    logDownload?.(photo);
    pingUnsplashDownload(photo); // required Unsplash download-event registration
    try {
      if (opt.key === 'original') {
        await downloadOriginal();
      } else {
        const blob = await renderToBlob(photo.urls.full, opt);
        saveBlob(blob, `${baseName}.${opt.ext}`);
      }
      setOpen(false);
      toast('Downloaded successfully');
      if (photo.license?.requiresAttribution) setShowCredit(true);
    } catch {
      // Canvas blocked by CORS or conversion failed → fall back to original.
      setError('Conversion unavailable for this image — downloading original instead.');
      await downloadOriginal();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="download-options">
      <div className="download-split">
        <button className="btn-primary download-main" onClick={() => handle(OPTIONS[0])} disabled={!!busy}>
          {busy ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }} /> : <><Sparkle weight="fill" /> Optimize &amp; Download</>}
        </button>
        <button className="btn-primary download-caret" onClick={() => setOpen(o => !o)} disabled={!!busy} title="More formats">
          <CaretDown weight="bold" />
        </button>
      </div>

      {open && (
        <div className="download-menu">
          {OPTIONS.map(opt => (
            <button key={opt.key} className={`download-item ${opt.star ? 'recommended' : ''}`} onClick={() => handle(opt)} disabled={!!busy}>
              <span className="download-item-icon">{opt.star ? <Sparkle weight="fill" /> : <DownloadSimple />}</span>
              <span className="download-item-text">
                <span className="download-item-label">{opt.label}{opt.star && <em> · recommended</em>}</span>
                <span className="download-item-hint">{opt.hint}</span>
              </span>
              {busy === opt.key && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: 0 }} />}
            </button>
          ))}
        </div>
      )}

      {error && <p className="download-error">{error}</p>}

      {showCredit && (
        <div className="download-credit">
          <p>This image&apos;s license requires attribution:</p>
          <button
            className="license-copy"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(attributionText(photo));
                toast('Credit copied to clipboard');
              } catch { /* clipboard unavailable */ }
            }}
          >
            <span>{attributionText(photo)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
