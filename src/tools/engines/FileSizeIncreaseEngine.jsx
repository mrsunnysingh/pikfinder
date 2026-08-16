import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, compressToTarget, baseName } from './canvas-utils';

// Increase (or set) an image's file size to an exact target in KB — the opposite
// of a compressor. Many exam/government upload forms require a photo *at least*
// a minimum size (e.g. "20KB to 50KB"); a too-small photo gets rejected.
//
// How it stays valid + identical-looking: we re-encode the picture as JPEG (same
// pixels, same dimensions) and then pad the file to the exact byte target using
// JPEG COM (comment) segments — a spec-compliant marker every decoder ignores.
// The image looks exactly the same; only the file size changes.

const MAX_DIMENSION = 4096;

// Pad a JPEG byte array up to exactly `targetBytes` using FF FE (COM) segments
// inserted right after the SOI marker; a tiny remainder (<5 B) is appended after
// EOI (also ignored by decoders). Returns a Uint8Array of exactly targetBytes.
function padJpegToSize(buf, targetBytes) {
  const src = new Uint8Array(buf);
  if (src.length >= targetBytes) return src;
  // Not a JPEG we can COM-pad → append harmless trailing bytes.
  if (!(src[0] === 0xFF && src[1] === 0xD8)) {
    const out = new Uint8Array(targetBytes);
    out.set(src);
    return out;
  }
  let needed = targetBytes - src.length;
  const segs = [];
  while (needed >= 5) {
    const dataLen = Math.min(65533, needed - 4); // segment adds dataLen + 4 bytes
    const seg = new Uint8Array(dataLen + 4);
    seg[0] = 0xFF; seg[1] = 0xFE;               // COM marker
    const len = dataLen + 2;                      // length field includes itself
    seg[2] = (len >> 8) & 0xFF; seg[3] = len & 0xFF;
    segs.push(seg);                               // data left as zeros
    needed -= dataLen + 4;
  }
  const out = new Uint8Array(targetBytes);
  let o = 0;
  out[o++] = 0xFF; out[o++] = 0xD8;               // SOI
  for (const s of segs) { out.set(s, o); o += s.length; }
  out.set(src.subarray(2), o); o += src.length - 2;
  // any 1–4 byte remainder stays as the trailing zero-fill already in `out`
  return out;
}

export default function FileSizeIncreaseEngine({ targetKB = null }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null); // { blob, url, exact }
  const [target, setTarget] = useState(targetKB || 20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');

  const process = async (f, tKB) => {
    setBusy(true); setError(null); setNote('');
    try {
      const targetBytes = Math.max(1, Math.round(tKB * 1024));
      const { img, url } = await loadImageFromFile(f);
      setPreviewUrl(url);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > MAX_DIMENSION) {
        const s = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * s); h = Math.round(h * s);
      }
      const canvas = drawToCanvas(img, w, h);

      // Encode at high quality; if that's already bigger than the target, first
      // bring it under the target, then pad up to the exact size.
      const hq = await canvasToBlob(canvas, 'image/jpeg', 0.95);
      let base = hq;
      if (hq.size > targetBytes) {
        try { base = (await compressToTarget(canvas, tKB, 'image/jpeg')).blob; } catch { base = hq; }
      }

      let blob, exact = true;
      if (base.size < targetBytes) {
        const bytes = padJpegToSize(await base.arrayBuffer(), targetBytes);
        blob = new Blob([bytes], { type: 'image/jpeg' });
      } else {
        blob = base; exact = false;
        setNote(`This image can't be made this small without heavy quality loss — it's ${formatBytes(base.size)}. To reduce it, use the image compressor instead.`);
      }

      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob), exact, width: w, height: h });
    } catch (e) {
      setError(e.message || 'Something went wrong processing this image.');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = ([f]) => { setFile(f); setResult(null); process(f, target); };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone
          onFiles={onFiles}
          accept="image/jpeg,image/png,image/webp"
          label="Drop your image here, or click to browse"
          hint="JPG, PNG, or WebP — processed on your device"
        />
      )}

      {file && (
        <>
          <div className="tool-controls">
            <label className="tool-control">
              <span>Target file size (KB)</span>
              <div className="tool-inline-input">
                <input
                  type="number" min="1" max="10000" placeholder="e.g. 20"
                  value={target || ''}
                  onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : null)}
                />
                <button className="btn-secondary" onClick={() => target && process(file, target)} disabled={busy}>
                  Apply
                </button>
              </div>
            </label>
            <p className="tool-note">Sets your photo to about <strong>{target}KB</strong> without changing how it looks or its dimensions — ideal for forms that require a <em>minimum</em> size.</p>
            <button className="btn-ghost" onClick={() => { setFile(null); setResult(null); setPreviewUrl(null); setNote(''); }}>
              Choose a different image
            </button>
          </div>

          {busy && <div className="loader"><div className="spinner"></div><p>Resizing file…</p></div>}
          {error && <p className="tool-error">{error}</p>}
          {note && <p className="tool-note" style={{ color: 'var(--warning, #d97706)' }}>{note}</p>}

          {result && !busy && (
            <>
              <div className="tool-compare">
                <figure>
                  <img src={previewUrl} alt="Original" />
                  <figcaption>Original — {formatBytes(file.size)}</figcaption>
                </figure>
                <figure>
                  <img src={result.url} alt="Result" />
                  <figcaption>{result.exact ? 'Resized' : 'Closest'} — {formatBytes(result.blob.size)} ({result.width}×{result.height})</figcaption>
                </figure>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-${Math.round(result.blob.size / 1024)}kb.jpg`)}
                downloadLabel="Download JPG"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
