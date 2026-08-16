// Shared canvas helpers used by all image engines.

/** Draw an <img> (or canvas) onto a new canvas at the given size. */
export function drawToCanvas(source, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** canvas.toBlob as a promise. */
export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed.'))), type, quality);
  });
}

/**
 * Multi-pass high quality scaling: repeatedly halve/double instead of one big jump.
 * Produces much cleaner results for both downscaling and upscaling.
 */
export function scaleImageHQ(source, targetW, targetH) {
  let current = source;
  let w = source.width || source.naturalWidth;
  let h = source.height || source.naturalHeight;

  // Downscale in halves
  while (w / 2 >= targetW && h / 2 >= targetH) {
    w = Math.round(w / 2);
    h = Math.round(h / 2);
    current = drawToCanvas(current, w, h);
  }
  // Upscale in steps of at most 2x
  while (w * 2 <= targetW && h * 2 <= targetH) {
    w = Math.round(w * 2);
    h = Math.round(h * 2);
    current = drawToCanvas(current, w, h);
  }
  if (w !== targetW || h !== targetH) {
    current = drawToCanvas(current, targetW, targetH);
  }
  return current;
}

/**
 * Compress a canvas to hit a target size in KB.
 * Binary-searches JPEG/WebP quality; if even minimum quality is too big,
 * progressively scales dimensions down and retries.
 */
export async function compressToTarget(canvas, targetKB, type = 'image/jpeg') {
  const targetBytes = targetKB * 1024;
  let workCanvas = canvas;

  for (let attempt = 0; attempt < 8; attempt++) {
    let lo = 0.05;
    let hi = 0.95;
    let best = null;

    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const blob = await canvasToBlob(workCanvas, type, mid);
      if (blob.size <= targetBytes) {
        best = blob;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    if (best) return { blob: best, width: workCanvas.width, height: workCanvas.height };

    // Still too big at minimum quality: shrink dimensions 80% and retry.
    const w = Math.round(workCanvas.width * 0.8);
    const h = Math.round(workCanvas.height * 0.8);
    if (w < 50 || h < 50) break;
    workCanvas = drawToCanvas(workCanvas, w, h);
  }

  const fallback = await canvasToBlob(workCanvas, type, 0.05);
  return { blob: fallback, width: workCanvas.width, height: workCanvas.height };
}

/** Strips extension from a filename. */
export function baseName(fileName) {
  return fileName.replace(/\.[^/.]+$/, '');
}
