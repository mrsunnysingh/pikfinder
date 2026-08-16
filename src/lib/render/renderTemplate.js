// src/lib/render/renderTemplate.js
// Pure, dependency-free template substitution shared by the browser (Business
// Hub preview) and the server (api/generate/*). Takes Studio layer JSON with
// {{placeholders}} + a data record and returns concrete layer JSON ready to
// render. No canvas, no React — runs anywhere.

// {{ field }}  or  {{ field | "fallback" }}
const PLACEHOLDER = /\{\{\s*([\w.]+)\s*(?:\|\s*"([^"]*)"\s*)?\}\}/g;

/** Replace every {{placeholder}} in a string using `data`. */
export function substituteText(str, data = {}) {
  return String(str ?? '').replace(PLACEHOLDER, (_, key, fallback) => {
    const v = data[key];
    if (v === undefined || v === null || v === '') return fallback ?? '';
    return String(v);
  });
}

/** List every placeholder/bind referenced by a set of layers (for the mapping UI). */
export function extractPlaceholders(layers = []) {
  const set = new Set();
  for (const l of layers) {
    if (l.type === 'text' && typeof l.text === 'string') {
      PLACEHOLDER.lastIndex = 0;
      let m;
      while ((m = PLACEHOLDER.exec(l.text))) set.add(m[1]);
    }
    if (l.bind) set.add(l.bind);
  }
  return [...set];
}

/**
 * Substitute a data record into template layers.
 * - text layers: {{fields}} in `text` are replaced.
 * - image layers with `bind`: `src` is set from data[bind] (e.g. logo / qr URL).
 * Returns a NEW array; the input template is never mutated.
 */
export function renderTemplate(layers = [], data = {}) {
  return layers.map((l) => {
    const c = { ...l };
    if (c.type === 'text' && typeof c.text === 'string') c.text = substituteText(c.text, data);
    if (c.bind && data[c.bind]) c.src = data[c.bind];
    return c;
  });
}
