import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, baseName } from './canvas-utils';
import { Eraser, PaintBrush, Check } from '@phosphor-icons/react';

// U2-Netp (Apache 2.0) — small portrait/object segmentation model, ~4.5MB.
// Runs fully in-browser via onnxruntime-web. No uploads, no API costs.
const MODEL_URL = 'https://huggingface.co/tomjackson2023/rembg/resolve/main/u2netp.onnx';
const MODEL_SIZE = 320;

let sessionPromise = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });
    })();
  }
  return sessionPromise;
}

async function removeBackgroundBase(img, onStatus) {
  onStatus('Loading AI model (first run only, ~5MB)...');
  const ort = await import('onnxruntime-web');
  const session = await getSession();

  onStatus('Analyzing image...');
  // Preprocess: resize to 320x320, normalize to [-~2, ~2] with ImageNet stats
  const small = drawToCanvas(img, MODEL_SIZE, MODEL_SIZE);
  const { data } = small.getContext('2d').getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const floats = new Float32Array(3 * MODEL_SIZE * MODEL_SIZE);
  for (let i = 0; i < MODEL_SIZE * MODEL_SIZE; i++) {
    floats[i] = (data[i * 4] / 255 - mean[0]) / std[0];
    floats[MODEL_SIZE * MODEL_SIZE + i] = (data[i * 4 + 1] / 255 - mean[1]) / std[1];
    floats[2 * MODEL_SIZE * MODEL_SIZE + i] = (data[i * 4 + 2] / 255 - mean[2]) / std[2];
  }
  const input = new ort.Tensor('float32', floats, [1, 3, MODEL_SIZE, MODEL_SIZE]);
  const results = await session.run({ [session.inputNames[0]]: input });
  const mask = results[session.outputNames[0]].data; // 1x1x320x320, values 0..1

  onStatus('Preparing mask...');
  // Build a mask canvas at the original image size
  const maskCanvasSmall = document.createElement('canvas');
  maskCanvasSmall.width = MODEL_SIZE;
  maskCanvasSmall.height = MODEL_SIZE;
  const maskImage = maskCanvasSmall.getContext('2d').createImageData(MODEL_SIZE, MODEL_SIZE);
  // normalize mask values
  let min = 1, max = 0;
  for (let i = 0; i < mask.length; i++) { if (mask[i] < min) min = mask[i]; if (mask[i] > max) max = mask[i]; }
  const range = max - min || 1;
  for (let i = 0; i < MODEL_SIZE * MODEL_SIZE; i++) {
    const a = Math.round(((mask[i] - min) / range) * 255);
    maskImage.data[i * 4] = 255;
    maskImage.data[i * 4 + 1] = 255;
    maskImage.data[i * 4 + 2] = 255;
    maskImage.data[i * 4 + 3] = a;
  }
  maskCanvasSmall.getContext('2d').putImageData(maskImage, 0, 0);

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const ctx = maskCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(maskCanvasSmall, 0, 0, MODEL_SIZE, MODEL_SIZE, 0, 0, w, h);
  
  return maskCanvas;
}

export default function BgRemoveEngine() {
  const [file, setFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [maskCanvas, setMaskCanvas] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Brush state
  const [mode, setMode] = useState('add'); // 'add' | 'remove'
  const [brushSize, setBrushSize] = useState(50);
  
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageObj || !maskCanvas) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw original image
    ctx.globalAlpha = 1;
    ctx.drawImage(imageObj, 0, 0, w, h);
    
    // Draw red overlay where background is masked out
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0, w, h);
    ctx.restore();
  }, [imageObj, maskCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const onFiles = async ([f]) => {
    setError(null);
    setResult(null);
    setMaskCanvas(null);
    setImageObj(null);
    try {
      const { img } = await loadImageFromFile(f);
      setFile(f);
      setImageObj(img);
      const mask = await removeBackgroundBase(img, setStatus);
      setMaskCanvas(mask);
    } catch (e) {
      console.error('[v0] Background removal failed:', e);
      setError('Background removal failed. Please try again.');
    } finally {
      setStatus(null);
    }
  };

  // --- Drawing logic ---
  const handlePointerDown = (e) => {
    if (!maskCanvas) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawBrush(e);
  };

  const handlePointerMove = (e) => {
    if (!drawing.current) return;
    drawBrush(e);
  };

  const handlePointerUp = () => {
    drawing.current = false;
  };

  const drawBrush = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = maskCanvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    if (mode === 'add') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'white';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'black'; // shape doesn't matter for dest-out, it just removes alpha
      ctx.fill();
    }
    redrawCanvas();
  };

  const completeEditing = async () => {
    setStatus('Compositing final image...');
    try {
      const w = imageObj.naturalWidth;
      const h = imageObj.naturalHeight;
      const out = drawToCanvas(imageObj, w, h);
      const ctx = out.getContext('2d');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const blob = await canvasToBlob(out, 'image/png');
      setResult({ blob, url: URL.createObjectURL(blob) });
      setMaskCanvas(null); // Leave editing mode
    } catch (e) {
      setError('Failed to composite image.');
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone
          onFiles={onFiles}
          label="Drop a photo here, or click to browse"
          hint="Works best with a clear subject — people, products, animals"
        />
      )}

      {status && <div className="loader"><div className="spinner"></div><p>{status}</p></div>}
      {error && <p className="tool-error">{error}</p>}

      {maskCanvas && !result && (
        <div className="tool-mask-editor" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Refine the mask: paint over areas to keep or remove them.</p>
          <div className="studio-row" style={{ background: 'var(--card-bg)', padding: '12px 24px', borderRadius: '50px', border: '1px solid var(--border)' }}>
            <button className={`btn-outline ${mode === 'add' ? 'active' : ''}`} onClick={() => setMode('add')}>
              <PaintBrush size={18} /> Keep
            </button>
            <button className={`btn-outline ${mode === 'remove' ? 'active' : ''}`} onClick={() => setMode('remove')}>
              <Eraser size={18} /> Erase
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', color: 'var(--text-muted)' }}>
              Brush Size
              <input type="range" min="10" max="200" value={brushSize} onChange={e => setBrushSize(+e.target.value)} />
            </label>
            <button className="btn-primary" onClick={completeEditing} style={{ marginLeft: 'auto' }}>
              <Check size={18} /> Done
            </button>
          </div>
          <div className="tool-transparent-bg" style={{ position: 'relative', maxWidth: '100%' }}>
            <canvas
              ref={canvasRef}
              width={imageObj.naturalWidth}
              height={imageObj.naturalHeight}
              style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', cursor: `crosshair`, touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="tool-compare">
            <figure className="tool-transparent-bg">
              <img src={result.url} alt="Background removed" />
              <figcaption>Background removed</figcaption>
            </figure>
          </div>
          <ResultBar
            originalSize={file.size}
            resultSize={result.blob.size}
            onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-no-bg.png`)}
            downloadLabel="Download transparent PNG"
          />
          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setFile(null); setResult(null); }}>
              Choose a different photo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
