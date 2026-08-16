// api/template/generate.js — POST /api/template/generate
// Headless render core (Business Hub phase 1). Substitutes a data record into
// template layer JSON and renders it. SVG works with zero extra deps; PNG/JPG/
// PDF require @resvg/resvg-js (+ pdf-lib, already present) — added to
// package.json, so they light up after `npm install`.
//
// MVP scope: renders INLINE layers/dims/bg from the request body (no template
// store, no auth, no storage yet — those are later slices). Returns the file
// bytes directly. Safe/isolated: touches nothing existing.

import { applyCors, json, guardMethod } from '../_lib/http.js';
import { renderTemplate } from '../../src/lib/render/renderTemplate.js';
import { sceneToSvg } from '../../src/lib/render/sceneToSvg.node.js';
import { BUSINESS_TEMPLATES } from '../../src/business/templates.js';

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (guardMethod(req, res, ['POST'])) return;

  const body = req.body || {};
  let { layers, dims, bg, data = {}, format = 'svg', scale = 1, templateId } = body;

  // Resolve a stored template by id (the client never has to ship layer JSON).
  if (templateId) {
    const t = BUSINESS_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return json(res, 404, { ok: false, error: 'unknown_template', detail: `No template "${templateId}".` });
    layers = t.layers; dims = t.dims; bg = t.bg;
  }

  if (!Array.isArray(layers) || !dims || !dims.w || !dims.h) {
    return json(res, 400, { ok: false, error: 'bad_data', detail: 'Provide templateId, or layers[] and dims:{w,h}.' });
  }

  let svg;
  try {
    const rendered = renderTemplate(layers, data);
    svg = sceneToSvg({ dims, bg: bg || { type: 'solid', color: '#ffffff' }, layers: rendered });
  } catch (e) {
    return json(res, 422, { ok: false, error: 'render_failed', detail: String(e.message || e) });
  }

  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  }

  // Raster / PDF path (optional dependency).
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const s = Math.min(4, Math.max(1, Number(scale) || 1));
    const png = new Resvg(svg, { fitTo: { mode: 'zoom', value: s } }).render().asPng();

    if (format === 'png' || format === 'jpg' || format === 'jpeg') {
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(Buffer.from(png));
    }
    if (format === 'pdf') {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const img = await pdf.embedPng(png);
      const page = pdf.addPage([dims.w, dims.h]);
      page.drawImage(img, { x: 0, y: 0, width: dims.w, height: dims.h });
      const bytes = await pdf.save();
      res.setHeader('Content-Type', 'application/pdf');
      return res.status(200).send(Buffer.from(bytes));
    }
    return json(res, 400, { ok: false, error: 'bad_format', detail: `Unsupported format "${format}".` });
  } catch (e) {
    return json(res, 501, {
      ok: false,
      error: 'render_unavailable',
      detail: 'PNG/PDF need @resvg/resvg-js. Run `npm install`, then redeploy. SVG works without it. ' + String(e.message || e),
    });
  }
}
