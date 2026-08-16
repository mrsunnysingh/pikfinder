// src/business/exportHistory.js
// Lightweight local record of Business Hub exports (last 50). Stored in
// localStorage — no server round-trip, survives reloads. Powers the "Exports"
// tab so users can see what they generated and re-download nothing is lost.

const KEY = 'pikfinder-business-exports';
const MAX = 40;

export function loadExports() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function addExport(entry) {
  const list = loadExports();
  const row = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    template: entry.template || '',
    templateId: entry.templateId || entry.template || '',
    templateName: entry.templateName || '',
    format: entry.format || 'png',
    count: entry.count || 1,
    source: entry.source || 'manual', // 'manual' | 'zoho'
    values: entry.values || null,      // saved field data → lets us reopen / re-download
    thumb: entry.thumb || null,        // small preview data URL
  };
  const next = [row, ...list].slice(0, MAX);
  // If the payload (thumbnails/values) exceeds quota, progressively drop the
  // heaviest fields on the oldest rows until it fits, so a save never fails outright.
  const persist = (rows) => { try { localStorage.setItem(KEY, JSON.stringify(rows)); return true; } catch { return false; } };
  if (!persist(next)) {
    const lite = next.map((r, i) => (i < 8 ? r : { ...r, thumb: null, values: null }));
    if (!persist(lite)) persist(next.map((r) => ({ ...r, thumb: null, values: null })));
  }
  return row;
}

export function removeExport(id) {
  const next = loadExports().filter((r) => r.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* no-op */ }
  return next;
}

export function clearExports() {
  try { localStorage.removeItem(KEY); } catch { /* no-op */ }
}
