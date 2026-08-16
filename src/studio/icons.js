// src/studio/icons.js
// Canva-style "Elements": a catalog of shapes/icons plus a procedural path
// builder that draws each one onto a 2D canvas. Everything is a filled vector,
// so elements stay crisp at any size and recolor instantly.

// Catalog. `kind` maps to the path builder; `icon` is the Phosphor component
// name used for the panel tile preview (resolved in StudioApp).
export const ELEMENTS = [
  { kind: 'square',      label: 'Square',    icon: 'Square',   keywords: 'rectangle box' },
  { kind: 'roundRect',   label: 'Rounded',   icon: 'Square',   keywords: 'rounded rectangle box card' },
  { kind: 'circle',      label: 'Circle',    icon: 'Circle',   keywords: 'ellipse round dot' },
  { kind: 'triangle',    label: 'Triangle',  icon: 'Triangle', keywords: 'arrow up pyramid' },
  { kind: 'diamond',     label: 'Diamond',   icon: 'Diamond',  keywords: 'rhombus gem' },
  { kind: 'pentagon',    label: 'Pentagon',  icon: 'Pentagon', keywords: 'polygon five' },
  { kind: 'hexagon',     label: 'Hexagon',   icon: 'Hexagon',  keywords: 'polygon six honeycomb' },
  { kind: 'star5',       label: 'Star',      icon: 'Star',     keywords: 'favourite rating award' },
  { kind: 'star6',       label: 'Sparkle',   icon: 'StarFour', keywords: 'star sparkle shine' },
  { kind: 'heart',       label: 'Heart',     icon: 'Heart',    keywords: 'love like valentine' },
  { kind: 'arrowRight',  label: 'Arrow',     icon: 'ArrowRight', keywords: 'direction next right' },
  { kind: 'arrowUp',     label: 'Arrow Up',  icon: 'ArrowUp',  keywords: 'direction up' },
  { kind: 'chevron',     label: 'Chevron',   icon: 'CaretRight', keywords: 'arrow next play' },
  { kind: 'plus',        label: 'Plus',      icon: 'Plus',     keywords: 'cross add medical' },
  { kind: 'lightning',   label: 'Bolt',      icon: 'Lightning', keywords: 'flash energy power thunder' },
  { kind: 'speech',      label: 'Speech',    icon: 'ChatCircle', keywords: 'bubble chat message talk' },
  { kind: 'pin',         label: 'Pin',       icon: 'MapPin',   keywords: 'location map marker place' },
  { kind: 'line',        label: 'Line',      icon: 'Minus',    keywords: 'divider rule bar' },
];

// Canvas blend modes (friendly label → globalCompositeOperation value).
export const BLEND_MODES = [
  ['normal', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'],
  ['darken', 'Darken'], ['lighten', 'Lighten'], ['color-dodge', 'Color Dodge'], ['color-burn', 'Color Burn'],
  ['hard-light', 'Hard Light'], ['soft-light', 'Soft Light'], ['difference', 'Difference'],
  ['exclusion', 'Exclusion'], ['hue', 'Hue'], ['saturation', 'Saturation'], ['color', 'Color'], ['luminosity', 'Luminosity'],
];

// Build a linear gradient fill spanning a layer's box at a given angle.
export function makeGradient(ctx, l) {
  const g = l.grad || {};
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
  const r = Math.max(l.w, l.h) / 2 || 1;
  const a = (g.angle ?? 90) * Math.PI / 180;
  // Match CSS: 0deg points up, 90deg points right.
  const dx = Math.sin(a), dy = -Math.cos(a);
  const grad = ctx.createLinearGradient(cx - dx * r, cy - dy * r, cx + dx * r, cy + dy * r);
  grad.addColorStop(0, g.c1 || '#8b5cf6');
  grad.addColorStop(1, g.c2 || '#ec4899');
  return grad;
}

// Trace a shape's path into `ctx` (caller fills/strokes). Coordinates are the
// element's bounding box (x, y, w, h) in canvas pixels.
export function buildShapePath(ctx, kind, x, y, w, h, radius = 0) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rMax = Math.min(w, h) / 2;
  ctx.beginPath();
  switch (kind) {
    case 'square':
      if (radius > 0) ctx.roundRect(x, y, w, h, Math.min(radius, rMax));
      else ctx.rect(x, y, w, h);
      break;
    case 'roundRect':
      ctx.roundRect(x, y, w, h, Math.min(radius > 0 ? radius : Math.min(w, h) * 0.16, rMax));
      break;
    case 'circle':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.moveTo(cx, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(cx, y); ctx.lineTo(x + w, cy); ctx.lineTo(cx, y + h); ctx.lineTo(x, cy); ctx.closePath();
      break;
    case 'pentagon':
      polygon(ctx, cx, cy, w / 2, h / 2, 5, -90);
      break;
    case 'hexagon':
      polygon(ctx, cx, cy, w / 2, h / 2, 6, -90);
      break;
    case 'star5':
      star(ctx, cx, cy, w / 2, h / 2, 5, 0.42, -90);
      break;
    case 'star6':
      star(ctx, cx, cy, w / 2, h / 2, 4, 0.42, -90);
      break;
    case 'heart':
      heart(ctx, x, y, w, h);
      break;
    case 'arrowRight':
      fromPoints(ctx, [[0.02, 0.32], [0.6, 0.32], [0.6, 0.12], [0.98, 0.5], [0.6, 0.88], [0.6, 0.68], [0.02, 0.68]], x, y, w, h);
      break;
    case 'arrowUp':
      fromPoints(ctx, [[0.32, 0.98], [0.32, 0.4], [0.12, 0.4], [0.5, 0.02], [0.88, 0.4], [0.68, 0.4], [0.68, 0.98]], x, y, w, h);
      break;
    case 'chevron':
      fromPoints(ctx, [[0.2, 0.05], [0.45, 0.05], [0.8, 0.5], [0.45, 0.95], [0.2, 0.95], [0.55, 0.5]], x, y, w, h);
      break;
    case 'plus':
      fromPoints(ctx, [[0.34, 0], [0.66, 0], [0.66, 0.34], [1, 0.34], [1, 0.66], [0.66, 0.66], [0.66, 1], [0.34, 1], [0.34, 0.66], [0, 0.66], [0, 0.34], [0.34, 0.34]], x, y, w, h);
      break;
    case 'lightning':
      fromPoints(ctx, [[0.58, 0.02], [0.16, 0.56], [0.44, 0.56], [0.34, 0.98], [0.82, 0.4], [0.52, 0.4]], x, y, w, h);
      break;
    case 'speech':
      speech(ctx, x, y, w, h);
      break;
    case 'pin':
      pin(ctx, x, y, w, h);
      break;
    case 'line':
      ctx.rect(x, cy - Math.max(2, h * 0.06), w, Math.max(4, h * 0.12));
      break;
    default:
      ctx.rect(x, y, w, h);
  }
}

// Records the same path calls buildShapePath makes, but as an SVG `d` string —
// used by the vector SVG exporter. Curves stay curves; canvas arcs are sampled.
const _round = (v) => Math.round(v * 100) / 100;
class SvgPathRecorder {
  constructor() { this.d = ''; }
  beginPath() { this.d = ''; }
  moveTo(x, y) { this.d += `M ${_round(x)} ${_round(y)} `; }
  lineTo(x, y) { this.d += `L ${_round(x)} ${_round(y)} `; }
  closePath() { this.d += 'Z '; }
  bezierCurveTo(a, b, c, d, x, y) { this.d += `C ${_round(a)} ${_round(b)} ${_round(c)} ${_round(d)} ${_round(x)} ${_round(y)} `; }
  rect(x, y, w, h) { this.d += `M ${_round(x)} ${_round(y)} H ${_round(x + w)} V ${_round(y + h)} H ${_round(x)} Z `; }
  roundRect(x, y, w, h, r) {
    r = Math.min(r, Math.min(w, h) / 2);
    this.d += `M ${_round(x + r)} ${_round(y)} H ${_round(x + w - r)} A ${_round(r)} ${_round(r)} 0 0 1 ${_round(x + w)} ${_round(y + r)} V ${_round(y + h - r)} A ${_round(r)} ${_round(r)} 0 0 1 ${_round(x + w - r)} ${_round(y + h)} H ${_round(x + r)} A ${_round(r)} ${_round(r)} 0 0 1 ${_round(x)} ${_round(y + h - r)} V ${_round(y + r)} A ${_round(r)} ${_round(r)} 0 0 1 ${_round(x + r)} ${_round(y)} Z `;
  }
  ellipse(cx, cy, rx, ry) {
    this.d += `M ${_round(cx - rx)} ${_round(cy)} A ${_round(rx)} ${_round(ry)} 0 1 0 ${_round(cx + rx)} ${_round(cy)} A ${_round(rx)} ${_round(ry)} 0 1 0 ${_round(cx - rx)} ${_round(cy)} Z `;
  }
  arc(cx, cy, r, a0, a1, ccw = false) {
    let s = a0, e = a1;
    if (!ccw && e < s) e += 2 * Math.PI;
    if (ccw && e > s) e -= 2 * Math.PI;
    const N = Math.max(8, Math.ceil(Math.abs(e - s) / (Math.PI / 16)));
    for (let i = 0; i <= N; i++) { const t = s + (e - s) * i / N; this.d += `L ${_round(cx + r * Math.cos(t))} ${_round(cy + r * Math.sin(t))} `; }
  }
  arcTo(x1, y1) { this.d += `L ${_round(x1)} ${_round(y1)} `; } // corner (approx; slightly sharper)
}

// Return an SVG path `d` string for a shape kind at (x,y,w,h).
export function shapeToSvgPath(kind, x, y, w, h, radius = 0) {
  const rec = new SvgPathRecorder();
  buildShapePath(rec, kind, x, y, w, h, radius);
  return rec.d.trim();
}

// --- geometry helpers ---
function polygon(ctx, cx, cy, rx, ry, n, startDeg) {
  for (let i = 0; i < n; i++) {
    const a = (startDeg + (i * 360) / n) * Math.PI / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function star(ctx, cx, cy, rx, ry, points, inner, startDeg) {
  const n = points * 2;
  for (let i = 0; i < n; i++) {
    const rr = i % 2 ? inner : 1;
    const a = (startDeg + (i * 180) / points) * Math.PI / 180;
    const px = cx + rx * rr * Math.cos(a);
    const py = cy + ry * rr * Math.sin(a);
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function fromPoints(ctx, pts, x, y, w, h) {
  pts.forEach(([fx, fy], i) => {
    const px = x + fx * w;
    const py = y + fy * h;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  });
  ctx.closePath();
}

function heart(ctx, x, y, w, h) {
  const topY = y + h * 0.28;
  ctx.moveTo(x + w / 2, y + h);
  ctx.bezierCurveTo(x - w * 0.02, y + h * 0.60, x + w * 0.10, y + h * 0.02, x + w / 2, topY);
  ctx.bezierCurveTo(x + w * 0.90, y + h * 0.02, x + w * 1.02, y + h * 0.60, x + w / 2, y + h);
  ctx.closePath();
}

function speech(ctx, x, y, w, h) {
  const bh = h * 0.78;                 // bubble body height
  const r = Math.min(w, bh) * 0.18;    // corner radius
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + bh - r);
  ctx.arcTo(x + w, y + bh, x + w - r, y + bh, r);
  ctx.lineTo(x + w * 0.4, y + bh);
  ctx.lineTo(x + w * 0.22, y + h);      // tail
  ctx.lineTo(x + w * 0.28, y + bh);
  ctx.lineTo(x + r, y + bh);
  ctx.arcTo(x, y + bh, x, y + bh - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function pin(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const r = w / 2;
  const cy = y + r;                     // circle centre near top
  // Teardrop: arc across the top, then two lines down to the point.
  ctx.moveTo(x, cy);
  ctx.arc(cx, cy, r, Math.PI, 0);       // top half circle (left→right)
  ctx.lineTo(cx, y + h);                // right side down to tip
  ctx.closePath();                      // back up the left side to start
}
