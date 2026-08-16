import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, Palette } from '@phosphor-icons/react';
import { useToast } from './Toast';

// Extracts a small palette of dominant colors from an image using canvas.
function extractPalette(img, maxColors = 6) {
  const canvas = document.createElement('canvas');
  const scale = 60 / Math.max(img.naturalWidth, 1);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 125) continue; // skip transparent
    // Quantize to reduce near-duplicates (group into 32-value bins).
    const r = data[i] & 0xe0;
    const g = data[i + 1] & 0xe0;
    const b = data[i + 2] & 0xe0;
    const key = `${r},${g},${b}`;
    if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
    buckets[key].count++;
    buckets[key].r += data[i];
    buckets[key].g += data[i + 1];
    buckets[key].b += data[i + 2];
  }

  return Object.values(buckets)
    .sort((x, y) => y.count - x.count)
    .slice(0, maxColors)
    .map(({ count, r, g, b }) => ({
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    }));
}

const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const toRgb = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

export default function ColorPalette({ src }) {
  const toast = useToast();
  const [colors, setColors] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | done | error
  const [copied, setCopied] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setStatus('loading');
    setColors([]);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const palette = extractPalette(img);
        if (mountedRef.current) {
          setColors(palette);
          setStatus(palette.length ? 'done' : 'error');
        }
      } catch {
        // Canvas tainted (CORS) — cannot read pixels.
        if (mountedRef.current) setStatus('error');
      }
    };
    img.onerror = () => { if (mountedRef.current) setStatus('error'); };
    img.src = src;

    return () => { mountedRef.current = false; };
  }, [src]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast(`Copied ${text}`);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      // Clipboard blocked — ignore silently.
    }
  };

  return (
    <div className="palette-section">
      <div className="section-title">
        <Palette weight="fill" /> Color palette
      </div>

      {status === 'loading' && <p className="palette-hint">Extracting colors…</p>}
      {status === 'error' && <p className="palette-hint">Couldn't read this image's colors (blocked by the source).</p>}

      {status === 'done' && (
        <div className="palette-grid">
          {colors.map((c, i) => {
            const hex = toHex(c);
            const rgb = toRgb(c);
            return (
              <div className="palette-swatch" key={i}>
                <div className="swatch-color" style={{ background: hex }} />
                <div className="swatch-codes">
                  <button className="code-copy" onClick={() => copy(hex)} title="Copy HEX">
                    <span>{hex}</span>
                    {copied === hex ? <Check weight="bold" /> : <Copy />}
                  </button>
                  <button className="code-copy rgb" onClick={() => copy(rgb)} title="Copy RGB">
                    <span>{rgb}</span>
                    {copied === rgb ? <Check weight="bold" /> : <Copy />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
