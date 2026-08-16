// src/business/exportUtils.js
// Shared client-side render/export helpers for the Business Hub. The SVG comes
// from the same pure render core used server-side (renderTemplate + sceneToSvg),
// so single and bulk exports are pixel-identical.

export const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Rasterize an SVG string to a canvas at `scale` (waits for web fonts to load).
export async function rasterize(svg, dims, scale = 2) {
  try { await document.fonts?.ready; } catch { /* no-op */ }
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('svg_load_failed'));
    i.src = svgUrl(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = Math.round(dims.w * scale);
  cv.height = Math.round(dims.h * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

// Produce an export Blob for a given format from an SVG + dims.
export async function toBlob(format, svg, dims) {
  if (format === 'svg') return new Blob([svg], { type: 'image/svg+xml' });
  const cv = await rasterize(svg, dims, 2);
  if (format === 'png') return canvasBlob(cv, 'image/png');
  if (format === 'jpg' || format === 'jpeg') return canvasBlob(cv, 'image/jpeg', 0.92);
  if (format === 'pdf') {
    const pngUrl = cv.toDataURL('image/png');
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    const png = await pdf.embedPng(pngUrl);
    const page = pdf.addPage([dims.w, dims.h]);
    page.drawImage(png, { x: 0, y: 0, width: dims.w, height: dims.h });
    const bytes = await pdf.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }
  throw new Error(`unsupported_format:${format}`);
}

function canvasBlob(cv, type, quality) {
  return new Promise((res, rej) =>
    cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas_blob_failed'))), type, quality)
  );
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const safeName = (s, fallback = 'export') =>
  String(s || fallback).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || fallback;
