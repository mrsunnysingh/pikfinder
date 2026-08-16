// api/templates.js — GET /api/templates
// Lightweight template catalogue for external surfaces (e.g. the Zoho widget).
// Returns metadata only (id, name, category, dims, fields) — never the layer JSON,
// which stays server-side and is resolved by /api/template/generate?templateId=…

import { applyCors, json, guardMethod } from './_lib/http.js';
import { BUSINESS_TEMPLATES } from '../src/business/templates.js';

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (guardMethod(req, res, ['GET'])) return;

  const list = BUSINESS_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category || 'Other',
    dims: t.dims,
    fields: (t.fields || []).map((f) => ({ key: f.key, label: f.label, sample: f.sample })),
  }));

  return json(res, 200, { count: list.length, templates: list }, { cache: 's-maxage=3600, stale-while-revalidate=86400' });
}
