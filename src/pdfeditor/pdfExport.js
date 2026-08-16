// src/pdfeditor/pdfExport.js
// Rebuilds an edited PDF with pdf-lib. Each page keeps its original rendering as
// a background image (so unedited text/graphics stay pixel-faithful), then draws
// the user's changes on top: edited/added text (bold/italic/underline, color,
// opacity, rotation), images, shapes, highlights, whiteout and pen drawings.
//
// Coordinates: the editor uses top-left origin (y down, PDF points). pdf-lib uses
// bottom-left origin (y up), so we flip. Rotation is applied around each element's
// centre to match the on-screen editor (transform-origin: center).

const hexToRgb01 = (hex) => {
  let h = String(hex || '#000').trim();
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(h);
  if (m) return [(+m[1]) / 255, (+m[2]) / 255, (+m[3]) / 255];
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h || '000000', 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function dataUrlToBytes(dataUrl) {
  const base64 = String(dataUrl).split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const winAnsiSafe = (s) => Array.from(String(s ?? '')).map((ch) => (ch.charCodeAt(0) > 255 ? '?' : ch)).join('');

// Given an element's top-left (x,y), size (w,h) in editor space, its clockwise
// rotation and the page height, return the pdf-lib draw origin + ccw angle so the
// element rotates around its centre.
function placeRotated(x, y, w, h, rotate, pageH) {
  const a = (-(rotate || 0)) * Math.PI / 180; // pdf-lib is counter-clockwise
  const cx = x + w / 2;
  const cyTop = y + h / 2;
  const cy = pageH - cyTop; // to pdf space
  const cos = Math.cos(a), sin = Math.sin(a);
  // bottom-left corner of the (unrotated) box relative to centre is (-w/2, -h/2)
  const ox = cx + (-w / 2) * cos - (-h / 2) * sin;
  const oy = cy + (-w / 2) * sin + (-h / 2) * cos;
  return { x: ox, y: oy, deg: -(rotate || 0) };
}

// Re-encode a PNG data URL to a smaller JPEG (used by "Compress"). Backgrounds
// are the bulk of the file, so this shrinks the PDF a lot with minor quality loss.
async function recodeToJpeg(dataUrl, quality = 0.6) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0);
  const jpg = cv.toDataURL('image/jpeg', quality);
  return dataUrlToBytes(jpg);
}

export async function buildPdf(pages, opts = {}) {
  const { PDFDocument, StandardFonts, rgb, degrees, BlendMode, PDFName, PDFString } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const fonts = {
    normal: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdf.embedFont(StandardFonts.HelveticaBoldOblique),
  };
  const fontOf = (l) => (l.bold && l.italic ? fonts.boldItalic : l.bold ? fonts.bold : l.italic ? fonts.italic : fonts.normal);
  const col = (hex) => { const [r, g, b] = hexToRgb01(hex); return rgb(r, g, b); };

  for (const pageData of pages) {
    const { w, h, bg, layers = [] } = pageData;
    const page = pdf.addPage([w, h]);
    const flipY = (y, hh) => h - (y + hh);

    if (bg) {
      try {
        const img = opts.compress
          ? await pdf.embedJpg(await recodeToJpeg(bg, 0.55))
          : await pdf.embedPng(dataUrlToBytes(bg));
        page.drawImage(img, { x: 0, y: 0, width: w, height: h });
      } catch { /* skip bad bg */ }
    }

    for (const l of layers) {
      if (l.hidden) continue;
      const op = l.opacity == null ? 1 : l.opacity;
      const rot = l.rotate || 0;

      if (l.type === 'whiteout' || l.type === 'highlight' || l.type === 'shape') {
        const color = col(l.color || (l.type === 'highlight' ? '#fde047' : '#ffffff'));
        const opacity = l.type === 'highlight' ? (l.opacity == null ? 0.4 : l.opacity) : op;
        // Highlight blends with the text underneath (marker look) like the editor.
        const base = { width: l.w, height: l.h, color, opacity, ...(l.type === 'highlight' && BlendMode ? { blendMode: BlendMode.Multiply } : {}) };
        if (rot) { const p = placeRotated(l.x, l.y, l.w, l.h, rot, h); page.drawRectangle({ ...base, x: p.x, y: p.y, rotate: degrees(p.deg) }); }
        else page.drawRectangle({ ...base, x: l.x, y: flipY(l.y, l.h) });
      } else if (l.type === 'image' && l.src) {
        try {
          const bytes = dataUrlToBytes(l.src);
          const img = /^data:image\/jpe?g/i.test(l.src) ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
          const base = { width: l.w, height: l.h, opacity: op };
          if (rot) { const p = placeRotated(l.x, l.y, l.w, l.h, rot, h); page.drawImage(img, { ...base, x: p.x, y: p.y, rotate: degrees(p.deg) }); }
          else page.drawImage(img, { ...base, x: l.x, y: flipY(l.y, l.h) });
        } catch { /* skip bad image */ }
      } else if (l.type === 'draw' && Array.isArray(l.points)) {
        const c = col(l.color || '#111');
        for (let i = 1; i < l.points.length; i++) {
          const a = l.points[i - 1], b = l.points[i];
          page.drawLine({ start: { x: a.x, y: h - a.y }, end: { x: b.x, y: h - b.y }, thickness: l.width || 2, color: c, opacity: op });
        }
      } else if (l.type === 'link') {
        // Faint underline marks the clickable area; add a real URI link annotation.
        if (l.url) {
          page.drawLine({ start: { x: l.x, y: h - (l.y + l.h) }, end: { x: l.x + l.w, y: h - (l.y + l.h) }, thickness: 1, color: col('#2563eb'), opacity: 0.5 });
          try {
            const annot = pdf.context.obj({
              Type: 'Annot', Subtype: 'Link', Border: [0, 0, 0],
              Rect: [l.x, h - (l.y + l.h), l.x + l.w, h - l.y],
              A: pdf.context.obj({ Type: 'Action', S: 'URI', URI: PDFString.of(String(l.url)) }),
            });
            const ref = pdf.context.register(annot);
            const existing = page.node.Annots();
            if (existing) existing.push(ref);
            else page.node.set(PDFName.of('Annots'), pdf.context.obj([ref]));
          } catch { /* link annotation is best-effort */ }
        }
      } else if (l.type === 'text') {
        if (l.original && !l.edited) continue;
        if (l.cover || (l.original && l.edited)) {
          page.drawRectangle({ x: l.x - 1, y: flipY(l.y, l.h), width: l.w + 2, height: l.h, color: col(l.cover || '#ffffff') });
        }
        if (l.field) {
          page.drawRectangle({ x: l.x, y: flipY(l.y, l.h), width: l.w, height: l.h, borderColor: col('#94a3b8'), borderWidth: 1 });
        }
        const size = l.size || 14;
        const font = fontOf(l);
        const lh = size * (l.lineHeight || 1.25);
        String(l.text ?? '').split('\n').forEach((ln, i) => {
          const text = winAnsiSafe(ln);
          if (!text) return;
          let x = l.x;
          if (l.align === 'center' || l.align === 'right') {
            const tw = font.widthOfTextAtSize(text, size);
            x = l.align === 'center' ? l.x + (l.w - tw) / 2 : l.x + l.w - tw;
          }
          const topY = l.y + size + i * lh;
          const draw = { size, font, color: col(l.color || '#111'), opacity: op };
          try {
            if (rot) { const p = placeRotated(x, topY - size, font.widthOfTextAtSize(text, size), size, rot, h); page.drawText(text, { ...draw, x: p.x, y: p.y, rotate: degrees(p.deg) }); }
            else page.drawText(text, { ...draw, x, y: h - topY });
            if (l.underline) {
              const tw = font.widthOfTextAtSize(text, size);
              page.drawLine({ start: { x, y: h - topY - 2 }, end: { x: x + tw, y: h - topY - 2 }, thickness: Math.max(0.5, size / 16), color: col(l.color || '#111'), opacity: op });
            }
          } catch { /* skip unencodable line */ }
        });
      }
    }
  }
  const bytes = await pdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

// Composite a single page (bg + layers) to a PNG blob at `scale`.
export async function exportPagePng(pageData, scale = 2) {
  const { w, h, bg, layers = [] } = pageData;
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * scale);
  cv.height = Math.round(h * scale);
  const ctx = cv.getContext('2d');
  ctx.scale(scale, scale);
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  if (bg) { try { ctx.drawImage(await loadImg(bg), 0, 0, w, h); } catch { /* skip */ } }

  for (const l of layers) {
    if (l.hidden) continue;
    ctx.save();
    ctx.globalAlpha = l.opacity == null ? (l.type === 'highlight' ? 0.4 : 1) : l.opacity;
    if (l.rotate && l.type !== 'draw') { const cx = l.x + (l.w || 0) / 2, cy = l.y + (l.h || 0) / 2; ctx.translate(cx, cy); ctx.rotate((l.rotate * Math.PI) / 180); ctx.translate(-cx, -cy); }

    if (l.type === 'whiteout' || l.type === 'shape') { ctx.fillStyle = l.color || '#fff'; ctx.fillRect(l.x, l.y, l.w, l.h); }
    else if (l.type === 'highlight') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = l.color || '#fde047'; ctx.fillRect(l.x, l.y, l.w, l.h); }
    else if (l.type === 'image' && l.src) { try { ctx.drawImage(await loadImg(l.src), l.x, l.y, l.w, l.h); } catch { /* skip */ } }
    else if (l.type === 'draw' && Array.isArray(l.points) && l.points.length > 1) {
      ctx.strokeStyle = l.color || '#111'; ctx.lineWidth = l.width || 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(l.points[0].x, l.points[0].y);
      for (const p of l.points.slice(1)) ctx.lineTo(p.x, p.y); ctx.stroke();
    } else if (l.type === 'text') {
      if (l.original && !l.edited) { ctx.restore(); continue; }
      if (l.cover || (l.original && l.edited)) { ctx.fillStyle = l.cover || '#fff'; ctx.fillRect(l.x - 1, l.y, l.w + 2, l.h); }
      if (l.field) { ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(l.x, l.y, l.w, l.h); }
      const size = l.size || 14;
      ctx.fillStyle = l.color || '#111';
      ctx.font = `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : ''}${size}px ${l.font || 'Helvetica'}, Arial, sans-serif`;
      ctx.textAlign = l.align || 'left'; ctx.textBaseline = 'alphabetic';
      try { ctx.letterSpacing = `${l.letterSpacing || 0}px`; } catch { /* older browsers */ }
      const ax = l.align === 'center' ? l.x + l.w / 2 : l.align === 'right' ? l.x + l.w : l.x;
      const lh = size * (l.lineHeight || 1.25);
      String(l.text ?? '').split('\n').forEach((ln, i) => {
        const y = l.y + size + i * lh;
        ctx.fillText(ln, ax, y);
        if (l.underline) { const tw = ctx.measureText(ln).width; const ux = l.align === 'center' ? ax - tw / 2 : l.align === 'right' ? ax - tw : ax; ctx.fillRect(ux, y + 2, tw, Math.max(0.7, size / 16)); }
      });
    }
    ctx.restore();
  }
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
}
