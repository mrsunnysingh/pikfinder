import React, { useState, useCallback } from 'react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { canvasToBlob, baseName } from './canvas-utils';

const CANVAS_MODES = [
  { id: 'original', label: 'Original size' },
  { id: 'square', label: 'Pad to square' },
];

export default function AddBackgroundEngine() {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [color, setColor] = useState('#ffffff');
  const [mode, setMode] = useState('original');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const render = useCallback(async (image, bg, canvasMode) => {
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    const size = Math.max(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = canvasMode === 'square' ? size : w;
    canvas.height = canvasMode === 'square' ? size : h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2);
    const blob = await canvasToBlob(canvas, 'image/png');
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height };
    });
  }, []);

  const onFiles = async ([f]) => {
    setError(null);
    try {
      const { img: image } = await loadImageFromFile(f);
      setFile(f);
      setImg(image);
      await render(image, color, mode);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" hint="Transparent PNGs work great" />}
      {error && <p className="tool-error">{error}</p>}

      {file && img && (
        <>
          <div className="tool-controls">
            <label className="tool-control">
              <span>Background color</span>
              <input type="color" value={color} onChange={(e) => { setColor(e.target.value); render(img, e.target.value, mode); }} />
            </label>
            <div className="tool-preset-row">
              {CANVAS_MODES.map((m) => (
                <button key={m.id} className={mode === m.id ? 'btn-primary' : 'btn-secondary'} onClick={() => { setMode(m.id); render(img, color, m.id); }}>
                  {m.label}
                </button>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => { setFile(null); setImg(null); setResult(null); }}>
              Choose a different image
            </button>
          </div>

          {result && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Image with new background" />
                <p>{result.w} x {result.h} px</p>
              </div>
              <ResultBar
                originalSize={file.size}
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-bg.png`)}
                downloadLabel="Download PNG"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
