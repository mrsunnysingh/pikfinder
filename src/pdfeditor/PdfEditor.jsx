import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  CursorClick, TextT, Image as ImageIcon, LinkSimple, Square, PencilSimple, HighlighterCircle,
  Eraser, Signature, PenNib, Textbox, DotsThree, Hand, ArrowCounterClockwise, ArrowClockwise,
  Minus, Plus, ShareNetwork, DownloadSimple, UploadSimple, X, FileArrowUp, CaretDown, CaretLeft, CaretRight,
  Trash, Copy, Lock, LockOpen, ArrowLineUp, ArrowLineDown, ArrowUp, ArrowDown, ArrowsOut,
  GridFour, Info, ChatCircle, ListChecks, BookmarkSimple, Scan, ArrowsInLineHorizontal,
  TextAlignLeft, TextAlignCenter, TextAlignRight, TextAlignJustify, TextB, TextItalic, TextUnderline, Plus as PlusIcon,
} from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';
import Logo from '../components/Logo';
import { loadPdf, uid } from './pdfLoad';
import { buildPdf, exportPagePng } from './pdfExport';

const clone = (a) => JSON.parse(JSON.stringify(a));
const download = (blob, name) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); };
const FONTS = ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
const LHS = [1, 1.15, 1.25, 1.4, 1.6, 2];

async function urlToDataUrl(url) { const r = await fetch(url); if (!r.ok) throw new Error('x'); const b = await r.blob(); return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); }); }
const fileToDataUrl = (f) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(f); });

const TOOLS = [
  { k: 'select', I: CursorClick, label: 'Select' },
  { k: 'text', I: TextT, label: 'Text' },
  { k: 'image', I: ImageIcon, label: 'Image' },
  { k: 'link', I: LinkSimple, label: 'Link' },
  { k: 'shape', I: Square, label: 'Shape' },
  { k: 'draw', I: PencilSimple, label: 'Draw' },
  { k: 'highlight', I: HighlighterCircle, label: 'Highlight' },
  { k: 'whiteout', I: Eraser, label: 'Whiteout' },
  { k: 'sign', I: Signature, label: 'Sign' },
  { k: 'fill', I: PenNib, label: 'Fill & Sign' },
  { k: 'formfield', I: Textbox, label: 'Form Field' },
];
const NAV = [
  { k: 'pages', I: GridFour, label: 'Pages' },
  { k: 'comments', I: ChatCircle, label: 'Comments' },
  { k: 'forms', I: ListChecks, label: 'Forms' },
  { k: 'redact', I: Scan, label: 'Redact' },
  { k: 'compress', I: ArrowsInLineHorizontal, label: 'Compress' },
];

export default function PdfEditor() {
  useSeo({
    title: 'Free PDF Editor — Edit Text, Images & Sign PDFs Online | PikFinder',
    description: 'Edit any PDF free: change existing text, add or replace images, highlight, whiteout, draw and sign, then export. Upload a file or paste a link. No signup.',
    canonical: `${SITE_URL}/pdf-editor`,
    jsonLd: { '@context': 'https://schema.org', '@graph': [{ '@type': 'SoftwareApplication', name: 'PikFinder PDF Editor', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: `${SITE_URL}/pdf-editor`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Edit text and images in any PDF online for free.' }] },
  });

  const [pages, setPages] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [docName, setDocName] = useState('document.pdf');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [urlIn, setUrlIn] = useState('');

  const [tool, setTool] = useState('select');
  const [sel, setSel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [color, setColor] = useState('#111111');
  const [penW, setPenW] = useState(3);
  const [hint, setHint] = useState(true);
  const [exporting, setExporting] = useState('');

  const surfaceRef = useRef(null);
  const drag = useRef(null);
  const hist = useRef({ past: [], future: [] });
  const imgInput = useRef(null);
  const addPdfInput = useRef(null);
  const fileInput = useRef(null);

  const page = pages?.[pageIdx];
  const layers = page?.layers || [];
  const selLayer = layers.find((l) => l.id === sel);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  // history ------------------------------------------------------------------
  const snapshot = useCallback(() => { if (!pages) return; hist.current.past.push({ i: pageIdx, layers: clone(pages[pageIdx].layers) }); if (hist.current.past.length > 40) hist.current.past.shift(); hist.current.future = []; }, [pages, pageIdx]);
  const setLayers = useCallback((updater, record = true) => {
    setPages((prev) => { if (!prev) return prev; const n = prev.slice(); const cur = n[pageIdx]; n[pageIdx] = { ...cur, layers: typeof updater === 'function' ? updater(cur.layers) : updater }; return n; });
    if (record) snapshot();
  }, [pageIdx, snapshot]);
  const undo = () => { const h = hist.current; if (!h.past.length) return; const p = h.past.pop(); setPages((s) => { const n = s.slice(); h.future.push({ i: p.i, layers: clone(n[p.i].layers) }); n[p.i] = { ...n[p.i], layers: p.layers }; return n; }); setSel(null); setEditingId(null); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; const x = h.future.pop(); setPages((s) => { const n = s.slice(); h.past.push({ i: x.i, layers: clone(n[x.i].layers) }); n[x.i] = { ...n[x.i], layers: x.layers }; return n; }); setSel(null); setEditingId(null); };

  // load ---------------------------------------------------------------------
  const doLoad = useCallback(async (source, name) => {
    setError(''); setLoading('Reading PDF…'); setSel(null); setEditingId(null);
    try {
      const { pages: p } = await loadPdf(source, (i, n) => setLoading(`Rendering page ${i} of ${n}…`));
      hist.current = { past: [], future: [] };
      setPages(p); setPageIdx(0); setZoom(1);
      if (name) setDocName(name);
    } catch (e) { setError(e.message || 'Could not open that PDF.'); }
    finally { setLoading(''); }
  }, []);
  const onDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) doLoad(f, f.name); };
  const appendPdf = async (f) => { try { const { pages: p } = await loadPdf(f); setPages((prev) => [...prev, ...p]); } catch { notify('Could not add that PDF.'); } };

  // pointer helpers ----------------------------------------------------------
  const toPage = (e) => { const r = surfaceRef.current.getBoundingClientRect(); return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }; };
  const startMove = (e, id) => {
    if (tool !== 'select') return; e.stopPropagation();
    const l = layers.find((x) => x.id === id); if (!l) { return; } setSel(id);
    if (l.locked) return;
    const p0 = toPage(e); drag.current = { mode: 'move', id, ox: l.x, oy: l.y, pts0: l.points, px: p0.x, py: p0.y, moved: false };
    window.addEventListener('pointermove', onDragMove); window.addEventListener('pointerup', onDragEnd);
  };
  const startResize = (e, id) => { e.stopPropagation(); const l = layers.find((x) => x.id === id); if (!l) return; const p0 = toPage(e); drag.current = { mode: 'resize', id, ow: l.w, oh: l.h, os: l.size, px: p0.x, py: p0.y }; window.addEventListener('pointermove', onDragMove); window.addEventListener('pointerup', onDragEnd); };
  const onDragMove = (e) => {
    const d = drag.current; if (!d) return; const p = toPage(e); const dx = p.x - d.px, dy = p.y - d.py;
    setPages((prev) => { const n = prev.slice(); const cur = n[pageIdx]; n[pageIdx] = { ...cur, layers: cur.layers.map((l) => {
      if (l.id !== d.id) return l;
      if (d.mode === 'move') {
        if (l.type === 'draw' && d.pts0) return { ...l, points: d.pts0.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) };
        return { ...l, x: d.ox + dx, y: d.oy + dy };
      }
      const w = Math.max(12, d.ow + dx), h = Math.max(8, d.oh + dy);
      if (l.type === 'text') return { ...l, w, size: Math.max(6, (d.os || 14) * (h / (d.oh || 1))), h };
      return { ...l, w, h };
    }) }; return n; }); d.moved = true;
  };
  const onDragEnd = () => { if (drag.current?.moved) snapshot(); drag.current = null; window.removeEventListener('pointermove', onDragMove); window.removeEventListener('pointerup', onDragEnd); };

  const RECT_TOOLS = { whiteout: '#ffffff', highlight: '#fde047', shape: null, redact: '#111111' };
  const onSurfaceDown = (e) => {
    if (editingId) { setEditingId(null); return; }
    const p = toPage(e);
    if (tool === 'select') { setSel(null); return; }
    if (tool === 'text' || tool === 'fill' || tool === 'comment' || tool === 'formfield') {
      const id = uid('a');
      const isNote = tool === 'comment', isField = tool === 'formfield';
      setLayers((ls) => [...ls, {
        id, type: 'text', original: false, edited: true, x: p.x, y: p.y,
        w: isField ? 200 : 240, h: 30, size: isField ? 15 : 18,
        text: isNote ? 'Comment' : isField ? '' : 'New text',
        color: isNote ? '#78350f' : color, align: 'left', font: 'Inter', lineHeight: 1.25, opacity: 1,
        cover: isNote ? '#fef9c3' : undefined,   // sticky-note background
        field: isField || undefined,             // bordered form field
      }]);
      setSel(id); setTool('select'); setTimeout(() => setEditingId(id), 30);
    } else if (tool === 'link') {
      const id = uid('lk'); drag.current = { mode: 'newrect', id, x0: p.x, y0: p.y, isLink: true };
      setLayers((ls) => [...ls, { id, type: 'link', x: p.x, y: p.y, w: 1, h: 1, url: '', color: '#2563eb', opacity: 1 }]);
      window.addEventListener('pointermove', onNewRect); window.addEventListener('pointerup', onNewRectEnd);
    } else if (tool === 'draw' || tool === 'sign') {
      const id = uid('d'); drag.current = { mode: 'draw', id };
      setLayers((ls) => [...ls, { id, type: 'draw', color: tool === 'sign' ? '#1d4ed8' : color, width: tool === 'sign' ? penW + 1 : penW, points: [{ x: p.x, y: p.y }], opacity: 1 }], false);
      window.addEventListener('pointermove', onDrawMove); window.addEventListener('pointerup', onDrawEnd);
    } else if (tool in RECT_TOOLS) {
      const kind = tool === 'redact' ? 'whiteout' : tool;
      const id = uid('r'); drag.current = { mode: 'newrect', id, x0: p.x, y0: p.y };
      const fill = RECT_TOOLS[tool] ?? color;
      const layer = { id, type: kind, x: p.x, y: p.y, w: 1, h: 1, color: fill, opacity: kind === 'highlight' ? 0.4 : 1 };
      setLayers((ls) => [...ls, layer]);
      window.addEventListener('pointermove', onNewRect); window.addEventListener('pointerup', onNewRectEnd);
    }
  };
  const onNewRect = (e) => { const d = drag.current; if (!d) return; const p = toPage(e); setPages((prev) => { const n = prev.slice(); const cur = n[pageIdx]; n[pageIdx] = { ...cur, layers: cur.layers.map((l) => l.id === d.id ? { ...l, x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y), w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0) } : l) }; return n; }); };
  const onNewRectEnd = () => {
    const d = drag.current; const id = d?.id; const isLink = d?.isLink; drag.current = null;
    window.removeEventListener('pointermove', onNewRect); window.removeEventListener('pointerup', onNewRectEnd);
    if (isLink) {
      const url = window.prompt('Link URL (https://…):', 'https://');
      if (!url || url === 'https://') { setLayers((ls) => ls.filter((l) => l.id !== id)); setTool('select'); return; }
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      setLayers((ls) => ls.map((l) => l.id === id ? { ...l, url: href } : l));
    }
    snapshot(); setTool('select'); setSel(id);
  };
  const onDrawMove = (e) => { const d = drag.current; if (!d) return; const p = toPage(e); setPages((prev) => { const n = prev.slice(); const cur = n[pageIdx]; n[pageIdx] = { ...cur, layers: cur.layers.map((l) => l.id === d.id ? { ...l, points: [...l.points, { x: p.x, y: p.y }] } : l) }; return n; }); };
  const onDrawEnd = () => { drag.current = null; snapshot(); window.removeEventListener('pointermove', onDrawMove); window.removeEventListener('pointerup', onDrawEnd); };

  // text edit ----------------------------------------------------------------
  const beginEdit = (e, id) => { e.stopPropagation(); if (tool !== 'select') return; setSel(id); snapshot(); setEditingId(id); };
  // Live sync while typing (no history entry) so the edit is always applied even
  // if the user exports without blurring. Blur/Escape finalises it.
  const liveText = (id, el) => { const text = el.innerText; setLayers((ls) => ls.map((l) => l.id === id ? { ...l, text, edited: true } : l), false); };
  const commitText = (id, el) => { const text = el.innerText; setLayers((ls) => ls.map((l) => l.id === id ? { ...l, text, edited: true } : l), false); setEditingId(null); };

  // images -------------------------------------------------------------------
  const addImage = (dataUrl) => { const im = new Image(); im.onload = () => { const maxW = page.w * 0.5; const w = Math.min(maxW, im.width); const h = w * (im.height / im.width); const id = uid('i'); setLayers((ls) => [...ls, { id, type: 'image', src: dataUrl, x: (page.w - w) / 2, y: (page.h - h) / 2, w, h, opacity: 1 }]); setSel(id); setTool('select'); }; im.src = dataUrl; };
  const onPickImage = async (e) => { const f = e.target.files?.[0]; if (f) addImage(await fileToDataUrl(f)); e.target.value = ''; };
  const addImageFromUrl = async () => { const url = window.prompt('Paste an image URL:'); if (!url) return; try { addImage(await urlToDataUrl(url)); } catch { notify('Could not load that image URL.'); } };

  // selection ops ------------------------------------------------------------
  const patchSel = (patch) => { if (sel) setLayers((ls) => ls.map((l) => l.id === sel ? { ...l, ...patch } : l)); };
  // Live patch for continuous controls (sliders, colour pickers): don't push a
  // history entry per event — snapshot once when the interaction begins instead.
  const patchLive = (patch) => { if (sel) setLayers((ls) => ls.map((l) => l.id === sel ? { ...l, ...patch } : l), false); };
  const liveStart = () => { if (sel) snapshot(); };
  const removeSel = () => { if (!sel) return; const l = layers.find((x) => x.id === sel); if (l?.type === 'text' && l.original) setLayers((ls) => ls.map((x) => x.id === sel ? { ...x, text: '', edited: true } : x)); else setLayers((ls) => ls.filter((x) => x.id !== sel)); setSel(null); setEditingId(null); };
  const duplicateSel = () => { if (!selLayer) return; const id = uid('c'); const copy = { ...clone(selLayer), id, x: selLayer.x + 16, y: selLayer.y + 16, original: false, edited: true }; setLayers((ls) => [...ls, copy]); setSel(id); };
  const arrange = (dir) => { if (!sel) return; setLayers((ls) => { const i = ls.findIndex((l) => l.id === sel); if (i < 0) return ls; const a = ls.slice(); const [it] = a.splice(i, 1); if (dir === 'front') a.push(it); else if (dir === 'back') a.unshift(it); else if (dir === 'up') a.splice(Math.min(a.length, i + 1), 0, it); else a.splice(Math.max(0, i - 1), 0, it); return a; }); };

  // keyboard + paste ---------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (editingId) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); removeSel(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); }
    };
    const onPaste = (e) => { if (!pages) return; const it = [...(e.clipboardData?.items || [])].find((x) => x.type.startsWith('image/')); if (it) { const f = it.getAsFile(); if (f) fileToDataUrl(f).then(addImage); } };
    window.addEventListener('keydown', onKey); window.addEventListener('paste', onPaste);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('paste', onPaste); };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // exports ------------------------------------------------------------------
  const exportPdf = async (opts = {}) => { setExporting('pdf'); try { download(await buildPdf(pages, opts), docName.replace(/\.pdf$/i, '') + (opts.compress ? '-compressed.pdf' : '-edited.pdf')); if (opts.compress) notify('Exported a compressed PDF.'); } catch { setError('Export failed.'); } finally { setExporting(''); } };
  const exportPng = async () => { setExporting('png'); try { const b = await exportPagePng(page, 2); if (b) download(b, `page-${pageIdx + 1}.png`); } catch { setError('Export failed.'); } finally { setExporting(''); } };
  // Native share sheet with the edited PDF; falls back to a download.
  const sharePdf = async () => {
    setExporting('pdf');
    try {
      const blob = await buildPdf(pages);
      const name = (docName.replace(/\.pdf$/i, '') || 'document') + '-edited.pdf';
      const file = new File([blob], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: docName });
      } else {
        download(blob, name); notify('Sharing isn’t supported on this device — downloaded instead.');
      }
    } catch (e) { if (e && e.name !== 'AbortError') notify('Could not share this file.'); }
    finally { setExporting(''); }
  };
  const fitZoom = () => { const st = surfaceRef.current?.parentElement?.parentElement; if (!st || !page) return; const avail = st.clientHeight - 56; setZoom(Math.max(0.4, Math.min(2, avail / page.h))); };

  const pickTool = (t) => { setTool(t); setSel(null); };
  const CREATE_TOOLS = ['text', 'draw', 'sign', 'shape', 'highlight', 'whiteout', 'redact', 'image', 'fill', 'comment', 'formfield', 'link'];

  // ── LOAD SCREEN ─────────────────────────────────────────────────────────────
  if (!pages) {
    return (
      <div className="subpage-wrap pdfe-load">
        <header className="pdfe-load-head">
          <h1>Free PDF Editor</h1>
          <p>Edit text and images in any PDF, add highlights, signatures, whiteout and drawings — then download. Everything runs in your browser; nothing is uploaded.</p>
        </header>
        {error && <div className="biz-flash err" style={{ maxWidth: 520, margin: '0 auto 16px' }}>{error}</div>}
        <div className="pdfe-drop" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onClick={() => fileInput.current?.click()}>
          <FileArrowUp size={40} />
          <strong>{loading || 'Drop a PDF here, or click to browse'}</strong>
          <span>or paste a link below</span>
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => e.target.files?.[0] && doLoad(e.target.files[0], e.target.files[0].name)} />
        </div>
        <div className="pdfe-url">
          <LinkSimple size={18} />
          <input value={urlIn} onChange={(e) => setUrlIn(e.target.value)} placeholder="https://example.com/file.pdf" onKeyDown={(e) => e.key === 'Enter' && urlIn && doLoad(urlIn.trim(), 'document.pdf')} />
          <button className="btn-primary" disabled={!urlIn || !!loading} onClick={() => doLoad(urlIn.trim(), 'document.pdf')}>Open</button>
        </div>
      </div>
    );
  }

  // ── EDITOR ──────────────────────────────────────────────────────────────────
  const isText = selLayer?.type === 'text';
  const hasFill = selLayer && ['shape', 'highlight', 'whiteout', 'draw'].includes(selLayer.type);

  return (
    <div className="pdfx">
      {/* Header */}
      <header className="pdfx-head">
        <div className="pdfx-brand"><Logo size={26} showText={false} animated={false} /> PikFinder</div>
        <button className="pdfx-close" title="Close file" onClick={() => { setPages(null); setError(''); }}><X size={16} /></button>
        <div className="pdfx-doc">
          <span className="pdfx-doc-name">{docName} <CaretDown size={13} /></span>
          <span className="pdfx-doc-sub">Saved just now</span>
        </div>
        <div className="pdfx-center">
          <button className="pdfx-ico" title="Undo" onClick={undo}><ArrowCounterClockwise size={18} /></button>
          <button className="pdfx-ico" title="Redo" onClick={redo}><ArrowClockwise size={18} /></button>
          <div className="pdfx-zoom">
            <button className="pdfx-ico" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}><Minus size={15} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button className="pdfx-ico" onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}><Plus size={15} /></button>
          </div>
          <button className="pdfx-ico" title="Fit page" onClick={fitZoom}><Hand size={17} /></button>
          <button className="pdfx-ico" title="Export current page as PNG" disabled={!!exporting} onClick={exportPng}><DotsThree size={18} /></button>
        </div>
        <div className="pdfx-head-right">
          <button className="pdfx-share" disabled={!!exporting} onClick={sharePdf}><ShareNetwork size={16} /> Share</button>
          <button className="pdfx-download" disabled={!!exporting} onClick={exportPdf}><DownloadSimple size={16} /> {exporting === 'pdf' ? 'Saving…' : 'Download PDF'}</button>
        </div>
      </header>

      {/* Tool ribbon */}
      <div className="pdfx-ribbon">
        {TOOLS.map(({ k, I, label, soon }) => (
          <button key={k} className={`pdfx-tool ${tool === k ? 'active' : ''} ${soon ? 'soon' : ''}`} onClick={() => pickTool(k)}>
            <I size={17} /> {label}
          </button>
        ))}
      </div>

      {/* Hint */}
      {hint && (
        <div className="pdfx-hint">
          <Info size={16} /><span><strong>Double-click</strong> any text to edit it · <strong>Drag</strong> to move elements · Use tools to add, edit or annotate</span>
          <button className="pdfx-gotit" onClick={() => setHint(false)}>Got it</button>
          <button className="pdfx-hint-x" onClick={() => setHint(false)}><X size={14} /></button>
        </div>
      )}

      <div className="pdfx-body">
        {/* Left: pages + nav */}
        <aside className="pdfx-left">
          <div className="pdfx-left-head"><span>PAGES</span><button title="Add PDF" onClick={() => addPdfInput.current?.click()}><PlusIcon size={15} /></button>
            <input ref={addPdfInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => e.target.files?.[0] && appendPdf(e.target.files[0])} />
          </div>
          <div className="pdfx-thumbs">
            {pages.map((p, i) => (
              <button key={i} className={`pdfx-thumb ${i === pageIdx ? 'active' : ''}`} onClick={() => { setPageIdx(i); setSel(null); }}>
                <img src={p.bg} alt={`Page ${i + 1}`} loading="lazy" />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
          <nav className="pdfx-nav">
            {NAV.map(({ k, I, label }) => {
              const onNav = () => {
                if (k === 'redact') { setTool('redact'); notify('Redact: drag to cover sensitive areas.'); }
                else if (k === 'comments') { setTool('comment'); notify('Click on the page to drop a comment note.'); }
                else if (k === 'forms') { setTool('formfield'); notify('Click to add a fillable form field, then type into it.'); }
                else if (k === 'compress') { exportPdf({ compress: true }); }
              };
              return (
                <button key={k} className={`pdfx-navitem ${(k === 'pages') ? 'active' : ''} ${tool === (k === 'comments' ? 'comment' : k === 'forms' ? 'formfield' : k) ? 'active' : ''}`} onClick={onNav}>
                  <I size={17} /> {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Center: canvas */}
        <div className="pdfx-stage">
          <div className="pdfx-scroll">
            <div className="pdfx-page-wrap" style={{ width: page.w * zoom, height: page.h * zoom }}>
              <div ref={surfaceRef} className={`pdfx-surface tool-${tool}`} style={{ width: page.w, height: page.h, transform: `scale(${zoom})` }} onPointerDown={onSurfaceDown}>
                <img className="pdfx-bg" src={page.bg} alt={`PDF page ${pageIdx + 1}`} width={page.w} height={page.h} draggable={false} />
                {layers.map((l) => (
                  <LayerView key={l.id} l={l} selected={sel === l.id} editing={editingId === l.id} tool={tool}
                    onDown={startMove} onResize={startResize} onEdit={beginEdit} onCommit={commitText} onLive={liveText} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom pager */}
          <div className="pdfx-pager">
            <button className="pdfx-ico" disabled={pageIdx === 0} onClick={() => { setPageIdx((i) => i - 1); setSel(null); }}><CaretLeft size={16} /></button>
            <span>Page {pageIdx + 1} / {pages.length}</span>
            <button className="pdfx-ico" disabled={pageIdx === pages.length - 1} onClick={() => { setPageIdx((i) => i + 1); setSel(null); }}><CaretRight size={16} /></button>
            <div className="pdfx-pager-sep" />
            <button className="pdfx-ico" title="Export current page PNG" onClick={exportPng}><GridFour size={16} /></button>
            <button className="pdfx-ico" title="Fit page" onClick={fitZoom}><ArrowsOut size={16} /></button>
          </div>
        </div>

        {/* Right: properties */}
        <aside className="pdfx-right">
          <input ref={imgInput} type="file" accept="image/*" hidden onChange={onPickImage} />
          {!selLayer && CREATE_TOOLS.includes(tool) && (
            <div className="pdfx-prop">
              <div className="pdfx-prop-title">{TOOLS.find((t) => t.k === tool)?.label || 'Tool'} options</div>
              {tool === 'image' ? (
                <div className="pdfx-obj-row">
                  <button title="Upload image" onClick={() => imgInput.current?.click()}><UploadSimple size={16} /> </button>
                  <button title="From URL" onClick={addImageFromUrl}><LinkSimple size={16} /> </button>
                </div>
              ) : (
                <>
                  <div className="pdfx-prop-row"><span className="pdfx-lab">Color</span><input className="pdfx-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
                  {(tool === 'draw' || tool === 'sign') && <label className="pdfx-slide"><span>Pen</span><input type="range" min="1" max="12" value={penW} onChange={(e) => setPenW(+e.target.value)} /><b>{penW}</b></label>}
                </>
              )}
            </div>
          )}
          {isText && (
            <div className="pdfx-prop">
              <div className="pdfx-prop-title">Text Properties</div>
              <select className="pdfx-select" value={selLayer.font || 'Inter'} onChange={(e) => patchSel({ font: e.target.value })}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="pdfx-prop-row">
                <select className="pdfx-select sm" value={Math.round(selLayer.size)} onChange={(e) => patchSel({ size: +e.target.value })}>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="pdfx-color" type="color" value={selLayer.color || '#111111'} onPointerDown={liveStart} onChange={(e) => patchLive({ color: e.target.value })} />
              </div>
              <div className="pdfx-btn-row">
                <button className={selLayer.bold ? 'on' : ''} onClick={() => patchSel({ bold: !selLayer.bold })}><TextB size={16} /></button>
                <button className={selLayer.italic ? 'on' : ''} onClick={() => patchSel({ italic: !selLayer.italic })}><TextItalic size={16} /></button>
                <button className={selLayer.underline ? 'on' : ''} onClick={() => patchSel({ underline: !selLayer.underline })}><TextUnderline size={16} /></button>
              </div>
              <div className="pdfx-btn-row">
                {[['left', TextAlignLeft], ['center', TextAlignCenter], ['right', TextAlignRight], ['justify', TextAlignJustify]].map(([a, Ic]) => (
                  <button key={a} className={selLayer.align === a ? 'on' : ''} onClick={() => patchSel({ align: a })}><Ic size={16} /></button>
                ))}
              </div>
              <select className="pdfx-select" value={selLayer.lineHeight || 1.25} onChange={(e) => patchSel({ lineHeight: +e.target.value })}>
                {LHS.map((v) => <option key={v} value={v}>Line height {v}</option>)}
              </select>
              <label className="pdfx-slide"><span>Letter Spacing</span><input type="range" min="-2" max="10" step="0.5" value={selLayer.letterSpacing || 0} onPointerDown={liveStart} onChange={(e) => patchLive({ letterSpacing: +e.target.value })} /><b>{selLayer.letterSpacing || 0}</b></label>
            </div>
          )}

          {hasFill && (
            <div className="pdfx-prop">
              <div className="pdfx-prop-title">{selLayer.type === 'highlight' ? 'Highlight' : selLayer.type === 'draw' ? 'Stroke' : selLayer.type === 'whiteout' ? 'Whiteout' : 'Shape'}</div>
              <div className="pdfx-prop-row"><span className="pdfx-lab">Color</span><input className="pdfx-color" type="color" value={selLayer.color || '#111111'} onPointerDown={liveStart} onChange={(e) => patchLive({ color: e.target.value })} /></div>
            </div>
          )}

          <div className="pdfx-prop">
            <div className="pdfx-prop-title">Object Properties</div>
            {!selLayer && <p className="pdfx-empty">Select an element to edit its properties.</p>}
            {selLayer && <>
              <div className="pdfx-obj-row">
                <button title="Rotate 15°" onClick={() => patchSel({ rotate: ((selLayer.rotate || 0) + 15) % 360 })}><ArrowClockwise size={16} /></button>
                <button title={selLayer.locked ? 'Unlock' : 'Lock'} className={selLayer.locked ? 'on' : ''} onClick={() => patchSel({ locked: !selLayer.locked })}>{selLayer.locked ? <Lock size={16} /> : <LockOpen size={16} />}</button>
                <button title="Duplicate" onClick={duplicateSel}><Copy size={16} /></button>
                <button title="Delete" onClick={removeSel}><Trash size={16} /></button>
              </div>
              <label className="pdfx-slide"><span>Opacity</span><input type="range" min="0" max="1" step="0.05" value={selLayer.opacity == null ? 1 : selLayer.opacity} onPointerDown={liveStart} onChange={(e) => patchLive({ opacity: +e.target.value })} /><b>{Math.round((selLayer.opacity == null ? 1 : selLayer.opacity) * 100)}%</b></label>
              <div className="pdfx-prop-title sub">Arrange</div>
              <div className="pdfx-obj-row">
                <button title="Forward" onClick={() => arrange('up')}><ArrowUp size={16} /></button>
                <button title="Backward" onClick={() => arrange('down')}><ArrowDown size={16} /></button>
                <button title="To front" onClick={() => arrange('front')}><ArrowLineUp size={16} /></button>
                <button title="To back" onClick={() => arrange('back')}><ArrowLineDown size={16} /></button>
              </div>
            </>}
          </div>
        </aside>
      </div>

      {toast && <div className="pdfx-toast">{toast}</div>}
      {error && <div className="pdfe-err"><span>{error}</span><button onClick={() => setError('')}><X size={14} /></button></div>}
    </div>
  );
}

// ── one layer ─────────────────────────────────────────────────────────────────
function LayerView({ l, selected, editing, tool, onDown, onResize, onEdit, onCommit, onLive }) {
  const ref = useRef(null);
  // On edit-start, seed the editable node imperatively and select all. While
  // editing we don't bind React children (below), so re-renders never reset the
  // caret or wipe the user's text.
  useLayoutEffect(() => {
    if (editing && ref.current) {
      if (ref.current.innerText !== (l.text || '')) ref.current.textContent = l.text || '';
      ref.current.focus();
      document.getSelection()?.selectAllChildren(ref.current);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectable = tool === 'select';
  const rot = l.rotate ? `rotate(${l.rotate}deg)` : '';
  const base = { left: l.x, top: l.y, width: l.w, height: l.h, position: 'absolute', transform: rot, transformOrigin: 'center', opacity: l.opacity == null ? undefined : l.opacity };

  if (l.type === 'text') {
    const visible = editing || selected || l.edited || !l.original;
    return (
      <div className={`pdfx-layer pdfx-text ${selected ? 'sel' : ''} ${l.original && !l.edited && !selected ? 'ghost' : ''}`}
        style={{ ...base, fontFamily: l.font || 'Inter', fontSize: l.size, fontWeight: l.bold ? 700 : 400, fontStyle: l.italic ? 'italic' : 'normal', textDecoration: l.underline ? 'underline' : 'none', lineHeight: l.lineHeight || 1.25, letterSpacing: `${l.letterSpacing || 0}px`, color: visible ? l.color : 'transparent', textAlign: l.align, background: l.cover ? l.cover : ((editing || (l.original && l.edited)) ? '#fff' : 'transparent'), border: l.field ? '1px solid #94a3b8' : undefined, borderRadius: l.field ? 4 : undefined, padding: l.field ? '2px 6px' : undefined, cursor: selectable ? 'move' : 'text' }}
        onPointerDown={(e) => onDown(e, l.id)} onDoubleClick={(e) => onEdit(e, l.id)}>
        <div ref={ref} className="pdfx-text-in" contentEditable={editing} suppressContentEditableWarning
          onInput={(e) => editing && onLive(l.id, e.currentTarget)}
          onBlur={(e) => onCommit(l.id, e.currentTarget)}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur(); } }}
          onPaste={(e) => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData)?.getData('text/plain') || ''; document.execCommand('insertText', false, t); }}
          style={{ outline: 'none', whiteSpace: 'pre-wrap', minHeight: '1em' }}>{editing ? undefined : l.text}</div>
        {selected && !editing && <span className="pdfx-handle" onPointerDown={(e) => onResize(e, l.id)} />}
      </div>
    );
  }
  if (l.type === 'image') {
    return (
      <div className={`pdfx-layer ${selected ? 'sel' : ''}`} style={{ ...base, cursor: selectable ? 'move' : 'default' }} onPointerDown={(e) => onDown(e, l.id)}>
        <img src={l.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        {selected && <span className="pdfx-handle" onPointerDown={(e) => onResize(e, l.id)} />}
      </div>
    );
  }
  if (l.type === 'whiteout' || l.type === 'shape' || l.type === 'highlight') {
    const isHl = l.type === 'highlight';
    return (
      <div className={`pdfx-layer ${selected ? 'sel' : ''} ${l.type === 'whiteout' ? 'pdfx-white' : ''}`}
        style={{ ...base, background: l.color, opacity: l.opacity == null ? (isHl ? 0.4 : 1) : l.opacity, mixBlendMode: isHl ? 'multiply' : 'normal', cursor: selectable ? 'move' : 'default' }}
        onPointerDown={(e) => onDown(e, l.id)}>
        {selected && <span className="pdfx-handle" onPointerDown={(e) => onResize(e, l.id)} />}
      </div>
    );
  }
  if (l.type === 'draw' && l.points?.length) {
    const d = l.points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
    const xs = l.points.map((p) => p.x), ys = l.points.map((p) => p.y);
    const pad = (l.width || 2) + 6;
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
    const bw = Math.max(...xs) - Math.min(...xs) + pad * 2, bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
    return (
      <div className={`pdfx-layer pdfx-draw-layer ${selected ? 'sel' : ''}`}
        style={{ position: 'absolute', left: minX, top: minY, width: bw, height: bh, opacity: l.opacity == null ? 1 : l.opacity, cursor: selectable ? 'move' : 'default' }}
        onPointerDown={(e) => onDown(e, l.id)}>
        <svg width={bw} height={bh} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
          <path d={d} transform={`translate(${-minX} ${-minY})`} fill="none" stroke={l.color} strokeWidth={l.width} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (l.type === 'link') {
    return (
      <div className={`pdfx-layer pdfx-link ${selected ? 'sel' : ''}`}
        style={{ ...base, border: '1.5px dashed #2563eb', borderRadius: 4, background: 'rgba(37,99,235,0.06)', cursor: selectable ? 'move' : 'default' }}
        title={l.url || 'Link'} onPointerDown={(e) => onDown(e, l.id)}>
        <span style={{ position: 'absolute', top: -9, left: 6, fontSize: 9, fontWeight: 700, color: '#2563eb', background: 'var(--bg, #fff)', padding: '0 3px', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {l.url || 'link'}</span>
        {selected && <span className="pdfx-handle" onPointerDown={(e) => onResize(e, l.id)} />}
      </div>
    );
  }
  return null;
}
