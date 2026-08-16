import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { STUDIO_PREMIUM_GATING } from '../config/features';
import ColorField from './ColorField';
import {
  Upload, TextT, Square, Circle as CircleIcon, Trash, DownloadSimple,
  FlipHorizontal, FlipVertical, Image as ImageIcon,
  Eye, EyeSlash, DotsSixVertical, CaretLeft, MagicWand,
  Shapes, MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowUUpLeft, ArrowUUpRight,
  MagnifyingGlass, PaintBucket, GridFour, CheckCircle, Gear,
  TextB, TextItalic, TextUnderline, TextAlignLeft, TextAlignCenter, TextAlignRight,
  Copy, Lock, LockOpen, PencilSimple, CaretDown, Question, ArrowLineUp, LinkSimple, LinkBreak,
  Ruler as RulerIcon,
  Triangle, Diamond, Pentagon, Hexagon, Star, StarFour, Heart, ArrowRight, ArrowUp,
  CaretRight, Plus, Lightning, ChatCircle, MapPin, Minus,
  AlignLeft, AlignRight, AlignTop, AlignBottom, AlignCenterHorizontal, AlignCenterVertical,
  Crop, Eraser, Drop, PaintBrush, PenNib, Cursor, Hand, ArrowsOutCardinal, Check,
  Sparkle, ArrowsOut, X as XIcon, FloppyDisk
} from '@phosphor-icons/react';
import { Reorder } from 'framer-motion';
import StudioMark from '../components/StudioMark';
import { canvasToBlob } from '../tools/engines/canvas-utils';
import { PRESETS, getPreset } from './presets';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { BUSINESS_TEMPLATES } from '../business/templates';
import { PREMIUM_TEMPLATES } from '../business/premiumTemplates';
import { loadCustom, addCustom } from '../business/customTemplates';
import { extractPlaceholders } from '../lib/render/renderTemplate';
import { ELEMENTS, buildShapePath, BLEND_MODES, makeGradient, shapeToSvgPath } from './icons';
import { removeBackground, blurBackground } from './segment';
import { searchMedia } from '../lib/mediaApi';
import { sceneToSvg as renderSceneSvg } from '../lib/render/sceneToSvg.node.js';

// Curated premium font library, grouped by feel. De-duplicated at the end so the
// dropdown never shows repeats. Web-safe fonts (Impact/Courier New/Georgia) are
// excluded from the Google Fonts request by the loader below.
const FONTS = Array.from(new Set([
  // Modern sans
  'Inter', 'Outfit', 'Plus Jakarta Sans', 'Roboto', 'Poppins',
  'Montserrat', 'Raleway', 'Lato', 'Open Sans', 'Nunito',
  'Space Grotesk', 'DM Sans', 'Manrope', 'Sora', 'Work Sans',
  'Rubik', 'Archivo', 'Epilogue', 'Figtree', 'Urbanist', 'Mulish', 'Karla',
  // Elegant serif & display
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Libre Baskerville',
  'DM Serif Display', 'Cormorant Garamond', 'Fraunces', 'Spectral', 'EB Garamond',
  'Bodoni Moda', 'Cinzel', 'Cinzel Decorative', 'Abril Fatface',
  // Bold / poster
  'Oswald', 'Bebas Neue', 'Anton', 'Righteous', 'Archivo Black', 'Fjalla One',
  'Teko', 'Alfa Slab One', 'Bungee', 'Passion One',
  // Script & handwriting
  'Caveat', 'Dancing Script', 'Pacifico', 'Lobster', 'Permanent Marker',
  'Sacramento', 'Great Vibes', 'Satisfy', 'Kaushan Script',
  // Mono
  'JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono',
  // Web-safe
  'Impact', 'Courier New', 'Georgia',
]));

// Maps an ELEMENTS entry's `icon` name to its Phosphor tile component.
const ELEMENT_ICONS = {
  Square, Circle: CircleIcon, Triangle, Diamond, Pentagon, Hexagon, Star, StarFour,
  Heart, ArrowRight, ArrowUp, CaretRight, Plus, Lightning, ChatCircle, MapPin, Minus,
};

// One-click photo filter presets (extra CSS filters appended to the live adjusts).
const IMAGE_FILTERS = {
  none: '',
  bw: 'grayscale(100%)',
  vintage: 'sepia(45%) contrast(92%) brightness(105%) saturate(120%)',
  cinematic: 'contrast(118%) saturate(88%) brightness(96%)',
  warm: 'sepia(28%) saturate(130%) brightness(103%)',
  cool: 'saturate(112%) hue-rotate(15deg) brightness(102%)',
  dramatic: 'contrast(138%) saturate(116%) brightness(92%)',
};
const IMAGE_FILTER_LIST = [
  ['none', 'Original'], ['bw', 'B&W'], ['vintage', 'Vintage'], ['cinematic', 'Cinematic'],
  ['warm', 'Warm'], ['cool', 'Cool'], ['dramatic', 'Dramatic'],
];

// Autosave: the current design is persisted to the browser under this key.
const AUTOSAVE_KEY = 'pikfinder-studio-autosave-v1';

// In-Studio help content (searchable + filterable).
const HELP_CATS = ['All', 'Getting Started', 'Tools', 'Editing', 'Text', 'Images', 'Export', 'Shortcuts', 'Tips'];
const HELP_ITEMS = [
  { cat: 'Getting Started', q: 'How do I start a design?', a: 'On the start screen pick Blank canvas, Edit a photo, or a Template. Or choose a size in the top bar (e.g. Instagram Post) and start adding elements from the left rail.' },
  { cat: 'Getting Started', q: 'How do I add my own photo?', a: 'Use Uploads → Upload Media, drag an image straight onto the canvas, paste with Ctrl/⌘+V, or search free Photos. On an empty canvas the artboard auto-fits your image.' },
  { cat: 'Getting Started', q: 'Where is the Brand Kit?', a: 'The Brand Kit tab (left rail) stores your brand colours and logo. Click a colour to apply it to the selection or the background, and "Add your logo" to place it on the canvas.' },
  { cat: 'Tools', q: 'What does each toolbar tool do?', a: 'Select moves & resizes; Text adds a text box; Image/Uploads add pictures; Shape & Elements add rectangles, circles and icons; Line draws lines; Draw is a freehand pen.' },
  { cat: 'Tools', q: 'How do I add icons?', a: 'Open Elements → “Icons from the web”, search a word like camera or heart, and click any icon to drop it onto the canvas.' },
  { cat: 'Editing', q: 'How do I resize keeping proportions?', a: 'Hold Shift while dragging a corner handle to keep the ratio, or turn on the aspect-ratio lock (chain icon) next to W and H in Properties and change either value. You can also resize from any side using the edge handles.' },
  { cat: 'Editing', q: 'How do I round corners?', a: 'Select a shape or image and set the Radius value in Properties (Design tab).' },
  { cat: 'Editing', q: 'How do I crop?', a: 'Double-click an image to crop it. To resize the whole artboard, use the Crop button in the top bar and drag the frame.' },
  { cat: 'Editing', q: 'How do I align & arrange layers?', a: 'Select layers and use the align buttons in Properties. Drag to reveal smart pink guides that snap to edges & centres. Reorder in the Layers strip.' },
  { cat: 'Text', q: 'How do I change fonts and styling?', a: 'Select text and use the top toolbar or Properties → Typography for font, size, weight, colour, letter-spacing and alignment.' },
  { cat: 'Images', q: 'Can I remove or blur a background?', a: 'Select an image, then use Properties → AI background to cut out the subject or blur the background — all in your browser.' },
  { cat: 'Images', q: 'How do I apply filters?', a: 'Select an image and adjust brightness, contrast, saturation, blur and preset filters in Properties.' },
  { cat: 'Export', q: 'How do I export my design?', a: 'Click Export (top-right), choose PNG, JPG, WebP, SVG or PDF, pick a scale up to 4× for high-resolution output, then download.' },
  { cat: 'Export', q: 'How do I get a transparent background?', a: 'Choose PNG or SVG and tick “Transparent background” in the Export panel.' },
  { cat: 'Shortcuts', q: 'Keyboard shortcuts', a: 'V select · T text · R rectangle · O ellipse · L line · Ctrl/⌘+Z undo · Ctrl/⌘+Shift+Z redo · Ctrl/⌘+D duplicate · Del delete · Space+drag pan · Arrow keys nudge.' },
  { cat: 'Tips', q: 'Design best practices', a: 'Start from a template, keep to 2–3 fonts, reuse Brand Kit colours for consistency, leave breathing room near the edges, build visual hierarchy with size & weight, and export at 2× for crisp results.' },
  { cat: 'Tips', q: 'Is my work saved?', a: 'The Studio autosaves during your session, but projects clear when you close the tab (for privacy). Export your design to keep a copy.' },
];

// Read a File/Blob as a data URL (persists across reloads, unlike blob: URLs).
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const uid = () => Math.random().toString(36).slice(2, 9);

// Apply a text layer's letter-case display transform.
function applyCase(text, c) {
  if (c === 'upper') return String(text).toUpperCase();
  if (c === 'lower') return String(text).toLowerCase();
  return String(text);
}

// Offscreen canvas for measuring real text dimensions (cached across calls).
const _measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const _measureCtx = _measureCanvas ? _measureCanvas.getContext('2d') : null;

// Measure a text layer's actual rendered size (width of the widest line, and
// total height from the line count) so selection/hit-testing match the glyphs
// instead of the hand-guessed _w/_h. Falls back to _w/_h if measuring is
// unavailable (SSR / no canvas).
function measureTextLayer(l) {
  if (!_measureCtx) return { w: l._w || 200, h: l._h || 80, oy: 0 };
  _measureCtx.font = `${l.italic ? 'italic ' : ''}${l.weight || 400} ${l.size}px "${l.font || 'Inter'}"`;
  _measureCtx.textBaseline = 'top'; // matches how draw() places each line at l.y
  try { _measureCtx.letterSpacing = `${l.spacing || 0}px`; } catch { /* older browsers */ }
  const lines = applyCase(l.text ?? '', l.textCase).split('\n');
  const size = l.size || 16;
  const lineHeight = size * (l.lineHeight || 1.2);
  let maxW = 0;
  // Track the real INK bounds (relative to l.y) so the box hugs the visible
  // glyphs — heavy display faces paint taller/above the em box, which is why the
  // old 1.2×size guess let letters poke outside the selection rectangle.
  let top = Infinity, bottom = -Infinity;
  lines.forEach((line, i) => {
    const m = _measureCtx.measureText(line || ' ');
    const w = Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0));
    if (w > maxW) maxW = w;
    const ly = i * lineHeight;
    const hasInk = m.actualBoundingBoxAscent != null && m.actualBoundingBoxDescent != null;
    // With textBaseline 'top', ascent is measured UP from l.y (the top line):
    // ink top = ly - ascent, ink bottom = ly + descent.
    const inkTop = hasInk ? ly - m.actualBoundingBoxAscent : ly;
    const inkBottom = hasInk ? ly + m.actualBoundingBoxDescent : ly + lineHeight;
    if (inkTop < top) top = inkTop;
    if (inkBottom > bottom) bottom = inkBottom;
  });
  if (!isFinite(top)) { top = 0; bottom = lines.length * lineHeight; }
  return {
    w: Math.max(1, Math.ceil(maxW) + 2),
    h: Math.max(1, Math.ceil(bottom - top)),
    oy: Math.floor(top), // vertical offset of the box top relative to l.y
  };
}

// Deep-clone layers for the history stack while PRESERVING the live image
// element (`el`), which JSON serialization silently drops — that loss is what
// made photos vanish on undo/redo.
function cloneLayers(layers) {
  return (layers || []).map((l) => {
    const { el, ...rest } = l;
    const copy = JSON.parse(JSON.stringify(rest));
    if (el) copy.el = el; // keep the same decoded image reference
    return copy;
  });
}

// Render a freehand stroke: `pts` are offsets from (ox,oy). Smooths the line by
// running a quadratic curve through the midpoints of consecutive points, so the
// path looks natural rather than jagged. Used by pen / brush / pencil / eraser.
function strokePoints(ctx, pts, ox = 0, oy = 0, { color = '#111827', width = 4, mode = 'pen', soft = 0 } = {}) {
  if (!pts || !pts.length) return;
  ctx.save();
  ctx.strokeStyle = mode === 'eraser' ? '#000' : color;
  ctx.lineWidth = Math.max(0.5, width);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (soft > 0 && mode !== 'eraser') {
    ctx.shadowColor = color;
    ctx.shadowBlur = width * soft;
  }
  const P = (i) => ({ x: ox + pts[i].x, y: oy + pts[i].y });
  ctx.beginPath();
  const p0 = P(0);
  ctx.moveTo(p0.x, p0.y);
  if (pts.length === 1) {
    // A single tap → a dot.
    ctx.lineTo(p0.x + 0.1, p0.y + 0.1);
  } else if (pts.length === 2) {
    const p1 = P(1);
    ctx.lineTo(p1.x, p1.y);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const c = P(i);
      const n = P(i + 1);
      ctx.quadraticCurveTo(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2);
    }
    const last = P(pts.length - 1);
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
  ctx.restore();
}

// --- Freehand smoothing (Figma-pencil feel) ---
// Drop points closer together than `minDist` so shaky micro-jitter disappears.
function decimatePoints(pts, minDist) {
  if (!pts || pts.length < 3) return pts || [];
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const q = out[out.length - 1];
    if (Math.hypot(pts[i].x - q.x, pts[i].y - q.y) >= minDist) out.push(pts[i]);
  }
  const last = pts[pts.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}
// Chaikin corner-cutting turns a polyline into a smooth curve.
function chaikin(pts, iterations) {
  let p = pts;
  for (let k = 0; k < iterations; k++) {
    if (p.length < 3) break;
    const n = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      n.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      n.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    n.push(p[p.length - 1]);
    p = n;
  }
  return p;
}
// level 0..1 → progressively smoother/simpler stroke.
function smoothStroke(raw, level) {
  if (!raw || raw.length < 3 || level <= 0) return raw || [];
  const minDist = 1 + level * 6;
  const iters = Math.max(1, Math.round(level * 3));
  return chaikin(decimatePoints(raw, minDist), iters);
}

// Build a cubic-bezier vector path from anchors. Each anchor has an "out" handle
// offset (hx,hy); the "in" handle is its mirror (symmetric = smooth). Corner
// points have hx=hy=0. Coordinates are offset by (ox,oy).
function vectorPath(ctx, anchors, ox = 0, oy = 0, closed = false) {
  if (!anchors || !anchors.length) return;
  const A = (i) => ({ x: ox + anchors[i].x, y: oy + anchors[i].y, hx: anchors[i].hx || 0, hy: anchors[i].hy || 0 });
  ctx.beginPath();
  const a0 = A(0);
  ctx.moveTo(a0.x, a0.y);
  const seg = (i, j) => {
    const a = A(i), b = A(j);
    ctx.bezierCurveTo(a.x + a.hx, a.y + a.hy, b.x - b.hx, b.y - b.hy, b.x, b.y);
  };
  for (let i = 0; i < anchors.length - 1; i++) seg(i, i + 1);
  if (closed && anchors.length > 2) { seg(anchors.length - 1, 0); ctx.closePath(); }
}
// SVG `d` string mirroring vectorPath().
function vectorToSvgPath(anchors, ox, oy, closed, nn) {
  if (!anchors || !anchors.length) return '';
  const A = (i) => ({ x: ox + anchors[i].x, y: oy + anchors[i].y, hx: anchors[i].hx || 0, hy: anchors[i].hy || 0 });
  const a0 = A(0);
  let d = `M ${nn(a0.x)} ${nn(a0.y)}`;
  const seg = (i, j) => {
    const a = A(i), b = A(j);
    d += ` C ${nn(a.x + a.hx)} ${nn(a.y + a.hy)} ${nn(b.x - b.hx)} ${nn(b.y - b.hy)} ${nn(b.x)} ${nn(b.y)}`;
  };
  for (let i = 0; i < anchors.length - 1; i++) seg(i, i + 1);
  if (closed && anchors.length > 2) { seg(anchors.length - 1, 0); d += ' Z'; }
  return d;
}

// Project point p onto segment a→b; returns the closest point, its parameter t
// and the distance. Used by the pen "Add point" tool to insert on a segment.
function projectToSeg(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const pt = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, pt, d: Math.hypot(px - pt.x, py - pt.y) };
}

// Pick a "nice" tick interval (in canvas px) so labels stay ~64px+ apart.
function rulerStep(scale) {
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  for (const s of steps) if (s * scale >= 64) return s;
  return 10000;
}

// A Figma-style ruler that spans the ENTIRE canvas viewport (not just the
// artboard). Canvas coord `v` maps to screen `pan + v*scale`; the origin (0)
// aligns with the artboard's top-left.
function ViewportRuler({ orientation, pan, scale, size, onPointerDown }) {
  if (!size || !scale) return null;
  const step = rulerStep(scale);
  const ticks = [];
  let v = Math.ceil((-pan / scale) / step) * step;
  const maxV = (size - pan) / scale;
  for (; v <= maxV; v += step) {
    const pos = pan + v * scale;
    if (pos < 22) continue; // keep clear of the corner square
    ticks.push({ v: Math.round(v), pos });
  }
  return (
    <div className={`studio-vruler ${orientation}`} title="Drag onto the canvas for a guide" onPointerDown={onPointerDown}>
      {ticks.map((t) => (
        <div key={t.v} className="studio-vruler-tick" style={orientation === 'h' ? { left: t.pos } : { top: t.pos }}>
          <span>{t.v}</span>
        </div>
      ))}
    </div>
  );
}

// Normalised list of gradient colour stops for a background. Falls back to the
// legacy two-colour {color,color2} model so old templates keep working.
function bgStops(bg) {
  if (bg && Array.isArray(bg.stops) && bg.stops.length >= 2) {
    return bg.stops
      .map((s) => ({ color: s.color || '#000000', pos: Math.max(0, Math.min(1, s.pos ?? 0)) }))
      .sort((a, b) => a.pos - b.pos);
  }
  return [
    { color: (bg && bg.color) || '#ffffff', pos: 0 },
    { color: (bg && bg.color2) || '#000000', pos: 1 },
  ];
}

// CSS background string for a template's `bg` (used by preview thumbnails).
function templateBgCss(bg) {
  if (!bg) return '#1e293b';
  if (bg.type === 'transparent') return 'transparent';
  if (bg.type === 'gradient') {
    const s = bgStops(bg).map((x) => `${x.color} ${Math.round(x.pos * 100)}%`).join(', ');
    return `linear-gradient(${bg.angle || 135}deg, ${s})`;
  }
  return bg.color;
}

// Relative luminance (0=black, 1=white) of a #rrggbb color, for contrast checks.
function hexLum(hex) {
  const c = (hex || '').replace('#', '');
  if (c.length < 6) return 0.5;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// Keep the template's own text color unless it's too close to the background
// (e.g. white text meant to sit on a shape). Then fall back to a readable color.
function previewTextColor(textColor, bg) {
  const base = bg?.color || '#1e293b';
  const bl = hexLum(base);
  if (Math.abs(hexLum(textColor) - bl) < 0.3) return bl > 0.5 ? '#0f172a' : '#ffffff';
  return textColor;
}

// A live mini-preview card for a template: shows the real background and the
// template's headline text scaled into a fixed-ratio tile.
function TemplateThumb({ tmpl, onClick, locked = false }) {
  // Render the REAL design (photos, shapes, fonts and all) as an inline SVG so the
  // panel preview matches exactly what loads onto the canvas.
  const dims = tmpl.presetId === 'custom'
    ? (tmpl.custom || { w: 1080, h: 1080 })
    : (getPreset(tmpl.presetId) ? { w: getPreset(tmpl.presetId).w, h: getPreset(tmpl.presetId).h } : { w: 1080, h: 1080 });
  let svg = '';
  try { svg = renderSceneSvg({ dims, bg: tmpl.bg, layers: tmpl.layers }); } catch { svg = ''; }
  // Only surface the "Pro" badge when gating is actually on; otherwise everything
  // is free and should read as free.
  const isPro = STUDIO_PREMIUM_GATING && !!(tmpl.pro || tmpl.premium);
  return (
    <button className="studio-tpl-card" onClick={onClick} title={`Use “${tmpl.name}”`}>
      <span className="studio-tpl-thumb">
        <span
          className="studio-tpl-preview studio-tpl-preview-svg"
          style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <span className={`studio-tpl-badge ${isPro ? 'pro' : 'free'}`}>{isPro ? 'Pro' : 'Free'}</span>
        {locked && <span className="studio-tpl-lock" aria-hidden="true"><Lock size={13} weight="fill" /></span>}
        <span className="studio-tpl-quick"><span className="studio-tpl-use">{locked ? <><Lock size={12} weight="bold" /> Unlock</> : <><Plus size={13} weight="bold" /> Use</>}</span></span>
      </span>
      <span className="studio-tpl-meta">
        <span className="studio-tpl-name">{tmpl.name}</span>
        <span className="studio-tpl-dims">{dims.w} × {dims.h}</span>
      </span>
    </button>
  );
}

export default function StudioApp() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const isPremium = !!user?.isPremium;
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const replaceRef = useRef(null);
  const canvasAreaRef = useRef(null);

  // -- Base Layout State
  const [presetId, setPresetId] = useState(params.get('preset') || 'instagram-post');
  const [custom, setCustom] = useState({ w: 1200, h: 800 });
  const preset = getPreset(presetId);
  const dims = presetId === 'custom' ? custom : { w: preset.w, h: preset.h };

  // -- Workspace chrome
  const [projectName, setProjectName] = useState('Untitled design');
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);                         // latest zoom (for wheel accumulation)
  const [pan, setPan] = useState({ x: 0, y: 0 });   // stage offset within the area
  const [viewport, setViewport] = useState({ w: 0, h: 0 }); // canvas-area size (for rulers)
  const [spaceDown, setSpaceDown] = useState(false); // hold Space to pan
  const [showGrid, setShowGrid] = useState(false);
  const [dirty, setDirty] = useState(false); // "save status" indicator
  const [uploads, setUploads] = useState([]); // session upload thumbnails
  
  const [bg, setBg] = useState({ type: 'solid', color: '#ffffff', color2: '#6d28d9', angle: 135 });
  const [layers, setLayers] = useState([]);
  // Live ref to the latest layers so window event handlers (which capture the
  // render they were created in) can read current data without stale closures.
  const layersRef = useRef(layers);
  layersRef.current = layers;
  // Selection model: `selectedIds` is the source of truth (multi-select).
  // `selectedId` (the last one) + `setSelectedId` keep single-select code simple.
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedId = selectedIds.length ? selectedIds[selectedIds.length - 1] : null;
  const setSelectedId = (id) => setSelectedIds(id == null ? [] : [id]);
  const [editingId, setEditingId] = useState(null);
  const [marquee, setMarquee] = useState(null); // {x,y,w,h} rubber-band rect
  const [ctxMenu, setCtxMenu] = useState(null);  // right-click menu {x,y}
  const [renamingId, setRenamingId] = useState(null); // layer being renamed
  const [crop, setCrop] = useState(null); // active crop {id,x,y,w,h,ix,iy,iw,ih}
  const [canvasCrop, setCanvasCrop] = useState(null); // crop the whole artboard {x,y,w,h,iw,ih}
  const [leftW, setLeftW] = useState(320);  // context panel width
  const [rightW, setRightW] = useState(320); // inspector width
  const [rulerGuides, setRulerGuides] = useState([]); // [{axis:'x'|'y', pos}]
  const [guideDrag, setGuideDrag] = useState(null);    // live guide being dragged
  const [bgBusy, setBgBusy] = useState(null);          // AI bg status text or null
  // AI prompt bar (Cursor-style) — floats over the canvas
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState('');        // transient status / hint line
  const clipboard = useRef(null); // copy/paste buffer for layer(s)

  // -- Freehand drawing (pen / brush / pencil / eraser)
  const [drawTool, setDrawTool] = useState(null);      // active tool, or null when not drawing
  const [drawColor, setDrawColor] = useState('#111827');
  const [drawSize, setDrawSize] = useState(6);
  const [drawing, setDrawing] = useState(null);        // live in-progress stroke {mode,color,strokeW,pts:[]}
  const drawRef = useRef(null);                        // mutable buffer for the current stroke
  const drawRaf = useRef(0);                           // rAF handle to batch stroke repaints
  const [drawSmooth, setDrawSmooth] = useState(0.5);   // pencil/brush smoothing 0..1
  // Vector pen state (Figma-style anchor placement)
  const [penDraft, setPenDraft] = useState(null);      // {anchors:[{x,y,hx,hy}], closed} in canvas coords, or null
  const [penCursor, setPenCursor] = useState(null);    // {x,y} rubber-band target
  const [brushRing, setBrushRing] = useState(null);     // {x,y,d} live brush-size cursor ring (screen px)
  // Main toolbar selection tool: move (default) | hand (pan) | scale (proportional resize)
  const [toolMode, setToolMode] = useState('move');
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  // Vector point-edit mode (double-click a pen path): move | bend | add | delete
  const [vecEdit, setVecEdit] = useState(null);   // id of the vector layer being edited
  const [vecTool, setVecTool] = useState('move');
  const [vecSel, setVecSel] = useState(null);     // selected anchor index
  const pickMoveTool = (mode) => {
    if (vecEdit) exitVecEdit();
    if (penDraft) commitPen(false);
    setDrawTool(null);
    setToolMode(mode);
    setMoveMenuOpen(false);
  };
  // Per-tool defaults so each brush feels distinct.
  const DRAW_TOOLS = {
    pen:    { size: 4,  opacity: 1,    soft: 0,   label: 'Pen' },
    brush:  { size: 14, opacity: 0.92, soft: 0.35, label: 'Brush' },
    pencil: { size: 2,  opacity: 0.85, soft: 0,   label: 'Pencil' },
    eraser: { size: 20, opacity: 1,    soft: 0,   label: 'Eraser' },
  };
  const pickDrawTool = (t) => {
    if (vecEdit) exitVecEdit();      // leave point-edit mode when starting a draw tool
    if (penDraft) commitPen(false); // finish any open pen path before switching
    setDrawTool(t);
    setToolMode('move');            // leave hand/scale mode when drawing
    setActiveTab('draw');           // open the Draw panel so its settings show
    setDrawSize(DRAW_TOOLS[t]?.size ?? 6);
    setSelectedIds([]); // clear selection so its overlay can't intercept strokes
  };

  // -- History (Undo/Redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const saveHistory = useCallback((newLayers, newBg) => {
    const state = { layers: cloneLayers(newLayers), bg: { ...newBg } };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    if (newHistory.length > 50) newHistory.shift(); // Keep last 50 states
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setLayers(cloneLayers(history[idx].layers));
      setBg({ ...history[idx].bg });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setLayers(cloneLayers(history[idx].layers));
      setBg({ ...history[idx].bg });
    }
  };
  
  // Initial history save
  useEffect(() => {
    if (history.length === 0) saveHistory(layers, bg);
  }, []);

  const setLayersWithHistory = (newLayersOrFn) => {
    setLayers(prev => {
      const updated = typeof newLayersOrFn === 'function' ? newLayersOrFn(prev) : newLayersOrFn;
      saveHistory(updated, bg);
      return updated;
    });
  };

  const setBgWithHistory = (newBgOrFn) => {
    setBg(prev => {
      const updated = typeof newBgOrFn === 'function' ? newBgOrFn(prev) : newBgOrFn;
      saveHistory(layers, updated);
      return updated;
    });
  };

  // -- UI State
  const [exportCfg, setExportCfg] = useState({ format: 'image/png', quality: 'high', scale: 1, transparent: false });
  const [exportOpen, setExportOpen] = useState(false);
  // Always export at least Full HD (1920px on the long side). If the artboard ×
  // chosen multiplier wouldn't reach it, bump the scale so downloads stay crisp
  // and print-ready. Capped so huge boards can't exceed the browser canvas limit.
  const EXPORT_MAX_SIDE = 15000;
  const hdMinScale = Math.max(dims.w, dims.h) < 1920 ? 1920 / Math.max(dims.w, dims.h) : 1;
  const effExportScale = Math.min(
    Math.max(exportCfg.scale || 1, hdMinScale),
    EXPORT_MAX_SIDE / dims.w, EXPORT_MAX_SIDE / dims.h
  );
  const [activeTab, setActiveTab] = useState('templates'); // sidebar tab
  // Onboarding: show the "how do you want to start?" screen every time the
  // Studio opens (except when deep-linking straight into a photo/template).
  const [showStart, setShowStart] = useState(() => !params.get('img') && !params.get('template'));
  const startFileRef = useRef(null);
  const [dropActive, setDropActive] = useState(false);
  const [railModal, setRailModal] = useState(null); // 'help' | 'settings' | null
  const [aspectLock, setAspectLock] = useState(false); // lock W:H ratio when resizing via inputs
  const [helpQuery, setHelpQuery] = useState('');
  const [helpCat, setHelpCat] = useState('All');
  const DEFAULT_BRAND = ['#8b5cf6', '#ec4899', '#0ea5e9', '#facc15', '#111827', '#ffffff'];
  const [brandColors, setBrandColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pikfinder-studio-brand') || 'null') || DEFAULT_BRAND; }
    catch { return DEFAULT_BRAND; }
  });
  const [brandPick, setBrandPick] = useState('#8b5cf6');
  useEffect(() => { try { localStorage.setItem('pikfinder-studio-brand', JSON.stringify(brandColors)); } catch { /* quota */ } }, [brandColors]);

  // Privacy: Studio projects are session-only. When the tab is closed (or
  // reloaded), erase the saved project so nothing persists afterwards.
  useEffect(() => {
    const clearSaved = () => { try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* ignore */ } };
    window.addEventListener('pagehide', clearSaved);
    window.addEventListener('beforeunload', clearSaved);
    return () => {
      window.removeEventListener('pagehide', clearSaved);
      window.removeEventListener('beforeunload', clearSaved);
      // Also erase when leaving the Studio via in-app navigation (unmount), so the
      // canvas starts fresh next time instead of restoring the old design.
      clearSaved();
    };
  }, []);
  const [rightTab, setRightTab] = useState('design'); // context panel tab
  const [mPane, setMPane] = useState('canvas'); // mobile pane: 'tools' | 'canvas' | 'design'
  const [tplCat, setTplCat] = useState('all');   // templates category filter
  const [tplQuery, setTplQuery] = useState('');   // templates search
  const [tplGroup, setTplGroup] = useState(null); // focused "See all" group
  const [elQuery, setElQuery] = useState('');      // elements search
  const [iconQuery, setIconQuery] = useState('');  // web icon search (Iconify)
  const [iconHits, setIconHits] = useState([]);
  const [iconBusy, setIconBusy] = useState(false);
  const searchIcons = async (q) => {
    if (!q.trim()) { setIconHits([]); return; }
    setIconBusy(true);
    try {
      const r = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(q.trim())}&limit=60`);
      const d = await r.json();
      setIconHits(Array.isArray(d.icons) ? d.icons : []);
    } catch { setIconHits([]); }
    finally { setIconBusy(false); }
  };
  const iconUrl = (name, color) => `https://api.iconify.design/${name.replace(':', '/')}.svg?width=280&height=280${color ? `&color=${encodeURIComponent(color)}` : ''}`;
  const addIcon = (name) => loadImage(iconUrl(name, '#111111'), { iconName: name, iconColor: '#111111' });
  // Recolour a web icon by re-fetching it from Iconify in the chosen colour.
  const recolorIcon = (hex) => {
    if (!sel || !sel.iconName) return;
    const id = sel.id;
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => setLayersWithHistory(layers.map((l) => l.id === id ? { ...l, el: im, src: im.src, iconColor: hex } : l));
    im.src = iconUrl(sel.iconName, hex);
  };
  const [txtMore, setTxtMore] = useState(false);  // text toolbar "More" popover
  const [guides, setGuides] = useState([]);        // live alignment guide lines
  const [showRulers, setShowRulers] = useState(false);

  // Lightweight grouping: tag selected layers with a shared group id so clicking
  // any of them selects the whole group (no nested tree needed).
  const groupSelected = () => {
    const gid = uid();
    setLayersWithHistory(layers.map(l => selectedIds.includes(l.id) ? { ...l, group: gid } : l));
  };
  const ungroupSelected = () => {
    setLayersWithHistory(layers.map(l => selectedIds.includes(l.id) ? { ...l, group: undefined } : l));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      const ids = selectedIds;
      const chosen = layers.filter(l => ids.includes(l.id));
      const primary = layers.find(l => l.id === selectedId);
      const key = e.key.toLowerCase();

      if (e.ctrlKey || e.metaKey) {
        if (key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (key === 'y') { e.preventDefault(); redo(); return; }
        if (key === 'a') { e.preventDefault(); setSelectedIds(layers.filter(l => !l.hidden).map(l => l.id)); return; }
        if (key === 'd' && chosen.length) {
          e.preventDefault();
          const dups = chosen.map(s => ({ ...s, id: uid(), x: s.x + 24, y: s.y + 24 }));
          setLayersWithHistory([...layers, ...dups]); setSelectedIds(dups.map(d => d.id)); return;
        }
        if (key === 'c' && chosen.length) { e.preventDefault(); clipboard.current = chosen.map(s => ({ ...s })); return; }
        // Ctrl+V is handled by the window 'paste' event (below) so it can also
        // accept images/text from the OS clipboard.
        if ((e.key === 'g' || key === 'g') && chosen.length > 1) { // group / ungroup
          e.preventDefault();
          if (e.shiftKey) ungroupSelected(); else groupSelected();
          return;
        }
        if ((e.key === ']' || e.key === '}') && primary) { // bring forward / to front
          e.preventDefault();
          const i = layers.findIndex(l => l.id === selectedId);
          if (e.shiftKey) { setLayersWithHistory([...layers.filter(l => l.id !== selectedId), primary]); }
          else if (i >= 0 && i < layers.length - 1) { const a = [...layers]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; setLayersWithHistory(a); }
          return;
        }
        if ((e.key === '[' || e.key === '{') && primary) { // send backward / to back
          e.preventDefault();
          const i = layers.findIndex(l => l.id === selectedId);
          if (e.shiftKey) { setLayersWithHistory([primary, ...layers.filter(l => l.id !== selectedId)]); }
          else if (i > 0) { const a = [...layers]; [a[i], a[i - 1]] = [a[i - 1], a[i]]; setLayersWithHistory(a); }
          return;
        }
        return;
      }

      // Finish a pen path with Enter.
      if (e.key === 'Enter' && penDraft) { e.preventDefault(); commitPen(false); return; }

      // Figma-style tool shortcuts (no modifier).
      if (!e.shiftKey) {
        if (key === 'v') { e.preventDefault(); if (penDraft) commitPen(false); setDrawTool(null); setToolMode('move'); return; }
        if (key === 'h') { e.preventDefault(); if (penDraft) commitPen(false); setDrawTool(null); setToolMode('hand'); return; }
        if (key === 'k') { e.preventDefault(); if (penDraft) commitPen(false); setDrawTool(null); setToolMode('scale'); return; }
        if (key === 'p') { e.preventDefault(); if (penDraft) commitPen(false); setActiveTab('draw'); pickDrawTool('pen'); return; }
        if (key === 'b') { e.preventDefault(); if (penDraft) commitPen(false); setActiveTab('draw'); pickDrawTool('brush'); return; }
        if (key === 'e') { e.preventDefault(); if (penDraft) commitPen(false); setActiveTab('draw'); pickDrawTool('eraser'); return; }
      } else if (key === 'p') { // Shift+P → pencil (matches Figma)
        e.preventDefault(); if (penDraft) commitPen(false); setActiveTab('draw'); pickDrawTool('pencil'); return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Always prevent default so Backspace can't trigger browser "back"
        // navigation (which would abandon the design). Input focus is already
        // guarded above, so this never blocks typing.
        e.preventDefault();
        if (vecEdit && vecSel != null) { deleteAnchor(vecSel); return; } // delete anchor point
        if (ids.length) {
          setLayersWithHistory(layers.filter(l => !ids.includes(l.id)));
          setSelectedIds([]);
        }
        return;
      }
      if (e.key === 'Escape') {
        if (vecEdit) { e.preventDefault(); exitVecEdit(); return; } // leave point-edit mode
        if (penDraft) { e.preventDefault(); commitPen(false); return; } // finish path, keep pen
        if (drawTool) { e.preventDefault(); setDrawTool(null); return; }
        if (ids.length) { e.preventDefault(); setSelectedIds([]); }
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ids.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setLayersWithHistory(layers.map(l => ids.includes(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedId, layers, history, historyIndex, drawTool, penDraft, drawColor, drawSize, drawSmooth, vecEdit, vecSel, vecTool]);

  const deselectAll = (e) => {
    if (e.target.classList.contains('studio-canvas-area') || e.target.classList.contains('studio-canvas-container') || e.target.classList.contains('studio-canvas-stage')) {
      setSelectedId(null);
    }
  };

  // Drag the whole viewport (Space+drag, or drag on empty space with Space).
  const startPan = (e) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const sp = { ...pan };
    const mv = (ev) => setPan({ x: sp.x + (ev.clientX - sx), y: sp.y + (ev.clientY - sy) });
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  const onAreaPointerDown = (e) => {
    if (e.button !== 0) return;
    if (moveMenuOpen) setMoveMenuOpen(false);
    if (spaceDown || toolMode === 'hand') { startPan(e); return; }
    deselectAll(e);
  };
  // Brush-size cursor ring (freehand tools only) that follows the pointer.
  const onAreaPointerMove = (e) => {
    if (!drawTool || drawTool === 'pen') { if (brushRing) setBrushRing(null); return; }
    const a = canvasAreaRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    setBrushRing({ x: e.clientX - r.left, y: e.clientY - r.top, d: Math.max(4, drawSize * fitScale * zoom) });
  };
  const onAreaPointerLeave = () => { if (brushRing) setBrushRing(null); };

  // Drag a panel edge to resize it.
  const startPanelResize = (e, side) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === 'left' ? leftW : rightW;
    const mv = (ev) => {
      const dx = ev.clientX - startX;
      if (side === 'left') setLeftW(Math.min(480, Math.max(220, startW + dx)));
      else setRightW(Math.min(440, Math.max(220, startW - dx)));
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  // Drag a guide out of a ruler ('h' ruler → horizontal guide, 'v' → vertical).
  const startGuideFromRuler = (e, orientation) => {
    e.preventDefault();
    const axis = orientation === 'h' ? 'y' : 'x';
    const a = canvasAreaRef.current;
    const scale = fitScale * zoom;
    const move = (ev) => {
      const rect = a.getBoundingClientRect();
      const pos = axis === 'y'
        ? (ev.clientY - rect.top - pan.y) / scale
        : (ev.clientX - rect.left - pan.x) / scale;
      setGuideDrag({ axis, pos: Math.round(pos) });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const rect = a.getBoundingClientRect();
      const onCanvas = ev.clientX > rect.left + 24 && ev.clientY > rect.top + 24;
      const pos = axis === 'y'
        ? (ev.clientY - rect.top - pan.y) / scale
        : (ev.clientX - rect.left - pan.x) / scale;
      if (onCanvas) setRulerGuides(g => [...g, { axis, pos: Math.round(pos) }]);
      setGuideDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const drag = useRef(null);
  const historyTimer = useRef(null);

  // Load fonts. We use the v1 CSS API and request a broad weight range per family;
  // unlike the v2 API (which 400s on any weight a family lacks), v1 silently
  // ignores unavailable weights — so single-weight display faces (Bebas Neue,
  // Pacifico, Anton…) coexist with variable sans that need 300–900 in one request.
  useEffect(() => {
    const weights = '400,500,600,700,800,900';
    const families = FONTS
      .filter(f => !['Impact', 'Courier New', 'Georgia'].includes(f))
      .map(f => `${f.replace(/ /g, '+')}:${weights}`)
      .join('|');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css?family=${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  const loadImage = useCallback((src, extra = {}) => {
    // Images from another site (Zoho record images, pasted links, stock hosts) would
    // taint the canvas and break export. Route cross-origin http(s) through our own
    // /api/proxy-image so the browser treats it as same-origin → editable AND exportable.
    const isRemote = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
    const proxied = isRemote ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src;
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onerror = () => {
      // 1st fallback: try the original URL directly (proxy may have blocked/failed).
      // The layer still shows, though export of that image may be limited (tainted).
      if (!el._triedDirect && isRemote && el.src.indexOf('/api/proxy-image') !== -1) {
        el._triedDirect = true; el.src = src; return;
      }
      // 2nd fallback: drop CORS entirely so at least it displays.
      if (!el._retried) { el._retried = true; el.removeAttribute('crossorigin'); el.crossOrigin = null; el.src = src; return; }
      alert('Could not load that image. If it is a link from another site, it may block loading — try downloading it and uploading the file.');
    };
    el.onload = () => {
      const iw = el.naturalWidth;
      const ih = el.naturalHeight;
      // Store whichever URL actually loaded (proxied when it worked) so SVG/PNG export
      // references an untainted source.
      const loadedSrc = el.src.indexOf(window.location.origin) === 0 || el.src.indexOf('/api/proxy-image') === 0 ? el.src : (el._triedDirect ? src : proxied);
      const mk = (x, y, w, h) => ({
        id: uid(), type: 'image', el, src: loadedSrc, opacity: 1, x, y, w, h,
        adjust: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
        imgStyle: { rotate: 0, flipH: false, flipV: false, radius: 0, shadow: 0 },
        ...extra,
      });
      // First image on an empty canvas → adapt the artboard to the image
      // (capped to 2400px on the long side), image fills the whole canvas.
      if (layers.length === 0) {
        const cap = 2400;
        const s = Math.min(1, cap / Math.max(iw, ih));
        const cw = Math.round(iw * s), ch = Math.round(ih * s);
        setCustom({ w: cw, h: ch });
        setPresetId('custom');
        const layer = mk(0, 0, cw, ch);
        setLayersWithHistory([layer]);
        setSelectedId(layer.id);
        setRightTab('design');
        return;
      }
      // Otherwise keep the current canvas: fit within it and center.
      const scale = Math.min((dims.w * 0.8) / iw, (dims.h * 0.8) / ih, 1);
      const w = iw * scale, h = ih * scale;
      const layer = mk((dims.w - w) / 2, (dims.h - h) / 2, w, h);
      setLayersWithHistory([...layers, layer]);
      setSelectedId(layer.id);
      setRightTab('design');
    };
    el.src = proxied;
  }, [dims, layers]);

  // Brand Kit: apply a saved colour to the selection, or to the background.
  const applyBrand = (hex) => {
    if (selectedIds.length) setLayersWithHistory(layers.map(l => selectedIds.includes(l.id) ? { ...l, color: hex } : l));
    else setBgWithHistory({ ...bg, type: 'solid', color: hex });
  };
  const addBrandColor = () => setBrandColors(prev => prev.includes(brandPick) ? prev : [...prev, brandPick]);
  const removeBrandColor = (hex) => setBrandColors(prev => prev.filter(c => c !== hex));

  // Drag & drop an image (file or link) straight onto the canvas.
  const onCanvasDragOver = (e) => { if (e.dataTransfer?.types?.includes('Files') || e.dataTransfer?.types?.includes('text/uri-list')) { e.preventDefault(); setDropActive(true); } };
  const onCanvasDragLeave = (e) => { if (e.target === e.currentTarget) setDropActive(false); };
  const onCanvasDrop = async (e) => {
    e.preventDefault();
    setDropActive(false);
    if (showStart) setShowStart(false);
    const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'));
    if (file) { loadImage(await fileToDataUrl(file)); return; }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text');
    if (url && /^https?:\/\//.test(url.trim())) loadImage(url.trim());
  };

  // Deep link: /studio?img=<url> (e.g. "Edit in Studio" from search) loads once.
  const imgParam = params.get('img');
  const imgLoadedRef = useRef(false);
  useEffect(() => {
    if (imgParam && !imgLoadedRef.current) {
      imgLoadedRef.current = true;
      loadImage(imgParam);
    }
  }, [imgParam, loadImage]);

  // Deep link: /studio?template=<businessId> (from the SEO template pages) opens
  // that document template in the editor with its sample text filled in.
  const templateParam = params.get('template');
  const tplLoadedRef = useRef(false);
  useEffect(() => {
    if (!templateParam || tplLoadedRef.current) return;
    // Built-in business templates, or one of the user's own saved custom designs.
    let t = PREMIUM_TEMPLATES.find((x) => x.id === templateParam) || BUSINESS_TEMPLATES.find((x) => x.id === templateParam);
    if (!t) { try { t = loadCustom().find((x) => x.id === templateParam); } catch { /* ignore */ } }
    if (!t) return;
    tplLoadedRef.current = true;
    const samples = {};
    (t.fields || []).forEach((f) => { samples[f.key] = f.sample; });
    const layers = t.layers.map((l) => (
      l.type === 'text' && typeof l.text === 'string'
        ? { ...l, text: l.text.replace(/\{\{(\w+)\}\}/g, (m, k) => (samples[k] ?? m)) }
        : { ...l }
    ));
    loadTemplate({ presetId: 'custom', custom: t.dims, bg: t.bg, layers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateParam]);

  // "Save status": mark dirty on any layer/bg change; export clears it.
  useEffect(() => { setDirty(true); }, [layers, bg]);

  // Paste (Ctrl+V / right-click paste): drop an image or text from the OS
  // clipboard onto the canvas, or paste internally-copied layers.
  useEffect(() => {
    const onPaste = async (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find(it => it.type && it.type.startsWith('image/'));
      if (imgItem) {
        const file = imgItem.getAsFile();
        if (file) { e.preventDefault(); loadImage(await fileToDataUrl(file)); return; }
      }
      if (clipboard.current?.length) {
        e.preventDefault();
        const dups = clipboard.current.map(c => ({ ...c, id: uid(), x: c.x + 24, y: c.y + 24 }));
        setLayersWithHistory([...layers, ...dups]);
        setSelectedIds(dups.map(d => d.id));
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (text && text.trim()) {
        e.preventDefault();
        const tl = { id: uid(), type: 'text', text: text.trim().slice(0, 800), x: dims.w / 2, y: dims.h / 2 - 20, size: 40, weight: 400, align: 'center', spacing: 0, color: '#ffffff', font: 'Inter' };
        setLayersWithHistory([...layers, tl]);
        setSelectedIds([tl.id]);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadImage, layers, dims]);

  // Restore the last design from the browser on first mount.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    // A deep link (?template= or ?img=) is an explicit "start with THIS" intent —
    // don't let a previously auto-saved design overwrite it.
    if (params.get('template') || params.get('img')) return;
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.presetId) setPresetId(data.presetId);
      if (data.custom) setCustom(data.custom);
      if (data.bg) setBg(data.bg);
      if (Array.isArray(data.layers) && data.layers.length) {
        setLayers(data.layers.map(l => ({ ...l })));
        data.layers.forEach(l => {
          if (l.type === 'image' && l.src) {
            const im = new Image();
            im.crossOrigin = 'anonymous';
            im.onload = () => setLayers(prev => prev.map(x => x.id === l.id ? { ...x, el: im } : x));
            im.src = l.src;
          }
        });
      }
    } catch { /* ignore corrupt/blocked storage */ }
  }, []);

  // Autosave to the browser (debounced). Image elements are stripped; their
  // `src` (a data URL for uploads/pastes) is what gets restored.
  useEffect(() => {
    if (!restoredRef.current) return;
    const t = setTimeout(() => {
      const strip = (skipImgData) => JSON.stringify({
        v: 1, presetId, custom, bg,
        layers: layers.map(l => {
          const r = { ...l };
          delete r.el; // the decoded image element isn't serialisable
          if (skipImgData && r.type === 'image') r.src = '';
          return r;
        }),
      });
      try {
        localStorage.setItem(AUTOSAVE_KEY, strip(false));
        setDirty(false);
      } catch {
        try { localStorage.setItem(AUTOSAVE_KEY, strip(true)); setDirty(false); } catch { /* quota exceeded */ }
      }
    }, 800);
    return () => clearTimeout(t);
  }, [layers, bg, presetId, custom]);

  const rectsIntersect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Begin moving a set of layers together (records each start position + the
  // union box for group snapping). Locked layers are skipped.
  const beginMove = (e, ids) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = dims.w / rect.width; // design-space px (canvas backing is super-sampled)
    const startX = (e.clientX - rect.left) * scale;
    const startY = (e.clientY - rect.top) * scale;
    const starts = {};
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of ids) {
      const l = layers.find(v => v.id === id);
      if (!l || l.locked) continue;
      starts[id] = { x: l.x, y: l.y };
      const b = boundsOf(l);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    if (Object.keys(starts).length === 0) return;
    drag.current = { kind: 'move', startX, startY, starts, moveIds: Object.keys(starts), groupStart: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, moved: false };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Selection-box pointer down (single selection): resize / rotate / move.
  const onPointerDown = (e) => {
    if (e.button !== 0 || !sel || sel.locked) return;
    const isResize = e.target.classList.contains('resize-handle');
    const isRotate = e.target.classList.contains('rotate-handle');
    if (isResize || isRotate) {
      e.stopPropagation();
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scale = dims.w / rect.width; // design-space px (canvas backing is super-sampled)
      const startLayer = { ...sel };
      const sb = boundsOf(startLayer);
      const startX = (e.clientX - rect.left) * scale;
      const startY = (e.clientY - rect.top) * scale;
      const rotCenter = { x: sb.x + sb.w / 2, y: sb.y + sb.h / 2 };
      drag.current = {
        kind: isRotate ? 'rotate' : 'resize',
        id: sel.id, startX, startY, layerStart: startLayer, startBounds: sb,
        handle: e.target.dataset.handle, rotCenter,
        rotStartAngle: Math.atan2(startY - rotCenter.y, startX - rotCenter.x) * 180 / Math.PI,
        rotStartValue: startLayer.rotate || 0, moved: false,
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    } else {
      beginMove(e, [sel.id]);
    }
  };

  // Smart snapping: compares a moving box's edges/centre against the canvas and
  // every non-moving layer. Returns the snap offset + guide lines to draw.
  const snapMove = (mb, excludeIds) => {
    const thresh = 8 / (fitScale * zoom); // ~8 screen px regardless of zoom
    const otherX = [0, dims.w / 2, dims.w];
    const otherY = [0, dims.h / 2, dims.h];
    for (const l of layers) {
      if (excludeIds.includes(l.id) || l.hidden) continue;
      const b = boundsOf(l);
      otherX.push(b.x, b.x + b.w / 2, b.x + b.w);
      otherY.push(b.y, b.y + b.h / 2, b.y + b.h);
    }
    const mxs = [mb.x, mb.x + mb.w / 2, mb.x + mb.w];
    const mys = [mb.y, mb.y + mb.h / 2, mb.y + mb.h];
    let sdx = 0, bestX = thresh + 1, gx = null;
    for (const m of mxs) for (const t of otherX) { const d = Math.abs(t - m); if (d <= thresh && d < bestX) { bestX = d; sdx = t - m; gx = t; } }
    let sdy = 0, bestY = thresh + 1, gy = null;
    for (const m of mys) for (const t of otherY) { const d = Math.abs(t - m); if (d <= thresh && d < bestY) { bestY = d; sdy = t - m; gy = t; } }
    const g = [];
    if (gx != null) g.push({ type: 'v', pos: gx });
    if (gy != null) g.push({ type: 'h', pos: gy });
    return { sdx, sdy, guides: g };
  };

  // Pointer moves fire faster than the screen refreshes; coalesce them into a
  // single state update per animation frame so dragging stays smooth.
  const applyDrag = () => {
    if (!drag.current) return;
    drag.current.raf = null;
    const ev = drag.current.lastEvent;
    const canvas = canvasRef.current;
    if (!ev || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = dims.w / rect.width; // design-space px (canvas backing is super-sampled)
    const x = (ev.clientX - rect.left) * scale;
    const y = (ev.clientY - rect.top) * scale;
    const dx = x - drag.current.startX;
    const dy = y - drag.current.startY;
    const d = drag.current;

    if (d.kind === 'marquee') {
      const r = { x: Math.min(x, d.startX), y: Math.min(y, d.startY), w: Math.abs(x - d.startX), h: Math.abs(y - d.startY) };
      d.rect = r;
      setMarquee(r);
      return;
    }

    if (d.kind === 'rotate') {
      setLayers(prev => prev.map(l => {
        if (l.id !== d.id) return l;
        const { x: rcx, y: rcy } = d.rotCenter;
        const ang = Math.atan2(y - rcy, x - rcx) * 180 / Math.PI;
        let rot = d.rotStartValue + (ang - d.rotStartAngle);
        if (ev.shiftKey) rot = Math.round(rot / 15) * 15; // snap to 15°
        rot = ((Math.round(rot) % 360) + 360) % 360;
        return { ...l, rotate: rot };
      }));
      return;
    }

    if (d.kind === 'resize' && d.handle) {
      const start = d.layerStart;
      const h = d.handle;
      // Corner handles = tl/tr/bl/br (both axes); edge handles = t/b/l/r (one axis).
      const hasH = h.includes('l') || h.includes('r');
      const hasV = h.includes('t') || h.includes('b');
      const right = h.includes('r');
      const bottom = h.includes('b');
      setLayers(prev => prev.map(l => {
        if (l.id !== d.id) return l;
        if (l.type === 'text') {
          const sb = d.startBounds || { w: 1, h: 1 };
          let factor;
          if (hasH) { const dw = right ? dx : -dx; factor = Math.max(0.15, (sb.w + dw) / Math.max(1, sb.w)); }
          else { const dh = bottom ? dy : -dy; factor = Math.max(0.15, (sb.h + dh) / Math.max(1, sb.h)); }
          return { ...l, size: Math.max(6, Math.round((start.size || 40) * factor)) };
        }
        let nw = hasH ? (right ? start.w + dx : start.w - dx) : start.w;
        let nh = hasV ? (bottom ? start.h + dy : start.h - dy) : start.h;
        // Hold Shift on a corner handle — or use the Scale tool — to keep aspect ratio.
        if ((ev.shiftKey || toolMode === 'scale') && hasH && hasV && start.w > 0 && start.h > 0) {
          const ar = start.w / start.h;
          if (Math.abs(nw - start.w) >= Math.abs(nh - start.h)) nh = nw / ar;
          else nw = nh * ar;
        }
        nw = Math.max(10, nw);
        nh = Math.max(10, nh);
        // Anchor the opposite edge/corner so the shape grows from the handle you drag.
        const nx2 = (hasH && !right) ? start.x + (start.w - nw) : start.x;
        const ny2 = (hasV && !bottom) ? start.y + (start.h - nh) : start.y;
        return { ...l, x: nx2, y: ny2, w: nw, h: nh };
      }));
      return;
    }

    // Move one or many layers together + group snapping/guides.
    const movingBox = { x: d.groupStart.x + dx, y: d.groupStart.y + dy, w: d.groupStart.w, h: d.groupStart.h };
    const { sdx, sdy, guides: g } = snapMove(movingBox, d.moveIds);
    setGuides(g);
    const fdx = dx + sdx, fdy = dy + sdy;
    setLayers(prev => prev.map(l => {
      const st = d.starts[l.id];
      return st ? { ...l, x: st.x + fdx, y: st.y + fdy } : l;
    }));
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    drag.current.moved = true;
    drag.current.lastEvent = e;
    if (drag.current.raf) return; // one update per frame
    drag.current.raf = requestAnimationFrame(applyDrag);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (d) {
      if (d.raf) cancelAnimationFrame(d.raf);
      if (d.kind === 'marquee') {
        if (d.moved && d.rect) {
          const hits = layers.filter(l => !l.hidden && rectsIntersect(boundsOf(l), d.rect)).map(l => l.id);
          setSelectedIds(d.base ? [...new Set([...d.base, ...hits])] : hits);
        }
        setMarquee(null);
      } else if (d.moved) {
        saveHistory(layers, bg);
      }
      drag.current = null;
    }
    setGuides([]); // hide alignment guides when the drag ends
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  // On-screen super-sampling: give the live canvas a higher-resolution backing
  // store than the design so detail stays razor-sharp when zoomed in. Bounded so
  // the backing store never exceeds ~16 megapixels (keeps large artboards safe).
  const viewSS = Math.max(1, Math.min(3, Math.floor(Math.sqrt(16_000_000 / (dims.w * dims.h))) || 1));

  // Draw the whole scene into any 2D context. `scale` renders at higher
  // resolution for export; `transparent` skips the background fill.
  const paintScene = useCallback((ctx, opts = {}) => {
    const scale = opts.scale || 1;
    const transparent = !!opts.transparent;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    // Highest-quality resampling for both the live view and exports.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, dims.w, dims.h);

    // Background. A 'transparent' type is never filled (exports keep the alpha,
    // live view shows a checkerboard behind the canvas element).
    if (!transparent && bg.type !== 'transparent') {
    if (bg.type === 'gradient') {
      const cx = dims.w / 2, cy = dims.h / 2;
      const r = Math.max(dims.w, dims.h);
      const rad = (bg.angle - 90) * Math.PI / 180;
      const g = ctx.createLinearGradient(
        cx - Math.cos(rad) * r / 2, cy - Math.sin(rad) * r / 2,
        cx + Math.cos(rad) * r / 2, cy + Math.sin(rad) * r / 2
      );
      bgStops(bg).forEach((s) => g.addColorStop(Math.max(0, Math.min(1, s.pos)), s.color));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, dims.w, dims.h);
    } else {
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, dims.w, dims.h);
    }
    }

    // Layers
    layers.forEach(l => {
      if (l.hidden) return;
      if (l.id === editingId && l.type === 'text') return; // hidden while inline-editing
      ctx.save();
      try {
      ctx.globalAlpha = l.opacity ?? 1;
      ctx.globalCompositeOperation = (l.blend && l.blend !== 'normal') ? l.blend : 'source-over';

      // Rotation/flip pivot = the layer's VISUAL centre (measured for text so
      // it matches the selection box), not the guessed _w/_h box.
      let bx = l.x, by = l.y, bw, bh;
      if (l.type === 'text') {
        const m = measureTextLayer(l);
        bw = m.w; bh = m.h;
        by = l.y + (m.oy || 0); // match the ink-tight selection box top
        if (l.align === 'center') bx = l.x - m.w / 2;
        else if (l.align === 'right') bx = l.x - m.w;
      } else {
        bw = l.w ?? 200; bh = l.h ?? 200;
      }
      const cx = bx + bw / 2;
      const cy = by + bh / 2;

      ctx.translate(cx, cy);
      if (l.imgStyle?.rotate || l.rotate) {
        ctx.rotate((l.imgStyle?.rotate || l.rotate || 0) * Math.PI / 180);
      }
      if (l.imgStyle?.flipH) ctx.scale(-1, 1);
      if (l.imgStyle?.flipV) ctx.scale(1, -1);
      ctx.translate(-cx, -cy);

      // ---- Unified layer effects (drop shadow / outer glow). Set on the context
      // before the fills & strokes below so they inherit it. Images keep their own
      // shadow/glow controls, so they're excluded from this generic pass.
      const fx = l.fx || null;
      if (fx && l.type !== 'image') {
        if (fx.glow?.on) {
          ctx.shadowColor = fx.glow.color || '#8b5cf6';
          ctx.shadowBlur = fx.glow.blur ?? 24;
        } else if (fx.shadow?.on) {
          ctx.shadowColor = fx.shadow.color || 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = fx.shadow.blur ?? 12;
          ctx.shadowOffsetX = fx.shadow.x ?? 0;
          ctx.shadowOffsetY = fx.shadow.y ?? 8;
        }
      }

      // Frosted-glass fill for shapes: blurs whatever is already painted behind the
      // shape's silhouette, then lays a translucent tint + light border on top.
      // Wrapped so any draw failure degrades to a plain translucent panel.
      const glassFill = (buildPath) => {
        const g = (fx && fx.glass) || {};
        const rgba = (hex, a) => {
          const h = String(hex || '#ffffff').replace('#', '');
          const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
          const r = parseInt(n.slice(0, 2), 16); const gg = parseInt(n.slice(2, 4), 16); const b = parseInt(n.slice(4, 6), 16);
          return `rgba(${r || 255},${gg || 255},${b || 255},${a})`;
        };
        const blur = g.blur ?? 14, tint = g.tint || '#ffffff', op = g.opacity ?? 0.18;
        try {
          ctx.save();
          buildPath(); ctx.clip();
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
          ctx.filter = `blur(${blur}px)`;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(ctx.canvas, 0, 0);
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.filter = 'none';
          ctx.fillStyle = rgba(tint, op);
          buildPath(); ctx.fill();
          ctx.restore();
        } catch {
          ctx.save(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
          ctx.fillStyle = rgba(tint, Math.max(op, 0.28));
          buildPath(); ctx.fill(); ctx.restore();
        }
        ctx.save();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 1.5;
        buildPath(); ctx.stroke();
        ctx.restore();
      };

      if (l.type === 'image' && l.el) {
        const a = l.adjust || {};
        const st = l.imgStyle || {};
        ctx.save();
        ctx.filter = `brightness(${a.brightness ?? 100}%) contrast(${a.contrast ?? 100}%) saturate(${a.saturation ?? 100}%) blur(${a.blur || 0}px) ${IMAGE_FILTERS[l.filter] || ''}`.trim();
        const imgR = Math.max(0, Math.min(st.radius || 0, Math.min(l.w, l.h) / 2));
        if (imgR > 0) {
          ctx.beginPath();
          ctx.roundRect(l.x, l.y, l.w, l.h, imgR);
          ctx.clip();
        }
        if ((st.glow || 0) > 0) {
          ctx.shadowColor = st.glowColor || '#8b5cf6';
          ctx.shadowBlur = st.glow;
        } else if ((st.shadow || 0) > 0) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = st.shadow;
          ctx.shadowOffsetY = st.shadow / 2;
        }
        ctx.drawImage(l.el, l.x, l.y, l.w, l.h);
        ctx.restore();
        if ((st.borderW || 0) > 0) {
          ctx.strokeStyle = st.borderColor || '#ffffff';
          ctx.lineWidth = st.borderW;
          ctx.beginPath();
          ctx.roundRect(l.x, l.y, l.w, l.h, st.radius || 0);
          ctx.stroke();
        }
      }
      else if (l.type === 'text') {
        ctx.font = `${l.italic ? 'italic ' : ''}${l.weight || 400} ${l.size}px "${l.font || 'Inter'}"`;
        ctx.textAlign = l.align || 'left';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = `${l.spacing || 0}px`;

        // ctx.textAlign anchors the string at tx (start/center/end), so l.x IS
        // the anchor: left edge for left-align, center point for center, right.
        const tx = l.x;
        const lineH = l.size * (l.lineHeight || 1.2);

        // Fill: solid, or a gradient spanning the text's visual box.
        ctx.fillStyle = l.fillType === 'gradient'
          ? makeGradient(ctx, { x: bx, y: by, w: bw, h: bh, grad: l.grad })
          : l.color;

        const lines = applyCase(l.text, l.textCase).split('\n');
        lines.forEach((line, i) => {
          const ly = l.y + (i * lineH);
          if (l.textShadow) {
            ctx.save();
            ctx.shadowColor = l.shadowColor || 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = l.shadowBlur ?? Math.max(2, l.size * 0.08);
            ctx.shadowOffsetX = l.size * 0.03;
            ctx.shadowOffsetY = l.size * 0.06;
            ctx.fillText(line, tx, ly);
            ctx.restore();
          }
          if (l.strokeW > 0) {
            ctx.lineWidth = l.strokeW;
            ctx.strokeStyle = l.strokeColor || '#000';
            ctx.lineJoin = 'round';
            ctx.strokeText(line, tx, ly);
          }
          ctx.fillText(line, tx, ly);
          if (l.underline && line) {
            const tw = ctx.measureText(line).width;
            let ux = tx;
            if (l.align === 'center') ux = tx - tw / 2;
            else if (l.align === 'right') ux = tx - tw;
            const uy = ly + l.size * 1.05;
            ctx.save();
            ctx.strokeStyle = l.color;
            ctx.lineWidth = Math.max(1, l.size / 16);
            ctx.beginPath();
            ctx.moveTo(ux, uy);
            ctx.lineTo(ux + tw, uy);
            ctx.stroke();
            ctx.restore();
          }
        });
      }
      else if (l.type === 'rect') {
        // Clamp to half the smaller side so the corners never over-round or glitch.
        const rr = Math.max(0, Math.min(l.radius || 0, Math.min(l.w, l.h) / 2));
        const rectPath = () => { ctx.beginPath(); ctx.roundRect(l.x, l.y, l.w, l.h, rr); };
        if (fx?.glass?.on) {
          glassFill(rectPath);
        } else {
          ctx.fillStyle = l.fillType === 'gradient' ? makeGradient(ctx, l) : l.color;
          rectPath();
          ctx.fill();
          if (l.border) { ctx.strokeStyle = l.border.split(' ')[2]; ctx.lineWidth = parseInt(l.border); ctx.stroke(); }
          if (l.strokeW > 0) { ctx.strokeStyle = l.strokeColor || '#000'; ctx.lineWidth = l.strokeW; ctx.stroke(); }
        }
      }
      else if (l.type === 'ellipse') {
        const ellPath = () => { ctx.beginPath(); ctx.ellipse(cx, cy, l.w/2, l.h/2, 0, 0, Math.PI * 2); };
        if (fx?.glass?.on) {
          glassFill(ellPath);
        } else {
          ctx.fillStyle = l.fillType === 'gradient' ? makeGradient(ctx, l) : l.color;
          ellPath();
          ctx.fill();
          if (l.strokeW > 0) { ctx.strokeStyle = l.strokeColor || '#000'; ctx.lineWidth = l.strokeW; ctx.stroke(); }
        }
      }
      else if (l.type === 'shape') {
        if (fx?.glass?.on) {
          glassFill(() => buildShapePath(ctx, l.shape, l.x, l.y, l.w, l.h, l.radius || 0));
        } else {
          ctx.fillStyle = l.fillType === 'gradient' ? makeGradient(ctx, l) : l.color;
          buildShapePath(ctx, l.shape, l.x, l.y, l.w, l.h, l.radius || 0);
          if (l.color !== 'none') ctx.fill();
          if (l.strokeW > 0) { ctx.strokeStyle = l.strokeColor || '#000'; ctx.lineWidth = l.strokeW; ctx.lineJoin = 'round'; ctx.stroke(); }
        }
      }
      else if (l.type === 'path') {
        // Freehand stroke. Points are stored relative to the layer origin (l.x,l.y)
        // so dragging the layer moves the whole drawing.
        if (l.mode === 'eraser') ctx.globalCompositeOperation = 'destination-out';
        strokePoints(ctx, l.pts, l.x, l.y, {
          color: l.color, width: l.strokeW, mode: l.mode, soft: l.soft,
        });
      }
      else if (l.type === 'vector') {
        // Editable bezier path from the pen tool.
        vectorPath(ctx, l.anchors, l.x, l.y, l.closed);
        if (l.fill && l.fill !== 'none') { ctx.fillStyle = l.fill; ctx.fill(); }
        if ((l.strokeW ?? 0) > 0) {
          ctx.strokeStyle = l.stroke || '#111827';
          ctx.lineWidth = l.strokeW;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      } catch (err) { /* a single malformed layer must never crash the whole editor */ }
      ctx.restore();
    });

    // Live in-progress stroke (drawn on top, in absolute canvas coords).
    if (drawing && drawing.pts && drawing.pts.length) {
      ctx.save();
      ctx.globalAlpha = drawing.opacity ?? 1;
      if (drawing.mode === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      strokePoints(ctx, drawing.pts, 0, 0, {
        color: drawing.color, width: drawing.strokeW, mode: drawing.mode, soft: drawing.soft,
      });
      ctx.restore();
    }

    // Pen-tool preview: committed bezier segments + rubber-band to the cursor,
    // plus anchor squares and handle lines (Figma-style).
    if (penDraft && penDraft.anchors.length) {
      const an = penDraft.anchors;
      ctx.save();
      // Committed path.
      vectorPath(ctx, an, 0, 0, false);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = Math.max(1, drawSize);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();
      // Rubber-band from the last anchor to the cursor.
      if (penCursor) {
        const last = an[an.length - 1];
        ctx.save();
        ctx.strokeStyle = '#8b5cf6';
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(last.x + (last.hx || 0), last.y + (last.hy || 0));
        ctx.lineTo(penCursor.x, penCursor.y);
        ctx.stroke();
        ctx.restore();
      }
      // Handles + anchor squares.
      ctx.setLineDash([]);
      for (const a of an) {
        if (a.hx || a.hy) {
          ctx.strokeStyle = 'rgba(139,92,246,0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x - a.hx, a.y - a.hy);
          ctx.lineTo(a.x + a.hx, a.y + a.hy);
          ctx.stroke();
          for (const [hx, hy] of [[a.hx, a.hy], [-a.hx, -a.hy]]) {
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(a.x + hx, a.y + hy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      an.forEach((a, i) => {
        const first = i === 0;
        ctx.fillStyle = first ? '#8b5cf6' : '#ffffff';
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(a.x - 3.5, a.y - 3.5, 7, 7);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [dims, bg, layers, editingId, drawing, penDraft, penCursor, drawColor, drawSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) paintScene(canvas.getContext('2d'), { scale: viewSS });
  }, [paintScene, viewSS]);

  useEffect(() => { draw(); }, [draw]);

  // Generators
  const TEXT_PRESETS = {
    heading: { text: 'Add a heading', size: 72, weight: 800 },
    subheading: { text: 'Add a subheading', size: 44, weight: 600 },
    body: { text: 'Add a little bit of body text', size: 26, weight: 400 },
  };
  // Choose readable ink (dark on light backgrounds, light on dark) so new text
  // is never invisible — important now that the default artboard is white.
  const inkForBg = () => {
    try {
      const c = (bg.type === 'solid' ? bg.color : bg.color) || '#ffffff';
      const h = c.replace('#', '');
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.6 ? '#111827' : '#ffffff';
    } catch { return '#111827'; }
  };
  const addText = (kind) => {
    const p = TEXT_PRESETS[kind] || TEXT_PRESETS.heading;
    const t = { id: uid(), type: 'text', text: p.text, x: dims.w/2, y: dims.h/2 - 20, size: p.size, weight: p.weight, align: 'center', spacing: 0, color: inkForBg(), font: 'Inter' };
    setLayersWithHistory([...layers, t]);
    setSelectedId(t.id);
    setRightTab('design');
  };
  
  // Add a Canva-style element (shape/icon) as a filled vector layer.
  const addElement = (kind) => {
    const size = Math.min(dims.w, dims.h) * 0.35;
    const w = size;
    const h = kind === 'line' ? Math.max(12, size * 0.12) : (kind === 'pin' || kind === 'speech' ? size * 1.15 : size);
    const s = { id: uid(), type: 'shape', shape: kind, x: dims.w/2 - w/2, y: dims.h/2 - h/2, w, h, color: '#8b5cf6' };
    setLayersWithHistory([...layers, s]);
    setSelectedId(s.id);
    setRightTab('design');
  };

  // Align the selected layer to the canvas. Uses the measured visual bounds and
  // preserves the layer's anchor offset (so centred text lands correctly).
  const alignSel = (dir) => {
    if (selectedIds.length === 0) return;
    setLayersWithHistory(layers.map(l => {
      if (!selectedIds.includes(l.id)) return l;
      const b = boundsOf(l);
      const offX = l.x - b.x, offY = l.y - b.y;
      let nx = l.x, ny = l.y;
      if (dir === 'left') nx = 0 + offX;
      else if (dir === 'hcenter') nx = (dims.w - b.w) / 2 + offX;
      else if (dir === 'right') nx = (dims.w - b.w) + offX;
      else if (dir === 'top') ny = 0 + offY;
      else if (dir === 'vcenter') ny = (dims.h - b.h) / 2 + offY;
      else if (dir === 'bottom') ny = (dims.h - b.h) + offY;
      return { ...l, x: nx, y: ny };
    }));
  };

  // Continuous property edits (typing in a text box, dragging a slider) update
  // the layers instantly and commit a SINGLE debounced history entry — instead
  // of deep-cloning every layer on every keystroke, which caused the lag.
  const updateLayersLive = (mapFn) => {
    setLayers(prev => {
      const updated = prev.map(mapFn);
      clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(() => saveHistory(updated, bg), 400);
      return updated;
    });
  };
  const updateLayer = (id, k, v) => updateLayersLive(l => l.id === id ? { ...l, [k]: v } : l);
  const updateNested = (id, obj, k, v) => updateLayersLive(l => l.id === id ? { ...l, [obj]: { ...l[obj], [k]: v } } : l);
  // Deep setter for the two-level effects object: l.fx[group][key] = v.
  const setFx = (id, group, k, v) => updateLayersLive(l => (
    l.id === id ? { ...l, fx: { ...(l.fx || {}), [group]: { ...((l.fx || {})[group] || {}), [k]: v } } } : l
  ));
  // Resize via the W/H inputs, keeping aspect ratio when the lock is on.
  const setSize = (l, dim, val) => {
    const v = Math.max(1, val);
    if (!aspectLock || !l.w || !l.h) { updateLayer(l.id, dim, v); return; }
    const ratio = l.w / l.h;
    if (dim === 'w') updateLayersLive(x => x.id === l.id ? { ...x, w: v, h: Math.max(1, Math.round(v / ratio)) } : x);
    else updateLayersLive(x => x.id === l.id ? { ...x, h: v, w: Math.max(1, Math.round(v * ratio)) } : x);
  };
  // Corner radius lives on `radius` for shapes/rects and on `imgStyle.radius` for images.
  const layerRadius = (l) => (l?.type === 'image' ? (l.imgStyle?.radius || 0) : (l?.radius || 0));
  const setLayerRadius = (l, v) => { const r = Math.max(0, v); l.type === 'image' ? updateNested(l.id, 'imgStyle', 'radius', r) : updateLayer(l.id, 'radius', r); };

  const loadTemplate = (tmpl) => {
    // Pro-only templates are gated: prompt sign-in, then upgrade. Free templates
    // (the vast majority) stay open so the Studio remains a strong free hook.
    if (STUDIO_PREMIUM_GATING && tmpl.premium && !isPremium) {
      if (!isLoggedIn) { toggleAuthModal('login'); toast('Sign in, then upgrade to use Pro templates.', 'info'); return; }
      toast('This is a Creator Pro template — upgrade to unlock it.', 'info');
      navigate('/billing');
      return;
    }
    setPresetId(tmpl.presetId);
    if (tmpl.custom) setCustom(tmpl.custom);
    setBgWithHistory(tmpl.bg);
    const mapped = tmpl.layers.map(l => ({ ...l, id: uid() }));
    setLayersWithHistory(mapped);
    setSelectedId(null);
    // Hydrate photo layers so image backgrounds actually render — and route remote
    // photos through the proxy so the design stays exportable (untainted canvas).
    mapped.forEach(l => {
      if (l.type === 'image' && l.src) {
        const isRemote = /^https?:\/\//i.test(l.src) && !l.src.startsWith(window.location.origin);
        const useSrc = isRemote ? `/api/proxy-image?url=${encodeURIComponent(l.src)}` : l.src;
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => setLayers(prev => prev.map(x => x.id === l.id ? { ...x, el: im, src: useSrc } : x));
        im.onerror = () => {
          if (isRemote) { const d = new Image(); d.onload = () => setLayers(prev => prev.map(x => x.id === l.id ? { ...x, el: d } : x)); d.src = l.src; }
        };
        im.src = useSrc;
      }
    });
  };

  // Reconstruct the scene as a true vector SVG from the layer data.
  const sceneToSvg = () => {
    const W = dims.w, H = dims.h;
    const nn = (v) => Math.round(v * 100) / 100;
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const defs = [];
    let gid = 0;

    // Linear-gradient <defs> spanning a box, matching makeGradient (0°=up, 90°=right).
    const gradDef = (grad, x, y, w, h) => {
      const id = `grad${gid++}`;
      const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2 || 1;
      const a = ((grad?.angle ?? 90)) * Math.PI / 180;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const stops = (grad?.stops && grad.stops.length >= 2)
        ? grad.stops.map((s) => `<stop offset="${Math.max(0, Math.min(1, s.pos))}" stop-color="${s.color}"/>`).join('')
        : `<stop offset="0" stop-color="${grad?.c1 || '#8b5cf6'}"/><stop offset="1" stop-color="${grad?.c2 || '#ec4899'}"/>`;
      defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${nn(cx - dx * r)}" y1="${nn(cy - dy * r)}" x2="${nn(cx + dx * r)}" y2="${nn(cy + dy * r)}">${stops}</linearGradient>`);
      return `url(#${id})`;
    };
    const fillOf = (l) => l.fillType === 'gradient' ? gradDef(l.grad, l.x, l.y, l.w, l.h) : (l.color === 'none' ? 'none' : l.color);
    const strokeAttr = (l) => (l.strokeW > 0) ? ` stroke="${l.strokeColor || '#000'}" stroke-width="${l.strokeW}"` : '';
    const wrapAttrs = (l) => {
      const b = boundsOf(l);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const rot = l.rotate || l.imgStyle?.rotate || 0;
      const parts = [];
      if (rot) parts.push(`rotate(${nn(rot)} ${nn(cx)} ${nn(cy)})`);
      if (l.imgStyle?.flipH) parts.push(`translate(${nn(2 * cx)} 0) scale(-1 1)`);
      if (l.imgStyle?.flipV) parts.push(`translate(0 ${nn(2 * cy)}) scale(1 -1)`);
      let a = parts.length ? ` transform="${parts.join(' ')}"` : '';
      if ((l.opacity ?? 1) < 1) a += ` opacity="${l.opacity}"`;
      if (l.blend && l.blend !== 'normal') a += ` style="mix-blend-mode:${l.blend}"`;
      return a;
    };

    let body = '';
    if (!(exportCfg.transparent) && bg.type !== 'transparent') {
      body += bg.type === 'gradient'
        ? `<rect width="${W}" height="${H}" fill="${gradDef({ angle: bg.angle, stops: bgStops(bg) }, 0, 0, W, H)}"/>`
        : `<rect width="${W}" height="${H}" fill="${bg.color}"/>`;
    }

    for (const l of layers) {
      if (l.hidden) continue;
      const w = wrapAttrs(l);
      if (l.type === 'text') {
        const anchor = l.align === 'center' ? 'middle' : l.align === 'right' ? 'end' : 'start';
        const lines = applyCase(l.text ?? '', l.textCase).split('\n');
        const lh = (l.size || 16) * (l.lineHeight || 1.2);
        const tspans = lines.map((ln, i) => `<tspan x="${nn(l.x)}" dy="${i === 0 ? 0 : nn(lh)}">${esc(ln) || ' '}</tspan>`).join('');
        const tb = boundsOf(l);
        const tFill = l.fillType === 'gradient' ? gradDef(l.grad, tb.x, tb.y, tb.w, tb.h) : l.color;
        const tStroke = l.strokeW > 0 ? ` stroke="${l.strokeColor || '#000'}" stroke-width="${l.strokeW}" paint-order="stroke"` : '';
        body += `<text x="${nn(l.x)}" y="${nn(l.y)}" font-family="${esc(l.font || 'Inter')}" font-size="${l.size}" font-weight="${l.weight || 400}" fill="${tFill}"${tStroke} text-anchor="${anchor}" dominant-baseline="text-before-edge" letter-spacing="${l.spacing || 0}"${l.italic ? ' font-style="italic"' : ''}${l.underline ? ' text-decoration="underline"' : ''}${w}>${tspans}</text>`;
      } else if (l.type === 'rect') {
        body += `<rect x="${nn(l.x)}" y="${nn(l.y)}" width="${nn(l.w)}" height="${nn(l.h)}" rx="${l.radius || 0}" fill="${fillOf(l)}"${strokeAttr(l)}${w}/>`;
      } else if (l.type === 'ellipse') {
        body += `<ellipse cx="${nn(l.x + l.w / 2)}" cy="${nn(l.y + l.h / 2)}" rx="${nn(l.w / 2)}" ry="${nn(l.h / 2)}" fill="${fillOf(l)}"${strokeAttr(l)}${w}/>`;
      } else if (l.type === 'shape') {
        body += `<path d="${shapeToSvgPath(l.shape, l.x, l.y, l.w, l.h, l.radius || 0)}" fill="${fillOf(l)}"${strokeAttr(l)}${w}/>`;
      } else if (l.type === 'path' && l.mode !== 'eraser' && l.pts && l.pts.length) {
        // Freehand stroke → smoothed SVG path through midpoints (mirrors strokePoints).
        // Eraser strokes are a canvas compositing effect with no simple SVG equivalent,
        // so they're skipped here (PNG/JPG export renders them correctly).
        const P = (i) => ({ x: nn(l.x + l.pts[i].x), y: nn(l.y + l.pts[i].y) });
        let d = `M ${P(0).x} ${P(0).y}`;
        if (l.pts.length === 1) d += ` l 0.1 0.1`;
        else if (l.pts.length === 2) d += ` L ${P(1).x} ${P(1).y}`;
        else {
          for (let i = 1; i < l.pts.length - 1; i++) {
            const c = P(i), n = P(i + 1);
            d += ` Q ${c.x} ${c.y} ${nn((c.x + n.x) / 2)} ${nn((c.y + n.y) / 2)}`;
          }
          const last = P(l.pts.length - 1);
          d += ` L ${last.x} ${last.y}`;
        }
        body += `<path d="${d}" fill="none" stroke="${l.color}" stroke-width="${l.strokeW || 4}" stroke-linecap="round" stroke-linejoin="round"${w}/>`;
      } else if (l.type === 'vector' && l.anchors && l.anchors.length) {
        const vd = vectorToSvgPath(l.anchors, l.x, l.y, l.closed, nn);
        body += `<path d="${vd}" fill="${l.fill && l.fill !== 'none' ? l.fill : 'none'}" stroke="${l.stroke || '#111827'}" stroke-width="${l.strokeW || 2}" stroke-linecap="round" stroke-linejoin="round"${w}/>`;
      } else if (l.type === 'image' && l.src) {
        body += `<image href="${esc(l.src)}" x="${nn(l.x)}" y="${nn(l.y)}" width="${nn(l.w)}" height="${nn(l.h)}" preserveAspectRatio="none"${w}/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join('')}</defs>${body}</svg>`;
  };

  // Opened from the Zoho widget (?zoho=1)? Then offer "Save to Zoho", which posts
  // the exported PNG back to the widget window, which uploads it to the record.
  const zohoMode = params.get('zoho') === '1';
  const [zohoSaving, setZohoSaving] = useState(false);
  const saveToZoho = () => {
    if (!window.opener) { alert('Open this from the PikFinder panel inside Zoho to save back.'); return; }
    setZohoSaving(true);
    try {
      const scale = 2;
      const out = document.createElement('canvas');
      out.width = Math.round(dims.w * scale);
      out.height = Math.round(dims.h * scale);
      paintScene(out.getContext('2d'), { scale, transparent: false });
      const image = out.toDataURL('image/png');
      const filename = (projectName || 'pikfinder').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png';
      window.opener.postMessage({ type: 'pikfinder:save', image, filename }, '*');
    } catch (e) { console.error(e); alert('Could not prepare the image to send to Zoho.'); }
    finally { setTimeout(() => setZohoSaving(false), 1500); }
  };

  const doExport = async () => {
    try {
      const baseName = (projectName || 'pikfinder-design').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

      if (exportCfg.format === 'image/svg+xml') {
        const blob = new Blob([sceneToSvg()], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        setExportOpen(false);
        setDirty(false);
        return;
      }

      if (exportCfg.format === 'application/pdf') {
        const s = exportCfg.scale || 1;
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(dims.w * s));
        out.height = Math.max(1, Math.round(dims.h * s));
        paintScene(out.getContext('2d'), { scale: s, transparent: false });
        const pngBlob = await canvasToBlob(out, 'image/png');
        const { PDFDocument } = await import('pdf-lib');
        const pdf = await PDFDocument.create();
        const png = await pdf.embedPng(new Uint8Array(await pngBlob.arrayBuffer()));
        const page = pdf.addPage([dims.w, dims.h]);
        page.drawImage(png, { x: 0, y: 0, width: dims.w, height: dims.h });
        const bytes = await pdf.save();
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setExportOpen(false);
        setDirty(false);
        return;
      }

      // Effective scale enforces the Full-HD floor and the max-side cap.
      const scale = effExportScale;
      const transparent = (exportCfg.format === 'image/png' || exportCfg.format === 'image/webp')
        && (exportCfg.transparent || bg.type === 'transparent');
      // Re-render the scene at the chosen scale onto an offscreen canvas.
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(dims.w * scale));
      out.height = Math.max(1, Math.round(dims.h * scale));
      paintScene(out.getContext('2d'), { scale, transparent });
      const blob = await canvasToBlob(out, exportCfg.format, exportCfg.quality === 'high' ? 0.96 : 0.6);
      const ext = exportCfg.format.split('/')[1].replace('jpeg', 'jpg');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectName || 'pikfinder-design').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}${scale > 1 ? `@${scale}x` : ''}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      setDirty(false);
    } catch (e) {
      console.error(e);
      alert('Export failed. If you used an online image, it may block cross-origin export — try uploading it instead.');
    }
  };

  // Save the current design as a reusable Document Generator template. Requires
  // sign-in (templates are saved to the user's account library). Placeholders in
  // text ({{name}}) and image binds become fillable fields.
  const [savingTpl, setSavingTpl] = useState(false);
  const saveAsTemplate = () => {
    if (!isLoggedIn) { toggleAuthModal('login'); toast('Sign in to save this design to your Documents.', 'info'); return; }
    if (!layers.length) { toast('Add something to the canvas first.', 'info'); return; }
    setSavingTpl(true);
    try {
      // Serialize layers (drop the live HTMLImage element; keep the src).
      const clean = layers.map(({ el, ...l }) => ({ ...l })); // eslint-disable-line no-unused-vars
      const keys = extractPlaceholders(clean);
      const fields = keys.map((k) => {
        const isImg = clean.some((l) => l.type === 'image' && l.bind === k);
        const label = k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return isImg ? { key: k, label, kind: 'image', sample: '' } : { key: k, label, sample: label };
      });
      const tpl = {
        id: `custom-${Date.now()}`, name: (projectName || 'My design').trim(), category: 'Custom', custom: true,
        dims: { w: dims.w, h: dims.h }, bg, fields, layers: clean,
      };
      if (!addCustom(tpl)) { toast('Could not save — the design may be too large. Try fewer/smaller images.', 'error'); return; }
      toast('Saved to your Documents templates. 🎉', 'success');
    } catch (e) {
      console.error(e);
      toast('Could not save the template.', 'error');
    } finally {
      setSavingTpl(false);
    }
  };

  // Single-selection layer (only when exactly one is selected — otherwise the
  // group panel/box takes over).
  const sel = selectedIds.length === 1 ? layers.find(l => l.id === selectedId) : null;
  const selLayers = layers.filter(l => selectedIds.includes(l.id));
  const fitScale = Math.min(1, 800 / dims.w, 600 / dims.h);

  // Exact bounding box of a layer — matches how draw() renders each type, so
  // the selection overlay and hit-testing wrap the real pixels. For text we
  // MEASURE the glyphs (not the guessed _w/_h) and position the box the same way
  // draw() aligns the text, so the box hugs the visible text without moving it.
  const boundsOf = (l) => {
    if (l.type === 'text') {
      const m = measureTextLayer(l);
      // Mirror draw(): l.x is the anchor per alignment; l.y + m.oy is the real ink top.
      let x = l.x;
      if (l.align === 'center') x = l.x - m.w / 2;
      else if (l.align === 'right') x = l.x - m.w;
      return { x, y: l.y + (m.oy || 0), w: m.w, h: m.h };
    }
    return {
      x: l.x,
      y: l.y,
      w: l.w ?? l._w ?? 200,
      h: l.h ?? l._h ?? 100,
    };
  };
  const selBox = sel ? boundsOf(sel) : null;
  const vecEditLayer = vecEdit ? layers.find(l => l.id === vecEdit && l.type === 'vector' && !l.hidden) : null;
  // Safety: never stay locked in point-edit mode if the layer was deleted/hidden.
  useEffect(() => { if (vecEdit && !vecEditLayer) { setVecEdit(null); setVecSel(null); } }, [vecEdit, vecEditLayer]);

  // Union bounding box of the whole selection (used for the group overlay).
  const groupBox = (() => {
    if (selLayers.length < 2) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const l of selLayers) {
      const b = boundsOf(l);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  })();

  // --- Figma-style pan / zoom ---
  const clampZoom = (z) => Math.min(64, Math.max(0.02, z)); // up to 6400% for pixel-level inspection

  // Centre the artboard in the viewport at zoom `z`.
  const centerCanvas = (z = zoom) => {
    const a = canvasAreaRef.current;
    if (!a) return;
    const sw = dims.w * fitScale * z;
    const sh = dims.h * fitScale * z;
    setPan({ x: (a.clientWidth - sw) / 2, y: (a.clientHeight - sh) / 2 });
  };

  // Zoom while keeping the point under (clientX, clientY) fixed on screen.
  const zoomAtPoint = (nz, clientX, clientY) => {
    const a = canvasAreaRef.current;
    if (!a) { zoomRef.current = nz; setZoom(nz); return; }
    const rect = a.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const ratio = nz / zoomRef.current;
    setPan(p => ({ x: cx - (cx - p.x) * ratio, y: cy - (cy - p.y) * ratio }));
    zoomRef.current = nz;
    setZoom(nz);
  };
  const zoomAtCenter = (nz) => {
    const a = canvasAreaRef.current;
    if (!a) { setZoom(nz); return; }
    const r = a.getBoundingClientRect();
    zoomAtPoint(nz, r.left + a.clientWidth / 2, r.top + a.clientHeight / 2);
  };
  const zoomToFit = () => { setZoom(1); centerCanvas(1); };
  const zoom100 = () => { const z = clampZoom(1 / fitScale); setZoom(z); centerCanvas(z); };
  const zoomToSelection = () => {
    const b = groupBox || selBox;
    const a = canvasAreaRef.current;
    if (!b || !a) { zoomToFit(); return; }
    const pad = 100;
    const z = clampZoom(Math.min((a.clientWidth - pad) / (b.w * fitScale), (a.clientHeight - pad) / (b.h * fitScale)));
    const cxDisp = (b.x + b.w / 2) * fitScale * z;
    const cyDisp = (b.y + b.h / 2) * fitScale * z;
    setZoom(z);
    setPan({ x: a.clientWidth / 2 - cxDisp, y: a.clientHeight / 2 - cyDisp });
  };

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Track the canvas-area size so the viewport rulers know the visible range.
  useEffect(() => {
    const a = canvasAreaRef.current;
    if (!a) return;
    const update = () => setViewport({ w: a.clientWidth, h: a.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(a);
    return () => ro.disconnect();
  }, []);

  // Centre the artboard on load and whenever the canvas size changes.
  useEffect(() => { centerCanvas(zoomRef.current); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.w, dims.h, presetId]);

  // Wheel: Ctrl/⌘+wheel (or trackpad pinch) zooms to the cursor; plain scroll pans.
  useEffect(() => {
    const a = canvasAreaRef.current;
    if (!a) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        zoomAtPoint(clampZoom(zoomRef.current * Math.exp(-e.deltaY * 0.0015)), e.clientX, e.clientY);
      } else {
        const dx = e.shiftKey ? e.deltaY : e.deltaX;
        const dy = e.shiftKey ? 0 : e.deltaY;
        setPan(p => ({ x: p.x - dx, y: p.y - dy }));
      }
    };
    a.addEventListener('wheel', onWheel, { passive: false });
    return () => a.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hold Space to pan (hand cursor).
  useEffect(() => {
    const isField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    const kd = (e) => { if (e.code === 'Space' && !isField(e.target)) { e.preventDefault(); setSpaceDown(true); } };
    const ku = (e) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  // Navigation + tool shortcuts (Figma-style).
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomAtCenter(clampZoom(zoom * 1.2)); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAtCenter(clampZoom(zoom / 1.2)); }
        return;
      }
      if (e.shiftKey) {
        if (e.code === 'Digit0') { e.preventDefault(); zoom100(); }
        else if (e.code === 'Digit1') { e.preventDefault(); zoomToFit(); }
        else if (e.code === 'Digit2') { e.preventDefault(); zoomToSelection(); }
        return;
      }
      switch (e.key.toLowerCase()) {
        case 't': e.preventDefault(); addText('heading'); break;
        case 'r': e.preventDefault(); addElement('square'); break;
        case 'o': e.preventDefault(); addElement('circle'); break;
        case 'l': e.preventDefault(); addElement('line'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, dims.w, dims.h, layers, selectedIds]);

  // Convert a pointer event to canvas-pixel coordinates.
  const toCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (dims.w / rect.width),
      y: (e.clientY - rect.top) * (dims.h / rect.height),
    };
  };

  // Click anywhere on the canvas: select the topmost layer under the cursor
  // (and start dragging it), or deselect if the click missed everything.
  // Right-click: select the layer under the cursor and open the context menu.
  const onContextMenu = (e) => {
    e.preventDefault();
    setCtxMenu(null);
    const { x: px, y: py } = toCanvasPoint(e);
    let hit = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (l.hidden) continue;
      const b = boundsOf(l);
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) { hit = l; break; }
    }
    if (hit && !selectedIds.includes(hit.id)) {
      const groupIds = hit.group ? layers.filter(l => l.group === hit.group).map(l => l.id) : [hit.id];
      setSelectedIds(groupIds);
      setRightTab('design');
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, canPaste: !!(clipboard.current && clipboard.current.length) });
  };

  // --- Freehand drawing pointer flow ---
  const onDrawMove = (e) => {
    const r = drawRef.current;
    if (!r) return;
    const { x, y } = toCanvasPoint(e);
    r.pts.push({ x, y });
    // Repaint at most once per frame — long strokes stay smooth instead of
    // triggering a full canvas repaint on every pointer event.
    if (drawRaf.current) return;
    drawRaf.current = requestAnimationFrame(() => {
      drawRaf.current = 0;
      const rr = drawRef.current;
      if (rr) setDrawing({ ...rr, pts: rr.pts.slice() });
    });
  };
  const onDrawUp = () => {
    window.removeEventListener('pointermove', onDrawMove);
    window.removeEventListener('pointerup', onDrawUp);
    if (drawRaf.current) { cancelAnimationFrame(drawRaf.current); drawRaf.current = 0; }
    const r = drawRef.current;
    drawRef.current = null;
    setDrawing(null);
    if (!r || !r.pts.length) return;
    // Pencil & brush get Figma-style smoothing; eraser stays raw for precision.
    const smooth = r.mode === 'eraser' ? 0 : (r.smooth ?? 0);
    const shown = smooth > 0 ? smoothStroke(r.pts, smooth) : r.pts;
    // Bounding box (padded by the stroke half-width) → layer origin + relative pts.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of shown) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
    const pad = (r.strokeW || 4) / 2 + (r.soft ? r.strokeW : 0) + 2;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const layer = {
      id: uid(), type: 'path', name: DRAW_TOOLS[r.mode]?.label || 'Drawing',
      mode: r.mode, color: r.color, strokeW: r.strokeW, soft: r.soft, smooth,
      opacity: r.opacity ?? 1,
      blend: r.mode === 'eraser' ? 'destination-out' : 'normal',
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      pts: shown.map((p) => ({ x: p.x - minX, y: p.y - minY })),
      // Keep the raw capture so the smoothing slider can re-derive later.
      raw: r.pts.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    };
    setLayersWithHistory((prev) => [...prev, layer]);
  };

  // --- Vector pen pointer flow (Figma-style) ---
  // Screen→canvas distance for the "click first anchor to close" hit test.
  const penCloseDist = () => 10 * (dims.w / Math.max(1, (canvasRef.current?.getBoundingClientRect().width || dims.w)));
  const commitPen = (closed) => {
    const d = penDraft;
    setPenDraft(null); setPenCursor(null);
    if (!d || d.anchors.length < 2) return;
    // Bounding box including bezier handles.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const a of d.anchors) {
      for (const [px, py] of [[a.x, a.y], [a.x + (a.hx || 0), a.y + (a.hy || 0)], [a.x - (a.hx || 0), a.y - (a.hy || 0)]]) {
        minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
      }
    }
    const pad = (drawSize || 4) / 2 + 2;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const layer = {
      id: uid(), type: 'vector', name: 'Pen path', closed: !!closed,
      stroke: drawColor, strokeW: drawSize, fill: 'none', opacity: 1,
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      anchors: d.anchors.map((a) => ({ x: a.x - minX, y: a.y - minY, hx: a.hx || 0, hy: a.hy || 0 })),
    };
    setLayersWithHistory((prev) => [...prev, layer]);
  };
  const penPointerDown = (e) => {
    const { x, y } = toCanvasPoint(e);
    // Click near the first anchor → close the shape and finish.
    if (penDraft && penDraft.anchors.length >= 2) {
      const first = penDraft.anchors[0];
      if (Math.hypot(x - first.x, y - first.y) <= penCloseDist()) { commitPen(true); return; }
    }
    const anchors = penDraft ? penDraft.anchors.slice() : [];
    anchors.push({ x, y, hx: 0, hy: 0 });
    const idx = anchors.length - 1;
    setPenDraft({ anchors, closed: false });
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    // Drag after placing → pull symmetric bezier handles for a smooth curve.
    // Local closures ensure add/remove use the same references (no leak).
    const mv = (ev) => {
      const p = toCanvasPoint(ev);
      setPenDraft((prev) => {
        if (!prev) return prev;
        const a2 = prev.anchors.slice();
        const a = a2[idx];
        a2[idx] = { ...a, hx: p.x - a.x, hy: p.y - a.y };
        return { ...prev, anchors: a2 };
      });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  // --- Vector point editing (Figma-style edit mode) ---
  const recordVecHistory = () => saveHistory(layersRef.current, bg);
  const enterVecEdit = (id) => { setVecEdit(id); setVecTool('move'); setVecSel(null); setDrawTool(null); setToolMode('move'); };
  // Re-tighten the layer's bbox around its (possibly moved) anchors, then leave.
  const exitVecEdit = () => {
    setLayersWithHistory(prev => prev.map(l => {
      if (l.id !== vecEdit || l.type !== 'vector' || !l.anchors?.length) return l;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const a of l.anchors) {
        const ax = l.x + a.x, ay = l.y + a.y;
        for (const [px, py] of [[ax, ay], [ax + (a.hx || 0), ay + (a.hy || 0)], [ax - (a.hx || 0), ay - (a.hy || 0)]]) {
          minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
        }
      }
      const pad = (l.strokeW || 2) / 2 + 2;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      return { ...l, x: minX, y: minY, w: maxX - minX, h: maxY - minY, anchors: l.anchors.map(a => ({ ...a, x: (l.x + a.x) - minX, y: (l.y + a.y) - minY })) };
    }));
    setVecEdit(null); setVecSel(null);
  };
  // Drag an anchor point (move it, or in Bend mode pull symmetric curve handles).
  const startAnchorDrag = (e, i) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === vecEdit);
    if (!layer) return;
    setVecSel(i);
    if (vecTool === 'delete') { deleteAnchor(i); return; }
    const start = toCanvasPoint(e);
    const a0 = { ...layer.anchors[i] };
    let moved = false;
    const mv = (ev) => {
      moved = true;
      const p = toCanvasPoint(ev);
      setLayers(prev => prev.map(l => l.id === vecEdit ? { ...l, anchors: l.anchors.map((a, j) => {
        if (j !== i) return a;
        if (vecTool === 'bend') return { ...a, hx: p.x - (layer.x + a0.x), hy: p.y - (layer.y + a0.y) };
        return { ...a, x: a0.x + (p.x - start.x), y: a0.y + (p.y - start.y) };
      }) } : l));
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      if (!moved && vecTool === 'bend') {
        // Click without dragging in Bend mode → toggle corner (remove handles).
        setLayers(prev => prev.map(l => l.id === vecEdit ? { ...l, anchors: l.anchors.map((a, j) => j === i ? { ...a, hx: 0, hy: 0 } : a) } : l));
      }
      recordVecHistory();
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  // Drag a bezier handle (symmetric — the opposite handle mirrors).
  const startHandleDrag = (e, i, sign) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === vecEdit);
    if (!layer) return;
    setVecSel(i);
    const mv = (ev) => {
      const p = toCanvasPoint(ev);
      const ax = layer.x + layer.anchors[i].x, ay = layer.y + layer.anchors[i].y;
      const hx = (p.x - ax) * sign, hy = (p.y - ay) * sign;
      setLayers(prev => prev.map(l => l.id === vecEdit ? { ...l, anchors: l.anchors.map((a, j) => j === i ? { ...a, hx, hy } : a) } : l));
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); recordVecHistory(); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  const deleteAnchor = (i) => {
    setLayersWithHistory(prev => prev.map(l => (l.id === vecEdit && l.type === 'vector' && l.anchors.length > 2) ? { ...l, anchors: l.anchors.filter((_, j) => j !== i) } : l));
    setVecSel(null);
  };
  const insertAnchorAt = (px, py) => {
    const layer = layers.find(l => l.id === vecEdit);
    if (!layer || !layer.anchors || layer.anchors.length < 2) return;
    const pts = layer.anchors.map(a => ({ x: layer.x + a.x, y: layer.y + a.y }));
    const n = layer.closed ? pts.length : pts.length - 1;
    let best = -1, bestD = Infinity, bestPt = null;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const { d, pt } = projectToSeg(px, py, a, b);
      if (d < bestD) { bestD = d; best = i; bestPt = pt; }
    }
    if (best < 0 || bestD > 24) return; // only insert when clicking near the path
    const newA = { x: bestPt.x - layer.x, y: bestPt.y - layer.y, hx: 0, hy: 0 };
    setLayersWithHistory(prev => prev.map(l => l.id === vecEdit ? { ...l, anchors: [...l.anchors.slice(0, best + 1), newA, ...l.anchors.slice(best + 1)] } : l));
  };

  const onCanvasPointerDown = (e) => {
    if (e.button !== 0) return; // only the left button selects/drags
    if (crop || canvasCrop) return; // crop mode owns the pointer
    if (spaceDown || toolMode === 'hand') { startPan(e); return; } // Space or Hand tool pans
    // Vector edit mode: the Add tool inserts a point on the path; anchor dots have
    // their own handlers. Any other click on the canvas leaves edit mode (and then
    // falls through to normal selection) so you're never trapped — Figma-style.
    if (vecEdit) {
      if (vecEditLayer && vecTool === 'add') { const p = toCanvasPoint(e); insertAnchorAt(p.x, p.y); return; }
      exitVecEdit();
      // fall through → normal hit-test / selection below
    }
    // Pen tool → vector anchor placement (handled separately).
    if (drawTool === 'pen') { penPointerDown(e); return; }
    // Freehand tools (brush / pencil / eraser) → capture a stroke.
    if (drawTool) {
      const { x, y } = toCanvasPoint(e);
      const meta = DRAW_TOOLS[drawTool] || {};
      const smooth = drawTool === 'eraser' ? 0 : drawSmooth;
      drawRef.current = { mode: drawTool, color: drawColor, strokeW: drawSize, soft: meta.soft || 0, opacity: meta.opacity ?? 1, smooth, pts: [{ x, y }] };
      setDrawing({ ...drawRef.current });
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      window.addEventListener('pointermove', onDrawMove);
      window.addEventListener('pointerup', onDrawUp);
      return;
    }
    const { x: px, y: py } = toCanvasPoint(e);
    let hit = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (l.hidden) continue;
      const b = boundsOf(l);
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) { hit = l; break; }
    }

    // Empty space → rubber-band marquee (Shift keeps the current selection).
    if (!hit) {
      drag.current = { kind: 'marquee', startX: px, startY: py, base: e.shiftKey ? [...selectedIds] : null, moved: false };
      if (!e.shiftKey) setSelectedIds([]);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      return;
    }

    setRightTab('design');
    // Grouped layers select as a unit.
    const groupIds = hit.group ? layers.filter(l => l.group === hit.group).map(l => l.id) : [hit.id];

    if (e.shiftKey) {
      const already = selectedIds.includes(hit.id);
      setSelectedIds(already ? selectedIds.filter(id => !groupIds.includes(id)) : [...new Set([...selectedIds, ...groupIds])]);
      return; // shift-click adjusts selection without dragging
    }

    const nextSel = selectedIds.includes(hit.id) ? selectedIds : groupIds;
    if (!selectedIds.includes(hit.id)) setSelectedIds(nextSel);
    if (hit.locked) return; // selectable but not draggable
    beginMove(e, nextSel);
  };

  // Hover feedback: show a "move" cursor when the pointer is over a layer.
  const onCanvasHover = (e) => {
    if (drag.current || spaceDown) return;
    if (drawTool) {
      e.currentTarget.style.cursor = 'crosshair';
      if (drawTool === 'pen' && penDraft) setPenCursor(toCanvasPoint(e));
      return;
    }
    const { x: px, y: py } = toCanvasPoint(e);
    const over = layers.some(l => {
      if (l.hidden) return false;
      const b = boundsOf(l);
      return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    });
    e.currentTarget.style.cursor = over ? 'move' : 'default';
  };

  // Double-click: text → edit inline; image → crop.
  const onCanvasDoubleClick = (e) => {
    if (drawTool) return; // drawing tools own the pointer; don't edit/crop
    const { x: px, y: py } = toCanvasPoint(e);
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (l.hidden) continue;
      const b = boundsOf(l);
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        setSelectedId(l.id);
        setRightTab('design');
        if (l.type === 'text') setEditingId(l.id);
        else if (l.type === 'image') startCropFor(l.id);
        else if (l.type === 'vector') enterVecEdit(l.id);
        return;
      }
    }
  };
  // Double-click the selection box acts on the selected layer (its overlay sits
  // on top of the canvas, so the canvas dblclick never reaches it).
  const onSelDoubleClick = () => {
    if (!sel) return;
    if (sel.type === 'text') setEditingId(sel.id);
    else if (sel.type === 'image') startCropFor(sel.id);
    else if (sel.type === 'vector') enterVecEdit(sel.id);
  };
  // Debounced history from updateLayersLive already records the edit; just close.
  const commitEdit = () => setEditingId(null);

  const editingLayer = editingId ? layers.find(l => l.id === editingId && l.type === 'text') : null;
  const editBox = editingLayer ? boundsOf(editingLayer) : null;

  // --- Context-menu / order actions (operate on the whole selection) ---
  const bringToFront = () => setLayersWithHistory([...layers.filter(l => !selectedIds.includes(l.id)), ...layers.filter(l => selectedIds.includes(l.id))]);
  const sendToBack = () => setLayersWithHistory([...layers.filter(l => selectedIds.includes(l.id)), ...layers.filter(l => !selectedIds.includes(l.id))]);
  const duplicateSelection = () => { const dups = selLayers.map(s => ({ ...s, id: uid(), x: s.x + 24, y: s.y + 24 })); setLayersWithHistory([...layers, ...dups]); setSelectedIds(dups.map(d => d.id)); };
  const deleteSelection = () => { setLayersWithHistory(layers.filter(l => !selectedIds.includes(l.id))); setSelectedIds([]); };
  const copySelection = () => { clipboard.current = selLayers.map(s => ({ ...s })); };
  const pasteClipboard = () => { if (!clipboard.current?.length) return; const dups = clipboard.current.map(c => ({ ...c, id: uid(), x: c.x + 24, y: c.y + 24 })); setLayersWithHistory([...layers, ...dups]); setSelectedIds(dups.map(d => d.id)); };
  const selectAllLayers = () => setSelectedIds(layers.filter(l => !l.hidden).map(l => l.id));
  const runCtx = (fn) => { fn(); setCtxMenu(null); };

  // --- Crop (image layers) ---
  const startCropFor = (id) => {
    const l = layers.find(x => x.id === id);
    if (l?.type !== 'image') return;
    const b = boundsOf(l);
    setSelectedIds([id]);
    setCrop({ id, x: b.x, y: b.y, w: b.w, h: b.h, ix: b.x, iy: b.y, iw: b.w, ih: b.h });
  };
  const startCrop = () => { if (sel) startCropFor(sel.id); };

  // Swap the selected image's photo in place (keeps position, size, filters).
  // Works for uploads (data URLs) and remote URLs (routed through the proxy so
  // the canvas stays exportable). Used to change a template's photo.
  const replaceSelectedImage = (src) => {
    if (!sel || sel.type !== 'image' || !src) return;
    const id = sel.id;
    const isRemote = /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin);
    const useSrc = isRemote ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src;
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => setLayersWithHistory(layers.map(x => x.id === id ? { ...x, el: im, src: useSrc } : x));
    im.onerror = () => { if (isRemote) { const d = new Image(); d.onload = () => setLayers(prev => prev.map(x => x.id === id ? { ...x, el: d, src } : x)); d.src = src; } };
    im.src = useSrc;
  };

  // AI background: 'remove' → transparent cutout, 'blur' → subject sharp over blur.
  const applyBg = async (kind) => {
    if (sel?.type !== 'image' || !sel.el || bgBusy) return;
    const id = sel.id;
    try {
      const dataUrl = kind === 'blur'
        ? await blurBackground(sel.el, 24, setBgBusy)
        : await removeBackground(sel.el, setBgBusy);
      setBgBusy('Finishing…');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLayersWithHistory(layers.map(x => x.id === id ? { ...x, src: dataUrl, el: img, filter: 'none' } : x));
        setBgBusy(null);
      };
      img.onerror = () => setBgBusy(null);
      img.src = dataUrl;
    } catch (e) {
      console.error(e);
      setBgBusy(null);
      alert('Background processing failed. Try a clearer subject, or a smaller image.');
    }
  };

  // --- AI prompt bar actions ---
  // Generate a background image from the prompt via /api/ai-bg (gated behind
  // OPENAI_API_KEY server-side). Blob is same-origin, so it stays export-safe.
  const generateAiBackground = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) { setAiStatus('Describe the background you want first.'); return; }
    if (aiStatus === 'Generating…') return;
    setAiStatus('Generating…');
    try {
      const size = dims.w === dims.h ? '1024x1024' : dims.w > dims.h ? '1536x1024' : '1024x1536';
      const r = await fetch('/api/ai-bg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, size }) });
      const ct = r.headers.get('content-type') || '';
      if (!r.ok || !ct.includes('image')) {
        const data = await r.json().catch(() => ({}));
        setAiStatus(data.detail || 'AI backgrounds aren’t available right now.');
        return;
      }
      const url = URL.createObjectURL(await r.blob());
      const img = new Image();
      img.onload = () => {
        const layer = {
          id: uid(), type: 'image', el: img, src: url, name: 'AI background', opacity: 1,
          x: 0, y: 0, w: dims.w, h: dims.h,
          adjust: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
          imgStyle: { rotate: 0, flipH: false, flipV: false, radius: 0, shadow: 0 },
        };
        setLayersWithHistory(prev => [layer, ...prev]); // drop behind everything
        setAiStatus(''); setAiPrompt('');
      };
      img.onerror = () => setAiStatus('Couldn’t load the generated image.');
      img.src = url;
    } catch {
      setAiStatus('AI background failed — please try again.');
    }
  };
  // Route the AI chips. Generate uses /api/ai-bg (live once OPENAI_API_KEY is set;
  // shows a clear setup message otherwise). Remove/Blur run locally. The rest are
  // still coming soon.
  const runAiAction = (id) => {
    if (id === 'generate') return generateAiBackground();
    if (id === 'remove' || id === 'blur') {
      if (sel?.type !== 'image') { setAiStatus('Select an image first, then run this.'); return; }
      setAiStatus(''); applyBg(id); return;
    }
    const names = { expand: 'Expand image', eraser: 'Magic eraser', upscale: 'Image upscaler', palette: 'Palette generator' };
    setAiStatus(`${names[id] || 'That tool'} is coming soon ✨`);
  };

  // Deep link: /studio?img=…&bg=remove|blur (from the Zoho widget) auto-runs the
  // background op once the image has loaded, so the user just clicks Save to Zoho.
  const autoBgRef = useRef(false);
  useEffect(() => {
    const kind = params.get('bg');
    if (!kind || autoBgRef.current) return;
    if (sel?.type === 'image' && sel.el && !bgBusy) {
      autoBgRef.current = true;
      applyBg(kind === 'blur' ? 'blur' : 'remove');
    }
  }, [sel, bgBusy, params]);

  const cropPointerDown = (e) => {
    e.stopPropagation();
    const handle = e.target.dataset.crop || 'move';
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = dims.w / rect.width; // design-space px (canvas backing is super-sampled)
    const startX = (e.clientX - rect.left) * scale;
    const startY = (e.clientY - rect.top) * scale;
    const start = { ...crop };
    const mv = (ev) => {
      const x = (ev.clientX - rect.left) * scale, y = (ev.clientY - rect.top) * scale;
      const dx = x - startX, dy = y - startY;
      setCrop(() => {
        const { ix, iy, iw, ih } = start;
        let nx = start.x, ny = start.y, nw = start.w, nh = start.h;
        if (handle === 'move') {
          nx = Math.min(Math.max(start.x + dx, ix), ix + iw - nw);
          ny = Math.min(Math.max(start.y + dy, iy), iy + ih - nh);
        } else {
          const right = handle.includes('r'), bottom = handle.includes('b');
          if (right) nw = start.w + dx; else { nw = start.w - dx; nx = start.x + dx; }
          if (bottom) nh = start.h + dy; else { nh = start.h - dy; ny = start.y + dy; }
          if (nx < ix) { nw -= (ix - nx); nx = ix; }
          if (ny < iy) { nh -= (iy - ny); ny = iy; }
          if (nx + nw > ix + iw) nw = ix + iw - nx;
          if (ny + nh > iy + ih) nh = iy + ih - ny;
          nw = Math.max(20, nw); nh = Math.max(20, nh);
        }
        return { ...start, x: nx, y: ny, w: nw, h: nh };
      });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  const applyCrop = () => {
    const c = crop;
    if (!c) return;
    const l = layers.find(x => x.id === c.id);
    if (!l?.el) { setCrop(null); return; }
    const nw = l.el.naturalWidth, nh = l.el.naturalHeight;
    const sx = (c.x - c.ix) / c.iw * nw;
    const sy = (c.y - c.iy) / c.ih * nh;
    const sw = c.w / c.iw * nw;
    const sh = c.h / c.ih * nh;
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(sw));
    off.height = Math.max(1, Math.round(sh));
    off.getContext('2d').drawImage(l.el, sx, sy, sw, sh, 0, 0, off.width, off.height);
    const dataUrl = off.toDataURL('image/png');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLayersWithHistory(layers.map(x => x.id === c.id ? { ...x, src: dataUrl, el: img, x: c.x, y: c.y, w: c.w, h: c.h } : x));
      setCrop(null);
    };
    img.src = dataUrl;
  };

  // --- Crop the whole canvas / artboard ---
  const startCanvasCrop = () => {
    setCrop(null);
    setSelectedIds([]);
    setCanvasCrop({ x: 0, y: 0, w: dims.w, h: dims.h, iw: dims.w, ih: dims.h });
  };
  const canvasCropPointerDown = (e) => {
    e.stopPropagation();
    const handle = e.target.dataset.crop || 'move';
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = dims.w / rect.width; // design-space px (canvas backing is super-sampled)
    const startX = (e.clientX - rect.left) * scale;
    const startY = (e.clientY - rect.top) * scale;
    const start = { ...canvasCrop };
    const iw = start.iw, ih = start.ih;
    const mv = (ev) => {
      const dx = (ev.clientX - rect.left) * scale - startX;
      const dy = (ev.clientY - rect.top) * scale - startY;
      setCanvasCrop(() => {
        let nx = start.x, ny = start.y, nw = start.w, nh = start.h;
        if (handle === 'move') {
          nx = Math.min(Math.max(start.x + dx, 0), iw - nw);
          ny = Math.min(Math.max(start.y + dy, 0), ih - nh);
        } else {
          const right = handle.includes('r'), bottom = handle.includes('b');
          if (right) nw = start.w + dx; else { nw = start.w - dx; nx = start.x + dx; }
          if (bottom) nh = start.h + dy; else { nh = start.h - dy; ny = start.y + dy; }
          if (nx < 0) { nw += nx; nx = 0; }
          if (ny < 0) { nh += ny; ny = 0; }
          if (nx + nw > iw) nw = iw - nx;
          if (ny + nh > ih) nh = ih - ny;
          nw = Math.max(20, nw); nh = Math.max(20, nh);
        }
        return { ...start, x: nx, y: ny, w: nw, h: nh };
      });
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  const applyCanvasCrop = () => {
    const c = canvasCrop;
    if (!c) return;
    const nx = Math.round(c.x), ny = Math.round(c.y);
    const nw = Math.max(1, Math.round(c.w)), nh = Math.max(1, Math.round(c.h));
    const moved = layers.map(l => ({ ...l, x: (l.x || 0) - nx, y: (l.y || 0) - ny }));
    setCustom({ w: nw, h: nh });
    setPresetId('custom');
    setPan({ x: 40, y: 40 });
    setLayersWithHistory(moved);
    setCanvasCrop(null);
  };

  return (
    <div className="studio-layout">
      {/* Onboarding: choose how to start */}
      {showStart && (
        <div className="studio-start-overlay">
          <div className="studio-start">
            <div className="studio-start-head">
              <h2>Start a new design</h2>
              <p>Choose how you’d like to begin — you can switch anytime.</p>
            </div>
            <div className="studio-start-grid">
              <button className="studio-start-card" onClick={() => setShowStart(false)}>
                <span className="studio-start-ic"><Square size={26} weight="duotone" /></span>
                <strong>Blank canvas</strong>
                <span>Start from scratch on an empty artboard.</span>
              </button>
              <button className="studio-start-card accent" onClick={() => { setShowStart(false); startFileRef.current?.click(); }}>
                <span className="studio-start-ic"><ImageIcon size={26} weight="duotone" /></span>
                <strong>Edit a photo</strong>
                <span>Upload an image and start editing right away.</span>
              </button>
              <button className="studio-start-card" onClick={() => { setActiveTab('templates'); setShowStart(false); }}>
                <span className="studio-start-ic"><MagicWand size={26} weight="duotone" /></span>
                <strong>Browse templates</strong>
                <span>Pick a ready-made design and customize it.</span>
              </button>
            </div>
            <button className="studio-start-skip" onClick={() => setShowStart(false)}>Skip for now</button>
          </div>
        </div>
      )}

      {/* Always-mounted image picker (used by the start screen + drag/drop) so the
          input never detaches before its change event fires. */}
      <input ref={startFileRef} type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await fileToDataUrl(f); loadImage(u); } e.target.value = ''; }} />

      {/* Help & Settings modals (opened from the left rail) */}
      {railModal && (
        <div className="studio-rail-modal-overlay" onClick={() => setRailModal(null)}>
          <div className={`studio-rail-modal ${railModal === 'help' ? 'wide' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="studio-rail-modal-head">
              <h3>{railModal === 'help' ? 'Help & guide' : 'Settings'}</h3>
              <button className="studio-rail-modal-x" onClick={() => setRailModal(null)} aria-label="Close"><span aria-hidden>✕</span></button>
            </div>
            {railModal === 'help' ? (
              <div className="studio-rail-modal-body studio-help">
                <div className="studio-tpl-search"><MagnifyingGlass size={16} /><input value={helpQuery} onChange={e => setHelpQuery(e.target.value)} placeholder="Search help… (e.g. export, crop, fonts)" aria-label="Search help" /></div>
                <div className="studio-help-cats">
                  {HELP_CATS.map(c => <button key={c} className={helpCat === c ? 'active' : ''} onClick={() => setHelpCat(c)}>{c}</button>)}
                </div>
                <div className="studio-help-list">
                  {(() => {
                    const q = helpQuery.trim().toLowerCase();
                    const items = HELP_ITEMS.filter(it => (helpCat === 'All' || it.cat === helpCat) && (!q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)));
                    if (!items.length) return <p className="studio-hint">No results. Try another word.</p>;
                    return items.map((it, i) => (
                      <details key={i} className="studio-help-item"><summary>{it.q}<span className="studio-help-tag">{it.cat}</span></summary><p>{it.a}</p></details>
                    ));
                  })()}
                </div>
                <p className="studio-hint" style={{ marginTop: 12 }}>More on the <Link to="/help" target="_blank" rel="noreferrer">Help Center</Link>.</p>
              </div>
            ) : (
              <div className="studio-rail-modal-body">
                <label className="studio-set-row"><span>Show grid</span><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /></label>
                <label className="studio-set-row"><span>Show rulers</span><input type="checkbox" checked={showRulers} onChange={e => setShowRulers(e.target.checked)} /></label>
                <p className="studio-hint" style={{ marginTop: 10 }}>Studio projects are session-only and clear when you close the tab.</p>
                <Link to="/settings" className="btn-outline" style={{ display: 'inline-flex', marginTop: 12, padding: '8px 16px', borderRadius: 10 }}>Account settings</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className="studio-topbar">
        <div className="studio-topbar-left">
          <Link to="/" className="studio-back" title="Exit Studio" aria-label="Exit Studio"><CaretLeft size={18} weight="bold" /></Link>
          <span className="studio-logo-mark" aria-hidden="true"><StudioMark size={28} /></span>
          <span className="studio-wordmark">PikFinder <span className="dim">Studio</span></span>
          <span className="studio-topbar-div" />
          <input
            className="studio-project-name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            aria-label="Project name"
            title="Rename project"
          />
        </div>
        
        <div className="studio-topbar-center">
          <button className="studio-btn-icon" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"><ArrowUUpLeft size={18} /></button>
          <button className="studio-btn-icon" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Shift+Z)"><ArrowUUpRight size={18} /></button>
          
          <select value={presetId} onChange={e => setPresetId(e.target.value)}
            style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-color)', fontSize: '13px' }}>
            {PRESETS.filter(p => p.id !== 'custom').map(p => <option key={p.id} value={p.id}>{p.label} ({p.w}×{p.h})</option>)}
            <option value="custom">Custom Size</option>
          </select>
          {presetId === 'custom' && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input type="number" value={custom.w} onChange={e => setCustom({...custom, w: +e.target.value})} style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '12px' }} />
              <span style={{ color: 'var(--text-muted)' }}>×</span>
              <input type="number" value={custom.h} onChange={e => setCustom({...custom, h: +e.target.value})} style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '12px' }} />
            </div>
          )}
          <button className={`studio-btn-icon ${canvasCrop ? 'active' : ''}`} onClick={() => canvasCrop ? setCanvasCrop(null) : startCanvasCrop()} title="Crop canvas / resize artboard"><Crop size={18} /></button>
        </div>
        
        <div className="studio-topbar-right">
          <div className="studio-zoombar-head">
            <button className="studio-btn-icon" onClick={() => zoomAtCenter(clampZoom(zoom / 1.2))} title="Zoom out (Ctrl -)" aria-label="Zoom out"><MagnifyingGlassMinus size={15} /></button>
            <button className="studio-zoom-value" onClick={zoomToFit} title="Zoom to fit (Shift 1)">{Math.round(fitScale * zoom * 100)}%</button>
            <button className="studio-btn-icon" onClick={() => zoomAtCenter(clampZoom(zoom * 1.2))} title="Zoom in (Ctrl +)" aria-label="Zoom in"><MagnifyingGlassPlus size={15} /></button>
            <span className="studio-zoombar-sep" />
            <button className={`studio-btn-icon ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(g => !g)} title="Toggle grid" aria-label="Toggle grid" aria-pressed={showGrid}><GridFour size={15} /></button>
            <button className={`studio-btn-icon ${showRulers ? 'active' : ''}`} onClick={() => setShowRulers(r => !r)} title="Toggle rulers" aria-label="Toggle rulers" aria-pressed={showRulers}><RulerIcon size={15} /></button>
          </div>
          <span className="studio-topbar-div" />
          <span className="studio-save-status" title={dirty ? 'Unsaved changes' : 'All changes captured'}>
            {dirty ? <><span className="save-dot" /> Unsaved</> : <><CheckCircle size={14} weight="fill" /> Saved</>}
          </span>
          {zohoMode && (
            <button className="btn-primary" onClick={saveToZoho} disabled={zohoSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, marginRight: 8, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }} title="Send this image back to the Zoho record">
              <Upload size={16} /> {zohoSaving ? 'Sending…' : 'Save to Zoho'}
            </button>
          )}
          <button className="btn-outline studio-savetpl-btn" onClick={saveAsTemplate} disabled={savingTpl} title="Save this design as a reusable template in your Documents (sign in required)">
            <FloppyDisk size={16} /> {savingTpl ? 'Saving…' : 'Save to Documents'}
          </button>
          <div className="studio-export-wrap">
            <button className="btn-primary studio-export-btn" onClick={() => setExportOpen(o => !o)}>
              <DownloadSimple size={16} /> Export <CaretDown size={12} />
            </button>
            {exportOpen && (
              <>
                <div className="studio-export-backdrop" onPointerDown={() => setExportOpen(false)} />
                <div className="studio-export-pop" onPointerDown={e => e.stopPropagation()}>
                  <div className="studio-export-title">Export</div>

                  <label className="studio-export-row">
                    <span>Format</span>
                    <select value={exportCfg.format} onChange={e => setExportCfg({ ...exportCfg, format: e.target.value })}>
                      <option value="image/png">PNG</option>
                      <option value="image/jpeg">JPG</option>
                      <option value="image/webp">WEBP</option>
                      <option value="image/svg+xml">SVG</option>
                      <option value="application/pdf">PDF</option>
                    </select>
                  </label>

                  {exportCfg.format !== 'image/svg+xml' && (
                    <>
                      <div className="studio-export-row">
                        <span>Scale</span>
                        <div className="studio-export-scales">
                          {[1, 2, 4, 6, 8].map(s => (
                            <button key={s} className={exportCfg.scale === s ? 'active' : ''} onClick={() => setExportCfg({ ...exportCfg, scale: s })}>{s}x</button>
                          ))}
                        </div>
                      </div>
                      <div className="studio-export-row studio-export-dims">
                        <span>Output</span>
                        <strong>{Math.round(dims.w * effExportScale)} × {Math.round(dims.h * effExportScale)} px{effExportScale > (exportCfg.scale || 1) ? ' · HD' : ''}</strong>
                      </div>
                    </>
                  )}

                  {(exportCfg.format === 'image/jpeg' || exportCfg.format === 'image/webp') && (
                    <label className="studio-export-row">
                      <span>Quality</span>
                      <select value={exportCfg.quality} onChange={e => setExportCfg({ ...exportCfg, quality: e.target.value })}>
                        <option value="high">High</option>
                        <option value="low">Smaller file</option>
                      </select>
                    </label>
                  )}

                  {(exportCfg.format === 'image/png' || exportCfg.format === 'image/svg+xml') && (
                    <label className="studio-export-row studio-export-check">
                      <span>Transparent background</span>
                      <input type="checkbox" checked={exportCfg.transparent} onChange={e => setExportCfg({ ...exportCfg, transparent: e.target.checked })} />
                    </label>
                  )}

                  <div className="studio-export-size">
                    {exportCfg.format === 'image/svg+xml'
                      ? `${dims.w}×${dims.h} · scalable vector`
                      : `${dims.w}×${dims.h} → ${Math.round(dims.w * effExportScale)}×${Math.round(dims.h * effExportScale)} px · always ≥ Full HD`}
                  </div>
                  <button className="btn-primary studio-export-go" onClick={doExport}>
                    <DownloadSimple size={16} /> Export {exportCfg.format === 'image/svg+xml' ? 'SVG' : exportCfg.format.split('/')[1].replace('jpeg', 'jpg').toUpperCase()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={`studio-workspace pane-${mPane}`}>
        {/* Mobile-only bottom bar to switch between Tools, Canvas and Design.
            Hidden on desktop; lets the editor work on a phone one pane at a time. */}
        <nav className="studio-mobile-tabs" aria-label="Editor panels">
          <button className={mPane === 'tools' ? 'active' : ''} onClick={() => setMPane('tools')}>Tools</button>
          <button className={mPane === 'canvas' ? 'active' : ''} onClick={() => setMPane('canvas')}>Canvas</button>
          <button className={mPane === 'design' ? 'active' : ''} onClick={() => setMPane('design')}>Design</button>
        </nav>
        {/* Sidebar Navigation */}
        <aside className="studio-sidebar">
          <div className="studio-sidebar-main">
            <button className="studio-tab studio-tab-ai" title="AI Studio" onClick={() => setAiOpen(true)}>
              <Sparkle size={22} weight="fill" /><span>AI Studio</span>
            </button>
            <span className="studio-tab-sep" />
            {[
              { id: 'templates', label: 'Templates', Icon: MagicWand },
              { id: 'uploads', label: 'Uploads', Icon: Upload },
              { id: 'images', label: 'Photos', Icon: ImageIcon },
              { id: 'elements', label: 'Elements', Icon: Shapes },
              { id: 'text', label: 'Text', Icon: TextT },
              { id: 'icons', label: 'Icons', Icon: Star, go: 'elements' },
              { id: 'shapes', label: 'Shapes', Icon: Square, go: 'elements' },
              { id: 'draw', label: 'Draw', Icon: PenNib },
              { id: 'backgrounds', label: 'Background', Icon: PaintBucket },
              { id: 'brandkit', label: 'Brand Kit', Icon: Drop },
            ].map(({ id, label, Icon, go }) => {
              const target = go || id;
              return (
                <button
                  key={id}
                  className={`studio-tab ${activeTab === id ? 'active' : ''}`}
                  onClick={() => { if (target !== 'draw') { if (penDraft) commitPen(false); setDrawTool(null); } setActiveTab(target); }}
                  title={label}
                >
                  <Icon size={22} weight="duotone" /><span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="studio-sidebar-foot">
            <button className="studio-tab" title="Help & shortcuts" onClick={() => setRailModal('help')}>
              <Question size={22} weight="duotone" /><span>Help</span>
            </button>
            <button className="studio-tab" title="Settings" onClick={() => setRailModal('settings')}>
              <Gear size={22} weight="duotone" /><span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Left Context Panel */}
        <div className="studio-context-panel" style={{ width: leftW }}>
          <div className="studio-panel-resizer right" onPointerDown={(e) => startPanelResize(e, 'left')} title="Drag to resize" />
          <div className="studio-panel-header">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          </div>
          <div className="studio-panel-content">
            {activeTab === 'templates' && (
              <div className="studio-tpl-panel">
                <div className="studio-tpl-search">
                  <MagnifyingGlass size={16} />
                  <input value={tplQuery} onChange={e => setTplQuery(e.target.value)} placeholder="Search templates..." aria-label="Search templates" />
                </div>
                <div className="studio-tpl-cats">
                  {TEMPLATE_CATEGORIES.map(c => (
                    <button key={c.id} className={`studio-tpl-cat ${tplCat === c.id ? 'active' : ''}`}
                      onClick={() => { setTplCat(c.id); setTplGroup(null); }}>{c.label}</button>
                  ))}
                </div>
                {(() => {
                  const q = tplQuery.trim().toLowerCase();
                  let list = TEMPLATES.filter(t =>
                    (tplCat === 'all' || t.cat === tplCat) &&
                    (!q || t.name.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))
                  );
                  if (tplGroup) list = list.filter(t => t.group === tplGroup);
                  if (list.length === 0) return <div className="studio-empty"><MagicWand size={24} /><p>No templates found.</p></div>;
                  const order = [];
                  const groups = {};
                  for (const t of list) { if (!groups[t.group]) { groups[t.group] = []; order.push(t.group); } groups[t.group].push(t); }
                  if (tplGroup) {
                    return (
                      <>
                        <button className="studio-tpl-back" onClick={() => setTplGroup(null)}><CaretLeft size={14} /> All templates</button>
                        <div className="studio-tpl-grid">
                          {list.map((t, i) => <TemplateThumb key={i} tmpl={t} locked={STUDIO_PREMIUM_GATING && !!t.premium && !isPremium} onClick={() => loadTemplate(t)} />)}
                        </div>
                      </>
                    );
                  }
                  return order.map(g => (
                    <div key={g} className="studio-tpl-section">
                      <div className="studio-tpl-section-head">
                        <span>{g}</span>
                        {groups[g].length > 4 && <button className="studio-tpl-seeall" onClick={() => setTplGroup(g)}>See all</button>}
                      </div>
                      <div className="studio-tpl-grid">
                        {groups[g].slice(0, 4).map((t, i) => <TemplateThumb key={i} tmpl={t} locked={STUDIO_PREMIUM_GATING && !!t.premium && !isPremium} onClick={() => loadTemplate(t)} />)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            
            {activeTab === 'text' && (
              <>
                <button className="btn-primary" onClick={() => addText('heading')} style={{ padding: '12px', fontSize: '15px', borderRadius: '12px', width: '100%', marginBottom: '8px' }}>+ Add a text box</button>
                <div className="studio-text-presets">
                  <button className="studio-text-preset" onClick={() => addText('heading')} style={{ fontSize: 22, fontWeight: 800 }}>Add a heading</button>
                  <button className="studio-text-preset" onClick={() => addText('subheading')} style={{ fontSize: 17, fontWeight: 600 }}>Add a subheading</button>
                  <button className="studio-text-preset" onClick={() => addText('body')} style={{ fontSize: 14, fontWeight: 400 }}>Add body text</button>
                </div>
                <div className="studio-section-title">Font Library</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {FONTS.slice(0, 10).map(f => (
                    <div key={f} onClick={() => {
                      if (sel && sel.type === 'text') updateLayer(sel.id, 'font', f);
                      else addText();
                    }} style={{ padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: f, fontSize: '16px' }}>
                      {f}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'elements' && (
              <div className="studio-el-panel">
                <div className="studio-tpl-search">
                  <MagnifyingGlass size={16} />
                  <input value={elQuery} onChange={e => setElQuery(e.target.value)} placeholder="Search shapes & icons..." aria-label="Search elements" />
                </div>
                <div className="studio-section-title" style={{ margin: '4px 0 2px' }}>Shapes & icons</div>
                {(() => {
                  const q = elQuery.trim().toLowerCase();
                  const list = ELEMENTS.filter(el => !q || el.label.toLowerCase().includes(q) || el.keywords.includes(q));
                  if (list.length === 0) return <div className="studio-empty"><Shapes size={24} /><p>No elements found.</p></div>;
                  return (
                    <div className="studio-el-grid">
                      {list.map(el => {
                        const Ico = ELEMENT_ICONS[el.icon] || Square;
                        return (
                          <button key={el.kind} className="studio-el-tile" onClick={() => addElement(el.kind)} title={`Add ${el.label}`}>
                            <Ico size={30} weight="fill" />
                            <span>{el.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Web icon library (Iconify) — search 200k+ open-source icons */}
                <div className="studio-section-title" style={{ margin: '16px 0 6px' }}>Icons from the web</div>
                <form className="studio-tpl-search" onSubmit={e => { e.preventDefault(); searchIcons(iconQuery); }}>
                  <MagnifyingGlass size={16} />
                  <input value={iconQuery} onChange={e => setIconQuery(e.target.value)} placeholder="Search icons (e.g. camera, heart)…" aria-label="Search web icons" />
                </form>
                {iconBusy && <div className="studio-empty"><p>Searching icons…</p></div>}
                {!iconBusy && iconHits.length > 0 && (
                  <div className="studio-icon-grid">
                    {iconHits.map(name => (
                      <button key={name} className="studio-icon-tile" onClick={() => addIcon(name)} title={`Add ${name}`}>
                        <img src={`https://api.iconify.design/${name.replace(':', '/')}.svg?width=32&height=32`} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
                {!iconBusy && iconQuery && iconHits.length === 0 && (
                  <div className="studio-empty"><Shapes size={22} /><p>No icons found. Try another word.</p></div>
                )}
              </div>
            )}

            {activeTab === 'uploads' && (
              <>
                <button className="btn-primary" onClick={() => fileRef.current.click()} style={{ padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%' }}><Upload size={18} /> Upload Media</button>
                <input type="file" ref={fileRef} hidden accept="image/*" onChange={async e => {
                  const f = e.target.files[0];
                  if (f) { const u = await fileToDataUrl(f); setUploads(prev => [u, ...prev]); loadImage(u); }
                }} />
                {uploads.length > 0 ? (
                  <div className="studio-thumb-grid">
                    {uploads.map((u, i) => (
                      <button key={i} className="studio-thumb" onClick={() => loadImage(u)} title="Add to canvas">
                        <img src={u} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="studio-empty"><Upload size={26} /><p>Images you upload will appear here.</p></div>
                )}
              </>
            )}

            {activeTab === 'images' && (
              <StudioMediaSearch
                type="photo"
                onPick={(src) => { if (sel && sel.type === 'image') replaceSelectedImage(src); else loadImage(src); }}
                placeholder="Search free images…"
                note={sel && sel.type === 'image' ? 'An image is selected — picking a photo will replace it.' : undefined}
              />
            )}

            {activeTab === 'backgrounds' && (
              <>
                <div className="studio-section-title">Solid colors</div>
                <div className="studio-swatch-grid">
                  {['#0f172a','#111827','#ffffff','#f8fafc','#8b5cf6','#ec4899','#38bdf8','#10b981','#f59e0b','#ef4444'].map(c => (
                    <button key={c} className="studio-swatch" style={{ background: c }} title={c}
                      onClick={() => setBgWithHistory({ ...bg, type: 'solid', color: c })} />
                  ))}
                </div>
                <div className="studio-section-title">Gradients</div>
                <div className="studio-grad-grid">
                  {[['#8b5cf6','#ec4899'],['#0ea5e9','#22d3ee'],['#f59e0b','#ef4444'],['#10b981','#84cc16'],['#6d28d9','#0f172a'],['#f472b6','#fb923c']].map(([c1,c2]) => (
                    <button key={c1+c2} className="studio-grad" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                      onClick={() => setBgWithHistory({ type: 'gradient', color: c1, color2: c2, angle: 135 })} />
                  ))}
                </div>
                <p className="studio-hint" style={{ marginTop: 12 }}>Fine-tune colors in the Canvas tab on the right.</p>
              </>
            )}

            {activeTab === 'brandkit' && (
              <>
                <div className="studio-section-title">Brand colors</div>
                <div className="studio-swatch-grid">
                  {brandColors.map(c => (
                    <button key={c} className="studio-swatch brand" style={{ background: c }} title={`Apply ${c}`} onClick={() => applyBrand(c)}>
                      <span className="studio-swatch-x" onClick={(e) => { e.stopPropagation(); removeBrandColor(c); }} title="Remove">×</span>
                    </button>
                  ))}
                </div>
                <div className="studio-brand-add">
                  <input type="color" value={brandPick} onChange={e => setBrandPick(e.target.value)} aria-label="Pick a brand color" />
                  <button className="btn-outline" onClick={addBrandColor}>Add color</button>
                </div>
                <p className="studio-hint">Click a color to apply it to the selected layer — or to the background if nothing is selected.</p>
                <div className="studio-section-title" style={{ marginTop: 18 }}>Brand logo</div>
                <button className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }} onClick={() => startFileRef.current?.click()}><Upload size={18} /> Add your logo</button>
                <p className="studio-hint" style={{ marginTop: 10 }}>Drops your logo onto the canvas so you can place it on any design.</p>
              </>
            )}

            {activeTab === 'draw' && (
              <>
                <div className="studio-section-title">Tools</div>
                <div className="studio-draw-tools">
                  {[
                    { id: 'pen', label: 'Pen', Icon: PenNib },
                    { id: 'brush', label: 'Brush', Icon: PaintBrush },
                    { id: 'pencil', label: 'Pencil', Icon: PencilSimple },
                    { id: 'eraser', label: 'Eraser', Icon: Eraser },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      className={`studio-draw-tool ${drawTool === id ? 'active' : ''}`}
                      onClick={() => (drawTool === id ? setDrawTool(null) : pickDrawTool(id))}
                      title={label}
                    >
                      <Icon size={22} weight="duotone" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {drawTool ? (
                  <>
                    {drawTool !== 'eraser' && (
                      <>
                        <div className="studio-section-title" style={{ marginTop: 18 }}>Color</div>
                        <div className="studio-draw-color">
                          <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} aria-label="Brush color" />
                          <div className="studio-draw-swatches">
                            {['#111827', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'].map((c) => (
                              <button key={c} className={`studio-draw-swatch ${drawColor.toLowerCase() === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setDrawColor(c)} title={c} aria-label={`Brush color ${c}`} aria-pressed={drawColor.toLowerCase() === c} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="studio-section-title" style={{ marginTop: 18 }}>{drawTool === 'pen' ? 'Stroke' : 'Size'} — {drawSize}px</div>
                    <input className="studio-draw-size" type="range" min="1" max="80" value={drawSize} onChange={(e) => setDrawSize(Number(e.target.value))} aria-label="Brush size" />
                    <div className="studio-draw-preview" aria-hidden="true">
                      <span style={{ width: drawSize, height: drawSize, background: drawTool === 'eraser' ? 'repeating-conic-gradient(#bbb 0% 25%, #eee 0% 50%) 50% / 10px 10px' : drawColor }} />
                    </div>

                    {(drawTool === 'pencil' || drawTool === 'brush') && (
                      <>
                        <div className="studio-section-title" style={{ marginTop: 18 }}>Smoothing — {Math.round(drawSmooth * 100)}%</div>
                        <input className="studio-draw-size" type="range" min="0" max="1" step="0.05" value={drawSmooth} onChange={(e) => setDrawSmooth(Number(e.target.value))} aria-label="Smoothing" />
                      </>
                    )}

                    <p className="studio-hint" style={{ marginTop: 14 }}>
                      {drawTool === 'eraser'
                        ? 'Drag on the canvas to erase. Each erase is its own layer you can undo or delete.'
                        : drawTool === 'pen'
                        ? 'Click to add points; click-drag to curve. Click the first point to close, or press Enter / Esc to finish. Creates an editable vector path.'
                        : 'Drag to draw freehand — shaky lines are auto-smoothed. Each stroke becomes a layer you can move, restyle, or delete.'}
                    </p>
                    <p className="studio-hint" style={{ marginTop: 8, opacity: 0.75 }}>Shortcuts: P pen · B brush · Shift+P pencil · E eraser · V exit</p>
                  </>
                ) : (
                  <p className="studio-hint" style={{ marginTop: 14 }}>Pick a tool above, then draw on the canvas. Shortcuts: P pen · B brush · Shift+P pencil · E eraser · V to exit.</p>
                )}
              </>
            )}

          </div>
        </div>

        {/* Canvas Area */}
        <div ref={canvasAreaRef} className={`studio-canvas-area ${showGrid ? 'grid-on' : ''} ${spaceDown || toolMode === 'hand' ? 'panning' : ''} ${showRulers ? 'has-rulers' : ''} ${dropActive ? 'drop-active' : ''}`} onPointerDown={onAreaPointerDown} onPointerMove={onAreaPointerMove} onPointerLeave={onAreaPointerLeave} onContextMenu={onContextMenu} onDragOver={onCanvasDragOver} onDragLeave={onCanvasDragLeave} onDrop={onCanvasDrop}>
          {showRulers && <>
            <ViewportRuler orientation="h" pan={pan.x} scale={fitScale * zoom} size={viewport.w} onPointerDown={(e) => startGuideFromRuler(e, 'h')} />
            <ViewportRuler orientation="v" pan={pan.y} scale={fitScale * zoom} size={viewport.h} onPointerDown={(e) => startGuideFromRuler(e, 'v')} />
            <span className="studio-vruler-corner" />
          </>}

          {/* Brush-size cursor ring (freehand tools) */}
          {brushRing && (
            <div className="studio-brush-ring" style={{ left: brushRing.x, top: brushRing.y, width: brushRing.d, height: brushRing.d, borderColor: drawTool === 'eraser' ? '#ef4444' : drawColor }} />
          )}

          {/* AI prompt bar (Cursor-style) — floats above the dock */}
          {aiOpen && (
            <div className="studio-ai-bar" onPointerDown={(e) => e.stopPropagation()}>
              <div className="studio-ai-row">
                <span className="studio-ai-spark" aria-hidden="true"><Sparkle size={17} weight="fill" /></span>
                <input
                  className="studio-ai-input"
                  autoFocus
                  value={aiPrompt}
                  onChange={(e) => { setAiPrompt(e.target.value); if (aiStatus) setAiStatus(''); }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') generateAiBackground(); if (e.key === 'Escape') setAiOpen(false); }}
                  placeholder="Describe a background to generate…"
                  aria-label="AI prompt"
                />
                <button className="studio-ai-send" onClick={generateAiBackground} disabled={aiStatus === 'Generating…'} aria-label="Generate">
                  {aiStatus === 'Generating…' ? <span className="studio-ai-spin" /> : <ArrowUp size={17} weight="bold" />}
                </button>
                <button className="studio-ai-close" onClick={() => setAiOpen(false)} aria-label="Close AI"><XIcon size={15} /></button>
              </div>
              <div className="studio-ai-chips">
                {[
                  { id: 'generate', label: 'Generate background', Icon: MagicWand, live: true },
                  { id: 'remove', label: 'Remove background', Icon: Eraser, live: true },
                  { id: 'blur', label: 'Blur background', Icon: Drop, live: true },
                  { id: 'expand', label: 'Expand image', Icon: ArrowsOut, live: false },
                  { id: 'eraser', label: 'Magic eraser', Icon: PaintBrush, live: false },
                  { id: 'upscale', label: 'Upscale', Icon: ArrowsOutCardinal, live: false },
                ].map(({ id, label, Icon, live }) => (
                  <button key={id} className={`studio-ai-chip ${live ? '' : 'soon'}`} onClick={() => runAiAction(id)}>
                    <Icon size={14} weight="duotone" /> {label}{live ? '' : <span className="studio-ai-soon">Soon</span>}
                  </button>
                ))}
              </div>
              {aiStatus && <div className="studio-ai-status">{aiStatus}</div>}
            </div>
          )}

          {/* Vector edit-mode contextual toolbar (appears above the main dock) */}
          {vecEditLayer && (
            <div className="studio-draw-dock studio-vec-dock" onPointerDown={(e) => e.stopPropagation()}>
              {[
                { id: 'move', Icon: Cursor, label: 'Move' },
                { id: 'add', Icon: Plus, label: 'Add point' },
                { id: 'bend', Icon: PenNib, label: 'Bend' },
                { id: 'delete', Icon: Minus, label: 'Delete point' },
              ].map(({ id, Icon, label }) => (
                <button key={id} className={vecTool === id ? 'active' : ''} title={label} onClick={() => setVecTool(id)}>
                  <Icon size={17} weight="duotone" /><span className="studio-vec-dock-lbl">{label}</span>
                </button>
              ))}
              <span className="studio-draw-dock-sep" />
              <button title="Done editing" onClick={exitVecEdit}><CheckCircle size={17} weight="duotone" /><span className="studio-vec-dock-lbl">Done</span></button>
            </div>
          )}

          {/* Figma-style persistent bottom toolbar */}
          <div className="studio-draw-dock" role="toolbar" aria-label="Editor tools" onPointerDown={(e) => e.stopPropagation()}>
            {/* Move / Hand / Scale group with dropdown */}
            <div className="studio-dock-group">
              <button
                className={!drawTool ? 'active' : ''}
                aria-pressed={!drawTool}
                aria-label={toolMode === 'hand' ? 'Hand tool' : toolMode === 'scale' ? 'Scale tool' : 'Move tool'}
                title={toolMode === 'hand' ? 'Hand tool (H)' : toolMode === 'scale' ? 'Scale (K)' : 'Move (V)'}
                onClick={() => { if (penDraft) commitPen(false); setDrawTool(null); setMoveMenuOpen(false); }}
              >
                {toolMode === 'hand' ? <Hand size={18} weight="duotone" /> : toolMode === 'scale' ? <ArrowsOutCardinal size={18} weight="duotone" /> : <Cursor size={18} weight="duotone" />}
              </button>
              <button className="studio-dock-caret" aria-label="Choose selection tool" aria-expanded={moveMenuOpen} title="Choose tool" onClick={() => setMoveMenuOpen(o => !o)}>
                <CaretDown size={11} weight="bold" />
              </button>
              {moveMenuOpen && (
                <div className="studio-dock-menu" role="menu">
                  {[
                    { m: 'move', Icon: Cursor, label: 'Move', k: 'V' },
                    { m: 'hand', Icon: Hand, label: 'Hand tool', k: 'H' },
                    { m: 'scale', Icon: ArrowsOutCardinal, label: 'Scale', k: 'K' },
                  ].map(({ m, Icon, label, k }) => (
                    <button key={m} role="menuitemradio" aria-checked={!drawTool && toolMode === m} className={!drawTool && toolMode === m ? 'active' : ''} onClick={() => pickMoveTool(m)}>
                      <span className="studio-dock-menu-check">{!drawTool && toolMode === m ? <Check size={13} weight="bold" /> : null}</span>
                      <Icon size={16} weight="duotone" />
                      <span className="studio-dock-menu-label">{label}</span>
                      <span className="studio-dock-menu-key">{k}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="studio-draw-dock-sep" />

            {/* Drawing tools */}
            {[
              { id: 'pen', Icon: PenNib, k: 'P' },
              { id: 'brush', Icon: PaintBrush, k: 'B' },
              { id: 'pencil', Icon: PencilSimple, k: '⇧P' },
              { id: 'eraser', Icon: Eraser, k: 'E' },
            ].map(({ id, Icon, k }) => {
              const name = id[0].toUpperCase() + id.slice(1);
              return (
                <button key={id} className={drawTool === id ? 'active' : ''} aria-pressed={drawTool === id} aria-label={name} title={`${name} (${k})`}
                  onClick={() => { setActiveTab('draw'); (drawTool === id ? setDrawTool(null) : pickDrawTool(id)); }}>
                  <Icon size={18} weight="duotone" />
                </button>
              );
            })}

            <span className="studio-draw-dock-sep" />

            {/* Quick insert — just the essentials (the rest live in the left rail) */}
            <button aria-label="Add text" title="Add text" onClick={() => { setDrawTool(null); setToolMode('move'); addText('heading'); }}><TextT size={18} weight="duotone" /></button>
            <button aria-label="Add shape" title="Shapes &amp; elements" onClick={() => { setDrawTool(null); setToolMode('move'); setActiveTab('elements'); }}><Square size={18} weight="duotone" /></button>

            <span className="studio-draw-dock-sep" />

            {/* Magic AI — trailing accent */}
            <button className={`studio-dock-ai ${aiOpen ? 'active' : ''}`} aria-label="Magic AI" aria-pressed={aiOpen} title="Magic AI" onClick={() => setAiOpen(o => !o)}><Sparkle size={18} weight="fill" /> <span className="studio-dock-ai-lbl">AI</span></button>
          </div>

          {/* Guides (dragged from the rulers) — full-viewport lines, double-click to remove */}
          {rulerGuides.map((g, i) => (
            <div
              key={`rg${i}`}
              className={`studio-rguide ${g.axis === 'x' ? 'v' : 'h'}`}
              style={g.axis === 'x' ? { left: pan.x + g.pos * fitScale * zoom } : { top: pan.y + g.pos * fitScale * zoom }}
              onDoubleClick={(e) => { e.stopPropagation(); setRulerGuides(gs => gs.filter((_, j) => j !== i)); }}
              title={`Guide ${g.pos}px · double-click to remove`}
            />
          ))}
          {guideDrag && (
            <div
              className={`studio-rguide preview ${guideDrag.axis === 'x' ? 'v' : 'h'}`}
              style={guideDrag.axis === 'x' ? { left: pan.x + guideDrag.pos * fitScale * zoom } : { top: pan.y + guideDrag.pos * fitScale * zoom }}
            />
          )}
          {/* Contextual text toolbar — shown when a text layer is selected */}
          {sel && sel.type === 'text' && (
            <div className="studio-text-toolbar" onPointerDown={e => e.stopPropagation()}>
              <select className="stt-font" value={sel.font || 'Inter'} onChange={e => updateLayer(sel.id, 'font', e.target.value)} title="Font" style={{ fontFamily: `"${sel.font || 'Inter'}"` }}>
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: `"${f}"` }}>{f}</option>)}
              </select>
              <div className="stt-size">
                <input type="number" min="4" max="800" value={sel.size} onChange={e => updateLayer(sel.id, 'size', +e.target.value)} title="Font size" />
              </div>
              <label className="stt-color" title="Text color">
                <input type="color" value={sel.color} onChange={e => updateLayer(sel.id, 'color', e.target.value)} />
              </label>
              <span className="stt-sep" />
              <button className={`stt-btn ${(sel.weight || 400) >= 700 ? 'active' : ''}`} title="Bold" onClick={() => updateLayer(sel.id, 'weight', (sel.weight || 400) >= 700 ? 400 : 700)}><TextB size={16} weight="bold" /></button>
              <button className={`stt-btn ${sel.italic ? 'active' : ''}`} title="Italic" onClick={() => updateLayer(sel.id, 'italic', !sel.italic)}><TextItalic size={16} /></button>
              <button className={`stt-btn ${sel.underline ? 'active' : ''}`} title="Underline" onClick={() => updateLayer(sel.id, 'underline', !sel.underline)}><TextUnderline size={16} /></button>
              <span className="stt-sep" />
              <button className={`stt-btn ${(sel.align || 'left') === 'left' ? 'active' : ''}`} title="Align left" onClick={() => updateLayer(sel.id, 'align', 'left')}><TextAlignLeft size={16} /></button>
              <button className={`stt-btn ${sel.align === 'center' ? 'active' : ''}`} title="Align center" onClick={() => updateLayer(sel.id, 'align', 'center')}><TextAlignCenter size={16} /></button>
              <button className={`stt-btn ${sel.align === 'right' ? 'active' : ''}`} title="Align right" onClick={() => updateLayer(sel.id, 'align', 'right')}><TextAlignRight size={16} /></button>
              <span className="stt-sep" />
              <div className="stt-more-wrap">
                <button className={`stt-more ${txtMore ? 'active' : ''}`} onClick={() => setTxtMore(v => !v)} title="More options">More <CaretDown size={12} /></button>
                {txtMore && (
                  <div className="stt-more-pop" onPointerDown={e => e.stopPropagation()}>
                    <label className="stt-pop-row">
                      <span>Letter spacing</span>
                      <input type="range" min="-10" max="40" value={sel.spacing || 0} onChange={e => updateLayer(sel.id, 'spacing', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} />
                    </label>
                    <label className="stt-pop-row">
                      <span>Weight</span>
                      <select value={sel.weight || 400} onChange={e => updateLayer(sel.id, 'weight', +e.target.value)}>
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">SemiBold</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="studio-canvas-stage" style={{ width: dims.w * fitScale * zoom, height: dims.h * fitScale * zoom, left: pan.x, top: pan.y }}>
          <div className={`studio-canvas-container ${bg.type === 'transparent' ? 'is-transparent' : ''}`} style={{ width: dims.w, height: dims.h, transform: `scale(${fitScale * zoom})`, transformOrigin: 'top left' }}>
            <canvas
              ref={canvasRef}
              width={Math.round(dims.w * viewSS)}
              height={Math.round(dims.h * viewSS)}
              aria-label={`Design canvas, ${dims.w} by ${dims.h} pixels, ${layers.length} layer${layers.length === 1 ? '' : 's'}`}
              style={{ width: '100%', height: '100%', display: 'block', imageRendering: (fitScale * zoom) > viewSS * 2.5 ? 'pixelated' : 'auto' }}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasHover}
              onDoubleClick={onCanvasDoubleClick}
            />
            {showGrid && <div className="studio-canvas-grid" />}

            {/* Live alignment guides while dragging */}
            {guides.map((g, i) => (
              <div
                key={i}
                className={`studio-guide ${g.type}`}
                style={g.type === 'v' ? { left: g.pos } : { top: g.pos }}
              />
            ))}


            {/* Crop overlay (whole canvas / artboard) */}
            {canvasCrop && (
              <div
                className="studio-crop-rect studio-canvascrop-rect"
                style={{ left: canvasCrop.x, top: canvasCrop.y, width: canvasCrop.w, height: canvasCrop.h, '--sel-scale': 1 / (fitScale * zoom) }}
                data-crop="move"
                onPointerDown={canvasCropPointerDown}
              >
                <span className="studio-crop-h tl" data-crop="tl" onPointerDown={canvasCropPointerDown} />
                <span className="studio-crop-h tr" data-crop="tr" onPointerDown={canvasCropPointerDown} />
                <span className="studio-crop-h bl" data-crop="bl" onPointerDown={canvasCropPointerDown} />
                <span className="studio-crop-h br" data-crop="br" onPointerDown={canvasCropPointerDown} />
                <span className="studio-canvascrop-dim" style={{ transform: `scale(${1 / (fitScale * zoom)})` }}>{Math.round(canvasCrop.w)} × {Math.round(canvasCrop.h)}</span>
              </div>
            )}

            {/* Crop overlay (image layers) */}
            {crop && (
              <div
                className="studio-crop-rect"
                style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, '--sel-scale': 1 / (fitScale * zoom) }}
                data-crop="move"
                onPointerDown={cropPointerDown}
              >
                <span className="studio-crop-h tl" data-crop="tl" onPointerDown={cropPointerDown} />
                <span className="studio-crop-h tr" data-crop="tr" onPointerDown={cropPointerDown} />
                <span className="studio-crop-h bl" data-crop="bl" onPointerDown={cropPointerDown} />
                <span className="studio-crop-h br" data-crop="br" onPointerDown={cropPointerDown} />
              </div>
            )}

            {/* Vector point-edit overlay — anchors + bezier handles */}
            {vecEditLayer && (
              <svg className="studio-vec-overlay" width={dims.w} height={dims.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                {(() => {
                  const L = vecEditLayer;
                  const s = 1 / (fitScale * zoom);
                  const A = (a) => ({ x: L.x + a.x, y: L.y + a.y });
                  return (
                    <>
                      {/* Handle lines + dots for the selected anchor */}
                      {L.anchors.map((a, i) => {
                        if (vecSel !== i || (!a.hx && !a.hy)) return null;
                        const c = A(a);
                        return (
                          <g key={`h${i}`}>
                            <line x1={c.x - a.hx} y1={c.y - a.hy} x2={c.x + a.hx} y2={c.y + a.hy} stroke="#8b5cf6" strokeWidth={1 * s} />
                            <circle cx={c.x + a.hx} cy={c.y + a.hy} r={4 * s} fill="#8b5cf6" style={{ pointerEvents: 'auto', cursor: 'grab' }} onPointerDown={(e) => startHandleDrag(e, i, 1)} />
                            <circle cx={c.x - a.hx} cy={c.y - a.hy} r={4 * s} fill="#8b5cf6" style={{ pointerEvents: 'auto', cursor: 'grab' }} onPointerDown={(e) => startHandleDrag(e, i, -1)} />
                          </g>
                        );
                      })}
                      {/* Anchor squares */}
                      {L.anchors.map((a, i) => {
                        const c = A(a);
                        const sz = 8 * s;
                        return (
                          <rect key={`a${i}`} x={c.x - sz / 2} y={c.y - sz / 2} width={sz} height={sz} rx={1.5 * s}
                            fill={vecSel === i ? '#8b5cf6' : '#ffffff'} stroke="#8b5cf6" strokeWidth={1.5 * s}
                            style={{ pointerEvents: 'auto', cursor: vecTool === 'delete' ? 'not-allowed' : 'move' }}
                            onPointerDown={(e) => startAnchorDrag(e, i)} />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            )}

            {/* Selection Box overlay — wraps the selected layer exactly */}
            {!crop && !vecEdit && sel && !sel.hidden && selBox && (
              <div
                className={`studio-sel-box ${sel.locked ? 'locked' : ''}`}
                style={{ left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h, transform: `rotate(${sel.rotate || 0}deg)`, transformOrigin: 'center', '--sel-scale': 1 / (fitScale * zoom) }}
                onPointerDown={onPointerDown}
                onDoubleClick={onSelDoubleClick}
              >
                <span className="studio-sel-label">{sel.locked ? '🔒 ' : ''}{sel.type}{sel.rotate ? ` · ${Math.round(sel.rotate)}°` : ''}</span>
                {!sel.locked && <>
                  {/* Corner rotate zones sit just outside each corner (Figma-style) */}
                  <span className="studio-sel-rotzone tl rotate-handle" data-handle="rotate" title="Drag to rotate (Shift = 15°)" />
                  <span className="studio-sel-rotzone tr rotate-handle" data-handle="rotate" title="Drag to rotate (Shift = 15°)" />
                  <span className="studio-sel-rotzone bl rotate-handle" data-handle="rotate" title="Drag to rotate (Shift = 15°)" />
                  <span className="studio-sel-rotzone br rotate-handle" data-handle="rotate" title="Drag to rotate (Shift = 15°)" />
                  <span className="studio-sel-handle resize-handle tl" data-handle="tl" />
                  <span className="studio-sel-handle resize-handle tr" data-handle="tr" />
                  <span className="studio-sel-handle resize-handle bl" data-handle="bl" />
                  <span className="studio-sel-handle resize-handle br" data-handle="br" />
                  {/* Edge handles — resize width or height from any side */}
                  <span className="studio-sel-edge resize-handle e-t" data-handle="t" />
                  <span className="studio-sel-edge resize-handle e-b" data-handle="b" />
                  <span className="studio-sel-edge resize-handle e-l" data-handle="l" />
                  <span className="studio-sel-edge resize-handle e-r" data-handle="r" />
                  <span className="studio-sel-rotate rotate-handle" data-handle="rotate" title="Drag to rotate (hold Shift for 15°)" />
                </>}
              </div>
            )}

            {/* Group selection box (2+ layers) — drag to move them together */}
            {groupBox && (
              <div
                className="studio-group-box"
                style={{ left: groupBox.x, top: groupBox.y, width: groupBox.w, height: groupBox.h, '--sel-scale': 1 / (fitScale * zoom) }}
                onPointerDown={(e) => { e.stopPropagation(); beginMove(e, selectedIds); }}
              >
                <span className="studio-sel-label">{selectedIds.length} selected</span>
              </div>
            )}

            {/* Rubber-band marquee */}
            {marquee && (
              <div className="studio-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
            )}

            {/* Floating context toolbar — hovers above the selected element */}
            {!crop && !vecEdit && sel && !sel.hidden && selBox && !editingLayer && (
              <div
                className="studio-ctx-toolbar"
                style={{ left: selBox.x + selBox.w / 2, top: selBox.y, '--sel-scale': 1 / (fitScale * zoom) }}
                onPointerDown={e => e.stopPropagation()}
              >
                <button className="ctx-btn" title={sel.type === 'text' ? 'Edit text' : 'Edit properties'} onClick={() => { if (sel.type === 'text') { setEditingId(sel.id); } setRightTab('design'); }}><PencilSimple size={15} /></button>
                <button className="ctx-btn" title="Duplicate" onClick={() => { const dup = { ...sel, id: uid(), x: sel.x + 24, y: sel.y + 24 }; setLayersWithHistory([...layers, dup]); setSelectedId(dup.id); }}><Copy size={15} /></button>
                <button className="ctx-btn" title={sel.locked ? 'Unlock' : 'Lock'} onClick={() => updateLayer(sel.id, 'locked', !sel.locked)}>{sel.locked ? <LockOpen size={15} /> : <Lock size={15} />}</button>
                <button className="ctx-btn danger" title="Delete" onClick={() => { setLayersWithHistory(layers.filter(l => l.id !== sel.id)); setSelectedId(null); }}><Trash size={15} /></button>
                <span className="ctx-sep" />
                <button className="ctx-btn" title="Bring to front" onClick={() => setLayersWithHistory([...layers.filter(l => l.id !== sel.id), sel])}><ArrowLineUp size={15} /></button>
              </div>
            )}

            {/* Inline text editor — double-click a text layer to edit on canvas */}
            {editingLayer && editBox && (
              <textarea
                className="studio-inline-edit"
                autoFocus
                value={editingLayer.text}
                onChange={(e) => updateLayer(editingId, 'text', e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') { e.preventDefault(); commitEdit(); }
                }}
                style={{
                  left: editBox.x,
                  // Anchor to the text's em-top (l.y) so the editing overlay lines up
                  // with the rendered glyphs; the selection box uses the ink-top.
                  top: editingLayer.y,
                  width: Math.max(editBox.w, 40),
                  height: Math.max(editBox.h, editingLayer.size || 16),
                  fontSize: editingLayer.size,
                  fontFamily: `"${editingLayer.font || 'Inter'}"`,
                  fontWeight: editingLayer.weight || 400,
                  letterSpacing: `${editingLayer.spacing || 0}px`,
                  color: editingLayer.color,
                  textAlign: editingLayer.align || 'left',
                  fontStyle: editingLayer.italic ? 'italic' : 'normal',
                  textDecoration: editingLayer.underline ? 'underline' : 'none',
                  textTransform: editingLayer.textCase === 'upper' ? 'uppercase' : editingLayer.textCase === 'lower' ? 'lowercase' : 'none',
                  lineHeight: editingLayer.lineHeight || 1.2,
                }}
              />
            )}
          </div>
          </div>

          {/* AI background busy overlay */}
          {bgBusy && (
            <div className="studio-bg-busy">
              <div className="spinner" />
              <p>{bgBusy}</p>
              <span>First run downloads a small AI model (~5MB)</span>
            </div>
          )}

          {/* Crop apply/cancel bar */}
          {crop && (
            <div className="studio-crop-bar glass-panel">
              <span className="studio-crop-hint"><Crop size={15} /> Drag to crop</span>
              <button className="btn-outline" onClick={() => setCrop(null)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13 }}>Cancel</button>
              <button className="btn-primary" onClick={applyCrop} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13 }}>Apply</button>
            </div>
          )}

          {/* Canvas crop apply/cancel bar */}
          {canvasCrop && (
            <div className="studio-crop-bar glass-panel">
              <span className="studio-crop-hint"><Crop size={15} /> Drag to resize the canvas</span>
              <button className="btn-outline" onClick={() => setCanvasCrop(null)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13 }}>Cancel</button>
              <button className="btn-primary" onClick={applyCanvasCrop} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13 }}>Apply crop</button>
            </div>
          )}

        </div>

        {/* Right Settings Panel */}
        <div className="studio-right-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: rightW, borderLeft: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="studio-panel-resizer left" onPointerDown={(e) => startPanelResize(e, 'right')} title="Drag to resize" />
          {/* Design / Layers / Properties tabs */}
          <div className="studio-rtabs">
            <button className={`studio-rtab ${rightTab === 'bg' ? 'active' : ''}`} onClick={() => setRightTab('bg')}>Design</button>
            <button className={`studio-rtab ${rightTab === 'layers' ? 'active' : ''}`} onClick={() => setRightTab('layers')}>Layers</button>
            <button className={`studio-rtab ${rightTab === 'design' ? 'active' : ''}`} onClick={() => setRightTab('design')}>Properties</button>
          </div>
          
          {/* Top section: Properties/Background settings */}
          <div className="studio-panel-content" style={{ flex: '1', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rightTab === 'bg' && (
              <>
                <div className="studio-section-title" style={{ margin: '0 0 8px' }}>Background Type</div>
                <div className="studio-bg-types" style={{ marginBottom: '16px' }}>
                  <button onClick={() => setBgWithHistory({ ...bg, type: 'solid' })} className="btn-outline" style={{ borderColor: bg.type === 'solid' ? 'var(--primary)' : 'var(--border)', color: bg.type === 'solid' ? 'var(--primary)' : 'var(--text-color)', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>Solid</button>
                  <button onClick={() => setBgWithHistory({ ...bg, type: 'gradient', stops: bgStops(bg) })} className="btn-outline" style={{ borderColor: bg.type === 'gradient' ? 'var(--primary)' : 'var(--border)', color: bg.type === 'gradient' ? 'var(--primary)' : 'var(--text-color)', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>Gradient</button>
                  <button onClick={() => setBgWithHistory({ ...bg, type: 'transparent' })} className="btn-outline" style={{ borderColor: bg.type === 'transparent' ? 'var(--primary)' : 'var(--border)', color: bg.type === 'transparent' ? 'var(--primary)' : 'var(--text-color)', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>Transparent</button>
                </div>

                {bg.type === 'solid' && (
                  <div className="studio-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Color</span>
                    <ColorField value={bg.color} onChange={(v) => setBg({ ...bg, color: v })} onCommit={() => saveHistory(layers, bg)} title="Background color" />
                  </div>
                )}

                {bg.type === 'transparent' && (
                  <p className="studio-hint">Transparent background — exports as a PNG with a see-through background. The checkerboard just marks the empty area; it won't appear in your export.</p>
                )}

                {bg.type === 'gradient' && (() => {
                  const stops = bgStops(bg);
                  const commit = (next) => setBgWithHistory({ ...bg, type: 'gradient', stops: next });
                  const setStop = (i, patch) => commit(stops.map((s, idx) => idx === i ? { ...s, ...patch } : s));
                  const addStop = () => {
                    // Insert at the widest gap, blending the two neighbours' colours.
                    let gi = 0, best = -1;
                    for (let k = 0; k < stops.length - 1; k++) { const d = stops[k + 1].pos - stops[k].pos; if (d > best) { best = d; gi = k; } }
                    const pos = (stops[gi].pos + stops[gi + 1].pos) / 2;
                    commit([...stops, { color: stops[gi].color, pos }]);
                  };
                  const removeStop = (i) => { if (stops.length > 2) commit(stops.filter((_, idx) => idx !== i)); };
                  return (
                    <>
                      <div className="studio-label" style={{ marginBottom: 6 }}>
                        <span>Gradient preview</span>
                        <div style={{ height: 22, borderRadius: 6, border: '1px solid var(--border)', background: `linear-gradient(90deg, ${stops.map(s => `${s.color} ${Math.round(s.pos * 100)}%`).join(', ')})` }} />
                      </div>
                      <div className="studio-section-title" style={{ margin: '10px 0 6px' }}>Color points</div>
                      {stops.map((s, i) => (
                        <div key={i} className="studio-grad-stop">
                          <ColorField value={s.color} onChange={(v) => setStop(i, { color: v })} onCommit={() => saveHistory(layers, bg)} title="Stop color" />
                          <input type="range" min="0" max="100" value={Math.round(s.pos * 100)} onChange={e => setStop(i, { pos: +e.target.value / 100 })} onMouseUp={() => saveHistory(layers, bg)} style={{ flex: 1 }} title="Position" />
                          <span className="studio-grad-pos">{Math.round(s.pos * 100)}%</span>
                          <button className="studio-grad-del" onClick={() => removeStop(i)} disabled={stops.length <= 2} title={stops.length <= 2 ? 'Keep at least 2 colors' : 'Remove color'}>×</button>
                        </div>
                      ))}
                      <button className="btn-outline w-100" onClick={addStop} style={{ padding: '8px', borderRadius: 8, fontSize: 12.5, marginTop: 4 }}>+ Add color point</button>
                      <div className="studio-label" style={{ marginTop: 12 }}>
                        <span>Angle ({bg.angle || 135}°)</span>
                        <input type="range" min="0" max="360" value={bg.angle || 135} onChange={e => setBg({ ...bg, angle: +e.target.value })} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {rightTab === 'design' && sel && (
              <>
                <div className="insp-head">
                  <span className="insp-title">{sel.type === 'shape' ? sel.shape : sel.type}</span>
                  <div className="insp-head-actions">
                    <button className={`insp-icon-btn ${sel.locked ? 'active' : ''}`} onClick={() => updateLayer(sel.id, 'locked', !sel.locked)} title={sel.locked ? 'Unlock' : 'Lock'}>{sel.locked ? <LockOpen size={15} /> : <Lock size={15} />}</button>
                    <button className={`insp-icon-btn ${sel.hidden ? 'active' : ''}`} onClick={() => updateLayer(sel.id, 'hidden', !sel.hidden)} title={sel.hidden ? 'Show' : 'Hide'}>{sel.hidden ? <EyeSlash size={15} /> : <Eye size={15} />}</button>
                    <button className="insp-icon-btn danger" onClick={() => { setLayersWithHistory(layers.filter(l => l.id !== sel.id)); setSelectedId(null); }} title="Delete"><Trash size={15} /></button>
                  </div>
                </div>

                <div className="insp-align">
                  <button onClick={() => alignSel('left')} title="Align left"><AlignLeft size={15} /></button>
                  <button onClick={() => alignSel('hcenter')} title="Align horizontal center"><AlignCenterHorizontal size={15} /></button>
                  <button onClick={() => alignSel('right')} title="Align right"><AlignRight size={15} /></button>
                  <span className="insp-align-sep" />
                  <button onClick={() => alignSel('top')} title="Align top"><AlignTop size={15} /></button>
                  <button onClick={() => alignSel('vcenter')} title="Align vertical center"><AlignCenterVertical size={15} /></button>
                  <button onClick={() => alignSel('bottom')} title="Align bottom"><AlignBottom size={15} /></button>
                </div>

                <div className="insp-grid">
                  <label className="insp-field"><span>X</span><input type="number" value={Math.round(sel.x)} onChange={e => updateLayer(sel.id, 'x', +e.target.value)} /></label>
                  <label className="insp-field"><span>Y</span><input type="number" value={Math.round(sel.y)} onChange={e => updateLayer(sel.id, 'y', +e.target.value)} /></label>
                  {typeof sel.w === 'number' && <label className="insp-field"><span>W</span><input type="number" value={Math.round(sel.w)} onChange={e => setSize(sel, 'w', +e.target.value)} /></label>}
                  {typeof sel.h === 'number' && <label className="insp-field"><span>H</span><input type="number" value={Math.round(sel.h)} onChange={e => setSize(sel, 'h', +e.target.value)} /></label>}
                  {typeof sel.w === 'number' && typeof sel.h === 'number' && (
                    <button type="button" className={`insp-lock ${aspectLock ? 'active' : ''}`} onClick={() => setAspectLock(v => !v)} title={aspectLock ? 'Aspect ratio locked' : 'Lock aspect ratio'}>
                      {aspectLock ? <LinkSimple size={15} /> : <LinkBreak size={15} />}
                    </button>
                  )}
                  <label className="insp-field"><span>Angle</span><input type="number" value={Math.round(sel.rotate || 0)} onChange={e => updateLayer(sel.id, 'rotate', ((+e.target.value % 360) + 360) % 360)} /></label>
                  <label className="insp-field"><span>Opacity</span><input type="number" min="0" max="100" value={Math.round((sel.opacity ?? 1) * 100)} onChange={e => updateLayer(sel.id, 'opacity', Math.min(1, Math.max(0, +e.target.value / 100)))} /></label>
                  {['rect', 'shape', 'image'].includes(sel.type) && (
                    <label className="insp-field"><span>Radius</span><input type="number" min="0" max="500" value={Math.round(layerRadius(sel))} onChange={e => setLayerRadius(sel, +e.target.value)} /></label>
                  )}
                  <label className="insp-field" style={{ gridColumn: '1 / -1' }}>
                    <span>Blend</span>
                    <select value={sel.blend || 'normal'} onChange={e => updateLayer(sel.id, 'blend', e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontSize: '13px' }}>
                      {BLEND_MODES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                  </label>
                </div>

                {sel.iconName && (
                  <div className="studio-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span>Icon color</span>
                    <input type="color" value={sel.iconColor || '#111111'} onChange={(e) => recolorIcon(e.target.value)} style={{ width: 44, height: 32, padding: 2, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-color)', cursor: 'pointer' }} />
                  </div>
                )}

                {sel.type === 'text' && (
                  <>
                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Typography</div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Text Content</span>
                      <textarea value={sel.text} onChange={e => updateLayer(sel.id, 'text', e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px', minHeight: '50px', resize: 'vertical' }} />
                    </div>
                    
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Font Family</span>
                      <select value={sel.font || 'Inter'} onChange={e => updateLayer(sel.id, 'font', e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px' }}>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    
                    <div className="studio-grid-2" style={{ gap: '8px' }}>
                      <div className="studio-label" style={{ marginBottom: '8px' }}>
                        <span>Size</span>
                        <input type="number" value={sel.size} onChange={e => updateLayer(sel.id, 'size', +e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px' }} />
                      </div>
                      <div className="studio-label" style={{ marginBottom: '8px' }}>
                        <span>Weight</span>
                        <select value={sel.weight} onChange={e => updateLayer(sel.id, 'weight', +e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px' }}>
                          <option value="300">Light</option>
                          <option value="400">Regular</option>
                          <option value="500">Medium</option>
                          <option value="600">SemiBold</option>
                          <option value="700">Bold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="studio-grid-2" style={{ gap: '8px' }}>
                      <div className="studio-label" style={{ marginBottom: '8px' }}>
                        <span>Align</span>
                        <select value={sel.align} onChange={e => updateLayer(sel.id, 'align', e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '13px' }}>
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div className="studio-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Color</span>
                        <ColorField value={sel.color} onChange={(v) => updateLayersLive(l => l.id === sel.id ? { ...l, color: v } : l)} onCommit={() => saveHistory(layers, bg)} title="Text color" />
                      </div>
                    </div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Letter spacing ({sel.spacing || 0}px)</span>
                      <input type="range" min="-10" max="40" value={sel.spacing || 0} onChange={e => updateLayer(sel.id, 'spacing', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Line height ({(sel.lineHeight || 1.2).toFixed(1)})</span>
                      <input type="range" min="0.8" max="3" step="0.1" value={sel.lineHeight || 1.2} onChange={e => updateLayer(sel.id, 'lineHeight', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="insp-align" style={{ marginBottom: 4 }}>
                      <button className={(!sel.textCase || sel.textCase === 'none') ? 'active' : ''} onClick={() => updateLayer(sel.id, 'textCase', 'none')} title="Normal case" style={{ fontSize: 13, fontWeight: 600, color: 'inherit' }}>Ag</button>
                      <button className={sel.textCase === 'upper' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'textCase', 'upper')} title="UPPERCASE" style={{ fontSize: 13, fontWeight: 700, color: 'inherit' }}>AG</button>
                      <button className={sel.textCase === 'lower' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'textCase', 'lower')} title="lowercase" style={{ fontSize: 13, fontWeight: 600, color: 'inherit' }}>ag</button>
                    </div>

                    <div className="studio-section-title" style={{ margin: '10px 0 4px' }}>Text effects</div>
                    <div className="insp-fill-toggle">
                      <button className={sel.fillType !== 'gradient' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'fillType', 'solid')}>Solid</button>
                      <button className={sel.fillType === 'gradient' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'fillType', 'gradient')}>Gradient</button>
                    </div>
                    {sel.fillType === 'gradient' && (
                      <div className="insp-fill" style={{ marginBottom: 8 }}>
                        <input type="color" value={sel.grad?.c1 || '#8b5cf6'} onChange={e => updateNested(sel.id, 'grad', 'c1', e.target.value)} title="Start color" />
                        <input type="color" value={sel.grad?.c2 || '#ec4899'} onChange={e => updateNested(sel.id, 'grad', 'c2', e.target.value)} title="End color" />
                        <input className="insp-hex" type="number" min="0" max="360" value={sel.grad?.angle ?? 90} onChange={e => updateNested(sel.id, 'grad', 'angle', +e.target.value)} title="Angle" />
                      </div>
                    )}
                    <label className="insp-field studio-export-check" style={{ marginBottom: 6 }}>
                      <span>Drop shadow</span>
                      <input type="checkbox" checked={!!sel.textShadow} onChange={e => updateLayer(sel.id, 'textShadow', e.target.checked)} />
                    </label>
                    <div className="studio-label" style={{ marginBottom: '4px' }}>
                      <span>Outline / stroke</span>
                      <div className="insp-fill">
                        <input type="color" value={sel.strokeColor || '#000000'} onChange={e => updateLayer(sel.id, 'strokeColor', e.target.value)} />
                        <input className="insp-hex" type="number" min="0" max="40" value={sel.strokeW || 0} onChange={e => updateLayer(sel.id, 'strokeW', Math.max(0, +e.target.value))} title="Stroke width" />
                      </div>
                    </div>
                  </>
                )}

                {(sel.type === 'rect' || sel.type === 'ellipse' || sel.type === 'shape') && (
                  <>
                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Fill</div>
                    <div className="insp-fill-toggle">
                      <button className={sel.fillType !== 'gradient' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'fillType', 'solid')}>Solid</button>
                      <button className={sel.fillType === 'gradient' ? 'active' : ''} onClick={() => updateLayer(sel.id, 'fillType', 'gradient')}>Gradient</button>
                    </div>
                    {sel.fillType === 'gradient' ? (
                      <>
                        <div className="insp-grad-preview" style={{ background: `linear-gradient(${(sel.grad?.angle ?? 90)}deg, ${sel.grad?.c1 || '#8b5cf6'}, ${sel.grad?.c2 || '#ec4899'})` }} />
                        <div className="insp-fill" style={{ marginTop: 8 }}>
                          <input type="color" value={sel.grad?.c1 || '#8b5cf6'} onChange={e => updateNested(sel.id, 'grad', 'c1', e.target.value)} title="Start color" />
                          <input type="color" value={sel.grad?.c2 || '#ec4899'} onChange={e => updateNested(sel.id, 'grad', 'c2', e.target.value)} title="End color" />
                          <input className="insp-hex" type="number" min="0" max="360" value={sel.grad?.angle ?? 90} onChange={e => updateNested(sel.id, 'grad', 'angle', +e.target.value)} title="Angle" />
                        </div>
                      </>
                    ) : (
                      <div className="insp-fill">
                        <ColorField value={sel.color === 'none' ? '#8b5cf6' : sel.color} onChange={(v) => updateLayersLive(l => l.id === sel.id ? { ...l, color: v } : l)} onCommit={() => saveHistory(layers, bg)} title="Fill color" />
                        <input className="insp-hex" type="text" value={sel.color} onChange={e => updateLayer(sel.id, 'color', e.target.value)} spellCheck={false} />
                      </div>
                    )}

                    <div className="studio-section-title" style={{ margin: '10px 0 4px' }}>Stroke</div>
                    <div className="insp-fill">
                      <input type="color" value={sel.strokeColor || '#000000'} onChange={e => updateLayer(sel.id, 'strokeColor', e.target.value)} />
                      <input className="insp-hex" type="number" min="0" max="80" value={sel.strokeW || 0} onChange={e => updateLayer(sel.id, 'strokeW', Math.max(0, +e.target.value))} title="Stroke width" />
                    </div>

                    {(sel.type === 'rect' || (sel.type === 'shape' && (sel.shape === 'square' || sel.shape === 'roundRect'))) && (() => {
                      const rMax = Math.max(1, Math.round(Math.min(sel.w || 0, sel.h || 0) / 2));
                      const rVal = Math.min(sel.radius || 0, rMax);
                      const setR = (v) => updateLayer(sel.id, 'radius', Math.max(0, Math.min(Math.round(v) || 0, rMax)));
                      return (
                        <div className="studio-label" style={{ marginTop: '10px' }}>
                          <span>Corner radius</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min="0" max={rMax} value={rVal} onChange={e => setR(+e.target.value)} style={{ flex: 1 }} />
                            <input className="insp-hex" type="number" min="0" max={rMax} value={rVal} onChange={e => setR(+e.target.value)} style={{ width: 56 }} title="Corner radius (px)" />
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {sel.type === 'path' && (
                  <>
                    {sel.mode !== 'eraser' && (
                      <>
                        <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Stroke color</div>
                        <div className="insp-fill">
                          <input type="color" value={sel.color || '#111827'} onChange={e => updateLayer(sel.id, 'color', e.target.value)} />
                          <input className="insp-hex" type="text" value={sel.color || ''} onChange={e => updateLayer(sel.id, 'color', e.target.value)} spellCheck={false} />
                        </div>
                      </>
                    )}
                    <div className="studio-label" style={{ marginTop: 10 }}>
                      <span>Thickness ({sel.strokeW || 1}px)</span>
                      <input type="range" min="1" max="80" value={sel.strokeW || 1} onChange={e => updateLayer(sel.id, 'strokeW', +e.target.value)} style={{ width: '100%' }} />
                    </div>
                    {sel.mode !== 'eraser' && (
                      <div className="studio-label" style={{ marginTop: 10 }}>
                        <span>Smoothing ({Math.round((sel.smooth ?? 0) * 100)}%)</span>
                        <input type="range" min="0" max="1" step="0.05" value={sel.smooth ?? 0}
                          onChange={e => {
                            const level = +e.target.value;
                            const raw = sel.raw || sel.pts;
                            const pts = level > 0 ? smoothStroke(raw, level) : raw;
                            setLayersWithHistory(layers.map(x => x.id === sel.id ? { ...x, smooth: level, pts } : x));
                          }} style={{ width: '100%' }} />
                      </div>
                    )}
                  </>
                )}

                {sel.type === 'vector' && (
                  <>
                    <button className="btn-primary w-100" onClick={() => enterVecEdit(sel.id)} style={{ padding: '10px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}><PenNib size={16} /> Edit points</button>
                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Stroke</div>
                    <div className="insp-fill">
                      <input type="color" value={sel.stroke || '#111827'} onChange={e => updateLayer(sel.id, 'stroke', e.target.value)} />
                      <input className="insp-hex" type="number" min="0" max="80" value={sel.strokeW || 0} onChange={e => updateLayer(sel.id, 'strokeW', Math.max(0, +e.target.value))} title="Stroke width" />
                    </div>
                    <label className="insp-field studio-export-check" style={{ marginTop: 10 }}>
                      <span>Closed shape</span>
                      <input type="checkbox" checked={!!sel.closed} onChange={e => updateLayer(sel.id, 'closed', e.target.checked)} />
                    </label>
                    <div className="studio-section-title" style={{ margin: '10px 0 4px' }}>Fill</div>
                    <div className="insp-fill">
                      <input type="color" value={sel.fill && sel.fill !== 'none' ? sel.fill : '#8b5cf6'} onChange={e => updateLayer(sel.id, 'fill', e.target.value)} />
                      <button className="btn-outline" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12 }} onClick={() => updateLayer(sel.id, 'fill', sel.fill && sel.fill !== 'none' ? 'none' : '#8b5cf6')}>{sel.fill && sel.fill !== 'none' ? 'Remove fill' : 'Add fill'}</button>
                    </div>
                  </>
                )}

                {sel.type === 'image' && (
                  <>
                    <button className="btn-primary w-100" onClick={() => replaceRef.current && replaceRef.current.click()} style={{ padding: '10px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}><ImageIcon size={16} /> Replace image</button>
                    <input ref={replaceRef} type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { replaceSelectedImage(await fileToDataUrl(f)); } e.target.value = ''; }} />
                    <button className="btn-outline w-100" onClick={startCrop} style={{ padding: '9px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}><Crop size={16} /> Crop image</button>
                    <div className="studio-grid-2" style={{ gap: 8, marginBottom: 8 }}>
                      <button className="btn-outline" onClick={() => applyBg('remove')} disabled={!!bgBusy} style={{ padding: '9px 6px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Eraser size={15} /> Remove BG</button>
                      <button className="btn-outline" onClick={() => applyBg('blur')} disabled={!!bgBusy} style={{ padding: '9px 6px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Drop size={15} /> Blur BG</button>
                    </div>
                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Image Adjustments</div>
                    <div className="studio-label" style={{ marginBottom: '6px' }}>
                      <span>Opacity ({Math.round((sel.opacity ?? 1) * 100)}%)</span>
                      <input type="range" min="0" max="100" value={Math.round((sel.opacity ?? 1) * 100)} onChange={e => updateLayer(sel.id, 'opacity', +e.target.value / 100)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '6px' }}>
                      <span>Brightness ({sel.adjust?.brightness ?? 100}%)</span>
                      <input type="range" min="0" max="200" value={sel.adjust?.brightness ?? 100} onChange={e => updateNested(sel.id, 'adjust', 'brightness', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '6px' }}>
                      <span>Contrast ({sel.adjust?.contrast ?? 100}%)</span>
                      <input type="range" min="0" max="200" value={sel.adjust?.contrast ?? 100} onChange={e => updateNested(sel.id, 'adjust', 'contrast', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '6px' }}>
                      <span>Saturation ({sel.adjust?.saturation ?? 100}%)</span>
                      <input type="range" min="0" max="200" value={sel.adjust?.saturation ?? 100} onChange={e => updateNested(sel.id, 'adjust', 'saturation', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>

                    <div className="studio-label" style={{ marginBottom: '6px' }}>
                      <span>Blur ({sel.adjust?.blur || 0}px)</span>
                      <input type="range" min="0" max="20" value={sel.adjust?.blur || 0} onChange={e => updateNested(sel.id, 'adjust', 'blur', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>

                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Filters</div>
                    <div className="insp-filter-grid">
                      {IMAGE_FILTER_LIST.map(([v, label]) => (
                        <button key={v} className={`insp-filter-btn ${(sel.filter || 'none') === v ? 'active' : ''}`} onClick={() => updateLayer(sel.id, 'filter', v)}>{label}</button>
                      ))}
                    </div>

                    <div className="studio-section-title" style={{ margin: '8px 0 4px' }}>Styling</div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Corner Radius</span>
                      <input type="range" min="0" max="200" value={sel.imgStyle?.radius ?? 0} onChange={e => updateNested(sel.id, 'imgStyle', 'radius', +e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Shadow ({sel.imgStyle?.shadow || 0})</span>
                      <input type="range" min="0" max="80" value={sel.imgStyle?.shadow || 0} onChange={e => updateNested(sel.id, 'imgStyle', 'shadow', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Glow ({sel.imgStyle?.glow || 0})</span>
                      <input type="range" min="0" max="80" value={sel.imgStyle?.glow || 0} onChange={e => updateNested(sel.id, 'imgStyle', 'glow', +e.target.value)} onMouseUp={() => saveHistory(layers, bg)} style={{ width: '100%' }} />
                    </div>
                    {(sel.imgStyle?.glow || 0) > 0 && (
                      <label className="insp-field" style={{ marginBottom: 8 }}>
                        <span>Glow color</span>
                        <input type="color" value={sel.imgStyle?.glowColor || '#8b5cf6'} onChange={e => updateNested(sel.id, 'imgStyle', 'glowColor', e.target.value)} style={{ width: 30, height: 24, border: 'none', background: 'none', cursor: 'pointer' }} />
                      </label>
                    )}
                    <div className="studio-label" style={{ marginBottom: '8px' }}>
                      <span>Border</span>
                      <div className="insp-fill">
                        <input type="color" value={sel.imgStyle?.borderColor || '#ffffff'} onChange={e => updateNested(sel.id, 'imgStyle', 'borderColor', e.target.value)} />
                        <input className="insp-hex" type="number" min="0" max="60" value={sel.imgStyle?.borderW || 0} onChange={e => updateNested(sel.id, 'imgStyle', 'borderW', Math.max(0, +e.target.value))} title="Border width" />
                      </div>
                    </div>
                    <div className="studio-grid-2" style={{ gap: '8px' }}>
                      <button className="btn-outline" onClick={() => updateNested(sel.id, 'imgStyle', 'flipH', !sel.imgStyle?.flipH)} style={{ borderColor: sel.imgStyle?.flipH ? 'var(--primary)' : 'var(--border)', padding: '6px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}><FlipHorizontal size={14} /> Flip H</button>
                      <button className="btn-outline" onClick={() => updateNested(sel.id, 'imgStyle', 'flipV', !sel.imgStyle?.flipV)} style={{ borderColor: sel.imgStyle?.flipV ? 'var(--primary)' : 'var(--border)', padding: '6px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}><FlipVertical size={14} /> Flip V</button>
                    </div>
                  </>
                )}

                {/* Shared Effects — shadow, glow, glassmorphism. Images have their
                    own shadow/glow controls under Styling, so exclude them here. */}
                {sel.type !== 'image' && (
                  <>
                    <div className="studio-section-title" style={{ margin: '12px 0 6px' }}>Effects</div>

                    <label className="insp-field studio-export-check" style={{ marginBottom: 6 }}>
                      <span>Drop shadow</span>
                      <input type="checkbox" checked={!!sel.fx?.shadow?.on} onChange={e => { setFx(sel.id, 'shadow', 'on', e.target.checked); saveHistory(layers, bg); }} />
                    </label>
                    {sel.fx?.shadow?.on && (
                      <div className="insp-grid" style={{ marginBottom: 8 }}>
                        <label className="insp-field"><span>X</span><input type="number" value={sel.fx.shadow.x ?? 0} onChange={e => setFx(sel.id, 'shadow', 'x', +e.target.value)} onBlur={() => saveHistory(layers, bg)} /></label>
                        <label className="insp-field"><span>Y</span><input type="number" value={sel.fx.shadow.y ?? 8} onChange={e => setFx(sel.id, 'shadow', 'y', +e.target.value)} onBlur={() => saveHistory(layers, bg)} /></label>
                        <label className="insp-field"><span>Blur</span><input type="number" min="0" value={sel.fx.shadow.blur ?? 12} onChange={e => setFx(sel.id, 'shadow', 'blur', Math.max(0, +e.target.value))} onBlur={() => saveHistory(layers, bg)} /></label>
                        <label className="insp-field"><span>Color</span><input type="color" value={sel.fx.shadow.color && sel.fx.shadow.color[0] === '#' ? sel.fx.shadow.color : '#000000'} onChange={e => setFx(sel.id, 'shadow', 'color', e.target.value)} onBlur={() => saveHistory(layers, bg)} /></label>
                      </div>
                    )}

                    <label className="insp-field studio-export-check" style={{ marginBottom: 6 }}>
                      <span>Outer glow</span>
                      <input type="checkbox" checked={!!sel.fx?.glow?.on} onChange={e => { setFx(sel.id, 'glow', 'on', e.target.checked); saveHistory(layers, bg); }} />
                    </label>
                    {sel.fx?.glow?.on && (
                      <div className="insp-grid" style={{ marginBottom: 4 }}>
                        <label className="insp-field"><span>Blur</span><input type="number" min="0" value={sel.fx.glow.blur ?? 24} onChange={e => setFx(sel.id, 'glow', 'blur', Math.max(0, +e.target.value))} onBlur={() => saveHistory(layers, bg)} /></label>
                        <label className="insp-field"><span>Color</span><input type="color" value={sel.fx.glow.color || '#8b5cf6'} onChange={e => setFx(sel.id, 'glow', 'color', e.target.value)} onBlur={() => saveHistory(layers, bg)} /></label>
                      </div>
                    )}
                    {sel.fx?.glow?.on && sel.fx?.shadow?.on && <p className="studio-hint" style={{ marginTop: 0 }}>Glow overrides the shadow while both are on.</p>}

                    {(sel.type === 'rect' || sel.type === 'ellipse' || sel.type === 'shape') && (
                      <>
                        <label className="insp-field studio-export-check" style={{ marginTop: 4, marginBottom: 6 }}>
                          <span>Glass (frosted)</span>
                          <input type="checkbox" checked={!!sel.fx?.glass?.on} onChange={e => { setFx(sel.id, 'glass', 'on', e.target.checked); saveHistory(layers, bg); }} />
                        </label>
                        {sel.fx?.glass?.on && (
                          <div className="insp-grid">
                            <label className="insp-field"><span>Blur</span><input type="number" min="0" max="60" value={sel.fx.glass.blur ?? 14} onChange={e => setFx(sel.id, 'glass', 'blur', Math.max(0, +e.target.value))} onBlur={() => saveHistory(layers, bg)} /></label>
                            <label className="insp-field"><span>Tint %</span><input type="number" min="0" max="100" value={Math.round((sel.fx.glass.opacity ?? 0.18) * 100)} onChange={e => setFx(sel.id, 'glass', 'opacity', Math.min(1, Math.max(0, +e.target.value / 100)))} onBlur={() => saveHistory(layers, bg)} /></label>
                            <label className="insp-field"><span>Tint</span><input type="color" value={sel.fx.glass.tint || '#ffffff'} onChange={e => setFx(sel.id, 'glass', 'tint', e.target.value)} onBlur={() => saveHistory(layers, bg)} /></label>
                          </div>
                        )}
                        {sel.fx?.glass?.on && <p className="studio-hint" style={{ marginTop: 2 }}>Glass blurs the layers behind it — place it over a photo or shapes.</p>}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {rightTab === 'design' && selectedIds.length > 1 && (
              <>
                <div className="insp-head">
                  <span className="insp-title">{selectedIds.length} selected</span>
                  <div className="insp-head-actions">
                    <button className="insp-icon-btn danger" onClick={() => { setLayersWithHistory(layers.filter(l => !selectedIds.includes(l.id))); setSelectedIds([]); }} title="Delete all"><Trash size={15} /></button>
                  </div>
                </div>
                <div className="insp-align">
                  <button onClick={() => alignSel('left')} title="Align left"><AlignLeft size={15} /></button>
                  <button onClick={() => alignSel('hcenter')} title="Align horizontal center"><AlignCenterHorizontal size={15} /></button>
                  <button onClick={() => alignSel('right')} title="Align right"><AlignRight size={15} /></button>
                  <span className="insp-align-sep" />
                  <button onClick={() => alignSel('top')} title="Align top"><AlignTop size={15} /></button>
                  <button onClick={() => alignSel('vcenter')} title="Align vertical center"><AlignCenterVertical size={15} /></button>
                  <button onClick={() => alignSel('bottom')} title="Align bottom"><AlignBottom size={15} /></button>
                </div>
                {selLayers.some(l => l.group) ? (
                  <button className="btn-outline w-100" onClick={ungroupSelected} style={{ padding: '9px', borderRadius: '10px', fontSize: '13px' }}>Ungroup</button>
                ) : (
                  <button className="btn-primary w-100" onClick={groupSelected} style={{ padding: '9px', borderRadius: '10px', fontSize: '13px' }}>Group selection</button>
                )}
                <p className="studio-hint" style={{ marginTop: 8 }}>Drag to move together · Ctrl+G to group.</p>
              </>
            )}

            {rightTab === 'design' && selectedIds.length === 0 && (
              <div className="studio-insp-empty">
                <span className="studio-insp-empty-ic"><Cursor size={24} weight="duotone" /></span>
                <b>Nothing selected</b>
                <p>Pick an element on the canvas to edit it — or add something to get started.</p>
                <div className="studio-insp-empty-actions">
                  <button onClick={() => { setDrawTool(null); setToolMode('move'); addText('heading'); }}><TextT size={15} /> Add text</button>
                  <button onClick={() => setActiveTab('images')}><ImageIcon size={15} /> Add photo</button>
                  <button onClick={() => setActiveTab('templates')}><MagicWand size={15} /> Browse templates</button>
                </div>
              </div>
            )}

            {rightTab === 'layers' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="studio-section-title" style={{ margin: 0 }}>Layers</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{layers.length}</span>
                </div>
                {layers.length === 0 ? (
                  <div className="studio-empty"><Shapes size={24} /><p>Nothing on the canvas yet.</p></div>
                ) : (
                  <Reorder.Group axis="y" values={layers} onReorder={setLayersWithHistory} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
                    {layers.map(l => (
                      <Reorder.Item key={l.id} value={l} className="studio-layer-row"
                        style={{ background: selectedIds.includes(l.id) ? 'var(--accent-soft)' : 'var(--bg-color)', border: `1px solid ${selectedIds.includes(l.id) ? 'var(--primary)' : 'var(--border)'}` }}
                        onClick={(e) => { if (e.shiftKey) setSelectedIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id]); else setSelectedId(l.id); }}>
                        <DotsSixVertical size={14} color="var(--text-muted)" />
                        {l.type === 'image' ? <ImageIcon size={14} /> : l.type === 'text' ? <TextT size={14} /> : l.type === 'path' ? <PenNib size={14} /> : <Shapes size={14} />}
                        {renamingId === l.id ? (
                          <input autoFocus className="studio-layer-rename" defaultValue={l.name || (l.type === 'text' ? l.text : l.type === 'shape' ? l.shape : l.type)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => { updateLayer(l.id, 'name', e.target.value.trim() || undefined); setRenamingId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { updateLayer(l.id, 'name', e.target.value.trim() || undefined); setRenamingId(null); } else if (e.key === 'Escape') setRenamingId(null); }} />
                        ) : (
                          <span className="studio-layer-name" onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(l.id); }} title="Double-click to rename">
                            {l.name || (l.type === 'text' ? l.text : l.type === 'shape' ? l.shape : l.type)}
                          </span>
                        )}
                        <button className="studio-layer-act" onClick={(e) => { e.stopPropagation(); updateLayer(l.id, 'locked', !l.locked); }} title={l.locked ? 'Unlock' : 'Lock'}>{l.locked ? <Lock size={13} /> : <LockOpen size={13} />}</button>
                        <button className="studio-layer-act" onClick={(e) => { e.stopPropagation(); updateLayer(l.id, 'hidden', !l.hidden); }} title={l.hidden ? 'Show' : 'Hide'}>{l.hidden ? <EyeSlash size={13} /> : <Eye size={13} />}</button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {ctxMenu && (
        <>
          <div className="studio-ctx-backdrop" onPointerDown={() => setCtxMenu(null)} onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }} />
          <div className="studio-ctxmenu" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
            {selectedIds.length > 0 ? (
              <>
                <button onClick={() => runCtx(copySelection)}>Copy <span>Ctrl C</span></button>
                <button onClick={() => runCtx(duplicateSelection)}>Duplicate <span>Ctrl D</span></button>
                {ctxMenu.canPaste ? <button onClick={() => runCtx(pasteClipboard)}>Paste <span>Ctrl V</span></button> : null}
                <button className="danger" onClick={() => runCtx(deleteSelection)}>Delete <span>Del</span></button>
                <div className="studio-ctxmenu-sep" />
                <button onClick={() => runCtx(bringToFront)}>Bring to front <span>Ctrl ]</span></button>
                <button onClick={() => runCtx(sendToBack)}>Send to back <span>Ctrl [</span></button>
                <div className="studio-ctxmenu-sep" />
                {selLayers.some(l => l.group)
                  ? <button onClick={() => runCtx(ungroupSelected)}>Ungroup <span>Ctrl Shift G</span></button>
                  : (selectedIds.length > 1 && <button onClick={() => runCtx(groupSelected)}>Group <span>Ctrl G</span></button>)}
                <div className="studio-ctxmenu-sep" />
                <button onClick={() => runCtx(selectAllLayers)}>Select all <span>Ctrl A</span></button>
              </>
            ) : (
              <>
                {ctxMenu.canPaste ? <button onClick={() => runCtx(pasteClipboard)}>Paste <span>Ctrl V</span></button> : <button disabled>Paste</button>}
                <button onClick={() => runCtx(selectAllLayers)}>Select all <span>Ctrl A</span></button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Secondary-panel: media search (Images / Videos). Reuses searchMedia. ---
function StudioMediaSearch({ type, onPick, placeholder, note }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const run = async (e) => {
    e?.preventDefault?.();
    if (!q.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      const { results } = await searchMedia(q.trim(), { type, perPage: 18 });
      setItems(results || []);
    } catch (err) {
      setError(err?.code === 'no_providers' ? 'Image providers are not configured yet.' : 'Search is unavailable right now.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-search-panel">
      <form className="studio-search-box" onSubmit={run}>
        <MagnifyingGlass size={16} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} />
      </form>
      {note && <p className="studio-hint" style={{ marginBottom: 10 }}>{note}</p>}

      {loading && (
        <div className="studio-thumb-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="studio-skeleton" />)}
        </div>
      )}
      {!loading && error && <div className="studio-empty"><p>{error}</p></div>}
      {!loading && !error && searched && items.length === 0 && (
        <div className="studio-empty"><p>No results. Try another search.</p></div>
      )}
      {!loading && !error && !searched && (
        <div className="studio-empty"><MagnifyingGlass size={26} /><p>Search millions of free {type === 'video' ? 'videos' : 'images'}.</p></div>
      )}
      {!loading && items.length > 0 && (
        <div className="studio-thumb-grid">
          {items.map((it) => {
            const src = it.downloadUrl || it.preview || it.thumbnail;
            return (
              <button key={it.id} className="studio-thumb" title={it.title || 'Add to canvas'} onClick={() => src && onPick(src)}>
                <img src={it.thumbnail || it.preview} alt={it.title || ''} loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

