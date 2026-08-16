import React, { useState } from 'react';
import { ArrowClockwise, ArrowCounterClockwise, ArrowsHorizontal, ArrowsVertical } from '@phosphor-icons/react';
import { Dropzone, ResultBar, saveBlob, loadImageFromFile } from '../ToolShell';
import { canvasToBlob, baseName } from './canvas-utils';

function renderTransformed(img, rotation, flipH, flipV) {
  const rad = (rotation * Math.PI) / 180;
  const swap = rotation % 180 !== 0;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas;
}

export default function RotateEngine() {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const update = async (image, rot, fH, fV) => {
    const canvas = renderTransformed(image, rot, fH, fV);
    const blob = await canvasToBlob(canvas, 'image/png');
    setPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height };
    });
  };

  const onFiles = async ([f]) => {
    setError(null);
    try {
      const { img: image } = await loadImageFromFile(f);
      setFile(f);
      setImg(image);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      await update(image, 0, false, false);
    } catch (e) {
      setError(e.message);
    }
  };

  const change = (rot = rotation, fH = flipH, fV = flipV) => {
    setRotation(rot);
    setFlipH(fH);
    setFlipV(fV);
    if (img) update(img, rot, fH, fV);
  };

  return (
    <div className="tool-engine">
      {!file && <Dropzone onFiles={onFiles} label="Drop your image here, or click to browse" />}

      {file && preview && (
        <>
          <div className="tool-preset-row">
            <button className="btn-secondary" onClick={() => change((rotation + 270) % 360)}>
              <ArrowCounterClockwise /> Rotate left
            </button>
            <button className="btn-secondary" onClick={() => change((rotation + 90) % 360)}>
              <ArrowClockwise /> Rotate right
            </button>
            <button className={flipH ? 'btn-primary' : 'btn-secondary'} onClick={() => change(rotation, !flipH, flipV)}>
              <ArrowsHorizontal /> Flip horizontal
            </button>
            <button className={flipV ? 'btn-primary' : 'btn-secondary'} onClick={() => change(rotation, flipH, !flipV)}>
              <ArrowsVertical /> Flip vertical
            </button>
            <button className="btn-ghost" onClick={() => { setFile(null); setPreview(null); }}>
              Choose a different image
            </button>
          </div>

          {error && <p className="tool-error">{error}</p>}

          <div className="tool-preview">
            <img src={preview.url} alt="Rotated result" />
            <p>{preview.w} x {preview.h} px — rotation {rotation}&deg;</p>
          </div>

          <ResultBar
            originalSize={file.size}
            resultSize={preview.blob.size}
            onDownload={() => saveBlob(preview.blob, `${baseName(file.name)}-rotated.png`)}
            downloadLabel="Download PNG"
          />
        </>
      )}
    </div>
  );
}
