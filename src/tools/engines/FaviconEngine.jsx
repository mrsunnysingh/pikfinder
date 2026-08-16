import React, { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import { Dropzone, saveBlob, loadImageFromFile } from '../ToolShell';
import { scaleImageHQ, canvasToBlob } from './canvas-utils';

/** Build a .ico file from PNG blobs (ICO format supports embedded PNGs). */
async function buildIco(pngEntries) {
  // pngEntries: [{ size, blob }]
  const buffers = await Promise.all(pngEntries.map((e) => e.blob.arrayBuffer()));
  const headerSize = 6 + 16 * pngEntries.length;
  const total = headerSize + buffers.reduce((s, b) => s + b.byteLength, 0);
  const out = new ArrayBuffer(total);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, pngEntries.length, true);

  let offset = headerSize;
  pngEntries.forEach((entry, i) => {
    const dir = 6 + i * 16;
    const size = entry.size >= 256 ? 0 : entry.size;
    view.setUint8(dir, size); // width
    view.setUint8(dir + 1, size); // height
    view.setUint8(dir + 2, 0); // palette
    view.setUint8(dir + 3, 0); // reserved
    view.setUint16(dir + 4, 1, true); // planes
    view.setUint16(dir + 6, 32, true); // bpp
    view.setUint32(dir + 8, buffers[i].byteLength, true);
    view.setUint32(dir + 12, offset, true);
    bytes.set(new Uint8Array(buffers[i]), offset);
    offset += buffers[i].byteLength;
  });

  return new Blob([out], { type: 'image/x-icon' });
}

const PACKAGE_SIZES = [16, 32, 48, 180, 192, 512];

const HTML_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

export default function FaviconEngine({ icoOnly = false }) {
  const [file, setFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState(null);

  const onFiles = async ([f]) => {
    setBusy(true);
    setError(null);
    setPreviews([]);
    setAssets(null);
    try {
      const { img } = await loadImageFromFile(f);
      setFile(f);
      const sizes = icoOnly ? [16, 32, 48] : PACKAGE_SIZES;
      const entries = [];
      const shots = [];
      for (const size of sizes) {
        const canvas = scaleImageHQ(img, size, size);
        const blob = await canvasToBlob(canvas, 'image/png');
        entries.push({ size, blob });
        if (size <= 64 || !icoOnly) shots.push({ size, url: URL.createObjectURL(blob) });
      }
      const ico = await buildIco(entries.filter((e) => e.size <= 48));
      setAssets({ ico, entries });
      setPreviews(shots);
    } catch (e) {
      setError(e.message || 'Could not process this image.');
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('favicon.ico', assets.ico);
    for (const e of assets.entries) {
      const name =
        e.size === 180 ? 'apple-touch-icon.png' :
        e.size === 192 ? 'android-chrome-192x192.png' :
        e.size === 512 ? 'android-chrome-512x512.png' :
        `favicon-${e.size}x${e.size}.png`;
      zip.file(name, e.blob);
    }
    zip.file('site.webmanifest', JSON.stringify({
      name: '', short_name: '',
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone',
    }, null, 2));
    zip.file('snippet.html', HTML_SNIPPET);
    const blob = await zip.generateAsync({ type: 'blob' });
    saveBlob(blob, 'favicon-package.zip');
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(HTML_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="tool-engine">
      {!file && (
        <Dropzone onFiles={onFiles} accept="image/png,image/jpeg,image/webp,image/svg+xml" label="Drop a square logo here, or click to browse" hint="512x512 or larger recommended" />
      )}

      {busy && <div className="loader"><div className="spinner"></div><p>Generating icons...</p></div>}
      {error && <p className="tool-error">{error}</p>}

      {assets && !busy && (
        <>
          <div className="tool-favicon-previews">
            {previews.map((p) => (
              <figure key={p.size}>
                <img src={p.url} alt={`${p.size}x${p.size} favicon preview`} width={Math.min(p.size, 64)} height={Math.min(p.size, 64)} />
                <figcaption>{p.size}px</figcaption>
              </figure>
            ))}
          </div>

          <div className="tool-controls">
            {icoOnly ? (
              <button className="btn-primary" onClick={() => saveBlob(assets.ico, 'favicon.ico')}>
                Download favicon.ico
              </button>
            ) : (
              <>
                <button className="btn-primary" onClick={downloadZip}>Download full package (ZIP)</button>
                <button className="btn-secondary" onClick={() => saveBlob(assets.ico, 'favicon.ico')}>Just favicon.ico</button>
              </>
            )}
            <button className="btn-ghost" onClick={() => { setFile(null); setAssets(null); setPreviews([]); }}>
              Choose a different image
            </button>
          </div>

          {!icoOnly && (
            <div className="tool-snippet">
              <div className="tool-snippet-head">
                <span>Add to your &lt;head&gt;</span>
                <button className="btn-secondary" onClick={copySnippet}>
                  {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre>{HTML_SNIPPET}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
