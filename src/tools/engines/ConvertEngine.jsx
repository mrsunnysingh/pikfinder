import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, baseName } from './canvas-utils';

const OUTPUTS = [
  { id: 'jpg', label: 'JPG', mime: 'image/jpeg' },
  { id: 'png', label: 'PNG', mime: 'image/png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp' },
  { id: 'avif', label: 'AVIF', mime: 'image/avif' },
];

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/svg+xml,.heic,.heif,.svg,.avif';

/** Decode any supported input file into an ImageBitmap/HTMLImageElement + canvas. */
async function decodeToCanvas(file) {
  const name = file.name.toLowerCase();
  const type = file.type || '';

  // HEIC/HEIF: browsers can't decode natively — use heic-to (MIT)
  if (type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif')) {
    const { heicTo } = await import('heic-to');
    const pngBlob = await heicTo({ blob: file, type: 'image/png' });
    const { img } = await loadImageFromFile(new File([pngBlob], file.name, { type: 'image/png' }));
    return drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  }

  // AVIF: decode with wasm if browser lacks native support
  if (type.includes('avif') || name.endsWith('.avif')) {
    try {
      const { img } = await loadImageFromFile(file); // try native decode first
      return drawToCanvas(img, img.naturalWidth, img.naturalHeight);
    } catch {
      const { decode } = await import('@jsquash/avif');
      const imageData = await decode(await file.arrayBuffer());
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      canvas.getContext('2d').putImageData(imageData, 0, 0);
      return canvas;
    }
  }

  // SVG: rasterize at 2x natural size (min 1024) for crisp output
  if (type.includes('svg') || name.endsWith('.svg')) {
    const { img } = await loadImageFromFile(file);
    let w = img.naturalWidth || 512;
    let h = img.naturalHeight || 512;
    const scale = Math.max(1, 1024 / Math.max(w, h));
    return drawToCanvas(img, w * scale, h * scale);
  }

  const { img } = await loadImageFromFile(file);
  return drawToCanvas(img, img.naturalWidth, img.naturalHeight);
}

/** Encode a canvas to the requested output format. */
async function encodeCanvas(canvas, outId, quality = 0.9) {
  const out = OUTPUTS.find((o) => o.id === outId);

  if (outId === 'avif') {
    // Prefer native encoder; fall back to wasm
    try {
      const blob = await canvasToBlob(canvas, 'image/avif', quality);
      if (blob.type === 'image/avif') return blob;
    } catch { /* fall through to wasm */ }
    const { encode } = await import('@jsquash/avif');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const buf = await encode(imageData, { quality: Math.round(quality * 63) });
    return new Blob([buf], { type: 'image/avif' });
  }

  if (outId === 'jpg') {
    // Flatten transparency onto white
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const ctx = flat.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    return canvasToBlob(flat, out.mime, quality);
  }

  return canvasToBlob(canvas, out.mime, quality);
}

export default function ConvertEngine({ from = 'any', to = 'any' }) {
  const fixedOutput = to !== 'any';
  const [file, setFile] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [output, setOutput] = useState(fixedOutput ? to : 'png');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const convert = async (cnv, outId) => {
    setBusy(true);
    setError(null);
    try {
      const blob = await encodeCanvas(cnv, outId);
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob), ext: outId });
    } catch (e) {
      setError(e.message || 'Conversion failed. This format may not be supported by your browser.');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = async ([f]) => {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const cnv = await decodeToCanvas(f);
      setFile(f);
      setCanvas(cnv);
      await convert(cnv, output);
    } catch (e) {
      setError(e.message || 'Could not read this file.');
      setBusy(false);
    }
  };

  const acceptHint = from === 'any'
    ? 'JPG, PNG, WebP, AVIF, HEIC, or SVG'
    : `${from.toUpperCase()} files`;

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} accept={ACCEPT} label={`Drop your ${from === 'any' ? 'image' : from.toUpperCase()} here, or click to browse`} hint={acceptHint} />
      )}

      {file && (
        <>
          {!fixedOutput && (
            <div className="tool-preset-row">
              {OUTPUTS.map((o) => (
                <button
                  key={o.id}
                  className={output === o.id ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => { setOutput(o.id); if (canvas) convert(canvas, o.id); }}
                  disabled={busy}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setFile(null); setCanvas(null); setResult(null); }}>
              Choose a different file
            </button>
          </div>

          {busy && <div className="loader"><div className="spinner"></div><p>Converting...</p></div>}
          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Converted result" />
                <p>{result.ext.toUpperCase()} — {formatBytes(result.blob.size)}</p>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}.${result.ext}`)}
                downloadLabel={`Download ${result.ext.toUpperCase()}`}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
