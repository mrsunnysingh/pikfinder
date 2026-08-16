// src/studio/segment.js
// In-browser subject segmentation for the Studio (Remove / Blur background).
// Uses the same U2-Netp ONNX model as the standalone Background Remover tool,
// run via onnxruntime-web — no uploads, no API. Kept separate so the existing
// tool is untouched, and loaded lazily so the model/runtime stay out of the
// main bundle until used.

const MODEL_URL = 'https://huggingface.co/tomjackson2023/rembg/resolve/main/u2netp.onnx';
const MODEL_SIZE = 320;

let sessionPromise = null;
async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });
    })();
  }
  return sessionPromise;
}

// Returns an alpha mask canvas (white = subject) at the image's natural size.
export async function computeSubjectMask(img, onStatus = () => {}) {
  onStatus('Loading AI model…');
  const ort = await import('onnxruntime-web');
  const session = await getSession();

  onStatus('Analyzing image…');
  const small = document.createElement('canvas');
  small.width = MODEL_SIZE; small.height = MODEL_SIZE;
  small.getContext('2d').drawImage(img, 0, 0, MODEL_SIZE, MODEL_SIZE);
  const { data } = small.getContext('2d').getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const floats = new Float32Array(3 * MODEL_SIZE * MODEL_SIZE);
  for (let i = 0; i < MODEL_SIZE * MODEL_SIZE; i++) {
    floats[i] = (data[i * 4] / 255 - mean[0]) / std[0];
    floats[MODEL_SIZE * MODEL_SIZE + i] = (data[i * 4 + 1] / 255 - mean[1]) / std[1];
    floats[2 * MODEL_SIZE * MODEL_SIZE + i] = (data[i * 4 + 2] / 255 - mean[2]) / std[2];
  }
  const input = new ort.Tensor('float32', floats, [1, 3, MODEL_SIZE, MODEL_SIZE]);
  const results = await session.run({ [session.inputNames[0]]: input });
  const mask = results[session.outputNames[0]].data;

  onStatus('Preparing mask…');
  const maskSmall = document.createElement('canvas');
  maskSmall.width = MODEL_SIZE; maskSmall.height = MODEL_SIZE;
  const mimg = maskSmall.getContext('2d').createImageData(MODEL_SIZE, MODEL_SIZE);
  let min = 1, max = 0;
  for (let i = 0; i < mask.length; i++) { if (mask[i] < min) min = mask[i]; if (mask[i] > max) max = mask[i]; }
  const range = max - min || 1;
  for (let i = 0; i < MODEL_SIZE * MODEL_SIZE; i++) {
    const a = Math.round(((mask[i] - min) / range) * 255);
    mimg.data[i * 4] = 255; mimg.data[i * 4 + 1] = 255; mimg.data[i * 4 + 2] = 255; mimg.data[i * 4 + 3] = a;
  }
  maskSmall.getContext('2d').putImageData(mimg, 0, 0);

  const w = img.naturalWidth, h = img.naturalHeight;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(maskSmall, 0, 0, MODEL_SIZE, MODEL_SIZE, 0, 0, w, h);
  return out;
}

// Cut out the subject → transparent-background PNG data URL.
export async function removeBackground(img, onStatus) {
  const mask = await computeSubjectMask(img, onStatus);
  const w = img.naturalWidth, h = img.naturalHeight;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, w, h);
  return out.toDataURL('image/png');
}

// Keep the subject sharp over a blurred version of the same photo.
export async function blurBackground(img, blurPx, onStatus) {
  const mask = await computeSubjectMask(img, onStatus);
  const w = img.naturalWidth, h = img.naturalHeight;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  octx.filter = `blur(${Math.max(1, blurPx)}px)`;
  octx.drawImage(img, 0, 0, w, h);
  octx.filter = 'none';
  const sub = document.createElement('canvas');
  sub.width = w; sub.height = h;
  const sctx = sub.getContext('2d');
  sctx.drawImage(img, 0, 0, w, h);
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(mask, 0, 0, w, h);
  octx.drawImage(sub, 0, 0);
  return out.toDataURL('image/png');
}
