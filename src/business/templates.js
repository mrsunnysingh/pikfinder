// src/business/templates.js
// Starter Business Hub templates — the same Studio layer JSON, with
// {{placeholders}} in text. Rendered by src/lib/render (renderTemplate +
// sceneToSvg). `fields` gives the mapping form friendly labels + samples.

// ── Builders: generate many themed Certificate & Invoice designs ─────────────
const CERT_FIELDS = [
  { key: 'recipient_name', label: 'Recipient name', sample: 'Alex Morgan' },
  { key: 'course_name', label: 'Course / achievement', sample: 'Digital Marketing Mastery' },
  { key: 'date', label: 'Date', sample: '20 Jul 2026' },
  { key: 'signatory', label: 'Signatory', sample: 'A. Sharma' },
];
// Invoice supports up to this many line-item rows. Empty rows render blank
// (missing placeholders become ''), so short invoices simply show fewer lines.
const INV_ROWS = 6;
const INVOICE_ITEM_FIELDS = [];
for (let i = 1; i <= INV_ROWS; i++) {
  const s = i === 1 ? { n: 'Website design', q: '1', r: '₹40,000', a: '₹40,000' }
          : i === 2 ? { n: 'Hosting (1 year)', q: '1', r: '₹5,000', a: '₹5,000' }
          : { n: '', q: '', r: '', a: '' };
  INVOICE_ITEM_FIELDS.push(
    { key: `item_${i}_name`, label: `Item ${i} — description`, sample: s.n, group: 'items' },
    { key: `item_${i}_qty`, label: `Item ${i} — qty`, sample: s.q, group: 'items' },
    { key: `item_${i}_rate`, label: `Item ${i} — rate`, sample: s.r, group: 'items' },
    { key: `item_${i}_amount`, label: `Item ${i} — amount`, sample: s.a, group: 'items' },
  );
}
const INVOICE_FIELDS = [
  { key: 'company_name', label: 'Your company', sample: 'Your Company' },
  { key: 'invoice_number', label: 'Invoice #', sample: 'INV-1042' },
  { key: 'date', label: 'Date', sample: '20 Jul 2026' },
  { key: 'customer_name', label: 'Bill to', sample: 'Acme Corp' },
  ...INVOICE_ITEM_FIELDS,
  { key: 'subtotal', label: 'Subtotal', sample: '₹45,000', group: 'items' },
  { key: 'tax', label: 'Tax', sample: '₹0', group: 'items' },
  { key: 'amount', label: 'Total', sample: '₹45,000', group: 'items' },
  { key: 'notes', label: 'Notes (optional)', sample: 'Payment due within 14 days.' },
];

// Certificate — 1200×850. `style`: 'frame' | 'bar' | 'ribbon' | 'plain'.
function cert(id, name, o) {
  const nameFont = o.nameFont || 'Playfair Display';
  const title = o.title || 'CERTIFICATE OF ACHIEVEMENT';
  const sub2 = o.sub2 || o.sub;
  const L = [];
  if (o.style === 'frame') {
    L.push({ type: 'rect', x: 40, y: 40, w: 1120, h: 770, color: 'none', strokeW: 3, strokeColor: o.accent, radius: 10 });
    L.push({ type: 'rect', x: 60, y: 60, w: 1080, h: 730, color: 'none', strokeW: 1, strokeColor: o.frame || o.accent, radius: 6 });
  } else if (o.style === 'bar') {
    L.push({ type: 'rect', x: 0, y: 0, w: 1200, h: 22, color: o.accent });
    L.push({ type: 'rect', x: 0, y: 828, w: 1200, h: 22, color: o.accent });
  } else if (o.style === 'ribbon') {
    L.push({ type: 'rect', x: 0, y: 0, w: 26, h: 850, color: o.accent });
    L.push({ type: 'rect', x: 1174, y: 0, w: 26, h: 850, color: o.accent });
  }
  L.push({ type: 'text', text: title, x: 600, y: 150, size: 38, weight: 800, align: 'center', color: o.accent, font: 'Outfit', textCase: 'upper', spacing: 2 });
  L.push({ type: 'text', text: 'This certificate is proudly presented to', x: 600, y: 275, size: 22, weight: 400, align: 'center', color: o.sub, font: 'Inter' });
  L.push({ type: 'text', text: '{{recipient_name}}', x: 600, y: 325, size: 64, weight: 700, align: 'center', color: o.name, font: nameFont });
  L.push({ type: 'text', text: 'for successfully completing {{course_name}}', x: 600, y: 455, size: 26, weight: 400, align: 'center', color: o.sub, font: 'Inter' });
  L.push({ type: 'text', text: 'Date: {{date}}', x: 600, y: 565, size: 20, weight: 500, align: 'center', color: sub2, font: 'Inter' });
  L.push({ type: 'rect', x: 450, y: 668, w: 300, h: 2, color: o.accent });
  L.push({ type: 'text', text: '{{signatory}}', x: 600, y: 680, size: 18, weight: 500, align: 'center', color: o.name, font: 'Inter' });
  L.push({ type: 'text', text: 'Authorized Signature', x: 600, y: 708, size: 13, weight: 400, align: 'center', color: o.sub, font: 'Inter' });
  return { id, name, category: 'Education', dims: { w: 1200, h: 850 }, bg: o.bg, fields: CERT_FIELDS, layers: L };
}

// Invoice — 900×1160. `header`: 'band' | 'minimal' | 'left'.
function invoice(id, name, o) {
  const ink = o.ink || '#0f172a';
  const sub = o.sub || '#475569';
  const L = [];
  if (o.header === 'band') {
    L.push({ type: 'rect', x: 0, y: 0, w: 900, h: 140, color: o.accent });
    L.push({ type: 'text', text: '{{company_name}}', x: 60, y: 52, size: 34, weight: 800, align: 'left', color: o.onAccent || '#ffffff', font: 'Outfit' });
    L.push({ type: 'text', text: 'INVOICE', x: 840, y: 54, size: 30, weight: 700, align: 'right', color: o.badge || '#ffffff', font: 'Outfit', spacing: 3 });
  } else if (o.header === 'left') {
    L.push({ type: 'rect', x: 0, y: 0, w: 14, h: 1160, color: o.accent });
    L.push({ type: 'text', text: '{{company_name}}', x: 60, y: 66, size: 34, weight: 800, align: 'left', color: ink, font: 'Outfit' });
    L.push({ type: 'text', text: 'INVOICE', x: 840, y: 70, size: 28, weight: 700, align: 'right', color: o.accent, font: 'Outfit', spacing: 3 });
  } else {
    L.push({ type: 'text', text: '{{company_name}}', x: 60, y: 70, size: 32, weight: 800, align: 'left', color: ink, font: 'Outfit' });
    L.push({ type: 'text', text: 'INVOICE', x: 840, y: 74, size: 28, weight: 700, align: 'right', color: o.accent, font: 'Outfit', spacing: 3 });
    L.push({ type: 'rect', x: 60, y: 132, w: 780, h: 3, color: o.accent });
  }
  L.push({ type: 'text', text: 'Invoice #: {{invoice_number}}', x: 60, y: 200, size: 20, weight: 500, align: 'left', color: ink, font: 'Inter' });
  L.push({ type: 'text', text: 'Date: {{date}}', x: 60, y: 236, size: 20, weight: 400, align: 'left', color: sub, font: 'Inter' });
  L.push({ type: 'text', text: 'BILL TO', x: 60, y: 330, size: 14, weight: 700, align: 'left', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'text', text: '{{customer_name}}', x: 60, y: 360, size: 26, weight: 600, align: 'left', color: ink, font: 'Inter' });

  // ── Line-item table ──────────────────────────────────────────────────────
  const head = 470;
  L.push({ type: 'text', text: 'DESCRIPTION', x: 60, y: head, size: 13, weight: 700, align: 'left', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'text', text: 'QTY', x: 560, y: head, size: 13, weight: 700, align: 'right', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'text', text: 'RATE', x: 690, y: head, size: 13, weight: 700, align: 'right', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'text', text: 'AMOUNT', x: 840, y: head, size: 13, weight: 700, align: 'right', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'rect', x: 60, y: head + 24, w: 780, h: 2, color: o.accent });

  const rowY0 = head + 54, step = 44;
  for (let i = 1; i <= INV_ROWS; i++) {
    const y = rowY0 + (i - 1) * step;
    L.push({ type: 'text', text: `{{item_${i}_name}}`, x: 60, y, size: 16, weight: 500, align: 'left', color: ink, font: 'Inter' });
    L.push({ type: 'text', text: `{{item_${i}_qty}}`, x: 560, y, size: 16, weight: 400, align: 'right', color: sub, font: 'Inter' });
    L.push({ type: 'text', text: `{{item_${i}_rate}}`, x: 690, y, size: 16, weight: 400, align: 'right', color: sub, font: 'Inter' });
    L.push({ type: 'text', text: `{{item_${i}_amount}}`, x: 840, y, size: 16, weight: 600, align: 'right', color: ink, font: 'Inter' });
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  const tot = rowY0 + INV_ROWS * step + 8;
  L.push({ type: 'rect', x: 60, y: tot, w: 780, h: 1, color: o.line || '#e2e8f0' });
  L.push({ type: 'text', text: 'Subtotal', x: 690, y: tot + 22, size: 15, weight: 400, align: 'right', color: sub, font: 'Inter' });
  L.push({ type: 'text', text: '{{subtotal}}', x: 840, y: tot + 22, size: 15, weight: 500, align: 'right', color: ink, font: 'Inter' });
  L.push({ type: 'text', text: 'Tax', x: 690, y: tot + 52, size: 15, weight: 400, align: 'right', color: sub, font: 'Inter' });
  L.push({ type: 'text', text: '{{tax}}', x: 840, y: tot + 52, size: 15, weight: 500, align: 'right', color: ink, font: 'Inter' });
  L.push({ type: 'rect', x: 520, y: tot + 84, w: 320, h: 64, color: o.totalBg || '#f1f5f9', radius: 12 });
  L.push({ type: 'text', text: 'TOTAL', x: 548, y: tot + 108, size: 14, weight: 700, align: 'left', color: sub, font: 'Inter', textCase: 'upper', spacing: 1 });
  L.push({ type: 'text', text: '{{amount}}', x: 824, y: tot + 100, size: 30, weight: 800, align: 'right', color: o.accent, font: 'Outfit' });

  L.push({ type: 'text', text: 'Thank you for your business.', x: 60, y: 1060, size: 15, weight: 400, align: 'left', color: sub, font: 'Inter' });
  L.push({ type: 'text', text: '{{notes}}', x: 60, y: 1096, size: 13, weight: 400, align: 'left', color: sub, font: 'Inter' });
  return { id, name, category: 'Documents', dims: { w: 900, h: 1160 }, bg: o.bg, fields: INVOICE_FIELDS, itemized: true, layers: L };
}

const CERTIFICATES = [
  cert('cert-gold', 'Certificate — Classic Gold', { style: 'frame', bg: { type: 'solid', color: '#0b1020' }, accent: '#c9a227', frame: '#3a3f52', name: '#ffffff', sub: '#cbd5e1', sub2: '#94a3b8' }),
  cert('cert-navy', 'Certificate — Navy Elegant', { style: 'frame', bg: { type: 'solid', color: '#0f172a' }, accent: '#60a5fa', frame: '#1e293b', name: '#ffffff', sub: '#cbd5e1' }),
  cert('cert-emerald', 'Certificate — Emerald', { style: 'ribbon', bg: { type: 'solid', color: '#052e2b' }, accent: '#34d399', name: '#ecfdf5', sub: '#a7f3d0' }),
  cert('cert-royal', 'Certificate — Royal Purple', { style: 'frame', bg: { type: 'gradient', color: '#2e1065', color2: '#1e1b4b', angle: 135 }, accent: '#c4b5fd', frame: '#4c1d95', name: '#ffffff', sub: '#ddd6fe' }),
  cert('cert-light', 'Certificate — Minimal Light', { style: 'frame', bg: { type: 'solid', color: '#ffffff' }, accent: '#b45309', frame: '#e5e7eb', name: '#111827', sub: '#6b7280', nameFont: 'Playfair Display' }),
  cert('cert-cream', 'Certificate — Cream Classic', { style: 'frame', bg: { type: 'solid', color: '#fbf7ef' }, accent: '#9a6a2f', frame: '#e7d8bd', name: '#3f2d16', sub: '#7c6a52' }),
  cert('cert-teal', 'Certificate — Teal Bar', { style: 'bar', bg: { type: 'solid', color: '#ffffff' }, accent: '#0d9488', name: '#0f172a', sub: '#64748b' }),
  cert('cert-rose', 'Certificate — Rose Bar', { style: 'bar', bg: { type: 'solid', color: '#fff1f2' }, accent: '#e11d48', name: '#4c0519', sub: '#9f1239' }),
  cert('cert-slate', 'Certificate — Modern Slate', { style: 'ribbon', bg: { type: 'gradient', color: '#1e293b', color2: '#0f172a', angle: 135 }, accent: '#38bdf8', name: '#ffffff', sub: '#94a3b8' }),
  cert('cert-appreciation', 'Certificate of Appreciation', { style: 'frame', title: 'CERTIFICATE OF APPRECIATION', bg: { type: 'solid', color: '#0b1020' }, accent: '#f59e0b', frame: '#3a3f52', name: '#ffffff', sub: '#cbd5e1' }),
  cert('cert-completion', 'Certificate of Completion', { style: 'bar', title: 'CERTIFICATE OF COMPLETION', bg: { type: 'solid', color: '#ffffff' }, accent: '#4f46e5', name: '#111827', sub: '#6b7280' }),
  cert('cert-participation', 'Certificate of Participation', { style: 'ribbon', title: 'CERTIFICATE OF PARTICIPATION', bg: { type: 'solid', color: '#0c0a09' }, accent: '#eab308', name: '#fafaf9', sub: '#a8a29e' }),
];

const INVOICES = [
  invoice('inv-slate', 'Invoice — Slate Band', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#0f172a', badge: '#38bdf8', totalBg: '#f1f5f9' }),
  invoice('inv-blue', 'Invoice — Ocean Blue', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#2563eb', badge: '#bfdbfe', totalBg: '#eff6ff' }),
  invoice('inv-emerald', 'Invoice — Emerald', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#059669', badge: '#a7f3d0', totalBg: '#ecfdf5' }),
  invoice('inv-violet', 'Invoice — Violet', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#7c3aed', badge: '#ddd6fe', totalBg: '#f5f3ff' }),
  invoice('inv-rose', 'Invoice — Rose', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#e11d48', badge: '#fecdd3', totalBg: '#fff1f2' }),
  invoice('inv-amber', 'Invoice — Amber', { header: 'band', bg: { type: 'solid', color: '#ffffff' }, accent: '#d97706', badge: '#fde68a', totalBg: '#fffbeb' }),
  invoice('inv-minimal', 'Invoice — Minimal Line', { header: 'minimal', bg: { type: 'solid', color: '#ffffff' }, accent: '#111827', totalBg: '#f5f5f5' }),
  invoice('inv-minimal-teal', 'Invoice — Minimal Teal', { header: 'minimal', bg: { type: 'solid', color: '#ffffff' }, accent: '#0d9488', totalBg: '#f0fdfa' }),
  invoice('inv-left-indigo', 'Invoice — Left Accent', { header: 'left', bg: { type: 'solid', color: '#ffffff' }, accent: '#4f46e5', totalBg: '#eef2ff' }),
  invoice('inv-left-black', 'Invoice — Left Mono', { header: 'left', bg: { type: 'solid', color: '#ffffff' }, accent: '#111827', totalBg: '#f4f4f5' }),
  invoice('inv-dark', 'Invoice — Dark Mode', { header: 'band', bg: { type: 'solid', color: '#0f172a' }, accent: '#38bdf8', badge: '#7dd3fc', ink: '#e2e8f0', sub: '#94a3b8', line: '#1e293b', totalBg: '#1e293b' }),
  invoice('inv-receipt', 'Receipt — Simple', { header: 'minimal', bg: { type: 'solid', color: '#ffffff' }, accent: '#334155', totalBg: '#f8fafc' }),
];

import { PREMIUM_TEMPLATES } from './premiumTemplates.js';

export const BUSINESS_TEMPLATES = [
  ...PREMIUM_TEMPLATES,
  ...CERTIFICATES,
  ...INVOICES,
  {
    id: 'certificate',
    name: 'Certificate of Achievement',
    category: 'Education',
    dims: { w: 1200, h: 850 },
    bg: { type: 'solid', color: '#0b1020' },
    fields: [
      { key: 'recipient_name', label: 'Recipient name', sample: 'Alex Morgan' },
      { key: 'course_name', label: 'Course / achievement', sample: 'Zoho Creator Mastery' },
      { key: 'date', label: 'Date', sample: '20 Jul 2026' },
      { key: 'signatory', label: 'Signatory', sample: 'A. Sharma' },
    ],
    layers: [
      { type: 'rect', x: 40, y: 40, w: 1120, h: 770, color: 'none', strokeW: 3, strokeColor: '#c9a227', radius: 10 },
      { type: 'rect', x: 60, y: 60, w: 1080, h: 730, color: 'none', strokeW: 1, strokeColor: '#3a3f52', radius: 6 },
      { type: 'text', text: 'CERTIFICATE OF ACHIEVEMENT', x: 600, y: 140, size: 40, weight: 800, align: 'center', color: '#c9a227', font: 'Outfit', textCase: 'upper', spacing: 2 },
      { type: 'text', text: 'This certificate is proudly presented to', x: 600, y: 270, size: 22, weight: 400, align: 'center', color: '#cbd5e1', font: 'Inter' },
      { type: 'text', text: '{{recipient_name}}', x: 600, y: 320, size: 66, weight: 700, align: 'center', color: '#ffffff', font: 'Playfair Display' },
      { type: 'text', text: 'for successfully completing {{course_name}}', x: 600, y: 450, size: 26, weight: 400, align: 'center', color: '#cbd5e1', font: 'Inter' },
      { type: 'text', text: 'Date: {{date}}', x: 600, y: 560, size: 20, weight: 500, align: 'center', color: '#94a3b8', font: 'Inter' },
      { type: 'rect', x: 450, y: 665, w: 300, h: 2, color: '#c9a227' },
      { type: 'text', text: '{{signatory}}', x: 600, y: 678, size: 18, weight: 500, align: 'center', color: '#e2e8f0', font: 'Inter' },
      { type: 'text', text: 'Authorized Signature', x: 600, y: 706, size: 13, weight: 400, align: 'center', color: '#64748b', font: 'Inter' },
    ],
  },
  {
    id: 'invoice',
    name: 'Invoice',
    category: 'Documents',
    dims: { w: 900, h: 1160 },
    bg: { type: 'solid', color: '#ffffff' },
    fields: [
      { key: 'company_name', label: 'Your company', sample: 'PikFinder Inc.' },
      { key: 'invoice_number', label: 'Invoice #', sample: 'INV-1042' },
      { key: 'date', label: 'Date', sample: '20 Jul 2026' },
      { key: 'customer_name', label: 'Bill to', sample: 'Acme Corp' },
      { key: 'amount', label: 'Amount due', sample: '$1,250.00' },
    ],
    layers: [
      { type: 'rect', x: 0, y: 0, w: 900, h: 140, color: '#0f172a' },
      { type: 'text', text: '{{company_name}}', x: 60, y: 52, size: 34, weight: 800, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: 'INVOICE', x: 840, y: 52, size: 30, weight: 700, align: 'right', color: '#38bdf8', font: 'Outfit', spacing: 3 },
      { type: 'text', text: 'Invoice #: {{invoice_number}}', x: 60, y: 200, size: 20, weight: 500, align: 'left', color: '#0f172a', font: 'Inter' },
      { type: 'text', text: 'Date: {{date}}', x: 60, y: 236, size: 20, weight: 400, align: 'left', color: '#475569', font: 'Inter' },
      { type: 'text', text: 'BILL TO', x: 60, y: 330, size: 14, weight: 700, align: 'left', color: '#94a3b8', font: 'Inter', textCase: 'upper', spacing: 1 },
      { type: 'text', text: '{{customer_name}}', x: 60, y: 360, size: 26, weight: 600, align: 'left', color: '#0f172a', font: 'Inter' },
      { type: 'rect', x: 60, y: 460, w: 780, h: 1, color: '#e2e8f0' },
      { type: 'rect', x: 60, y: 900, w: 780, h: 120, color: '#f1f5f9', radius: 12 },
      { type: 'text', text: 'Amount Due', x: 90, y: 936, size: 18, weight: 500, align: 'left', color: '#475569', font: 'Inter' },
      { type: 'text', text: '{{amount}}', x: 810, y: 928, size: 40, weight: 800, align: 'right', color: '#0f172a', font: 'Outfit' },
      { type: 'text', text: 'Thank you for your business.', x: 60, y: 1080, size: 15, weight: 400, align: 'left', color: '#94a3b8', font: 'Inter' },
    ],
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'Branding',
    dims: { w: 1050, h: 600 },
    bg: { type: 'gradient', color: '#0f172a', color2: '#312e81', angle: 135 },
    fields: [
      { key: 'name', label: 'Full name', sample: 'Alex Morgan' },
      { key: 'designation', label: 'Designation', sample: 'Founder & CEO' },
      { key: 'phone', label: 'Phone', sample: '+91 98765 43210' },
      { key: 'email', label: 'Email', sample: 'alex@yourbrand.com' },
      { key: 'company', label: 'Company', sample: 'PikFinder' },
    ],
    layers: [
      { type: 'rect', x: 0, y: 0, w: 12, h: 600, color: '#8b5cf6' },
      { type: 'text', text: '{{name}}', x: 70, y: 150, size: 56, weight: 800, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: '{{designation}}', x: 72, y: 225, size: 24, weight: 500, align: 'left', color: '#a5b4fc', font: 'Inter' },
      { type: 'text', text: '{{phone}}', x: 72, y: 380, size: 22, weight: 400, align: 'left', color: '#e2e8f0', font: 'Inter' },
      { type: 'text', text: '{{email}}', x: 72, y: 420, size: 22, weight: 400, align: 'left', color: '#e2e8f0', font: 'Inter' },
      { type: 'text', text: '{{company}}', x: 980, y: 520, size: 26, weight: 700, align: 'right', color: '#8b5cf6', font: 'Outfit' },
    ],
  },
  {
    id: 'sale-banner',
    name: 'Sale Banner',
    category: 'Marketing',
    dims: { w: 1080, h: 1080 },
    bg: { type: 'gradient', color: '#e11d48', color2: '#7c2d12', angle: 160 },
    fields: [
      { key: 'headline', label: 'Headline', sample: 'MEGA SALE' },
      { key: 'discount', label: 'Discount', sample: '50% OFF' },
      { key: 'product_name', label: 'Product / detail', sample: 'On all products' },
      { key: 'cta', label: 'Call to action', sample: 'Shop now at pikfinder.com' },
    ],
    layers: [
      { type: 'text', text: '{{headline}}', x: 540, y: 300, size: 120, weight: 900, align: 'center', color: '#ffffff', font: 'Anton', textCase: 'upper', spacing: 4 },
      { type: 'rect', x: 240, y: 470, w: 600, h: 200, color: '#facc15', radius: 24 },
      { type: 'text', text: '{{discount}}', x: 540, y: 500, size: 130, weight: 900, align: 'center', color: '#7c2d12', font: 'Anton' },
      { type: 'text', text: '{{product_name}}', x: 540, y: 740, size: 40, weight: 600, align: 'center', color: '#ffe4e6', font: 'Inter' },
      { type: 'rect', x: 340, y: 860, w: 400, h: 90, color: '#ffffff', radius: 45 },
      { type: 'text', text: '{{cta}}', x: 540, y: 888, size: 26, weight: 700, align: 'center', color: '#e11d48', font: 'Inter' },
    ],
  },
];

// Derive the filter chips from the templates themselves so new categories
// (Letterhead, Flyers, Gift Cards, Coupons, Proposals, Cards, …) appear automatically.
export const BUSINESS_CATEGORIES = ['All', ...Array.from(new Set(BUSINESS_TEMPLATES.map((t) => t.category).filter(Boolean)))];
