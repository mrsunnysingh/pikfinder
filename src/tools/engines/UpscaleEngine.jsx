import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob, loadImageFromFile } from '../ToolShell';
import { scaleImageHQ, canvasToBlob, baseName } from './canvas-utils';

const MAX_OUTPUT = 8192;

export default function UpscaleEngine() {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [factor, setFactor] = useState(2);
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
    } catch (e) {
      setError(e.message);
    }
  };

  const apply = async (fx) => {
    if (!img) return;
    setFactor(fx);
    setBusy(true);
    setError(null);
    try {
      const targetW = img.naturalWidth * fx;
      const targetH = img.naturalHeight * fx;
      if (Math.max(targetW, targetH) > MAX_OUTPUT) {
        throw new Error(`Output would exceed ${MAX_OUTPUT}px. Try a smaller factor or image.`);
      }
      const canvas = scaleImageHQ(img, targetW, targetH);
      const blob = await canvasToBlob(canvas, 'image/png');
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height });
    } catch (e) {
      setError(e.message || 'Upscaling failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} label="Drop a small image here, or click to browse" hint="Best for images under 2000px" />
      )}

      {file && img && (
        <>
          <div className="tool-preset-row">
            {[2, 3, 4].map((fx) => (
              <button
                key={fx}
                className={factor === fx && result ? 'btn-primary' : 'btn-secondary'}
                onClick={() => apply(fx)}
                disabled={busy}
              >
                {fx}x — {img.naturalWidth * fx}x{img.naturalHeight * fx}px
              </button>
            ))}
            <button className="btn-ghost" onClick={() => { setFile(null); setImg(null); setResult(null); }}>
              Choose a different image
            </button>
          </div>

          {busy && <div className="loader"><div className="spinner"></div><p>Upscaling...</p></div>}
          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Upscaled result" />
                <p>{result.w} x {result.h} px — {formatBytes(result.blob.size)}</p>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-${factor}x.png`)}
                downloadLabel="Download PNG"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
