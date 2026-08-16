import React, { useState, useRef, useCallback } from 'react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, baseName } from './canvas-utils';

const POSITIONS = [
  { id: 'br', label: 'Bottom right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'tr', label: 'Top right' },
  { id: 'tl', label: 'Top left' },
  { id: 'c', label: 'Center' },
  { id: 'tile', label: 'Tiled' },
];

function drawWatermark(img, { text, position, opacity, size, color }) {
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  const fontSize = Math.max(14, Math.round((canvas.width * size) / 100));
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  const pad = fontSize;
  const tw = ctx.measureText(text).width;

  if (position === 'tile') {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = tw + fontSize * 3;
    const stepY = fontSize * 4;
    for (let y = -canvas.height; y < canvas.height; y += stepY) {
      for (let x = -canvas.width; x < canvas.width; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  } else {
    let x = pad;
    let y = canvas.height - pad;
    if (position.includes('r')) x = canvas.width - tw - pad;
    if (position.includes('t')) y = pad + fontSize;
    if (position === 'c') { x = (canvas.width - tw) / 2; y = canvas.height / 2; }
    ctx.fillText(text, x, y);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function drawRedactions(img, regions, style, strength) {
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  for (const r of regions) {
    const sx = Math.round(r.x); const sy = Math.round(r.y);
    const sw = Math.max(1, Math.round(r.w)); const sh = Math.max(1, Math.round(r.h));
    if (style === 'pixelate') {
      const block = Math.max(4, Math.round(strength * 2));
      const small = document.createElement('canvas');
      small.width = Math.max(1, Math.round(sw / block));
      small.height = Math.max(1, Math.round(sh / block));
      const sctx = small.getContext('2d');
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, small.width, small.height, sx, sy, sw, sh);
      ctx.imageSmoothingEnabled = true;
    } else {
      // blur: draw region through a filtered offscreen canvas
      const off = document.createElement('canvas');
      off.width = sw; off.height = sh;
      const octx = off.getContext('2d');
      octx.filter = `blur(${strength}px)`;
      octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.drawImage(off, sx, sy);
    }
  }
  return canvas;
}

export default function EditEngine({ mode = 'watermark' }) {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // watermark state
  const [text, setText] = useState('© PikFinder');
  const [position, setPosition] = useState('br');
  const [opacity, setOpacity] = useState(0.5);
  const [size, setSize] = useState(4);
  const [color, setColor] = useState('#ffffff');
  // blur state
  const [style, setStyle] = useState('blur');
  const [strength, setStrength] = useState(12);
  const [regions, setRegions] = useState([]);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const rerender = useCallback(async (image, opts) => {
    const canvas = mode === 'watermark'
      ? drawWatermark(image, opts)
      : drawRedactions(image, opts.regions, opts.style, opts.strength);
    const blob = await canvasToBlob(canvas, 'image/png');
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { blob, url: URL.createObjectURL(blob) };
    });
  }, [mode]);

  const onFiles = async ([f]) => {
    setError(null);
    setRegions([]);
    setResult(null);
    try {
      const { img: image, url } = await loadImageFromFile(f);
      setFile(f);
      setImg(image);
      setPreviewUrl(url);
      if (mode === 'watermark') {
        rerender(image, { text, position, opacity, size, color });
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const applyWatermark = (patch = {}) => {
    const opts = { text, position, opacity, size, color, ...patch };
    if (patch.text !== undefined) setText(patch.text);
    if (patch.position !== undefined) setPosition(patch.position);
    if (patch.opacity !== undefined) setOpacity(patch.opacity);
    if (patch.size !== undefined) setSize(patch.size);
    if (patch.color !== undefined) setColor(patch.color);
    if (img) rerender(img, opts);
  };

  // blur region selection on the displayed image
  const clientPos = (e) => {
    const rect = stageRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: Math.min(Math.max(p.clientX - rect.left, 0), rect.width), y: Math.min(Math.max(p.clientY - rect.top, 0), rect.height) };
  };
  const toNatural = (r) => {
    const displayed = stageRef.current.querySelector('img');
    const sx = img.naturalWidth / displayed.clientWidth;
    const sy = img.naturalHeight / displayed.clientHeight;
    return { x: r.x * sx, y: r.y * sy, w: r.w * sx, h: r.h * sy };
  };
  const onDown = (e) => { e.preventDefault(); dragRef.current = { start: clientPos(e), current: null }; };
  const onMove = (e) => {
    if (!dragRef.current) return;
    dragRef.current.current = clientPos(e);
    setRegions((prev) => [...prev.filter((r) => !r.temp), tempRegion()]);
  };
  const tempRegion = () => {
    const { start, current } = dragRef.current;
    if (!current) return { x: start.x, y: start.y, w: 0, h: 0, temp: true };
    return {
      x: Math.min(start.x, current.x), y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x), h: Math.abs(current.y - start.y), temp: true,
    };
  };
  const onUp = () => {
    if (!dragRef.current?.current) { dragRef.current = null; return; }
    const region = tempRegion();
    dragRef.current = null;
    if (region.w < 4 || region.h < 4) { setRegions((p) => p.filter((r) => !r.temp)); return; }
    const next = [...regions.filter((r) => !r.temp), { ...region, temp: false }];
    setRegions(next);
    rerender(img, { regions: next.map(toNatural), style, strength });
  };

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" />}
      {error && <p className="tool-error">{error}</p>}

      {file && img && mode === 'watermark' && (
        <>
          <div className="tool-controls">
            <label className="tool-control">
              <span>Watermark text</span>
              <input type="text" value={text} onChange={(e) => applyWatermark({ text: e.target.value })} />
            </label>
            <label className="tool-control">
              <span>Opacity: {Math.round(opacity * 100)}%</span>
              <input type="range" min="10" max="100" value={Math.round(opacity * 100)} onChange={(e) => applyWatermark({ opacity: Number(e.target.value) / 100 })} />
            </label>
            <label className="tool-control">
              <span>Size: {size}%</span>
              <input type="range" min="2" max="15" value={size} onChange={(e) => applyWatermark({ size: Number(e.target.value) })} />
            </label>
            <label className="tool-control">
              <span>Color</span>
              <input type="color" value={color} onChange={(e) => applyWatermark({ color: e.target.value })} />
            </label>
          </div>
          <div className="tool-preset-row">
            {POSITIONS.map((p) => (
              <button key={p.id} className={position === p.id ? 'btn-primary' : 'btn-secondary'} onClick={() => applyWatermark({ position: p.id })}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}

      {file && img && mode === 'blur' && (
        <>
          <div className="tool-preset-row">
            <button className={style === 'blur' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setStyle('blur'); if (regions.length) rerender(img, { regions: regions.map(toNatural), style: 'blur', strength }); }}>Blur</button>
            <button className={style === 'pixelate' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setStyle('pixelate'); if (regions.length) rerender(img, { regions: regions.map(toNatural), style: 'pixelate', strength }); }}>Pixelate</button>
            <label className="tool-control">
              <span>Strength: {strength}</span>
              <input type="range" min="4" max="40" value={strength} onChange={(e) => { const s = Number(e.target.value); setStrength(s); if (regions.length) rerender(img, { regions: regions.map(toNatural), style, strength: s }); }} />
            </label>
            <button className="btn-secondary" onClick={() => { setRegions([]); setResult(null); }}>Clear areas</button>
          </div>
          <p className="tool-note">Drag over the image to mark areas to obscure. You can select multiple areas.</p>
          <div
            ref={stageRef} className="tool-crop-stage"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            <img src={result?.url || previewUrl} alt="Editing stage" draggable={false} />
            {regions.filter((r) => r.temp).map((r, i) => (
              <div key={i} className="tool-crop-selection" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
            ))}
          </div>
        </>
      )}

      {file && (
        <div className="tool-controls">
          <button className="btn-ghost" onClick={() => { setFile(null); setImg(null); setResult(null); setRegions([]); }}>
            Choose a different image
          </button>
        </div>
      )}

      {result && mode === 'watermark' && (
        <div className="tool-preview">
          <img src={result.url} alt="Watermarked result" />
        </div>
      )}

      {result && (
        <ResultBar
          originalSize={file?.size}
          resultSize={result.blob.size}
          onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-${mode === 'watermark' ? 'watermarked' : 'redacted'}.png`)}
          downloadLabel="Download PNG"
        />
      )}
    </div>
  );
}
