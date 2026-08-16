import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import { Dropzone, formatBytes } from '../ToolShell';

export default function Base64Engine() {
  const [file, setFile] = useState(null);
  const [dataUri, setDataUri] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState(null);

  const onFiles = ([f]) => {
    setError(null);
    if (f.size > 2 * 1024 * 1024) {
      setError('Files over 2MB produce impractically large Base64 strings. Compress the image first.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setFile(f); setDataUri(reader.result); };
    reader.onerror = () => setError('Could not read this file.');
    reader.readAsDataURL(f);
  };

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const snippets = dataUri
    ? [
        { key: 'raw', label: 'Raw data URI', text: dataUri },
        { key: 'html', label: 'HTML <img>', text: `<img src="${dataUri}" alt="" />` },
        { key: 'css', label: 'CSS background', text: `background-image: url('${dataUri}');` },
      ]
    : [];

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" hint="Up to 2MB" />}
      {error && <p className="tool-error">{error}</p>}

      {dataUri && (
        <>
          <p className="tool-note">
            {file.name} — {formatBytes(file.size)} encodes to a {formatBytes(dataUri.length)} string.
          </p>

          {snippets.map((s) => (
            <div key={s.key} className="tool-snippet">
              <div className="tool-snippet-head">
                <span>{s.label}</span>
                <button className="btn-secondary" onClick={() => copy(s.key, s.text)}>
                  {copiedKey === s.key ? <Check /> : <Copy />} {copiedKey === s.key ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="tool-snippet-clamp">{s.text.length > 400 ? `${s.text.slice(0, 400)}... (${formatBytes(s.text.length)} total)` : s.text}</pre>
            </div>
          ))}

          <div className="tool-controls">
            <button className="btn-ghost" onClick={() => { setFile(null); setDataUri(null); }}>
              Choose a different image
            </button>
          </div>
        </>
      )}
    </div>
  );
}
