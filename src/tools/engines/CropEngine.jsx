import React, { useRef, useState, useCallback } from 'react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { canvasToBlob, baseName } from './canvas-utils';

const RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:4', value: 3 / 4 },
];

export default function CropEngine() {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ratio, setRatio] = useState(null);
  const [sel, setSel] = useState(null); // selection in display px {x,y,w,h}
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  const onFiles = async ([f]) => {
    setError(null);
    setResult(null);
    setSel(null);
    try {
      const { img: image, url } = await loadImageFromFile(f);
      setFile(f);
      setImg(image);
      setPreviewUrl(url);
    } catch (e) {
      setError(e.message);
    }
  };

  const clientPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return {
      x: Math.min(Math.max(p.clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(p.clientY - rect.top, 0), rect.height),
    };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const start = clientPos(e);
    dragRef.current = start;
    setSel({ x: start.x, y: start.y, w: 0, h: 0 });
  };

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const cur = clientPos(e);
    const start = dragRef.current;
    let w = cur.x - start.x;
    let h = cur.y - start.y;
    if (ratio) {
      // Constrain to aspect ratio, keep drag direction
      const signW = w < 0 ? -1 : 1;
      const signH = h < 0 ? -1 : 1;
      const absW = Math.abs(w);
      h = signH * (absW / ratio);
      w = signW * absW;
    }
    setSel({
      x: w < 0 ? start.x + w : start.x,
      y: h < 0 ? start.y + h : start.y,
      w: Math.abs(w),
      h: Math.abs(h),
    });
  }, [ratio]);

  const onPointerUp = () => { dragRef.current = null; };

  const applyCrop = async () => {
    if (!sel || sel.w < 4 || sel.h < 4 || !img) return;
    setError(null);
    const displayed = containerRef.current.querySelector('img');
    const scaleX = img.naturalWidth / displayed.clientWidth;
    const scaleY = img.naturalHeight / displayed.clientHeight;
    const sx = sel.x * scaleX;
    const sy = sel.y * scaleY;
    const sw = sel.w * scaleX;
    const sh = sel.h * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height });
    } catch (e) {
      setError(e.message || 'Crop failed.');
    }
  };

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" />}

      {file && previewUrl && (
        <>
          <div className="tool-preset-row">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                className={ratio === r.value ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setRatio(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <p className="tool-note">Drag over the image to select the crop area.</p>

          <div
            ref={containerRef}
            className="tool-crop-stage"
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            <img src={previewUrl} alt="Crop source" draggable={false} />
            {sel && sel.w > 2 && (
              <div
                className="tool-crop-selection"
                style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
              />
            )}
          </div>

          <div className="tool-controls">
            <button className="btn-primary" onClick={applyCrop} disabled={!sel || sel.w < 4}>Crop</button>
            <button className="btn-ghost" onClick={() => { setFile(null); setResult(null); setSel(null); }}>
              Choose a different image
            </button>
          </div>

          {error && <p className="tool-error">{error}</p>}

          {result && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Cropped result" />
                <p>{result.w} x {result.h} px</p>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-cropped.png`)}
                downloadLabel="Download PNG"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
