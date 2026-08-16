import React, { useState, useMemo } from 'react';
import { Plus, Trash, Copy, Check, DownloadSimple } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';

const START = [
  { color: '#8b5cf6', pos: 0 },
  { color: '#ec4899', pos: 100 },
];

export default function GradientGenerator() {
  const toast = useToast();
  const [type, setType] = useState('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState(START);
  const [copied, setCopied] = useState(null);

  const sorted = useMemo(() => [...stops].sort((a, b) => a.pos - b.pos), [stops]);
  const stopStr = sorted.map(s => `${s.color} ${s.pos}%`).join(', ');
  const css = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopStr})`
    : `radial-gradient(circle, ${stopStr})`;

  const cssCode = `background: ${css};`;
  const svgCode = useMemo(() => {
    const defs = type === 'linear'
      ? `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle - 90} .5 .5)">
${sorted.map(s => `      <stop offset="${s.pos}%" stop-color="${s.color}"/>`).join('\n')}
    </linearGradient>`
      : `<radialGradient id="g">
${sorted.map(s => `      <stop offset="${s.pos}%" stop-color="${s.color}"/>`).join('\n')}
    </radialGradient>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    ${defs}
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
</svg>`;
  }, [type, angle, sorted]);

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast('Copied to clipboard');
      setTimeout(() => setCopied(null), 1400);
    } catch { /* clipboard blocked */ }
  };

  const downloadSvg = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pikfinder-gradient.svg';
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
    toast('SVG downloaded');
  };

  const updateStop = (i, patch) => setStops(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const addStop = () => setStops(prev => [...prev, { color: '#3b82f6', pos: 50 }]);
  const removeStop = (i) => setStops(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div className="gradient-gen">
      <header className="page-header" style={{ padding: '40px 0 24px' }}>
        <h1>Gradient Generator</h1>
        <p>Design a gradient, then export it as CSS or SVG. Add unlimited color stops.</p>
      </header>

      <div className="gradient-preview" style={{ background: css }} />

      <div className="gradient-controls">
        <div className="gradient-type">
          <button className={`filter-pill ${type === 'linear' ? 'active' : ''}`} onClick={() => setType('linear')}>Linear</button>
          <button className={`filter-pill ${type === 'radial' ? 'active' : ''}`} onClick={() => setType('radial')}>Radial</button>
        </div>

        {type === 'linear' && (
          <div className="gradient-angle">
            <label>Angle: {angle}°</label>
            <input type="range" min="0" max="360" value={angle} onChange={e => setAngle(+e.target.value)} />
          </div>
        )}

        <div className="gradient-stops">
          {stops.map((s, i) => (
            <div className="gradient-stop" key={i}>
              <input type="color" value={s.color} onChange={e => updateStop(i, { color: e.target.value })} />
              <input type="range" min="0" max="100" value={s.pos} onChange={e => updateStop(i, { pos: +e.target.value })} />
              <span className="stop-pos">{s.pos}%</span>
              <button className="stop-remove" onClick={() => removeStop(i)} disabled={stops.length <= 2}><Trash /></button>
            </div>
          ))}
          <button className="btn-outline" onClick={addStop}><Plus weight="bold" /> Add color stop</button>
        </div>
      </div>

      <div className="code-exports">
        <div className="code-block">
          <div className="code-head">
            <span>CSS</span>
            <button className="code-copy-btn" onClick={() => copy(cssCode, 'css')}>{copied === 'css' ? <><Check weight="bold" /> Copied</> : <><Copy /> Copy</>}</button>
          </div>
          <pre>{cssCode}</pre>
        </div>
        <div className="code-block">
          <div className="code-head">
            <span>SVG</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="code-copy-btn" onClick={() => copy(svgCode, 'svg')}>{copied === 'svg' ? <><Check weight="bold" /> Copied</> : <><Copy /> Copy</>}</button>
              <button className="code-copy-btn" onClick={downloadSvg}><DownloadSimple /> Download</button>
            </div>
          </div>
          <pre>{svgCode}</pre>
        </div>
      </div>
    </div>
  );
}
