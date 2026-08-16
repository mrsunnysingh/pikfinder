// src/business/premiumTemplates.js
// PikFinder EXCLUSIVE premium templates — original, high-quality vector designs
// authored as layer JSON. These render identically in the Studio and in the
// headless PNG/PDF generator (src/lib/render). Kept in their own file so the
// exclusive set is easy to find, extend, and protect.
//
// Layer vocabulary supported by the renderer:
//   text   { text, x, y, size, weight, align, color, font, textCase, spacing, italic, underline }
//   rect   { x, y, w, h, color|'none', radius, strokeW, strokeColor }
//   ellipse{ x, y, w, h, color, strokeW, strokeColor }
//   shape  { shape:'diamond|circle|hexagon|star5|star6|…', x, y, w, h, color, strokeW, strokeColor }
//   image  { src, x, y, w, h }
// Text supports {{placeholder}} tokens replaced from the record/field mapping.

const CERT_FIELDS = [
  { key: 'recipient_name', label: 'Recipient name', sample: 'Alexandra Morgan' },
  { key: 'course_name', label: 'Course / achievement', sample: 'Advanced Digital Marketing' },
  { key: 'date', label: 'Date', sample: '24 July 2026' },
  { key: 'signatory', label: 'Signatory', sample: 'Dr. R. Sharma' },
];
const INVOICE_FIELDS = [
  { key: 'company_name', label: 'Your company', sample: 'Northwind Studio' },
  { key: 'invoice_number', label: 'Invoice #', sample: 'INV-2048' },
  { key: 'date', label: 'Date', sample: '24 July 2026' },
  { key: 'customer_name', label: 'Bill to', sample: 'Acme Corporation' },
  { key: 'amount', label: 'Amount due', sample: '$2,450.00' },
];
const CARD_FIELDS = [
  { key: 'name', label: 'Full name', sample: 'Alexandra Morgan' },
  { key: 'designation', label: 'Designation', sample: 'Creative Director' },
  { key: 'phone', label: 'Phone', sample: '+1 415 555 0128' },
  { key: 'email', label: 'Email', sample: 'alex@northwind.co' },
  { key: 'company', label: 'Company', sample: 'Northwind Studio' },
];

// A refined award seal built from stacked shapes (font-independent).
const seal = (cx, cy, r, accent, inner) => ([
  { type: 'shape', shape: 'circle', x: cx - r, y: cy - r, w: r * 2, h: r * 2, color: accent },
  { type: 'shape', shape: 'circle', x: cx - r + 8, y: cy - r + 8, w: (r - 8) * 2, h: (r - 8) * 2, color: inner },
  { type: 'shape', shape: 'star5', x: cx - (r - 16), y: cy - (r - 16), w: (r - 16) * 2, h: (r - 16) * 2, color: accent },
]);

// ── Certificate style A — formal double-frame with corner ornaments + seal ──
function certSeal(id, name, p) {
  return {
    id, name, category: 'Education', dims: { w: 1200, h: 850 },
    bg: { type: 'solid', color: p.bg },
    fields: CERT_FIELDS,
    layers: [
      { type: 'rect', x: 44, y: 44, w: 1112, h: 762, color: 'none', strokeW: 2.5, strokeColor: p.frame, radius: 4 },
      { type: 'rect', x: 60, y: 60, w: 1080, h: 730, color: 'none', strokeW: 1, strokeColor: p.accent, radius: 2 },
      { type: 'shape', shape: 'diamond', x: 34, y: 34, w: 20, h: 20, color: p.accent },
      { type: 'shape', shape: 'diamond', x: 1146, y: 34, w: 20, h: 20, color: p.accent },
      { type: 'shape', shape: 'diamond', x: 34, y: 796, w: 20, h: 20, color: p.accent },
      { type: 'shape', shape: 'diamond', x: 1146, y: 796, w: 20, h: 20, color: p.accent },
      { type: 'text', text: 'CERTIFICATE', x: 600, y: 122, size: 24, weight: 700, align: 'center', color: p.accent, font: 'Outfit', textCase: 'upper', spacing: 10 },
      { type: 'text', text: 'OF ACHIEVEMENT', x: 600, y: 156, size: 15, weight: 500, align: 'center', color: p.sub, font: 'Outfit', textCase: 'upper', spacing: 6 },
      { type: 'text', text: 'This certificate is proudly presented to', x: 600, y: 250, size: 20, weight: 400, align: 'center', color: p.sub, font: 'Inter' },
      { type: 'text', text: '{{recipient_name}}', x: 600, y: 296, size: 70, weight: 700, align: 'center', color: p.name, font: 'Playfair Display' },
      { type: 'rect', x: 480, y: 412, w: 240, h: 2, color: p.accent },
      { type: 'text', text: 'for successfully completing', x: 600, y: 438, size: 18, weight: 400, align: 'center', color: p.sub, font: 'Inter' },
      { type: 'text', text: '{{course_name}}', x: 600, y: 468, size: 28, weight: 600, align: 'center', color: p.ink, font: 'Outfit' },
      ...seal(600, 600, 38, p.accent, p.bg),
      { type: 'text', text: '{{date}}', x: 340, y: 690, size: 20, weight: 600, align: 'center', color: p.ink, font: 'Inter' },
      { type: 'rect', x: 230, y: 720, w: 220, h: 1.5, color: p.sub },
      { type: 'text', text: 'DATE', x: 340, y: 730, size: 12, weight: 600, align: 'center', color: p.sub, font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{signatory}}', x: 860, y: 690, size: 20, weight: 600, align: 'center', color: p.ink, font: 'Inter' },
      { type: 'rect', x: 750, y: 720, w: 220, h: 1.5, color: p.sub },
      { type: 'text', text: 'SIGNATURE', x: 860, y: 730, size: 12, weight: 600, align: 'center', color: p.sub, font: 'Inter', textCase: 'upper', spacing: 2 },
    ],
  };
}

// ── Certificate style B — modern gradient with white card + hexagon badge ──
function certPanel(id, name, p) {
  return {
    id, name, category: 'Education', dims: { w: 1200, h: 850 },
    bg: { type: 'gradient', color: p.bg1, color2: p.bg2, angle: 135 },
    fields: CERT_FIELDS,
    layers: [
      { type: 'rect', x: 90, y: 70, w: 1020, h: 710, color: '#ffffff', radius: 16 },
      { type: 'rect', x: 90, y: 70, w: 10, h: 710, color: p.accent },
      { type: 'shape', shape: 'hexagon', x: 566, y: 108, w: 68, h: 68, color: p.accent },
      { type: 'shape', shape: 'star5', x: 582, y: 124, w: 36, h: 36, color: '#ffffff' },
      { type: 'text', text: 'CERTIFICATE OF ACHIEVEMENT', x: 600, y: 216, size: 26, weight: 700, align: 'center', color: p.accent, font: 'Outfit', textCase: 'upper', spacing: 3 },
      { type: 'text', text: 'Presented to', x: 600, y: 288, size: 19, weight: 400, align: 'center', color: '#64748b', font: 'Inter' },
      { type: 'text', text: '{{recipient_name}}', x: 600, y: 328, size: 64, weight: 700, align: 'center', color: '#0f172a', font: 'Playfair Display' },
      { type: 'rect', x: 500, y: 440, w: 200, h: 3, color: p.accent, radius: 2 },
      { type: 'text', text: 'for successfully completing', x: 600, y: 476, size: 18, weight: 400, align: 'center', color: '#64748b', font: 'Inter' },
      { type: 'text', text: '{{course_name}}', x: 600, y: 506, size: 26, weight: 600, align: 'center', color: '#0f172a', font: 'Outfit' },
      { type: 'text', text: '{{date}}', x: 340, y: 650, size: 18, weight: 600, align: 'center', color: '#0f172a', font: 'Inter' },
      { type: 'rect', x: 250, y: 680, w: 180, h: 1.5, color: '#cbd5e1' },
      { type: 'text', text: 'DATE', x: 340, y: 690, size: 11, weight: 600, align: 'center', color: '#94a3b8', font: 'Inter', spacing: 2 },
      { type: 'text', text: '{{signatory}}', x: 860, y: 650, size: 18, weight: 600, align: 'center', color: '#0f172a', font: 'Inter' },
      { type: 'rect', x: 770, y: 680, w: 180, h: 1.5, color: '#cbd5e1' },
      { type: 'text', text: 'SIGNATURE', x: 860, y: 690, size: 11, weight: 600, align: 'center', color: '#94a3b8', font: 'Inter', spacing: 2 },
    ],
  };
}

// ── Invoice style A — executive header band, table, accent total panel ──
function invExec(id, name, p) {
  const ink = '#0f172a', sub = '#64748b', line = '#e2e8f0';
  return {
    id, name, category: 'Documents', dims: { w: 900, h: 1160 },
    bg: { type: 'solid', color: '#ffffff' },
    fields: INVOICE_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 900, h: 150, color: p.band },
      { type: 'shape', shape: 'circle', x: 60, y: 45, w: 60, h: 60, color: '#ffffff' },
      { type: 'text', text: p.mono, x: 90, y: 60, size: 30, weight: 800, align: 'center', color: p.band, font: 'Outfit' },
      { type: 'text', text: '{{company_name}}', x: 140, y: 58, size: 30, weight: 800, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: 'INVOICE', x: 840, y: 60, size: 30, weight: 700, align: 'right', color: p.badge, font: 'Outfit', spacing: 4 },
      { type: 'text', text: 'Invoice #  {{invoice_number}}', x: 60, y: 210, size: 18, weight: 600, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: 'Date  {{date}}', x: 60, y: 244, size: 18, weight: 400, align: 'left', color: sub, font: 'Inter' },
      { type: 'text', text: 'BILL TO', x: 60, y: 330, size: 13, weight: 700, align: 'left', color: p.band, font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{customer_name}}', x: 60, y: 358, size: 26, weight: 600, align: 'left', color: ink, font: 'Inter' },
      { type: 'rect', x: 60, y: 450, w: 780, h: 44, color: '#f1f5f9', radius: 8 },
      { type: 'text', text: 'DESCRIPTION', x: 80, y: 464, size: 12, weight: 700, align: 'left', color: sub, font: 'Inter', spacing: 1 },
      { type: 'text', text: 'AMOUNT', x: 820, y: 464, size: 12, weight: 700, align: 'right', color: sub, font: 'Inter', spacing: 1 },
      { type: 'text', text: 'Professional services rendered', x: 80, y: 522, size: 16, weight: 400, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: '{{amount}}', x: 820, y: 522, size: 16, weight: 600, align: 'right', color: ink, font: 'Inter' },
      { type: 'rect', x: 60, y: 562, w: 780, h: 1, color: line },
      { type: 'rect', x: 480, y: 900, w: 360, h: 96, color: p.band, radius: 12 },
      { type: 'text', text: 'AMOUNT DUE', x: 510, y: 932, size: 14, weight: 500, align: 'left', color: p.badge, font: 'Inter', spacing: 1 },
      { type: 'text', text: '{{amount}}', x: 820, y: 922, size: 36, weight: 800, align: 'right', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: 'Thank you for your business.', x: 60, y: 1090, size: 15, weight: 400, align: 'left', color: sub, font: 'Inter' },
    ],
  };
}

// ── Invoice style B — minimal luxe, thin accent rule, big total ──
function invLuxe(id, name, p) {
  const ink = '#1a1a1a', sub = '#8a8a8a', line = '#ececec';
  return {
    id, name, category: 'Documents', dims: { w: 900, h: 1160 },
    bg: { type: 'solid', color: '#ffffff' },
    fields: INVOICE_FIELDS,
    layers: [
      { type: 'text', text: '{{company_name}}', x: 60, y: 78, size: 30, weight: 800, align: 'left', color: ink, font: 'Outfit' },
      { type: 'text', text: 'INVOICE', x: 840, y: 84, size: 26, weight: 400, align: 'right', color: p.accent, font: 'Outfit', spacing: 6 },
      { type: 'rect', x: 60, y: 140, w: 780, h: 2, color: p.accent },
      { type: 'text', text: 'Invoice #  {{invoice_number}}', x: 60, y: 182, size: 16, weight: 500, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: 'Date  {{date}}', x: 60, y: 212, size: 16, weight: 400, align: 'left', color: sub, font: 'Inter' },
      { type: 'text', text: 'BILLED TO', x: 840, y: 178, size: 12, weight: 700, align: 'right', color: sub, font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{customer_name}}', x: 840, y: 204, size: 20, weight: 600, align: 'right', color: ink, font: 'Inter' },
      { type: 'rect', x: 60, y: 300, w: 780, h: 1, color: line },
      { type: 'text', text: 'Professional services rendered', x: 60, y: 332, size: 16, weight: 400, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: '{{amount}}', x: 840, y: 332, size: 16, weight: 500, align: 'right', color: ink, font: 'Inter' },
      { type: 'rect', x: 60, y: 384, w: 780, h: 1, color: line },
      { type: 'text', text: 'Total due', x: 60, y: 448, size: 18, weight: 600, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: '{{amount}}', x: 840, y: 430, size: 46, weight: 800, align: 'right', color: p.accent, font: 'Outfit' },
      { type: 'rect', x: 60, y: 1060, w: 780, h: 1, color: line },
      { type: 'text', text: 'Thank you for your business.', x: 60, y: 1086, size: 14, weight: 400, align: 'left', color: sub, font: 'Inter' },
    ],
  };
}

// ── Business card — premium dark gradient, monogram, accent rail ──
function cardPremium(id, name, p) {
  return {
    id, name, category: 'Branding', dims: { w: 1050, h: 600 },
    bg: { type: 'gradient', color: p.bg1, color2: p.bg2, angle: 135 },
    fields: CARD_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 16, h: 600, color: p.accent },
      { type: 'shape', shape: 'circle', x: 62, y: 60, w: 70, h: 70, color: p.accent },
      { type: 'text', text: p.mono, x: 97, y: 78, size: 34, weight: 800, align: 'center', color: p.bg1, font: 'Outfit' },
      { type: 'text', text: '{{name}}', x: 62, y: 250, size: 52, weight: 800, align: 'left', color: p.ink, font: 'Outfit' },
      { type: 'text', text: '{{designation}}', x: 64, y: 322, size: 22, weight: 500, align: 'left', color: p.accent, font: 'Inter' },
      { type: 'text', text: '{{phone}}', x: 64, y: 408, size: 20, weight: 400, align: 'left', color: p.sub, font: 'Inter' },
      { type: 'text', text: '{{email}}', x: 64, y: 444, size: 20, weight: 400, align: 'left', color: p.sub, font: 'Inter' },
      { type: 'text', text: '{{company}}', x: 986, y: 520, size: 24, weight: 700, align: 'right', color: p.accent, font: 'Outfit' },
    ],
  };
}

// ── New category field sets ──────────────────────────────────────────────
const LETTERHEAD_FIELDS = [
  { key: 'company_name', label: 'Company', sample: 'Northwind Studio' },
  { key: 'tagline', label: 'Tagline', sample: 'Design that works' },
  { key: 'address', label: 'Address', sample: '221B Baker St, London' },
  { key: 'contact', label: 'Contact', sample: 'hello@northwind.co · +1 415 555 0128' },
];
const FLYER_FIELDS = [
  { key: 'event_title', label: 'Event title', sample: 'Summer Fest' },
  { key: 'date', label: 'Date & time', sample: 'Sat 15 Aug · 6 PM' },
  { key: 'venue', label: 'Venue', sample: 'Riverside Park' },
  { key: 'detail', label: 'Detail', sample: 'Live music · Food trucks · Free entry' },
];
const GIFT_FIELDS = [
  { key: 'brand', label: 'Brand', sample: 'Northwind' },
  { key: 'amount', label: 'Amount', sample: '$100' },
  { key: 'code', label: 'Code', sample: 'GIFT-7788' },
  { key: 'expiry', label: 'Expiry', sample: '31 Dec 2026' },
];
const COUPON_FIELDS = [
  { key: 'brand', label: 'Brand', sample: 'Northwind' },
  { key: 'offer', label: 'Offer', sample: '30% OFF' },
  { key: 'code', label: 'Code', sample: 'SAVE30' },
  { key: 'expiry', label: 'Expiry', sample: '31 Aug' },
];
const PROPOSAL_FIELDS = [
  { key: 'title', label: 'Title', sample: 'Brand Redesign Proposal' },
  { key: 'client_name', label: 'Client', sample: 'Acme Corporation' },
  { key: 'date', label: 'Date', sample: '24 July 2026' },
  { key: 'prepared_by', label: 'Prepared by', sample: 'Alexandra Morgan' },
];
const THANKYOU_FIELDS = [{ key: 'message', label: 'Message', sample: 'for being an amazing customer' }];

// ── Letterhead (A4 branded stationery) ──
function letterhead(id, name, p) {
  const ink = '#1f2937', sub = '#6b7280';
  return {
    id, name, category: 'Letterhead', dims: { w: 850, h: 1100 }, bg: { type: 'solid', color: '#ffffff' }, fields: LETTERHEAD_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 850, h: 8, color: p.accent },
      { type: 'shape', shape: 'circle', x: 60, y: 52, w: 52, h: 52, color: p.accent },
      { type: 'text', text: p.mono, x: 86, y: 66, size: 26, weight: 800, align: 'center', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: '{{company_name}}', x: 130, y: 60, size: 28, weight: 800, align: 'left', color: ink, font: 'Outfit' },
      { type: 'text', text: '{{tagline}}', x: 132, y: 98, size: 14, weight: 500, align: 'left', color: p.accent, font: 'Inter' },
      { type: 'rect', x: 60, y: 142, w: 730, h: 1.5, color: '#e5e7eb' },
      { type: 'text', text: 'Date: ______________________', x: 60, y: 210, size: 15, weight: 400, align: 'left', color: sub, font: 'Inter' },
      { type: 'text', text: 'Dear ______________________,', x: 60, y: 270, size: 16, weight: 500, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: 'Type your letter here…', x: 60, y: 330, size: 15, weight: 400, align: 'left', color: '#9ca3af', font: 'Inter' },
      { type: 'rect', x: 0, y: 1036, w: 850, h: 56, color: '#f3f4f6' },
      { type: 'text', text: '{{address}}', x: 60, y: 1056, size: 12, weight: 400, align: 'left', color: sub, font: 'Inter' },
      { type: 'text', text: '{{contact}}', x: 790, y: 1056, size: 12, weight: 500, align: 'right', color: p.accent, font: 'Inter' },
      { type: 'rect', x: 0, y: 1092, w: 850, h: 8, color: p.accent },
    ],
  };
}

// ── Event flyer (portrait) ──
function flyer(id, name, p) {
  return {
    id, name, category: 'Flyers', dims: { w: 1080, h: 1350 }, bg: { type: 'gradient', color: p.bg1, color2: p.bg2, angle: 150 }, fields: FLYER_FIELDS,
    layers: [
      { type: 'text', text: p.eyebrow || 'YOU’RE INVITED', x: 540, y: 150, size: 26, weight: 700, align: 'center', color: '#ffffff', font: 'Inter', textCase: 'upper', spacing: 8 },
      { type: 'rect', x: 340, y: 208, w: 400, h: 3, color: p.accent },
      { type: 'text', text: '{{event_title}}', x: 540, y: 300, size: 96, weight: 900, align: 'center', color: '#ffffff', font: 'Anton', textCase: 'upper' },
      { type: 'text', text: '{{date}}', x: 540, y: 560, size: 40, weight: 700, align: 'center', color: p.accent2 || '#fde047', font: 'Poppins' },
      { type: 'text', text: '{{venue}}', x: 540, y: 640, size: 30, weight: 500, align: 'center', color: '#e5e7eb', font: 'Inter' },
      { type: 'text', text: '{{detail}}', x: 540, y: 760, size: 26, weight: 400, align: 'center', color: '#cbd5e1', font: 'Inter' },
      { type: 'rect', x: 390, y: 900, w: 300, h: 88, color: '#ffffff', radius: 44 },
      { type: 'text', text: 'RSVP NOW', x: 540, y: 930, size: 26, weight: 700, align: 'center', color: p.bg1, font: 'Inter' },
    ],
  };
}

// ── Gift card ──
function giftCert(id, name, p) {
  return {
    id, name, category: 'Gift Cards', dims: { w: 1200, h: 628 }, bg: { type: 'solid', color: p.bg }, fields: GIFT_FIELDS,
    layers: [
      { type: 'rect', x: 30, y: 30, w: 1140, h: 568, color: 'none', strokeW: 2, strokeColor: p.accent, radius: 12 },
      { type: 'text', text: 'GIFT CARD', x: 600, y: 100, size: 30, weight: 700, align: 'center', color: p.accent, font: 'Outfit', textCase: 'upper', spacing: 8 },
      { type: 'text', text: '{{brand}}', x: 600, y: 160, size: 44, weight: 800, align: 'center', color: p.ink, font: 'Playfair Display' },
      { type: 'text', text: '{{amount}}', x: 600, y: 280, size: 120, weight: 900, align: 'center', color: p.accent, font: 'Outfit' },
      { type: 'text', text: 'Code: {{code}}', x: 600, y: 460, size: 24, weight: 600, align: 'center', color: p.ink, font: 'Inter', spacing: 2 },
      { type: 'text', text: 'Valid until {{expiry}}', x: 600, y: 510, size: 16, weight: 400, align: 'center', color: p.sub, font: 'Inter' },
    ],
  };
}

// ── Coupon (ticket-style) ──
function coupon(id, name, p) {
  return {
    id, name, category: 'Coupons', dims: { w: 1200, h: 600 }, bg: { type: 'solid', color: '#ffffff' }, fields: COUPON_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 760, h: 600, color: p.panel },
      { type: 'text', text: '{{brand}}', x: 60, y: 70, size: 26, weight: 700, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: '{{offer}}', x: 60, y: 200, size: 120, weight: 900, align: 'left', color: '#ffffff', font: 'Anton' },
      { type: 'text', text: 'Limited time only', x: 62, y: 410, size: 26, weight: 500, align: 'left', color: p.onPanelSub || '#e5e7eb', font: 'Inter' },
      { type: 'text', text: 'USE CODE', x: 980, y: 230, size: 20, weight: 600, align: 'center', color: '#94a3b8', font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{code}}', x: 980, y: 262, size: 46, weight: 900, align: 'center', color: p.panel, font: 'Outfit' },
      { type: 'text', text: 'Exp {{expiry}}', x: 980, y: 340, size: 16, weight: 400, align: 'center', color: '#94a3b8', font: 'Inter' },
    ],
  };
}

// ── Proposal cover (A4) ──
function proposal(id, name, p) {
  return {
    id, name, category: 'Proposals', dims: { w: 850, h: 1100 }, bg: { type: 'gradient', color: p.bg1, color2: p.bg2, angle: 160 }, fields: PROPOSAL_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 12, h: 1100, color: p.accent },
      { type: 'text', text: 'PROPOSAL', x: 70, y: 120, size: 24, weight: 700, align: 'left', color: '#ffffff', font: 'Inter', textCase: 'upper', spacing: 8 },
      { type: 'text', text: '{{title}}', x: 70, y: 200, size: 68, weight: 800, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'rect', x: 70, y: 440, w: 200, h: 4, color: p.accent },
      { type: 'text', text: 'Prepared for', x: 70, y: 820, size: 16, weight: 500, align: 'left', color: '#cbd5e1', font: 'Inter' },
      { type: 'text', text: '{{client_name}}', x: 70, y: 850, size: 34, weight: 700, align: 'left', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: 'Prepared by {{prepared_by}} · {{date}}', x: 70, y: 962, size: 16, weight: 400, align: 'left', color: '#94a3b8', font: 'Inter' },
    ],
  };
}

// ── Thank-you card ──
function thankYou(id, name, p) {
  return {
    id, name, category: 'Cards', dims: { w: 1050, h: 600 }, bg: p.bg2 ? { type: 'gradient', color: p.bg, color2: p.bg2, angle: 135 } : { type: 'solid', color: p.bg }, fields: THANKYOU_FIELDS,
    layers: [
      { type: 'text', text: 'Thank', x: 525, y: 160, size: 110, weight: 500, align: 'center', color: '#ffffff', font: 'Playfair Display' },
      { type: 'text', text: 'You', x: 525, y: 285, size: 110, weight: 500, align: 'center', color: p.accent, font: 'Playfair Display' },
      { type: 'rect', x: 425, y: 428, w: 200, h: 2, color: p.accent },
      { type: 'text', text: '{{message}}', x: 525, y: 468, size: 24, weight: 400, align: 'center', color: p.sub || '#e5e7eb', font: 'Inter' },
    ],
  };
}

const RESUME_FIELDS = [
  { key: 'full_name', label: 'Full name', sample: 'Alexandra Morgan' },
  { key: 'job_title', label: 'Job title', sample: 'Marketing Manager' },
  { key: 'email', label: 'Email', sample: 'alex@email.com' },
  { key: 'phone', label: 'Phone', sample: '+1 415 555 0128' },
  { key: 'summary', label: 'Profile', sample: 'Creative marketer with 8+ years\ndriving growth through brand and content.' },
];
const MENU_FIELDS = [
  { key: 'restaurant_name', label: 'Restaurant name', sample: 'The Corner Kitchen' },
  { key: 'tagline', label: 'Tagline', sample: 'Fresh · Local · Seasonal' },
];
const IDCARD_FIELDS = [
  { key: 'name', label: 'Name', sample: 'Alexandra Morgan' },
  { key: 'role', label: 'Role / title', sample: 'Design Lead' },
  { key: 'id_number', label: 'ID number', sample: 'EMP-04821' },
  { key: 'company', label: 'Company', sample: 'Northwind Studio' },
];

// ── Resume / CV (A4, sidebar layout) ──
function resume(id, name, p) {
  const ink = '#111827', sub = '#6b7280', line = '#e5e7eb';
  const sec = (t, y) => ([
    { type: 'text', text: t, x: 320, y, size: 15, weight: 700, align: 'left', color: p.accent, font: 'Inter', textCase: 'upper', spacing: 2 },
    { type: 'rect', x: 320, y: y + 26, w: 470, h: 2, color: line },
  ]);
  return {
    id, name, category: 'Resume', dims: { w: 850, h: 1100 }, bg: { type: 'solid', color: '#ffffff' }, fields: RESUME_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 280, h: 1100, color: p.side },
      { type: 'text', text: '{{full_name}}', x: 40, y: 66, size: 30, weight: 800, align: 'left', color: p.onSide, font: 'Outfit' },
      { type: 'text', text: '{{job_title}}', x: 40, y: 116, size: 15, weight: 500, align: 'left', color: p.onSideSub, font: 'Inter' },
      { type: 'text', text: 'CONTACT', x: 40, y: 210, size: 12, weight: 700, align: 'left', color: p.accent2 || p.onSide, font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{email}}', x: 40, y: 238, size: 12, weight: 400, align: 'left', color: p.onSideSub, font: 'Inter' },
      { type: 'text', text: '{{phone}}', x: 40, y: 262, size: 12, weight: 400, align: 'left', color: p.onSideSub, font: 'Inter' },
      { type: 'text', text: 'SKILLS', x: 40, y: 330, size: 12, weight: 700, align: 'left', color: p.accent2 || p.onSide, font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: 'Strategy · Branding\nContent · Leadership', x: 40, y: 358, size: 12, weight: 400, align: 'left', color: p.onSideSub, font: 'Inter', lineHeight: 1.6 },
      ...sec('Profile', 66),
      { type: 'text', text: '{{summary}}', x: 320, y: 104, size: 14, weight: 400, align: 'left', color: sub, font: 'Inter', lineHeight: 1.6 },
      ...sec('Experience', 230),
      { type: 'text', text: 'Senior Manager — Company', x: 320, y: 268, size: 16, weight: 700, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: '2022 – Present', x: 320, y: 292, size: 12, weight: 500, align: 'left', color: sub, font: 'Inter' },
      { type: 'text', text: 'Led campaigns and delivered results.\nReplace with your own experience.', x: 320, y: 318, size: 13, weight: 400, align: 'left', color: sub, font: 'Inter', lineHeight: 1.5 },
      ...sec('Education', 460),
      { type: 'text', text: 'B.A. Marketing — University', x: 320, y: 498, size: 14, weight: 600, align: 'left', color: ink, font: 'Inter' },
      { type: 'text', text: '2014 – 2018', x: 320, y: 522, size: 12, weight: 400, align: 'left', color: sub, font: 'Inter' },
    ],
  };
}

// ── Restaurant menu (A4) ──
function menu(id, name, p) {
  const ink = p.ink || '#1f2937', sub = p.sub || '#6b7280';
  const item = (n, price, y) => ([
    { type: 'text', text: n, x: 90, y, size: 20, weight: 600, align: 'left', color: ink, font: 'Inter' },
    { type: 'text', text: price, x: 760, y, size: 20, weight: 700, align: 'right', color: p.accent, font: 'Outfit' },
  ]);
  const head = (t, y) => ({ type: 'text', text: t, x: 425, y, size: 22, weight: 800, align: 'center', color: p.accent, font: 'Outfit', textCase: 'upper', spacing: 4 });
  return {
    id, name, category: 'Menus', dims: { w: 850, h: 1100 }, bg: { type: 'solid', color: p.bg }, fields: MENU_FIELDS,
    layers: [
      { type: 'text', text: '{{restaurant_name}}', x: 425, y: 70, size: 46, weight: 800, align: 'center', color: ink, font: 'Playfair Display' },
      { type: 'text', text: '{{tagline}}', x: 425, y: 132, size: 16, weight: 500, align: 'center', color: sub, font: 'Inter', textCase: 'upper', spacing: 3 },
      { type: 'rect', x: 325, y: 172, w: 200, h: 2, color: p.accent },
      head('Starters', 240), item('Soup of the day', '$8', 300), item('Garden salad', '$10', 344), item('Bruschetta', '$9', 388),
      head('Mains', 480), item('Grilled salmon', '$24', 540), item('Ribeye steak', '$32', 584), item('Wild mushroom risotto', '$19', 628),
      head('Desserts', 720), item('Chocolate fondant', '$11', 780), item('Seasonal fruit tart', '$9', 824),
    ],
  };
}

// ── ID / membership card (portrait) ──
function idCard(id, name, p) {
  return {
    id, name, category: 'ID Cards', dims: { w: 640, h: 1000 }, bg: { type: 'solid', color: '#ffffff' }, fields: IDCARD_FIELDS,
    layers: [
      { type: 'rect', x: 0, y: 0, w: 640, h: 200, color: p.accent },
      { type: 'text', text: '{{company}}', x: 320, y: 70, size: 30, weight: 800, align: 'center', color: '#ffffff', font: 'Outfit' },
      { type: 'text', text: 'IDENTITY CARD', x: 320, y: 118, size: 14, weight: 600, align: 'center', color: p.onAccentSub || '#e5e7eb', font: 'Inter', textCase: 'upper', spacing: 3 },
      { type: 'shape', shape: 'circle', x: 220, y: 260, w: 200, h: 200, color: p.photo || '#e5e7eb' },
      { type: 'text', text: 'PHOTO', x: 320, y: 350, size: 14, weight: 600, align: 'center', color: '#9ca3af', font: 'Inter', spacing: 2 },
      { type: 'text', text: '{{name}}', x: 320, y: 520, size: 34, weight: 800, align: 'center', color: '#111827', font: 'Outfit' },
      { type: 'text', text: '{{role}}', x: 320, y: 568, size: 20, weight: 500, align: 'center', color: p.accent, font: 'Inter' },
      { type: 'rect', x: 120, y: 640, w: 400, h: 1.5, color: '#e5e7eb' },
      { type: 'text', text: 'ID No.', x: 320, y: 680, size: 13, weight: 600, align: 'center', color: '#9ca3af', font: 'Inter', textCase: 'upper', spacing: 2 },
      { type: 'text', text: '{{id_number}}', x: 320, y: 706, size: 24, weight: 700, align: 'center', color: '#111827', font: 'Outfit', spacing: 2 },
      { type: 'rect', x: 0, y: 940, w: 640, h: 60, color: p.accent },
    ],
  };
}

export const PREMIUM_TEMPLATES = [
  // Certificates — formal seal
  certSeal('pro-cert-navy-gold', 'Certificate — Navy & Gold Seal', { bg: '#0b1836', frame: '#c9a227', accent: '#c9a227', ink: '#ffffff', sub: '#9fb3d1', name: '#ffffff' }),
  certSeal('pro-cert-emerald', 'Certificate — Emerald & Gold', { bg: '#06281f', frame: '#d4af37', accent: '#d4af37', ink: '#ffffff', sub: '#93c9b4', name: '#ffffff' }),
  certSeal('pro-cert-burgundy', 'Certificate — Burgundy Royal', { bg: '#2a0a12', frame: '#d4af37', accent: '#d4af37', ink: '#ffffff', sub: '#d9a7b0', name: '#ffffff' }),
  certSeal('pro-cert-classic', 'Certificate — Classic Ivory', { bg: '#ffffff', frame: '#1f2937', accent: '#b58b2a', ink: '#111827', sub: '#6b7280', name: '#111827' }),
  // Certificates — modern panel
  certPanel('pro-cert-indigo', 'Certificate — Indigo Modern', { bg1: '#4f46e5', bg2: '#7c3aed', accent: '#6366f1' }),
  certPanel('pro-cert-teal', 'Certificate — Teal Modern', { bg1: '#0d9488', bg2: '#0891b2', accent: '#0d9488' }),
  certPanel('pro-cert-sunset', 'Certificate — Sunset Modern', { bg1: '#db2777', bg2: '#f97316', accent: '#db2777' }),
  // Invoices — executive band
  invExec('pro-inv-navy', 'Invoice — Executive Navy', { band: '#0f172a', badge: '#38bdf8', mono: 'N' }),
  invExec('pro-inv-emerald', 'Invoice — Executive Emerald', { band: '#065f46', badge: '#6ee7b7', mono: 'E' }),
  invExec('pro-inv-violet', 'Invoice — Executive Violet', { band: '#5b21b6', badge: '#c4b5fd', mono: 'V' }),
  invExec('pro-inv-slate', 'Invoice — Executive Slate', { band: '#334155', badge: '#cbd5e1', mono: 'S' }),
  // Invoices — minimal luxe
  invLuxe('pro-inv-gold', 'Invoice — Minimal Gold', { accent: '#b58b2a' }),
  invLuxe('pro-inv-teal', 'Invoice — Minimal Teal', { accent: '#0d9488' }),
  invLuxe('pro-inv-indigo', 'Invoice — Minimal Indigo', { accent: '#4f46e5' }),
  invLuxe('pro-inv-rose', 'Invoice — Minimal Rose', { accent: '#db2777' }),
  // Business cards
  cardPremium('pro-card-violet', 'Business Card — Midnight Violet', { bg1: '#0f172a', bg2: '#312e81', accent: '#8b5cf6', ink: '#ffffff', sub: '#cbd5e1', mono: 'A' }),
  cardPremium('pro-card-emerald', 'Business Card — Emerald Noir', { bg1: '#052e2b', bg2: '#064e3b', accent: '#34d399', ink: '#ffffff', sub: '#a7f3d0', mono: 'A' }),
  cardPremium('pro-card-gold', 'Business Card — Charcoal Gold', { bg1: '#1c1917', bg2: '#292524', accent: '#d4af37', ink: '#ffffff', sub: '#d6d3d1', mono: 'A' }),

  // More certificates & invoices
  certSeal('pro-cert-slate', 'Certificate — Slate Minimal', { bg: '#f8fafc', frame: '#334155', accent: '#0ea5e9', ink: '#0f172a', sub: '#64748b', name: '#0f172a' }),
  certPanel('pro-cert-rose', 'Certificate — Rose Modern', { bg1: '#e11d48', bg2: '#9f1239', accent: '#e11d48' }),
  invExec('pro-inv-teal2', 'Invoice — Executive Teal', { band: '#0f766e', badge: '#5eead4', mono: 'T' }),
  invLuxe('pro-inv-charcoal', 'Invoice — Minimal Charcoal', { accent: '#1f2937' }),

  // Letterheads
  letterhead('pro-letter-navy', 'Letterhead — Navy', { accent: '#1e3a8a', mono: 'N' }),
  letterhead('pro-letter-emerald', 'Letterhead — Emerald', { accent: '#047857', mono: 'E' }),
  letterhead('pro-letter-rose', 'Letterhead — Rose', { accent: '#be185d', mono: 'R' }),

  // Event flyers
  flyer('pro-flyer-violet', 'Flyer — Night Violet', { bg1: '#2e1065', bg2: '#4c1d95', accent: '#a78bfa', accent2: '#fde047' }),
  flyer('pro-flyer-sunset', 'Flyer — Sunset', { bg1: '#9a3412', bg2: '#b91c1c', accent: '#fca5a5', accent2: '#fde047' }),
  flyer('pro-flyer-teal', 'Flyer — Ocean', { bg1: '#0e7490', bg2: '#155e75', accent: '#67e8f9', accent2: '#fde047' }),

  // Gift cards
  giftCert('pro-gift-black', 'Gift Card — Black & Gold', { bg: '#0b0b0d', accent: '#d4af37', ink: '#ffffff', sub: '#9ca3af' }),
  giftCert('pro-gift-emerald', 'Gift Card — Emerald', { bg: '#052e2b', accent: '#34d399', ink: '#ffffff', sub: '#6ee7b7' }),
  giftCert('pro-gift-blush', 'Gift Card — Blush', { bg: '#fdf2f8', accent: '#db2777', ink: '#831843', sub: '#9d174d' }),

  // Coupons
  coupon('pro-coupon-red', 'Coupon — Bold Red', { panel: '#dc2626', onPanelSub: '#fecaca' }),
  coupon('pro-coupon-indigo', 'Coupon — Indigo', { panel: '#4338ca', onPanelSub: '#c7d2fe' }),
  coupon('pro-coupon-green', 'Coupon — Fresh Green', { panel: '#15803d', onPanelSub: '#bbf7d0' }),

  // Proposals
  proposal('pro-proposal-indigo', 'Proposal — Indigo Cover', { bg1: '#312e81', bg2: '#1e1b4b', accent: '#818cf8' }),
  proposal('pro-proposal-slate', 'Proposal — Slate Cover', { bg1: '#0f172a', bg2: '#334155', accent: '#38bdf8' }),

  // Thank-you cards
  thankYou('pro-thanks-violet', 'Thank You — Violet', { bg: '#2e1065', bg2: '#4c1d95', accent: '#c4b5fd', sub: '#e9d5ff' }),
  thankYou('pro-thanks-emerald', 'Thank You — Emerald', { bg: '#064e3b', bg2: '#065f46', accent: '#6ee7b7', sub: '#d1fae5' }),

  // Resumes / CVs
  resume('pro-resume-navy', 'Resume — Navy Sidebar', { side: '#0f172a', onSide: '#ffffff', onSideSub: '#cbd5e1', accent: '#2563eb', accent2: '#93c5fd' }),
  resume('pro-resume-emerald', 'Resume — Emerald Sidebar', { side: '#064e3b', onSide: '#ffffff', onSideSub: '#a7f3d0', accent: '#059669', accent2: '#6ee7b7' }),
  resume('pro-resume-charcoal', 'Resume — Charcoal Minimal', { side: '#1f2937', onSide: '#ffffff', onSideSub: '#d1d5db', accent: '#4b5563', accent2: '#9ca3af' }),

  // Menus
  menu('pro-menu-cream', 'Menu — Cream Classic', { bg: '#fdfaf3', accent: '#b45309', ink: '#3f2d1a', sub: '#8a6d4b' }),
  menu('pro-menu-dark', 'Menu — Dark Elegant', { bg: '#111827', accent: '#f59e0b', ink: '#f9fafb', sub: '#9ca3af' }),

  // ID cards
  idCard('pro-id-blue', 'ID Card — Corporate Blue', { accent: '#1d4ed8', photo: '#dbeafe' }),
  idCard('pro-id-emerald', 'ID Card — Emerald', { accent: '#047857', photo: '#d1fae5' }),
];
