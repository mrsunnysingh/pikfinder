import React, { useState } from 'react';
import { ArrowUp, ArrowDown, X } from '@phosphor-icons/react';
import { Dropzone, ResultBar, saveBlob } from '../ToolShell';
import { loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob } from './canvas-utils';

const PAGE_SIZES = {
  fit: { label: 'Fit to image' },
  a4: { label: 'A4', w: 595.28, h: 841.89 },
  letter: { label: 'US Letter', w: 612, h: 792 },
};

export default function ImageToPdfEngine() {
  const [items, setItems] = useState([]); // { file, url }
  const [pageSize, setPageSize] = useState('fit');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFiles = (files) => {
    setResult(null);
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const move = (i, dir) => {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setResult(null);
  };

  const remove = (i) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
  };

  const build = async () => {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      for (const item of items) {
        const { img } = await loadImageFromFile(item.file);
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        const jpg = await doc.embedJpg(new Uint8Array(await jpgBlob.arrayBuffer()));

        if (pageSize === 'fit') {
          const page = doc.addPage([img.naturalWidth, img.naturalHeight]);
          page.drawImage(jpg, { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
        } else {
          const { w, h } = PAGE_SIZES[pageSize];
          const page = doc.addPage([w, h]);
          const margin = 24;
          const scale = Math.min((w - margin * 2) / img.naturalWidth, (h - margin * 2) / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          page.drawImage(jpg, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
        }
      }
      const bytes = await doc.save();
      setResult({ blob: new Blob([bytes], { type: 'application/pdf' }) });
    } catch (e) {
      setError(e.message || 'Could not build the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-engine">
      <Dropzone
        onFiles={onFiles}
        multiple
        accept="image/jpeg,image/png,image/webp"
        label={items.length ? 'Add more images' : 'Drop your images here, or click to browse'}
        hint="JPG, PNG, or WebP — add as many as you need"
      />

      {items.length > 0 && (
        <>
          <div className="tool-preset-row">
            {Object.entries(PAGE_SIZES).map(([id, s]) => (
              <button key={id} className={pageSize === id ? 'btn-primary' : 'btn-secondary'} onClick={() => { setPageSize(id); setResult(null); }}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="tool-page-grid">
            {items.map((item, i) => (
              <figure key={item.url} className="tool-page-card">
                <img src={item.url} alt={`Page ${i + 1}: ${item.file.name}`} loading="lazy" />
                <figcaption>
                  <span>Page {i + 1}</span>
                  <span className="tool-page-actions">
                    <button aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp /></button>
                    <button aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown /></button>
                    <button aria-label="Remove" onClick={() => remove(i)}><X /></button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="tool-controls">
            <button className="btn-primary" onClick={build} disabled={busy}>
              {busy ? 'Building PDF...' : `Create PDF (${items.length} page${items.length > 1 ? 's' : ''})`}
            </button>
          </div>

          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <ResultBar
              resultSize={result.blob.size}
              onDownload={() => saveBlob(result.blob, 'images.pdf')}
              downloadLabel="Download PDF"
            />
          )}
        </>
      )}
    </div>
  );
}
