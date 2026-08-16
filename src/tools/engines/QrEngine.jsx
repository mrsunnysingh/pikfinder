import React, { useState, useEffect, useCallback } from 'react';
import { saveBlob } from '../ToolShell';

export default function QrEngine() {
  const [text, setText] = useState('https://pikfinder.com');
  const [size, setSize] = useState(512);
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [pngUrl, setPngUrl] = useState(null);
  const [svgText, setSvgText] = useState(null);
  const [error, setError] = useState(null);

  const generate = useCallback(async (value, s, d, l) => {
    if (!value.trim()) { setPngUrl(null); setSvgText(null); return; }
    setError(null);
    try {
      const QRCode = (await import('qrcode')).default;
      const opts = { width: s, margin: 2, color: { dark: d, light: l }, errorCorrectionLevel: 'M' };
      const [png, svg] = await Promise.all([
        QRCode.toDataURL(value, opts),
        QRCode.toString(value, { ...opts, type: 'svg' }),
      ]);
      setPngUrl(png);
      setSvgText(svg);
    } catch (e) {
      setError(e.message || 'Could not generate a QR code for this input.');
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => generate(text, size, dark, light), 250);
    return () => clearTimeout(id);
  }, [text, size, dark, light, generate]);

  const downloadPng = () => {
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'qr-code.png';
    a.click();
  };

  const downloadSvg = () => {
    saveBlob(new Blob([svgText], { type: 'image/svg+xml' }), 'qr-code.svg');
  };

  return (
    <div className="tool-engine">
      <div className="tool-controls">
        <label className="tool-control tool-control-wide">
          <span>Link or text</span>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com or any text, WiFi string, vCard..."
          />
        </label>
        <label className="tool-control">
          <span>Size: {size}px</span>
          <input type="range" min="128" max="2048" step="64" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <label className="tool-control">
          <span>Foreground</span>
          <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
        </label>
        <label className="tool-control">
          <span>Background</span>
          <input type="color" value={light} onChange={(e) => setLight(e.target.value)} />
        </label>
      </div>

      {error && <p className="tool-error">{error}</p>}

      {pngUrl && (
        <>
          <div className="tool-preview tool-qr-preview">
            <img src={pngUrl} alt={`QR code for: ${text.slice(0, 60)}`} width={Math.min(size, 320)} height={Math.min(size, 320)} />
          </div>
          <div className="tool-controls">
            <button className="btn-primary" onClick={downloadPng}>Download PNG</button>
            <button className="btn-secondary" onClick={downloadSvg}>Download SVG</button>
          </div>
        </>
      )}
    </div>
  );
}
