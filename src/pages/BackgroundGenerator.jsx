import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowsClockwise, DownloadSimple, PaintBrush, Sparkle, Drop } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';

const PALETTES = [
  ['#8b5cf6', '#ec4899', '#3b82f6'],
  ['#0ea5e9', '#22d3ee', '#a78bfa'],
  ['#f59e0b', '#ef4444', '#ec4899'],
  ['#10b981', '#22d3ee', '#3b82f6'],
  ['#111827', '#4c1d95', '#7c3aed'],
  ['#f43f5e', '#fb923c', '#facc15'],
  ['#6366f1', '#8b5cf6', '#d946ef'],
];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeConfig(type) {
  const palette = pick(PALETTES);
  return {
    type,
    palette,
    angle: rand(0, 360),
    blobs: Array.from({ length: 5 }, () => ({
      x: Math.random(), y: Math.random(),
      r: rand(0.28, 0.6), color: pick(palette),
    })),
  };
}

// Single draw routine used for both the live preview and the hi-res export.
function draw(ctx, w, h, cfg) {
  ctx.clearRect(0, 0, w, h);

  if (cfg.type === 'gradient') {
    const rad = (cfg.angle * Math.PI) / 180;
    const x = Math.cos(rad), y = Math.sin(rad);
    const g = ctx.createLinearGradient(w / 2 - x * w / 2, h / 2 - y * h / 2, w / 2 + x * w / 2, h / 2 + y * h / 2);
    cfg.palette.forEach((c, i) => g.addColorStop(i / (cfg.palette.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Base fill for mesh/abstract.
  ctx.fillStyle = cfg.palette[0];
  ctx.fillRect(0, 0, w, h);

  if (cfg.type === 'mesh') {
    ctx.globalCompositeOperation = 'lighter';
    cfg.blobs.forEach(b => {
      const grd = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
      grd.addColorStop(0, b.color);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    });
    ctx.globalCompositeOperation = 'source-over';
  } else { // abstract — soft blurred blobs
    ctx.filter = `blur(${Math.round(Math.max(w, h) * 0.05)}px)`;
    cfg.blobs.forEach(b => {
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.75;
      ctx.arc(b.x * w, b.y * h, b.r * Math.min(w, h) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }
}

const TYPES = [
  { key: 'gradient', label: 'Gradient', icon: PaintBrush },
  { key: 'mesh', label: 'Mesh Gradient', icon: Drop },
  { key: 'abstract', label: 'Abstract', icon: Sparkle },
];

export default function BackgroundGenerator() {
  const toast = useToast();
  const canvasRef = useRef(null);
  const [type, setType] = useState('mesh');
  const [cfg, setCfg] = useState(() => makeConfig('mesh'));

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    draw(ctx, canvas.width, canvas.height, cfg);
  }, [cfg]);

  useEffect(() => { render(); }, [render]);

  const regenerate = () => setCfg(makeConfig(type));
  const changeType = (t) => { setType(t); setCfg(makeConfig(t)); };

  const exportPng = () => {
    const off = document.createElement('canvas');
    off.width = 1920; off.height = 1080;
    draw(off.getContext('2d'), off.width, off.height, cfg);
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pikfinder-${cfg.type}-background.png`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      toast('Background exported as PNG');
    }, 'image/png');
  };

  return (
    <div className="bg-generator">
      <header className="page-header">
        <h1>Background Generator</h1>
        <p>Create gradients, mesh gradients, and abstract backgrounds. Export at 1920×1080 PNG.</p>
      </header>

      <div className="bg-type-tabs">
        {TYPES.map(t => (
          <button key={t.key} className={`bg-type-tab ${type === t.key ? 'active' : ''}`} onClick={() => changeType(t.key)}>
            <t.icon weight={type === t.key ? 'fill' : 'regular'} /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-canvas-wrap">
        <canvas ref={canvasRef} width={960} height={540} className="bg-canvas" />
      </div>

      <div className="bg-controls">
        <button className="btn-outline" onClick={regenerate}><ArrowsClockwise weight="bold" /> Regenerate</button>
        <button className="btn-primary" onClick={exportPng}><DownloadSimple /> Export PNG</button>
      </div>

      <div className="bg-palette-preview">
        {cfg.palette.map((c, i) => (
          <span key={i} className="bg-palette-dot" style={{ background: c }} title={c} />
        ))}
      </div>
    </div>
  );
}
