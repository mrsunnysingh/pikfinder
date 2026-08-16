import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UploadSimple, Plus, Trash, FloppyDisk, CursorClick, PaintBrush, ImageSquare, Signature, TextT } from '@phosphor-icons/react';
import { addCustom, slugKey } from './customTemplates';

const CAP = 1600; // cap the long edge so the stored image stays small

// ── Convert an uploaded file (image / PDF / DOCX) into a { src, w, h } design ──
function loadImageEl(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function imageToDesign(file) {
  const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const im = await loadImageEl(dataUrl);
  const s = Math.min(1, CAP / Math.max(im.width, im.height));
  const w = Math.round(im.width * s), h = Math.round(im.height * s);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(im, 0, 0, w, h);
  return { src: cv.toDataURL('image/jpeg', 0.85), w, h };
}
async function pdfToDesign(file) {
  const { getPdfjs } = await import('../tools/engines/pdf-utils.js');
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = Math.min(2.5, CAP / Math.max(vp1.width, vp1.height));
  const vp = page.getViewport({ scale });
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
  await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  try { await doc.destroy(); } catch { /* no-op */ }
  return { src: cv.toDataURL('image/jpeg', 0.9), w: cv.width, h: cv.height };
}

// Common fields most business documents need — one-click add.
const QUICK_FIELDS = ['Name', 'Date', 'Company', 'Amount', 'Email', 'Phone', 'Address', 'Title'];

export default function TemplateBuilder({ onClose, onSaved }) {
  const navigate = useNavigate();
  const [img, setImg] = useState(null);      // { src, w, h }
  const [fields, setFields] = useState([]);  // { id, label, x, y, size, color, align, bold }
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loadingFile, setLoadingFile] = useState('');
  const [selId, setSelId] = useState(null);      // currently-selected field
  const [placing, setPlacing] = useState(null);  // {label} while waiting for a click to place
  const [zoom, setZoom] = useState(1);           // canvas zoom (0.5–2)
  const fileRef = useRef(null);
  const surfaceRef = useRef(null);
  const drag = useRef(null);
  const dragged = useRef(false);

  const baseW = img ? Math.min(540, img.w) : 540;
  const displayW = baseW * zoom;
  const scale = img ? displayW / img.w : 1;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr('');
    const type = f.type || '', nm = f.name.toLowerCase();
    // Word docs can't be rendered reliably in the browser — ask for a PDF.
    if (nm.endsWith('.docx') || nm.endsWith('.doc') || type.includes('word') || type.includes('officedocument')) {
      setErr('Word docs: open it and choose “Save as PDF” (File → Save As → PDF, or Google Docs → Download → PDF), then upload that PDF here.');
      e.target.value = '';
      return;
    }
    setLoadingFile(nm.endsWith('.pdf') || type === 'application/pdf' ? 'Reading PDF…' : 'Reading image…');
    try {
      let result;
      if (type.startsWith('image/')) result = await imageToDesign(f);
      else if (type === 'application/pdf' || nm.endsWith('.pdf')) result = await pdfToDesign(f);
      else { setErr('Please upload a PNG, JPG or PDF file.'); return; }
      setImg(result);
      setFields([]);
    } catch (er) {
      console.error(er);
      setErr('Could not read that file. Try a PNG, JPG or PDF.');
    } finally {
      setLoadingFile('');
      e.target.value = '';
    }
  };

  // Drop a field at a design-space position (defaults to a tidy spot).
  // kind 'text' → a fillable {{placeholder}}; 'image' → a logo/signature box.
  const addFieldAt = (x, y, label, kind = 'text') => {
    if (!img) return;
    const n = fields.length;
    const id = `f${Date.now()}${n}`;
    const cx = Math.round(Math.max(0, Math.min(img.w - 10, x)));
    const cy = Math.round(Math.max(0, Math.min(img.h - 10, y)));
    if (kind === 'image') {
      const isSign = label === 'Signature';
      const w = Math.round(img.w * (isSign ? 0.26 : 0.16));
      const h = Math.round(isSign ? w / 2.6 : w);
      setFields((fs) => [...fs, { id, kind: 'image', label: label || 'Logo', x: cx, y: cy, w, h }]);
    } else {
      setFields((fs) => [...fs, {
        id, kind: 'text', label: label || `Field ${n + 1}`, x: cx, y: cy,
        size: Math.max(14, Math.round(img.h * 0.03)), color: '#111111', align: 'left', bold: false,
      }]);
    }
    setSelId(id);
    setErr('');
  };
  // "Add field" / a quick chip arms placing mode; the next click on the design drops it.
  const startPlacing = (label, kind = 'text') => { if (!img) return; setPlacing({ label: label || null, kind }); };
  const patch = (id, p) => setFields((fs) => fs.map((f) => f.id === id ? { ...f, ...p } : f));
  const remove = (id) => { setFields((fs) => fs.filter((f) => f.id !== id)); if (selId === id) setSelId(null); };

  // Click on the design: place a pending field there, otherwise just deselect.
  const onSurfaceDown = (e) => {
    if (!img) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    if (placing) {
      addFieldAt(x - 4, y - 8, placing.label, placing.kind);
      setPlacing(null);
    } else {
      setSelId(null);
    }
  };

  // Resize a field by dragging its corner handle. Image boxes change w/h; text
  // fields change font size (from the vertical drag).
  const startResize = (e, id) => {
    e.stopPropagation();
    setSelId(id);
    const f = fields.find((x) => x.id === id);
    const rect = surfaceRef.current.getBoundingClientRect();
    const mv = (ev) => {
      const nx = (ev.clientX - rect.left) / scale;
      const ny = (ev.clientY - rect.top) / scale;
      if (f.kind === 'image') {
        patch(id, { w: Math.max(20, Math.round(nx - f.x)), h: Math.max(20, Math.round(ny - f.y)) });
      } else {
        patch(id, { size: Math.max(8, Math.min(400, Math.round(ny - f.y))) });
      }
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  const startDrag = (e, id) => {
    e.stopPropagation();
    setSelId(id);
    dragged.current = false;
    const f = fields.find((x) => x.id === id);
    const rect = surfaceRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale, py = (e.clientY - rect.top) / scale;
    drag.current = { id, dx: f.x - px, dy: f.y - py };
    const mv = (ev) => {
      dragged.current = true;
      const x = (ev.clientX - rect.left) / scale + drag.current.dx;
      const y = (ev.clientY - rect.top) / scale + drag.current.dy;
      patch(id, { x: Math.max(0, Math.min(img.w - 10, Math.round(x))), y: Math.max(0, Math.min(img.h - 10, Math.round(y))) });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  // Build the custom template object (image layer + one {{placeholder}} text
  // layer per field). Shared by "Save template" and "Edit in Studio".
  const buildTemplate = () => {
    const layers = [{ type: 'image', src: img.src, x: 0, y: 0, w: img.w, h: img.h }];
    const tplFields = [];
    const usedKeys = new Set();
    fields.forEach((f, i) => {
      let key = slugKey(f.label, i);
      while (usedKeys.has(key)) key = `${key}_${i}`;
      usedKeys.add(key);
      if (f.kind === 'image') {
        // Image placeholder: an image layer bound to the field. At generation time
        // renderTemplate sets its src from the record value (logo/signature URL or upload).
        layers.push({ type: 'image', bind: key, x: f.x, y: f.y, w: f.w, h: f.h });
        tplFields.push({ key, label: f.label, kind: 'image', sample: '' });
      } else {
        layers.push({ type: 'text', text: `{{${key}}}`, x: f.x, y: f.y, size: f.size, weight: f.bold ? 800 : 600, align: f.align, color: f.color, font: 'Inter' });
        tplFields.push({ key, label: f.label, sample: f.label });
      }
    });
    return {
      id: `custom-${Date.now()}`, name: name.trim() || 'My design', category: 'Custom', custom: true,
      dims: { w: img.w, h: img.h }, bg: { type: 'solid', color: '#ffffff' }, fields: tplFields, layers,
    };
  };

  const save = () => {
    if (!img) { setErr('Upload your design first.'); return; }
    if (!fields.length) { setErr('Add at least one field.'); return; }
    const tpl = buildTemplate();
    if (!addCustom(tpl)) { setErr('Could not save — your image may be too large. Try a smaller file.'); return; }
    onSaved(tpl);
  };

  // Advanced path: save the current draft and open it in the full Studio, where
  // the user gets real fonts, precise layout and effects. Fields aren't required
  // here — they can add {{placeholders}} in text right in the editor.
  const editInStudio = () => {
    if (!img) { setErr('Upload your design first.'); return; }
    const tpl = buildTemplate();
    if (!addCustom(tpl)) { setErr('Could not save — your image may be too large. Try a smaller file.'); return; }
    navigate(`/studio?template=${encodeURIComponent(tpl.id)}`);
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose}>
      <div className="biz-builder" onClick={(e) => e.stopPropagation()}>
        <div className="biz-modal-head">
          <div className="biz-modal-head-title">
            <span className="biz-modal-head-icon"><ImageSquare size={20} weight="duotone" /></span>
            <div>
              <h3>Upload your own design</h3>
              <p>Add editable fields to make your template dynamic</p>
            </div>
          </div>
          <button className="biz-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="biz-builder-body">
          {/* Canvas */}
          <div className="biz-builder-canvas">
            {!img ? (
              <button className="biz-builder-drop" onClick={() => fileRef.current?.click()} disabled={!!loadingFile}>
                <UploadSimple size={34} />
                <strong>{loadingFile || 'Upload your invoice / certificate design'}</strong>
                <span>PNG, JPG or PDF — the layout you want to fill in (Word: save as PDF first)</span>
              </button>
            ) : (
              <>
              <div className="biz-builder-zoom">
                <button onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} aria-label="Zoom out">−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))} aria-label="Zoom in">+</button>
              </div>
              <div ref={surfaceRef} className={`biz-builder-surface ${placing ? 'is-placing' : ''}`} style={{ width: displayW, height: img.h * scale }} onPointerDown={onSurfaceDown}>
                <img src={img.src} alt="Your design" width={displayW} height={img.h * scale} draggable={false} />
                {fields.map((f) => (f.kind === 'image' ? (
                  <div key={f.id} className={`biz-builder-imgbox ${selId === f.id ? 'selected' : ''}`} onPointerDown={(e) => startDrag(e, f.id)}
                    style={{ left: f.x * scale, top: f.y * scale, width: f.w * scale, height: f.h * scale }}>
                    {f.label === 'Signature' ? <Signature size={16} /> : <ImageSquare size={16} />}
                    <span>{f.label}</span>
                    <span className="biz-resize-handle" onPointerDown={(e) => startResize(e, f.id)} title="Drag to resize" />
                  </div>
                ) : (
                  <span key={f.id} className={`biz-builder-field ${selId === f.id ? 'selected' : ''}`} onPointerDown={(e) => startDrag(e, f.id)}
                    style={{ left: f.x * scale, top: f.y * scale, fontSize: Math.max(9, f.size * scale), color: f.color, textAlign: f.align, fontWeight: f.bold ? 800 : 600 }}>
                    {f.label}
                    <span className="biz-resize-handle text" onPointerDown={(e) => startResize(e, f.id)} title="Drag to resize text" />
                  </span>
                )))}
                {placing && <div className="biz-builder-placing-hint">Click on your design to place{placing.label ? ` “${placing.label}”` : ' the field'}</div>}
              </div>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={onFile} />
          </div>

          {/* Field editor */}
          <div className="biz-builder-side">
            <h4 className="biz-side-title">Template details</h4>
            <label className="biz-field"><span>Template name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Company Invoice" />
            </label>

            <div className="biz-builder-actions">
              <button className="btn-outline" onClick={() => fileRef.current?.click()} disabled={!img}><UploadSimple size={15} /> Replace design</button>
              <button className={`btn-primary biz-add-btn ${placing && !placing.label ? 'is-armed' : ''}`} onClick={() => startPlacing()} disabled={!img}><Plus size={15} weight="bold" /> {placing && !placing.label ? 'Click design…' : 'Add field'}</button>
            </div>

            {img && (
              <>
                <div className="biz-quick-fields">
                  <button type="button" className={`biz-quick-chip img ${placing?.label === 'Logo' ? 'armed' : ''}`} onClick={() => startPlacing('Logo', 'image')}><ImageSquare size={13} /> Logo</button>
                  <button type="button" className={`biz-quick-chip img ${placing?.label === 'Signature' ? 'armed' : ''}`} onClick={() => startPlacing('Signature', 'image')}><Signature size={13} /> Signature</button>
                </div>
                <div className="biz-quick-fields">
                  <span className="biz-quick-label">Quick add fields</span>
                </div>
                <div className="biz-quick-fields">
                  {QUICK_FIELDS.map((q) => (
                    <button key={q} type="button" className={`biz-quick-chip ${placing?.label === q ? 'armed' : ''}`} onClick={() => startPlacing(q)}>{q}</button>
                  ))}
                </div>
              </>
            )}

            {img && <p className="biz-hint"><CursorClick size={13} /> Drag each field on the design to position it.</p>}

            {img && fields.length > 0 && <div className="biz-added-head"><span>Added fields ({fields.length})</span></div>}

            <div className="biz-builder-fields">
              {fields.map((f) => (
                <div key={f.id} className={`biz-builder-row ${selId === f.id ? 'selected' : ''}`} onPointerDown={() => setSelId(f.id)}>
                  <div className="biz-bf-top">
                    <span className="biz-bf-kind">{f.kind === 'image' ? (f.label === 'Signature' ? <Signature size={14} /> : <ImageSquare size={14} />) : <TextT size={14} />}</span>
                    <input className="biz-bf-label" value={f.label} onChange={(e) => patch(f.id, { label: e.target.value })} placeholder={f.kind === 'image' ? 'Image field' : 'Field name'} />
                    <span className="biz-bf-typetag">{f.kind === 'image' ? 'Image' : 'Text'}</span>
                    <button className="biz-bf-del" onClick={() => remove(f.id)} title="Remove"><Trash size={14} /></button>
                  </div>
                  <div className="biz-bf-controls">
                    {f.kind === 'image' ? (
                      <label className="biz-bf-ctl"><span>Width</span>
                        <input type="number" min="20" max="2000" value={f.w} onChange={(e) => { const w = Math.max(20, +e.target.value); patch(f.id, { w, h: Math.round(w * (f.h / f.w)) }); }} />
                      </label>
                    ) : (
                      <>
                        <label className="biz-bf-ctl"><span>Size</span>
                          <input type="number" min="8" max="200" value={f.size} onChange={(e) => patch(f.id, { size: +e.target.value })} />
                        </label>
                        <button className={`biz-bf-bold ${f.bold ? 'on' : ''}`} onClick={() => patch(f.id, { bold: !f.bold })} title="Bold">B</button>
                        <input className="biz-bf-color" type="color" value={f.color} onChange={(e) => patch(f.id, { color: e.target.value })} title="Color" />
                        <select className="biz-bf-align" value={f.align} onChange={(e) => patch(f.id, { align: e.target.value })} title="Align">
                          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {img && fields.length === 0 && <p className="biz-hint">No fields yet — click “Add field” or a Quick add chip, then click on your design to place it.</p>}
            </div>

            {err && <div className="biz-flash err">{err}</div>}
          </div>
        </div>

        <div className="biz-modal-foot">
          <span className="biz-modal-count">{fields.length} field{fields.length !== 1 ? 's' : ''} added</span>
          <div className="biz-foot-actions">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-outline" onClick={editInStudio} disabled={!img} title="Open this design in the full Studio for advanced editing"><PaintBrush size={15} /> Edit in Studio</button>
            <button className="btn-primary biz-save-btn" onClick={save}><FloppyDisk size={15} /> Save template</button>
          </div>
        </div>
      </div>
    </div>
  );
}
