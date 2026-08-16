// src/business/mappingStore.js
// Remembers a user's field mapping per (service, module, template) so they
// don't re-map every time. Stored in localStorage — instant, no server call.
// (A future phase can sync these to Firestore for cross-device reuse.)

const KEY = 'pikfinder-business-mappings';

const idOf = (service, module, templateId) => `${service}::${module}::${templateId}`;

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

export function loadMapping(service, module, templateId) {
  if (!service || !module || !templateId) return null;
  const all = loadAll();
  return all[idOf(service, module, templateId)] || null;
}

export function saveMapping(service, module, templateId, map) {
  if (!service || !module || !templateId || !map) return;
  const all = loadAll();
  all[idOf(service, module, templateId)] = map;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* quota */ }
}
