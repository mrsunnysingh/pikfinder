import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UploadSimple, DownloadSimple, ArrowsClockwise } from '@phosphor-icons/react';

// Does a pasted/dropped file satisfy the dropzone's `accept` filter?
function fileMatchesAccept(file, accept) {
  if (!accept || accept.trim() === '' || accept.includes('*/*')) return true;
  const tokens = accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return tokens.some((tok) => {
    if (tok.endsWith('/*')) return type.startsWith(tok.slice(0, -1)); // e.g. image/*
    if (tok.startsWith('.')) return name.endsWith(tok);              // e.g. .pdf
    return type === tok;                                             // exact mime
  });
}

export function formatBytes(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke a moment later so the download isn't interrupted, then let the tool
  // page know a download finished (it resets to a clean state for the next file).
  setTimeout(() => {
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('pikfinder:downloaded', { detail: { fileName } }));
  }, 1200);
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')); };
    img.src = url;
  });
}

/** Drag-and-drop upload zone. */
export function Dropzone({ onFiles, accept = 'image/*', multiple = false, label, hint }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }, [onFiles, multiple]);

  // Paste an image or document (Ctrl/⌘+V) straight into the tool.
  useEffect(() => {
    const onPaste = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      let files = Array.from(e.clipboardData?.files || []);
      if (!files.length) {
        files = Array.from(e.clipboardData?.items || [])
          .filter((i) => i.kind === 'file')
          .map((i) => i.getAsFile())
          .filter(Boolean);
      }
      const matched = files.filter((f) => fileMatchesAccept(f, accept));
      if (matched.length) { e.preventDefault(); handleFiles(matched); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFiles, accept]);

  return (
    <div
      className={`tool-dropzone ${dragOver ? 'drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      aria-label={label || 'Upload file'}
    >
      <UploadSimple size={36} weight="light" />
      <p className="tool-dropzone-label">{label || 'Drop your image here, or click to browse'}</p>
      <p className="tool-dropzone-hint">…or paste from your clipboard (Ctrl/⌘+V)</p>
      {hint && <p className="tool-dropzone-hint">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

/** Result row: before/after size + download button. */
export function ResultBar({ originalSize, resultSize, onDownload, downloadLabel = 'Download', busy }) {
  const savings = originalSize && resultSize ? Math.round((1 - resultSize / originalSize) * 100) : null;
  return (
    <div className="tool-result-bar">
      <div className="tool-result-stats">
        {originalSize != null && <span>Original: <strong>{formatBytes(originalSize)}</strong></span>}
        {resultSize != null && <span>Result: <strong>{formatBytes(resultSize)}</strong></span>}
        {savings != null && savings > 0 && <span className="tool-savings">-{savings}%</span>}
      </div>
      <button className="btn-primary" onClick={onDownload} disabled={busy}>
        {busy ? <ArrowsClockwise className="spin" /> : <DownloadSimple weight="bold" />} {downloadLabel}
      </button>
    </div>
  );
}

/** Wraps an engine with the standard tool layout. */
export default function ToolShell({ children }) {
  return <div className="tool-shell">{children}</div>;
}
