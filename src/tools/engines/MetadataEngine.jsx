import React, { useState } from 'react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { drawToCanvas, canvasToBlob, baseName } from './canvas-utils';

function formatValue(v) {
  if (v instanceof Date) return v.toLocaleString();
  if (typeof v === 'number') return Math.round(v * 1000) / 1000;
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return String(v);
}

export default function MetadataEngine({ mode = 'view' }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [gps, setGps] = useState(null);
  const [clean, setClean] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFiles = async ([f]) => {
    setBusy(true);
    setError(null);
    setMeta(null);
    setClean(null);
    setGps(null);
    try {
      setFile(f);
      const exifr = (await import('exifr')).default;
      const data = await exifr.parse(f, { gps: true }).catch(() => null);
      setMeta(data || {});
      if (data?.latitude != null && data?.longitude != null) {
        setGps({ lat: data.latitude, lon: data.longitude });
      }
      // Re-encoding via canvas strips all metadata.
      const { img } = await loadImageFromFile(f);
      const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
      const isPng = f.type === 'image/png';
      const blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.95);
      setClean({ blob, ext: isPng ? 'png' : 'jpg' });
    } catch (e) {
      setError(e.message || 'Could not read this image.');
    } finally {
      setBusy(false);
    }
  };

  const entries = meta ? Object.entries(meta).filter(([, v]) => v != null).slice(0, 60) : [];

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} accept="image/jpeg,image/png,image/tiff,image/heic,.heic" label="Drop your photo here, or click to browse" />}

      {busy && <div className="loader"><div className="spinner"></div><p>Reading metadata...</p></div>}
      {error && <p className="tool-error">{error}</p>}

      {meta && !busy && (
        <>
          {gps && (
            <p className="tool-warning">
              This photo contains a GPS location ({gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}). Anyone you share it with can see where it was taken.
            </p>
          )}

          {entries.length === 0 ? (
            <p className="tool-note">No EXIF metadata found in this image.</p>
          ) : (
            <div className="tool-meta-table" role="table" aria-label="Image metadata">
              {entries.map(([key, value]) => (
                <div key={key} className="tool-meta-row" role="row">
                  <span role="cell" className="tool-meta-key">{key}</span>
                  <span role="cell" className="tool-meta-value">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}

          {clean && (
            <ResultBar
              originalSize={file.size}
              resultSize={clean.blob.size}
              onDownload={() => saveBlob(clean.blob, `${baseName(file.name)}-clean.${clean.ext}`)}
              downloadLabel={mode === 'strip' ? 'Download metadata-free copy' : 'Download clean copy'}
            />
          )}

          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setFile(null); setMeta(null); setClean(null); }}>
              Choose a different photo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
