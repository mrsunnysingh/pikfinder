// src/studio/ColorField.jsx
// A reusable colour control with an ALPHA (transparency) channel — the native
// <input type="color"> can't do alpha, so this wraps it with an opacity slider.
// Value is any CSS colour string (hex, #RRGGBBAA, or rgba()); it emits rgba()
// when alpha < 1 and plain hex when fully opaque, both of which canvas fillStyle
// and browser-rendered SVG understand.

import React, { useState, useRef, useEffect } from 'react';

export function parseColor(str) {
  const s = String(str ?? '').trim();
  if (!s || s === 'none') return { r: 139, g: 92, b: 246, a: 1 };
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return { r: r || 0, g: g || 0, b: b || 0, a: Number.isFinite(a) ? a : 1 };
    }
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0, a: p[3] === undefined ? 1 : p[3] };
  }
  return { r: 139, g: 92, b: 246, a: 1 };
}

const hx = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export const toHex = ({ r, g, b }) => `#${hx(r)}${hx(g)}${hx(b)}`;
export const toCss = ({ r, g, b, a }) => (a >= 1
  ? toHex({ r, g, b })
  : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${Math.round(a * 100) / 100})`);

export default function ColorField({ value, onChange, onCommit, allowAlpha = true, title = 'Color' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const swatchRef = useRef(null);
  const c = parseColor(value);

  // Position the popover with fixed coordinates anchored to the swatch, so it
  // never gets clipped by the scrolling inspector panel. Flip up if near bottom.
  const place = () => {
    const el = swatchRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 210, H = 150;
    let left = Math.min(r.right - W, window.innerWidth - W - 8);
    left = Math.max(8, left);
    let top = r.bottom + 6;
    if (top + H > window.innerHeight - 8) top = Math.max(8, r.top - H - 6);
    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); onCommit && onCommit(); }
    };
    const reflow = () => place();
    window.addEventListener('pointerdown', close);
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
    };
  }, [open, onCommit]);

  const emit = (next) => onChange(toCss(next));
  const toggle = () => { if (!open) place(); setOpen((o) => !o); };

  return (
    <div className="cf-wrap" ref={ref}>
      <button type="button" ref={swatchRef} className="cf-swatch" title={title} onClick={toggle}>
        <span className="cf-swatch-color" style={{ background: toCss(c) }} />
      </button>
      {open && (
        <div className="cf-pop" style={{ position: 'fixed', top: pos.top, left: pos.left }} onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="color"
            className="cf-native"
            value={toHex(c)}
            onChange={(e) => { const p = parseColor(e.target.value); emit({ ...p, a: c.a }); }}
          />
          {allowAlpha && (
            <label className="cf-alpha">
              <span>Opacity</span>
              <input type="range" min="0" max="100" value={Math.round(c.a * 100)} onChange={(e) => emit({ ...c, a: +e.target.value / 100 })} />
              <span className="cf-alpha-val">{Math.round(c.a * 100)}%</span>
            </label>
          )}
          <input
            className="cf-hex"
            type="text"
            value={toCss(c)}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => onCommit && onCommit()}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
