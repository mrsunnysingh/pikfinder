import React, { useState } from 'react';
import { ArrowUp, ArrowDown, X } from '@phosphor-icons/react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { scaleImageHQ } from './canvas-utils';

const MAX_SIZE = 600;

export default function GifEngine() {
  const [frames, setFrames] = useState([]); // { file, url }
  const [delay, setDelay] = useState(400);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFiles = (files) => {
    setResult(null);
    setFrames((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const move = (i, dir) => {
    setFrames((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setResult(null);
  };

  const remove = (i) => {
    setFrames((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
  };

  const build = async () => {
    setBusy(true);
    setError(null);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');

      // Use the first frame to set output dimensions (capped)
      const { img: first } = await loadImageFromFile(frames[0].file);
      let w = first.naturalWidth;
      let h = first.naturalHeight;
      const scale = Math.min(1, MAX_SIZE / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const gif = GIFEncoder();
      for (const frame of frames) {
        const { img } = await loadImageFromFile(frame.file);
        const canvas = scaleImageHQ(img, w, h);
        const ctx = canvas.getContext('2d');
        const { data } = ctx.getImageData(0, 0, w, h);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, w, h, { palette, delay });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e.message || 'Could not build the GIF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-engine">
      <Dropzone
        onFiles={onFiles} multiple
        label={frames.length ? 'Add more frames' : 'Drop 2 or more images here, or click to browse'}
        hint="Each image becomes one frame"
      />

      {frames.length > 0 && (
        <>
          <div className="tool-page-grid">
            {frames.map((frame, i) => (
              <figure key={frame.url} className="tool-page-card">
                <img src={frame.url} alt={`Frame ${i + 1}`} loading="lazy" />
                <figcaption>
                  <span>Frame {i + 1}</span>
                  <span className="tool-page-actions">
                    <button aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp /></button>
                    <button aria-label="Move down" onClick={() => move(i, 1)} disabled={i === frames.length - 1}><ArrowDown /></button>
                    <button aria-label="Remove" onClick={() => remove(i)}><X /></button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="tool-controls">
            <label className="tool-control">
              <span>Frame delay: {delay}ms</span>
              <input type="range" min="50" max="2000" step="50" value={delay} onChange={(e) => { setDelay(Number(e.target.value)); setResult(null); }} />
            </label>
            <button className="btn-primary" onClick={build} disabled={busy || frames.length < 2}>
              {busy ? 'Building GIF...' : `Create GIF (${frames.length} frames)`}
            </button>
          </div>

          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <>
              <div className="tool-preview">
                <img src={result.url} alt="Animated GIF result" />
              </div>
              <ResultBar
                resultSize={result.blob.size}
                onDownload={() => saveBlob(result.blob, 'animation.gif')}
                downloadLabel="Download GIF"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
