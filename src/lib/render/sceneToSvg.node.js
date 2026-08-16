// src/lib/render/sceneToSvg.node.js
// Pure SVG serializer for a PikFinder document ({ dims, bg, layers }). Ported
// from StudioApp.sceneToSvg with NO browser deps, so it runs in a serverless
// function. Text width/height are ESTIMATED (there is no canvas to measure
// with server-side); positioning uses SVG text-anchor so alignment is exact.
// Shapes reuse the geometry recorder from studio/icons.js (pure).

import { shapeToSvgPath } from '../../studio/icons.js';

const nn = (v) => Math.round((v || 0) * 100) / 100;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const applyCase = (t, c) => (c === 'upper' ? String(t).toUpperCase() : c === 'lower' ? String(t).toLowerCase() : String(t));

// Rough glyph metrics (server has no font metrics). Good enough for the bounding
// box used by gradients/rotation pivots; SVG text-anchor handles real alignment.
function estimateTextBounds(l) {
  const size = l.size || 16;
  const lines = applyCase(l.text ?? '', l.textCase).split('\n');
  const maxChars = Math.max(1, ...lines.map((s) => s.length));
  const w = Math.ceil(maxChars * size * 0.55);
  const h = Math.ceil(lines.length * size * (l.lineHeight || 1.2));
  let x = l.x;
  if (l.align === 'center') x = l.x - w / 2;
  else if (l.align === 'right') x = l.x - w;
  return { x, y: l.y, w, h };
}
function boundsOf(l) {
  if (l.type === 'text') return estimateTextBounds(l);
  return { x: l.x, y: l.y, w: l.w ?? 200, h: l.h ?? 100 };
}

export function sceneToSvg({ dims, bg = { type: 'solid', color: '#ffffff' }, layers = [] }) {
  const W = dims.w, H = dims.h;
  const defs = [];
  let gid = 0;

  const gradDef = (grad, x, y, w, h) => {
    const id = `grad${gid++}`;
    const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2 || 1;
    const a = ((grad?.angle ?? 90)) * Math.PI / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const stops = (grad?.stops && grad.stops.length >= 2)
      ? grad.stops.map((s) => `<stop offset="${Math.max(0, Math.min(1, s.pos))}" stop-color="${s.color}"/>`).join('')
      : `<stop offset="0" stop-color="${grad?.c1 || '#8b5cf6'}"/><stop offset="1" stop-color="${grad?.c2 || '#ec4899'}"/>`;
    defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${nn(cx - dx * r)}" y1="${nn(cy - dy * r)}" x2="${nn(cx + dx * r)}" y2="${nn(cy + dy * r)}">${stops}</linearGradient>`);
    return `url(#${id})`;
  };
  const bgStops = (b) => (Array.isArray(b.stops) && b.stops.length >= 2)
    ? b.stops.map((s) => ({ color: s.color || '#000', pos: Math.max(0, Math.min(1, s.pos ?? 0)) })).sort((a, b2) => a.pos - b2.pos)
    : [{ color: b.color || '#fff', pos: 0 }, { color: b.color2 || '#000', pos: 1 }];
  const fillOf = (l) => (l.fillType === 'gradient' ? gradDef(l.grad, l.x, l.y, l.w, l.h) : (l.color === 'none' ? 'none' : l.color));
  const strokeAttr = (l) => (l.strokeW > 0 ? ` stroke="${l.strokeColor || '#000'}" stroke-width="${l.strokeW}"` : '');

  const rgba = (hex, a) => {
    const h = String(hex || '#ffffff').replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16); const g = parseInt(n.slice(2, 4), 16); const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r || 255},${g || 255},${b || 255},${a})`;
  };

  // Drop-shadow / outer-glow → an SVG filter (browsers render feDropShadow; the
  // primary raster export uses the canvas path, so this keeps thumbnails faithful).
  const fxFilter = (l) => {
    const fx = l.fx; if (!fx) return '';
    let fe = '';
    if (fx.glow?.on) {
      fe = `<feDropShadow dx="0" dy="0" stdDeviation="${nn((fx.glow.blur ?? 24) / 2)}" flood-color="${fx.glow.color || '#8b5cf6'}" flood-opacity="0.9"/>`;
    } else if (fx.shadow?.on) {
      fe = `<feDropShadow dx="${nn(fx.shadow.x ?? 0)}" dy="${nn(fx.shadow.y ?? 8)}" stdDeviation="${nn((fx.shadow.blur ?? 12) / 2)}" flood-color="${fx.shadow.color || 'rgba(0,0,0,0.35)'}"/>`;
    }
    if (!fe) return '';
    const id = `fx${gid++}`;
    defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">${fe}</filter>`);
    return ` filter="url(#${id})"`;
  };
  // Glassmorphism (shapes) → translucent tint fill + light border. SVG can't blur
  // the backdrop reliably, so this is the flat frosted approximation.
  const isGlass = (l) => !!(l.fx && l.fx.glass && l.fx.glass.on);
  const glassFill = (l) => rgba(l.fx.glass.tint || '#ffffff', Math.max(l.fx.glass.opacity ?? 0.18, 0.22));
  const glassStroke = ' stroke="rgba(255,255,255,0.5)" stroke-width="1.5"';
  const wrapAttrs = (l) => {
    const b = boundsOf(l);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const rot = l.rotate || l.imgStyle?.rotate || 0;
    const parts = [];
    if (rot) parts.push(`rotate(${nn(rot)} ${nn(cx)} ${nn(cy)})`);
    if (l.imgStyle?.flipH) parts.push(`translate(${nn(2 * cx)} 0) scale(-1 1)`);
    if (l.imgStyle?.flipV) parts.push(`translate(0 ${nn(2 * cy)}) scale(1 -1)`);
    let a = parts.length ? ` transform="${parts.join(' ')}"` : '';
    if ((l.opacity ?? 1) < 1) a += ` opacity="${l.opacity}"`;
    if (l.blend && l.blend !== 'normal') a += ` style="mix-blend-mode:${l.blend}"`;
    return a;
  };

  let body = '';
  if (bg.type === 'transparent') {
    // no background rect — keep alpha
  } else if (bg.type === 'gradient') {
    body += `<rect width="${W}" height="${H}" fill="${gradDef({ angle: bg.angle, stops: bgStops(bg) }, 0, 0, W, H)}"/>`;
  } else {
    body += `<rect width="${W}" height="${H}" fill="${bg.color}"/>`;
  }

  for (const l of layers) {
    if (l.hidden) continue;
    const w = wrapAttrs(l) + fxFilter(l);
    if (l.type === 'text') {
      const anchor = l.align === 'center' ? 'middle' : l.align === 'right' ? 'end' : 'start';
      const lines = applyCase(l.text ?? '', l.textCase).split('\n');
      const lh = (l.size || 16) * (l.lineHeight || 1.2);
      const tspans = lines.map((ln, i) => `<tspan x="${nn(l.x)}" dy="${i === 0 ? 0 : nn(lh)}">${esc(ln) || ' '}</tspan>`).join('');
      const tb = boundsOf(l);
      const tFill = l.fillType === 'gradient' ? gradDef(l.grad, tb.x, tb.y, tb.w, tb.h) : l.color;
      const tStroke = l.strokeW > 0 ? ` stroke="${l.strokeColor || '#000'}" stroke-width="${l.strokeW}" paint-order="stroke"` : '';
      body += `<text x="${nn(l.x)}" y="${nn(l.y)}" font-family="${esc(l.font || 'Inter')}" font-size="${l.size}" font-weight="${l.weight || 400}" fill="${tFill}"${tStroke} text-anchor="${anchor}" dominant-baseline="text-before-edge" letter-spacing="${l.spacing || 0}"${l.italic ? ' font-style="italic"' : ''}${l.underline ? ' text-decoration="underline"' : ''}${w}>${tspans}</text>`;
    } else if (l.type === 'rect') {
      const gl = isGlass(l);
      body += `<rect x="${nn(l.x)}" y="${nn(l.y)}" width="${nn(l.w)}" height="${nn(l.h)}" rx="${l.radius || 0}" fill="${gl ? glassFill(l) : fillOf(l)}"${gl ? glassStroke : strokeAttr(l)}${w}/>`;
    } else if (l.type === 'ellipse') {
      const gl = isGlass(l);
      body += `<ellipse cx="${nn(l.x + l.w / 2)}" cy="${nn(l.y + l.h / 2)}" rx="${nn(l.w / 2)}" ry="${nn(l.h / 2)}" fill="${gl ? glassFill(l) : fillOf(l)}"${gl ? glassStroke : strokeAttr(l)}${w}/>`;
    } else if (l.type === 'shape') {
      const gl = isGlass(l);
      body += `<path d="${shapeToSvgPath(l.shape, l.x, l.y, l.w, l.h, l.radius || 0)}" fill="${gl ? glassFill(l) : fillOf(l)}"${gl ? glassStroke : strokeAttr(l)}${w}/>`;
    } else if ((l.type === 'image') && l.src) {
      body += `<image href="${esc(l.src)}" x="${nn(l.x)}" y="${nn(l.y)}" width="${nn(l.w)}" height="${nn(l.h)}" preserveAspectRatio="none"${w}/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join('')}</defs>${body}</svg>`;
}
