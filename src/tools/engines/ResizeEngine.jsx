import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { scaleImageHQ, canvasToBlob, compressToTarget, baseName } from './canvas-utils';

export default function ResizeEngine({ presets = null, targetKB = null }) {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [lockRatio, setLockRatio] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFiles = async ([f]) => {
    setError(null);
    setResult(null);
    try {
      const { img: image } = await loadImageFromFile(f);
      setFile(f);
      setImg(image);
      setDims({ w: image.naturalWidth, h: image.naturalHeight });
    } catch (e) {
      setError(e.message);
    }
  };

  const setWidth = (w) => {
    if (lockRatio && img) {
      const ratio = img.naturalHeight / img.naturalWidth;
      setDims({ w, h: Math.round(w * ratio) });
    } else {
      setDims((d) => ({ ...d, w }));
    }
  };
  const setHeight = (h) => {
    if (lockRatio && img) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setDims({ w: Math.round(h * ratio), h });
    } else {
      setDims((d) => ({ ...d, h }));
    }
  };

  const apply = async (w = dims.w, h = dims.h) => {
    if (!img || !w || !h) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = scaleImageHQ(img, w, h);
      let blob;
      let outExt = 'png';
      if (targetKB) {
        const out = await compressToTarget(canvas, targetKB, 'image/jpeg');
        blob = out.blob;
        outExt = 'jpg';
      } else {
        blob = await canvasToBlob(canvas, 'image/png');
      }
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height, ext: outExt });
    } catch (e) {
      setError(e.message || 'Resize failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" hint="JPG, PNG, or WebP" />
      )}

      {file && img && (
        <>
          {presets && (
            <div className="tool-preset-row">
              {presets.map((p) => (
                <button
                  key={p.label}
                  className="btn-secondary"
                  onClick={() => { setDims({ w: p.w, h: p.h }); apply(p.w, p.h); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="tool-controls">
            <label className="tool-control">
              <span>Width (px)</span>
              <input type="number" min="1" max="10000" value={dims.w} onChange={(e) => setWidth(Number(e.target.value))} />
            </label>
            <label className="tool-control">
              <span>Height (px)</span>
              <input type="number" min="1" max="10000" value={dims.h} onChange={(e) => setHeight(Number(e.target.value))} />
            </label>
            <label className="tool-checkbox">
              <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
              <span>Lock aspect ratio</span>
            </label>
            <button className="btn-primary" onClick={() => apply()} disabled={busy}>Resize</button>
            <button className="btn-ghost" onClick={() => { setFile(null); setImg(null); setResult(null); }}>
              Choose a different image
            </button>
          </div>

          {targetKB && <p className="tool-note">Output will also be compressed to fit under <strong>{targetKB}KB</strong>.</p>}
          {busy && <div className="loader"><div className="spinner"></div><p>Resizing...</p></div>}
          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Resized result" />
                <p>{result.w} x {result.h} px — {formatBytes(result.blob.size)}</p>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-${result.w}x${result.h}.${result.ext}`)}
                downloadLabel={`Download ${result.ext.toUpperCase()}`}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
