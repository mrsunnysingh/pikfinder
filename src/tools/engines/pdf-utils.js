// Compatibility shim: some pdf.js builds call the very new (2025) TC39 methods
// Map.prototype.getOrInsert / getOrInsertComputed, which older browsers lack —
// causing "getOrInsertComputed is not a function" when opening a PDF. We use
// pdfjs v4 (which doesn't need them), but define them harmlessly just in case.
function ensureMapPolyfills() {
  /* eslint-disable no-extend-native */
  if (typeof Map.prototype.getOrInsertComputed !== 'function') {
    Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
      value: function (key, compute) { if (this.has(key)) return this.get(key); const v = compute(key); this.set(key, v); return v; },
      writable: true, configurable: true,
    });
  }
  if (typeof Map.prototype.getOrInsert !== 'function') {
    Object.defineProperty(Map.prototype, 'getOrInsert', {
      value: function (key, dflt) { if (this.has(key)) return this.get(key); this.set(key, dflt); return dflt; },
      writable: true, configurable: true,
    });
  }
  /* eslint-enable no-extend-native */
}

// Shared pdfjs setup. pdfjs-dist ships its own worker; point to the bundled one.
export async function getPdfjs() {
  ensureMapPolyfills();
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

/** Render every page of a PDF file to canvases at the given scale. */
export async function renderPdfPages(file, scale = 1.5, onProgress) {
  const pdfjs = await getPdfjs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const canvases = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    canvases.push(canvas);
    onProgress?.(i, doc.numPages);
  }
  return canvases;
}
