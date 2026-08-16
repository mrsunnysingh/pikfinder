// src/business/customTemplates.js
// Stores the user's own uploaded designs as Business Hub templates (localStorage).
// A custom template has the exact same shape as a built-in one — an image layer
// (their design) plus {{placeholder}} text layers — so it flows through preview,
// fill-fields, Zoho auto-fill and export unchanged.

const KEY = 'pikfinder-business-custom';

export function loadCustom() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveCustomList(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
  catch { return false; } // likely quota — image too large
}

export function addCustom(tpl) {
  const next = [tpl, ...loadCustom().filter((t) => t.id !== tpl.id)];
  return saveCustomList(next) ? next : null;
}

export function removeCustom(id) {
  const next = loadCustom().filter((t) => t.id !== id);
  saveCustomList(next);
  return next;
}

export const slugKey = (label, i = 0) =>
  (String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')) || `field_${i + 1}`;
