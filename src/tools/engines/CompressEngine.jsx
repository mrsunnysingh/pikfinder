import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, compressToTarget, baseName } from './canvas-utils';

const MAX_DIMENSION = 4096;

export default function CompressEngine({ targetKB = null }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null); // { blob, url, width, height }
  const [quality, setQuality] = useState(0.8);
  const [target, setTarget] = useState(targetKB);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const process = async (f, q, tKB) => {
    setBusy(true);
    setError(null);
    try {
      const { img, url } = await loadImageFromFile(f);
      setPreviewUrl(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (Math.max(w, h) > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = drawToCanvas(img, w, h);

      let out;
      if (tKB) {
        out = await compressToTarget(canvas, tKB, 'image/jpeg');
      } else {
        const blob = await canvasToBlob(canvas, 'image/jpeg', q);
        out = { blob, width: w, height: h };
      }
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ ...out, url: URL.createObjectURL(out.blob) });
    } catch (e) {
      setError(e.message || 'Something went wrong compressing this image.');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = ([f]) => {
    setFile(f);
    setResult(null);
    process(f, quality, target);
  };

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
            {!targetKB && (
              <label className="tool-control">
                <span>Quality: {Math.round(quality * 100)}%</span>
                <input
                  type="range" min="10" max="95" value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(Number(e.target.value) / 100)}
                  onMouseUp={() => process(file, quality, target)}
                  onTouchEnd={() => process(file, quality, target)}
                />
              </label>
            )}
            {!targetKB && (
              <label className="tool-control">
                <span>Or target size (KB)</span>
                <div className="tool-inline-input">
                  <input
                    type="number" min="5" max="5000" placeholder="e.g. 100"
                    value={target || ''}
                    onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : null)}
                  />
                  <button className="btn-secondary" onClick={() => process(file, quality, target)} disabled={busy}>
                    Apply
                  </button>
                </div>
              </label>
            )}
            {targetKB && (
              <p className="tool-note">Automatically compressing to fit under <strong>{targetKB}KB</strong>.</p>
            )}
            <button className="btn-ghost" onClick={() => { setFile(null); setResult(null); setPreviewUrl(null); }}>
              Choose a different image
            </button>
          </div>

          {busy && <div className="loader"><div className="spinner"></div><p>Compressing...</p></div>}
          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <>
              <div className="tool-compare">
                <figure>
                  <img src={previewUrl} alt="Original" />
                  <figcaption>Original — {formatBytes(file.size)}</figcaption>
                </figure>
                <figure>
                  <img src={result.url} alt="Compressed result" />
                  <figcaption>Compressed — {formatBytes(result.blob.size)} ({result.width}x{result.height})</figcaption>
                </figure>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-compressed.jpg`)}
                downloadLabel="Download JPG"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
