import React, { useState } from 'react';
import { Dropzone, ResultBar, formatBytes, saveBlob } from '../ToolShell';
import { canvasToBlob, baseName } from './canvas-utils';
import { renderPdfPages } from './pdf-utils';

const LEVELS = [
  { id: 'high', label: 'High quality', scale: 1.5, quality: 0.8 },
  { id: 'balanced', label: 'Balanced', scale: 1.2, quality: 0.6 },
  { id: 'small', label: 'Smallest size', scale: 1.0, quality: 0.4 },
];

export default function PdfCompressEngine() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('balanced');
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const compress = async (f, lvlId) => {
    const lvl = LEVELS.find((l) => l.id === lvlId);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const canvases = await renderPdfPages(f, lvl.scale, (page, total) =>
        setProgress(`Rendering page ${page} of ${total}...`)
      );
      setProgress('Rebuilding PDF...');
      const { PDFDocument } = await import('pdf-lib');
      const outDoc = await PDFDocument.create();
      for (const canvas of canvases) {
        const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', lvl.quality);
        const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
        const jpg = await outDoc.embedJpg(jpgBytes);
        const page = outDoc.addPage([canvas.width, canvas.height]);
        page.drawImage(jpg, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      }
      const bytes = await outDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ blob, pages: canvases.length });
    } catch (e) {
      setError(e.message || 'Could not process this PDF. It may be password-protected.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const onFiles = ([f]) => {
    setFile(f);
    compress(f, level);
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} accept="application/pdf,.pdf" label="Drop your PDF here, or click to browse" hint="Best for scanned and image-heavy PDFs" />
      )}

      {file && (
        <>
          <div className="tool-preset-row">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                className={level === l.id ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setLevel(l.id); compress(file, l.id); }}
                disabled={busy}
              >
                {l.label}
              </button>
            ))}
            <button className="btn-ghost" onClick={() => { setFile(null); setResult(null); }}>
              Choose a different PDF
            </button>
          </div>

          <p className="tool-note">
            Note: this rebuilds the PDF from page images, which is ideal for scans. Selectable text becomes part of the image.
          </p>

          {busy && <div className="loader"><div className="spinner"></div><p>{progress || 'Compressing...'}</p></div>}
          {error && <p className="tool-error">{error}</p>}

          {result && !busy && (
            <ResultBar
              originalSize={file.size}
              resultSize={result.blob.size}
              onDownload={() => saveBlob(result.blob, `${baseName(file.name)}-compressed.pdf`)}
              downloadLabel={`Download PDF (${result.pages} pages, ${formatBytes(result.blob.size)})`}
            />
          )}
        </>
      )}
    </div>
  );
}
