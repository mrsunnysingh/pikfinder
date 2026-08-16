// src/pdfeditor/pdfLoad.js
// Loads a PDF (from a File or a URL), renders each page to a background image,
// and extracts its text into editable line-blocks positioned exactly over the
// original. Coordinates are in PDF points (scale-1 viewport = CSS px), so the
// overlay lines up with the rendered background at any zoom.
//
// Reuses the shared pdf.js worker setup from the tools module.

import { getPdfjs } from '../tools/engines/pdf-utils.js';

const BG_SCALE = 2;           // render backgrounds at 2× for crispness
const LINE_TOL = 4;           // baseline clustering tolerance (pt)

let _uid = 0;
const uid = (p) => `${p}${Date.now().toString(36)}${(_uid++).toString(36)}`;

// Fetch bytes from a File or a URL string.
async function readSource(source) {
  if (source instanceof ArrayBuffer) return source;
  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Could not fetch PDF (${res.status})`);
    const type = res.headers.get('content-type') || '';
    if (!/pdf|octet-stream|binary/i.test(type) && !source.toLowerCase().includes('.pdf')) {
      // Best-effort: still try, but warn callers via a thrown error if it's clearly HTML.
      if (/text\/html/i.test(type)) throw new Error('That link is a web page, not a PDF file.');
    }
    return res.arrayBuffer();
  }
  if (source && typeof source.arrayBuffer === 'function') return source.arrayBuffer();
  throw new Error('Unsupported PDF source');
}

// Sample an opaque cover color for an edited text block: read a pixel just to
// the right of the text (usually blank) from the rendered background.
function sampleColor(ctx, x, y) {
  try {
    const d = ctx.getImageData(Math.max(0, x | 0), Math.max(0, y | 0), 1, 1).data;
    return `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
  } catch { return '#ffffff'; }
}

// Group raw text items on a page into line-blocks.
function itemsToBlocks(pdfjs, viewport, textContent, ctx) {
  const raw = [];
  for (const it of textContent.items) {
    if (!it.str || !it.str.trim()) continue;
    const tx = pdfjs.Util.transform(viewport.transform, it.transform);
    const fontSize = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 12;
    const x = tx[4];
    const baseline = tx[5];
    const width = (it.width || (it.str.length * fontSize * 0.5)) * (viewport.scale || 1);
    raw.push({ str: it.str, x, baseline, top: baseline - fontSize, fontSize, width });
  }
  // Cluster by baseline into lines.
  raw.sort((a, b) => a.baseline - b.baseline || a.x - b.x);
  const lines = [];
  for (const r of raw) {
    const line = lines.find((l) => Math.abs(l.baseline - r.baseline) <= LINE_TOL);
    if (line) line.parts.push(r);
    else lines.push({ baseline: r.baseline, parts: [r] });
  }
  const blocks = [];
  for (const l of lines) {
    l.parts.sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd = null;
    for (const p of l.parts) {
      if (prevEnd != null && p.x - prevEnd > p.fontSize * 0.3) text += ' ';
      text += p.str;
      prevEnd = p.x + p.width;
    }
    const first = l.parts[0];
    const last = l.parts[l.parts.length - 1];
    const fontSize = Math.max(...l.parts.map((p) => p.fontSize));
    const x = first.x;
    const w = Math.max(20, last.x + last.width - first.x);
    const top = l.baseline - fontSize;
    blocks.push({
      id: uid('t'),
      type: 'text',
      original: true,
      edited: false,
      x, y: top, w, h: fontSize * 1.25,
      size: fontSize,
      text: text.trim(),
      color: '#111111',
      align: 'left',
      cover: sampleColor(ctx, (x + w + 3) * BG_SCALE, (top + fontSize * 0.5) * BG_SCALE),
    });
  }
  return blocks;
}

export async function loadPdf(source, onProgress) {
  const pdfjs = await getPdfjs();
  const data = await readSource(source);
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const vpR = page.getViewport({ scale: BG_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vpR.width);
    canvas.height = Math.ceil(vpR.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    await page.render({ canvasContext: ctx, viewport: vpR }).promise;
    const textContent = await page.getTextContent();
    const blocks = itemsToBlocks(pdfjs, vp1, textContent, ctx);
    pages.push({
      w: Math.round(vp1.width),
      h: Math.round(vp1.height),
      bg: canvas.toDataURL('image/png'),
      layers: blocks,
    });
    onProgress?.(i, doc.numPages);
  }
  try { await doc.destroy(); } catch { /* no-op */ }
  return { pages, numPages: doc.numPages };
}

export { uid };
