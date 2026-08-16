import { lazy } from 'react';

// Every engine is lazy-loaded so heavy dependencies (ONNX, Tesseract, pdfjs,
// AVIF wasm, HEIC decoder) only download on the tool page that needs them.
export const ENGINES = {
  compress: lazy(() => import('./CompressEngine')),
  'filesize-increase': lazy(() => import('./FileSizeIncreaseEngine')),
  resize: lazy(() => import('./ResizeEngine')),
  crop: lazy(() => import('./CropEngine')),
  rotate: lazy(() => import('./RotateEngine')),
  upscale: lazy(() => import('./UpscaleEngine')),
  convert: lazy(() => import('./ConvertEngine')),
  'pdf-compress': lazy(() => import('./PdfCompressEngine')),
  'pdf-to-jpg': lazy(() => import('./PdfToJpgEngine')),
  'image-to-pdf': lazy(() => import('./ImageToPdfEngine')),
  favicon: lazy(() => import('./FaviconEngine')),
  base64: lazy(() => import('./Base64Engine')),
  'bg-remove': lazy(() => import('./BgRemoveEngine')),
  'add-background': lazy(() => import('./AddBackgroundEngine')),
  metadata: lazy(() => import('./MetadataEngine')),
  edit: lazy(() => import('./EditEngine')),
  gif: lazy(() => import('./GifEngine')),
  color: lazy(() => import('./ColorEngine')),
  qr: lazy(() => import('./QrEngine')),
  ocr: lazy(() => import('./OcrEngine')),
};
