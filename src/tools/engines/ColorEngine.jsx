import React, { useState, useRef } from 'react';
import { Dropzone, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob } from './canvas-utils';

const toHex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** Simple frequency-based palette extraction with color bucketing. */
function extractPalette(canvas, count = 8) {
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue;
    const r = data[i] & 0xf0, g = data[i + 1] & 0xf0, b = data[i + 2] & 0xf0;
    const key = (r << 16) | (g << 8) | b;
    const entry = buckets.get(key);
    if (entry) { entry.n++; entry.r += data[i]; entry.g += data[i + 1]; entry.b += data[i + 2]; }
    else buckets.set(key, { n: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((e) => toHex(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)));
}

function PaletteMode() {
  const [colors, setColors] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copied, setCopied] = useState(null);

  const onFiles = async ([f]) => {
    const { img, url } = await loadImageFromFile(f);
    setPreviewUrl(url);
    const canvas = drawToCanvas(img, Math.min(400, img.naturalWidth), Math.min(400, img.naturalHeight) * (img.naturalHeight / img.naturalWidth) || 400);
    setColors(extractPalette(canvas));
  };

  const copy = async (hex) => {
    try { await navigator.clipboard.writeText(hex); setCopied(hex); setTimeout(() => setCopied(null), 1500); } catch { /* noop */ }
  };

  return (
    <>
      {!previewUrl && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" />}
      {previewUrl && (
        <>
          <div className="tool-preview"><img src={previewUrl} alt="Palette source" /></div>
          <div className="tool-swatch-row">
            {colors?.map((hex) => (
              <button key={hex} className="tool-swatch" style={{ background: hex }} onClick={() => copy(hex)} aria-label={`Copy ${hex}`}>
                <span>{copied === hex ? 'Copied!' : hex}</span>
              </button>
            ))}
          </div>
          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setPreviewUrl(null); setColors(null); }}>Choose a different image</button>
          </div>
        </>
      )}
    </>
  );
}

function PickerMode() {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState(null);
  const [picked, setPicked] = useState(null);
  const [copied, setCopied] = useState(false);

  const onFiles = async ([f]) => {
    const { img } = await loadImageFromFile(f);
    const canvas = canvasRef.current;
    const maxW = 900;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    setLoaded(true);
  };

  const read = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
    const [r, g, b] = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    return { hex: toHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})` };
  };

  return (
    <>
      {!loaded && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" />}
      <div style={{ display: loaded ? 'block' : 'none' }}>
        <p className="tool-note">Hover to inspect, click to copy the HEX value.</p>
        <canvas
          ref={canvasRef}
          className="tool-picker-canvas"
          onMouseMove={(e) => setHover(read(e))}
          onClick={async (e) => {
            const c = read(e);
            setPicked(c);
            try { await navigator.clipboard.writeText(c.hex); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
          }}
        />
        {(hover || picked) && (
          <div className="tool-picker-readout">
            {hover && <span><i style={{ background: hover.hex }} /> {hover.hex} — {hover.rgb}</span>}
            {picked && <strong>Picked: {picked.hex} {copied ? '(copied)' : ''}</strong>}
          </div>
        )}
        {loaded && (
          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setLoaded(false); setPicked(null); setHover(null); }}>Choose a different image</button>
          </div>
        )}
      </div>
    </>
  );
}

function DiffMode() {
  const [imgs, setImgs] = useState([]);
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState(null);

  const onFiles = async (files) => {
    setError(null);
    const next = [...imgs];
    for (const f of files) {
      if (next.length >= 2) break;
      const { img, url } = await loadImageFromFile(f);
      next.push({ img, url, name: f.name });
    }
    setImgs(next);
    if (next.length === 2) runDiff(next);
  };

  const runDiff = ([a, b]) => {
    const w = Math.min(a.img.naturalWidth, b.img.naturalWidth);
    const h = Math.min(a.img.naturalHeight, b.img.naturalHeight);
    const ca = drawToCanvas(a.img, w, h);
    const cb = drawToCanvas(b.img, w, h);
    const da = ca.getContext('2d').getImageData(0, 0, w, h);
    const db = cb.getContext('2d').getImageData(0, 0, w, h);
    const out = new ImageData(w, h);
    let changed = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const delta = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
      if (delta > 30) {
        changed++;
        out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 80; out.data[i + 3] = 255;
      } else {
        const gray = Math.round((da.data[i] + da.data[i + 1] + da.data[i + 2]) / 3 / 3);
        out.data[i] = gray; out.data[i + 1] = gray; out.data[i + 2] = gray; out.data[i + 3] = 255;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').putImageData(out, 0, 0);
    canvas.toBlob((blob) => {
      setDiff({ url: URL.createObjectURL(blob), blob, pct: ((changed / (w * h)) * 100).toFixed(2) });
    });
  };

  return (
    <>
      {imgs.length < 2 && (
        <Dropzone onFiles={onFiles} multiple label={imgs.length === 0 ? 'Drop the first image (or both)' : 'Drop the second image'} />
      )}
      {error && <p className="tool-error">{error}</p>}
      {imgs.length > 0 && (
        <div className="tool-compare">
          {imgs.map((m, i) => (
            <figure key={i}><img src={m.url} alt={`Image ${i + 1}`} /><figcaption>{m.name}</figcaption></figure>
          ))}
        </div>
      )}
      {diff && (
        <>
          <p className="tool-note"><strong>{diff.pct}%</strong> of pixels differ (highlighted in pink).</p>
          <div className="tool-preview"><img src={diff.url} alt="Difference map" /></div>
          <div className="tool-controls">
            <button className="btn-primary" onClick={() => saveBlob(diff.blob, 'diff.png')}>Download diff map</button>
            <button className="btn-ghost" onClick={() => { setImgs([]); setDiff(null); }}>Compare different images</button>
          </div>
        </>
      )}
    </>
  );
}

export default function ColorEngine({ mode = 'palette' }) {
  return (
    <div className="tool-engine">
      {mode === 'palette' && <PaletteMode />}
      {mode === 'picker' && <PickerMode />}
      {mode === 'diff' && <DiffMode />}
    </div>
  );
}
