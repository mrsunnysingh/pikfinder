import React, { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Dropzone, saveBlob } from '../ToolShell';
import { canvasToBlob, baseName } from './canvas-utils';
import { renderPdfPages } from './pdf-utils';

export default function PdfToJpgEngine() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // { blob, url }
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFiles = async ([f]) => {
    setFile(f);
    setPages([]);
    setBusy(true);
    setError(null);
    try {
      const canvases = await renderPdfPages(f, 2, (p, total) => setProgress(`Rendering page ${p} of ${total}...`));
      const out = [];
      for (const canvas of canvases) {
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
        out.push({ blob, url: URL.createObjectURL(blob) });
      }
      setPages(out);
    } catch (e) {
      setError(e.message || 'Could not read this PDF. It may be password-protected.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    pages.forEach((p, i) => zip.file(`${baseName(file.name)}-page-${i + 1}.jpg`, p.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveBlob(zipBlob, `${baseName(file.name)}-pages.zip`);
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} accept="application/pdf,.pdf" label="Drop your PDF here, or click to browse" />
      )}

      {busy && <div className="loader"><div className="spinner"></div><p>{progress || 'Rendering...'}</p></div>}
      {error && <p className="tool-error">{error}</p>}

      {pages.length > 0 && !busy && (
        <>
          <div className="tool-controls">
            <button className="btn-primary" onClick={downloadAll}>
              <DownloadSimple weight="bold" /> Download all as ZIP ({pages.length} pages)
            </button>
            <button className="btn-ghost" onClick={() => { setFile(null); setPages([]); }}>
              Choose a different PDF
            </button>
          </div>

          <div className="tool-page-grid">
            {pages.map((p, i) => (
              <figure key={i} className="tool-page-card">
                <img src={p.url} alt={`Page ${i + 1}`} loading="lazy" />
                <figcaption>
                  <span>Page {i + 1}</span>
                  <button
                    className="btn-secondary"
                    onClick={() => saveBlob(p.blob, `${baseName(file.name)}-page-${i + 1}.jpg`)}
                  >
                    <DownloadSimple /> JPG
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
