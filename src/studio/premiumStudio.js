// src/studio/premiumStudio.js
// EXCLUSIVE premium Studio templates:
//  1) photo + gradient social/marketing posts (real stock photos, attribution-free)
//  2) the premium business set (certificates / invoices / cards) surfaced in the
//     Studio panel with sample text filled in (from src/business/premiumTemplates.js).
// Kept separate so the exclusive set is easy to find and extend.

import { PREMIUM_TEMPLATES } from '../business/premiumTemplates.js';

const S = (color) => ({ type: 'solid', color });

// Attribution-free Pexels photos (stable CDN), sized for a 1080² canvas.
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const PH = {
  gradPastel: px(7135053),
  gradBlue: px(6985132),
  fashionW: px(34921744),
  fashionM: px(31589335),
  office: px(9300768),
  coffee: px(27860686),
  dessert: px(27972413),
  gourmet: px(1327393),
  beach: px(6910147),
  beach2: px(14570522),
  gym: px(3888405),
  gym2: px(3838705),
  laptop: px(265144),
  interior: px(6980724),
  mountain: px(38409470),
};

const imgLayer = (src) => ({
  type: 'image', src, x: 0, y: 0, w: 1080, h: 1080, opacity: 1,
  adjust: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
  imgStyle: { rotate: 0, flipH: false, flipV: false, radius: 0, shadow: 0 },
});

// Photo poster: full-bleed image + dark overlay for legibility + centred text stack.
function photoPoster(name, group, cat, img, lines, opts = {}) {
  const ov = opts.overlay || { color: '#0b1020', opacity: 0.42 };
  const layers = [imgLayer(img), { type: 'rect', x: 0, y: 0, w: 1080, h: 1080, color: ov.color, opacity: ov.opacity }];
  const align = opts.align || 'center';
  const cx = align === 'left' ? 96 : 540;
  const gap = 1.16;
  let total = lines.reduce((s, l) => s + l.size * gap, 0);
  if (opts.button) total += 130;
  let y = (opts.anchorY ?? 540) - total / 2 + (opts.topBias || 0);
  if (opts.eyebrow) {
    layers.push({ type: 'text', text: opts.eyebrow.t, x: cx, y: Math.round(y - 70), size: 26, weight: 700, align, spacing: 8, color: opts.eyebrow.color || '#ffffff', font: 'Inter', textCase: 'upper', _w: 900, _h: 34 });
  }
  for (const l of lines) {
    layers.push({ type: 'text', text: l.t, x: cx, y: Math.round(y), size: l.size, weight: l.weight ?? 800, align, spacing: l.spacing ?? 0, color: l.color, font: l.font ?? 'Poppins', _w: align === 'left' ? 900 : 980, _h: Math.round(l.size * 1.3) });
    y += l.size * gap;
  }
  if (opts.button) {
    y += 34;
    const bw = opts.button.w ?? 320, bx = cx - bw / 2;
    layers.push({ type: 'rect', x: bx, y: Math.round(y), w: bw, h: 84, color: opts.button.bg, radius: opts.button.radius ?? 42 });
    layers.push({ type: 'text', text: opts.button.text, x: cx, y: Math.round(y) + 28, size: 24, weight: 700, align: 'center', spacing: 1, color: opts.button.color, font: 'Inter', _w: bw - 16, _h: 30 });
  }
  return { name, group, cat, category: group, presetId: 'instagram-post', bg: S('#0b1020'), layers };
}

const PHOTO_TEMPLATES = [
  photoPoster('Summer Sale', 'Photo — Sale & Promo', 'marketing', PH.gradPastel,
    [{ t: 'SUMMER', size: 118, weight: 900, color: '#0f172a', font: 'Anton' }, { t: 'SALE', size: 150, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'Up to 60% off everything', size: 30, weight: 600, color: '#1f2937', font: 'Inter' }],
    { overlay: { color: '#ffffff', opacity: 0.12 }, button: { text: 'SHOP NOW', bg: '#0f172a', color: '#ffffff' } }),
  photoPoster('Flash Deal', 'Photo — Sale & Promo', 'marketing', PH.gradBlue,
    [{ t: 'FLASH', size: 138, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'DEAL', size: 138, weight: 900, color: '#fde047', font: 'Anton' }, { t: '48 hours only', size: 30, weight: 600, color: '#e0e7ff', font: 'Inter' }],
    { overlay: { color: '#0b1020', opacity: 0.4 }, button: { text: 'GRAB IT', bg: '#fde047', color: '#1e1b4b' } }),
  photoPoster('New Collection', 'Photo — Fashion', 'social', PH.fashionW,
    [{ t: 'New', size: 96, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Collection', size: 96, weight: 500, color: '#ffffff', font: 'Playfair Display' }],
    { overlay: { color: '#0a0a0a', opacity: 0.35 }, eyebrow: { t: 'Autumn 2026', color: '#e5e7eb' }, anchorY: 470, button: { text: 'EXPLORE', bg: '#ffffff', color: '#0a0a0a' } }),
  photoPoster('Style Icon', 'Photo — Fashion', 'social', PH.fashionM,
    [{ t: 'STAY', size: 120, weight: 900, color: '#ffffff', font: 'Bebas Neue' }, { t: 'ORIGINAL', size: 120, weight: 900, color: '#f59e0b', font: 'Bebas Neue' }],
    { overlay: { color: '#0a0a0a', opacity: 0.4 } }),
  photoPoster('Dream Big', 'Photo — Quotes', 'social', PH.gradBlue,
    [{ t: 'Dream', size: 118, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Big.', size: 118, weight: 500, color: '#fde047', font: 'Playfair Display' }, { t: 'START TODAY', size: 24, weight: 700, color: '#cbd5e1', font: 'Inter', spacing: 6 }],
    { overlay: { color: '#0b1020', opacity: 0.5 } }),
  photoPoster('Grand Opening', 'Photo — Business', 'business', PH.office,
    [{ t: 'GRAND', size: 104, weight: 900, color: '#ffffff', font: 'Poppins' }, { t: 'OPENING', size: 104, weight: 900, color: '#38bdf8', font: 'Poppins' }, { t: 'Join us this weekend', size: 30, weight: 500, color: '#e2e8f0', font: 'Inter' }],
    { overlay: { color: '#0b1226', opacity: 0.55 }, button: { text: 'RSVP NOW', bg: '#38bdf8', color: '#0b1226' } }),
  photoPoster('Coffee Time', 'Photo — Food & Cafe', 'social', PH.coffee,
    [{ t: 'Freshly', size: 78, weight: 500, color: '#fff7ed', font: 'Playfair Display' }, { t: 'Brewed', size: 120, weight: 700, color: '#ffffff', font: 'Dancing Script' }],
    { overlay: { color: '#1a0f08', opacity: 0.4 }, eyebrow: { t: 'Open 7am – 6pm', color: '#fed7aa' }, anchorY: 480 }),
  photoPoster('Menu Special', 'Photo — Food & Cafe', 'marketing', PH.coffee,
    [{ t: 'TODAY’S', size: 64, weight: 700, color: '#fde68a', font: 'Poppins', spacing: 4 }, { t: 'SPECIAL', size: 128, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'Buy one, get one free', size: 30, weight: 500, color: '#fef3c7', font: 'Inter' }],
    { overlay: { color: '#1a0f08', opacity: 0.5 }, button: { text: 'ORDER NOW', bg: '#f59e0b', color: '#1a0f08' } }),

  // Food & restaurant
  photoPoster('Fine Dining', 'Photo — Food & Cafe', 'business', PH.dessert,
    [{ t: 'Fine', size: 96, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Dining', size: 96, weight: 500, color: '#f5d0a9', font: 'Playfair Display' }],
    { overlay: { color: '#160d08', opacity: 0.45 }, eyebrow: { t: 'Reservations open', color: '#f5d0a9' }, anchorY: 470, button: { text: 'BOOK A TABLE', bg: '#f5d0a9', color: '#160d08' } }),
  photoPoster('Chef Special', 'Photo — Food & Cafe', 'marketing', PH.gourmet,
    [{ t: 'CHEF’S', size: 76, weight: 700, color: '#fde68a', font: 'Poppins', spacing: 3 }, { t: 'SPECIAL', size: 122, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'A new seasonal menu', size: 28, weight: 500, color: '#fef3c7', font: 'Inter' }],
    { overlay: { color: '#0f0a06', opacity: 0.52 } }),

  // Travel
  photoPoster('Escape Now', 'Photo — Travel', 'marketing', PH.beach,
    [{ t: 'Escape to', size: 60, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'PARADISE', size: 118, weight: 900, color: '#ffffff', font: 'Anton', spacing: 2 }],
    { overlay: { color: '#052033', opacity: 0.34 }, button: { text: 'BOOK NOW', bg: '#38bdf8', color: '#052033' } }),
  photoPoster('Summer Getaway', 'Photo — Travel', 'marketing', PH.beach2,
    [{ t: 'SUMMER', size: 92, weight: 900, color: '#ffffff', font: 'Poppins' }, { t: 'GETAWAY', size: 92, weight: 900, color: '#fde047', font: 'Poppins' }, { t: 'Save 30% on all packages', size: 28, weight: 500, color: '#e0f2fe', font: 'Inter' }],
    { overlay: { color: '#052033', opacity: 0.4 }, button: { text: 'EXPLORE TRIPS', bg: '#ffffff', color: '#052033' } }),
  photoPoster('Wanderlust', 'Photo — Travel', 'social', PH.mountain,
    [{ t: 'Adventure', size: 92, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Awaits', size: 92, weight: 500, color: '#fbbf24', font: 'Playfair Display' }],
    { overlay: { color: '#0b1020', opacity: 0.42 } }),

  // Fitness
  photoPoster('Push Limits', 'Photo — Fitness', 'marketing', PH.gym,
    [{ t: 'PUSH YOUR', size: 62, weight: 800, color: '#e5e7eb', font: 'Poppins' }, { t: 'LIMITS', size: 150, weight: 900, color: '#f59e0b', font: 'Anton' }],
    { overlay: { color: '#0a0a0a', opacity: 0.52 }, button: { text: 'JOIN TODAY', bg: '#f59e0b', color: '#0a0a0a' } }),
  photoPoster('Transform', 'Photo — Fitness', 'marketing', PH.gym2,
    [{ t: 'TRANSFORM', size: 96, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'YOURSELF', size: 96, weight: 900, color: '#22d3ee', font: 'Anton' }, { t: '12-week challenge starts Monday', size: 26, weight: 500, color: '#cbd5e1', font: 'Inter' }],
    { overlay: { color: '#04080f', opacity: 0.55 } }),

  // Real estate
  photoPoster('For Sale', 'Photo — Real Estate', 'business', PH.interior,
    [{ t: 'NOW', size: 72, weight: 700, color: '#e5e7eb', font: 'Poppins', spacing: 6 }, { t: 'FOR SALE', size: 108, weight: 900, color: '#ffffff', font: 'Poppins' }, { t: '3 bed · 2 bath · city views', size: 28, weight: 500, color: '#d1d5db', font: 'Inter' }],
    { overlay: { color: '#0b1020', opacity: 0.5 }, button: { text: 'VIEW LISTING', bg: '#ffffff', color: '#0b1020' } }),
  photoPoster('Open House', 'Photo — Real Estate', 'business', PH.interior,
    [{ t: 'OPEN', size: 130, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'HOUSE', size: 130, weight: 900, color: '#34d399', font: 'Anton' }, { t: 'This Sunday · 1–4pm', size: 30, weight: 500, color: '#e2e8f0', font: 'Inter' }],
    { overlay: { color: '#07110d', opacity: 0.55 } }),

  // Tech / startup
  photoPoster('Launch Day', 'Photo — Tech', 'business', PH.laptop,
    [{ t: 'LAUNCHING', size: 78, weight: 800, color: '#e5e7eb', font: 'Space Grotesk' }, { t: 'SOON', size: 150, weight: 900, color: '#38bdf8', font: 'Space Grotesk' }],
    { overlay: { color: '#05070d', opacity: 0.55 }, button: { text: 'GET EARLY ACCESS', bg: '#38bdf8', color: '#05070d', w: 380 } }),
  photoPoster('Work Smarter', 'Photo — Tech', 'social', PH.laptop,
    [{ t: 'Work', size: 108, weight: 700, color: '#ffffff', font: 'Space Grotesk' }, { t: 'Smarter.', size: 108, weight: 700, color: '#a5b4fc', font: 'Space Grotesk' }, { t: 'NOT HARDER', size: 24, weight: 700, color: '#c7d2fe', font: 'Inter', spacing: 6 }],
    { overlay: { color: '#07070f', opacity: 0.58 } }),

  // Nature / quotes
  photoPoster('Breathe', 'Photo — Quotes', 'social', PH.mountain,
    [{ t: 'Just', size: 84, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Breathe.', size: 116, weight: 500, color: '#fbbf24', font: 'Playfair Display' }],
    { overlay: { color: '#0b1020', opacity: 0.46 } }),

  // ── More image posters (extra premium set) ──
  photoPoster('Black Friday', 'Photo — Sale & Promo', 'marketing', PH.gradBlue,
    [{ t: 'BLACK', size: 130, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'FRIDAY', size: 130, weight: 900, color: '#fde047', font: 'Anton' }, { t: 'Everything must go', size: 30, weight: 600, color: '#e0e7ff', font: 'Inter' }],
    { overlay: { color: '#000000', opacity: 0.55 }, button: { text: 'SHOP THE SALE', bg: '#fde047', color: '#111111', w: 380 } }),
  photoPoster('Mega Sale', 'Photo — Sale & Promo', 'marketing', PH.gradPastel,
    [{ t: 'MEGA SALE', size: 92, weight: 900, color: '#0f172a', font: 'Poppins' }, { t: '50% OFF', size: 150, weight: 900, color: '#db2777', font: 'Anton' }],
    { overlay: { color: '#ffffff', opacity: 0.1 }, button: { text: 'BUY NOW', bg: '#db2777', color: '#ffffff' } }),
  photoPoster('We’re Hiring', 'Photo — Hiring', 'business', PH.office,
    [{ t: 'WE’RE', size: 88, weight: 900, color: '#ffffff', font: 'Poppins' }, { t: 'HIRING', size: 130, weight: 900, color: '#38bdf8', font: 'Anton' }, { t: 'Join our growing team', size: 30, weight: 500, color: '#e2e8f0', font: 'Inter' }],
    { overlay: { color: '#0b1226', opacity: 0.6 }, button: { text: 'APPLY NOW', bg: '#38bdf8', color: '#0b1226' } }),
  photoPoster('Free Webinar', 'Photo — Webinar', 'business', PH.laptop,
    [{ t: 'FREE', size: 80, weight: 800, color: '#e5e7eb', font: 'Space Grotesk' }, { t: 'WEBINAR', size: 128, weight: 900, color: '#a78bfa', font: 'Space Grotesk' }, { t: 'Register — limited seats', size: 26, weight: 500, color: '#cbd5e1', font: 'Inter' }],
    { overlay: { color: '#07070f', opacity: 0.6 }, button: { text: 'SAVE MY SEAT', bg: '#a78bfa', color: '#07070f', w: 380 } }),
  photoPoster('The Podcast', 'Photo — Podcast', 'social', PH.laptop,
    [{ t: 'THE', size: 48, weight: 700, color: '#cbd5e1', font: 'Inter', spacing: 6 }, { t: 'PODCAST', size: 120, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'New episode every Friday', size: 26, weight: 500, color: '#a5b4fc', font: 'Inter' }],
    { overlay: { color: '#0b1020', opacity: 0.55 } }),
  photoPoster('Make It Happen', 'Photo — Quotes', 'social', PH.mountain,
    [{ t: 'Make it', size: 84, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Happen.', size: 120, weight: 500, color: '#fbbf24', font: 'Playfair Display' }],
    { overlay: { color: '#0b1020', opacity: 0.5 } }),
  photoPoster('Stay Focused', 'Photo — Quotes', 'social', PH.beach,
    [{ t: 'Stay', size: 110, weight: 500, color: '#ffffff', font: 'Playfair Display' }, { t: 'Focused', size: 110, weight: 500, color: '#38bdf8', font: 'Playfair Display' }],
    { overlay: { color: '#052033', opacity: 0.4 } }),
  photoPoster('Morning Yoga', 'Photo — Fitness', 'marketing', PH.gym2,
    [{ t: 'MORNING', size: 64, weight: 700, color: '#e5e7eb', font: 'Poppins', spacing: 4 }, { t: 'YOGA', size: 150, weight: 900, color: '#22d3ee', font: 'Anton' }, { t: 'Every day · 6 AM', size: 28, weight: 500, color: '#cbd5e1', font: 'Inter' }],
    { overlay: { color: '#04080f', opacity: 0.5 }, button: { text: 'JOIN CLASS', bg: '#22d3ee', color: '#04080f' } }),
  photoPoster('Happy Hour', 'Photo — Food & Cafe', 'marketing', PH.dessert,
    [{ t: 'HAPPY', size: 92, weight: 500, color: '#ffffff', font: 'Dancing Script' }, { t: 'HOUR', size: 132, weight: 900, color: '#f5d0a9', font: 'Anton' }, { t: '5–7 PM · Half-price drinks', size: 28, weight: 500, color: '#fde68a', font: 'Inter' }],
    { overlay: { color: '#160d08', opacity: 0.5 } }),
  photoPoster('Just Sold', 'Photo — Real Estate', 'business', PH.interior,
    [{ t: 'JUST', size: 120, weight: 900, color: '#ffffff', font: 'Anton' }, { t: 'SOLD', size: 150, weight: 900, color: '#34d399', font: 'Anton' }],
    { overlay: { color: '#07110d', opacity: 0.55 }, button: { text: 'THINKING OF SELLING?', bg: '#34d399', color: '#07110d', w: 460 } }),
  photoPoster('Weekend Vibes', 'Photo — Food & Cafe', 'social', PH.coffee,
    [{ t: 'Weekend', size: 84, weight: 500, color: '#fff7ed', font: 'Playfair Display' }, { t: 'Vibes', size: 120, weight: 700, color: '#ffffff', font: 'Dancing Script' }],
    { overlay: { color: '#1a0f08', opacity: 0.42 } }),
  photoPoster('The Drop', 'Photo — Fashion', 'marketing', PH.fashionM,
    [{ t: 'THE DROP', size: 62, weight: 700, color: '#f59e0b', font: 'Poppins', spacing: 4 }, { t: 'IS HERE', size: 128, weight: 900, color: '#ffffff', font: 'Bebas Neue' }],
    { overlay: { color: '#0a0a0a', opacity: 0.42 }, button: { text: 'SHOP THE DROP', bg: '#f59e0b', color: '#0a0a0a', w: 380 } }),
  photoPoster('Trip Awaits', 'Photo — Travel', 'marketing', PH.beach2,
    [{ t: 'YOUR TRIP', size: 58, weight: 500, color: '#e0f2fe', font: 'Playfair Display' }, { t: 'AWAITS', size: 120, weight: 900, color: '#ffffff', font: 'Anton', spacing: 2 }],
    { overlay: { color: '#052033', opacity: 0.38 }, button: { text: 'BOOK NOW', bg: '#38bdf8', color: '#052033' } }),
  photoPoster('Grand Sale', 'Photo — Sale & Promo', 'marketing', PH.gourmet,
    [{ t: 'GRAND', size: 104, weight: 900, color: '#ffffff', font: 'Poppins' }, { t: 'SALE', size: 150, weight: 900, color: '#fde047', font: 'Anton' }],
    { overlay: { color: '#0f0a06', opacity: 0.5 }, button: { text: 'ORDER NOW', bg: '#fde047', color: '#0f0a06' } }),
];

// Convert a {{placeholder}} business template into a ready-to-edit Studio scene.
function toStudio(t) {
  const samples = {};
  (t.fields || []).forEach((f) => { samples[f.key] = f.sample; });
  const layers = t.layers.map((l) => (
    l.type === 'text' && typeof l.text === 'string'
      ? { ...l, text: l.text.replace(/\{\{(\w+)\}\}/g, (m, k) => (samples[k] ?? m)) }
      : { ...l }
  ));
  const group = t.category === 'Education' ? 'Certificates'
    : t.category === 'Documents' ? 'Invoices & Docs'
    : 'Business Cards';
  return { name: t.name, group, cat: 'business', category: group, presetId: 'custom', custom: t.dims, bg: t.bg, layers };
}

// Every template in this exclusive set is Pro-only — flagged so the panel shows
// the "Pro" badge and the Studio gates loading behind a Creator Pro upgrade.
export const PREMIUM_STUDIO = [
  ...PHOTO_TEMPLATES,
  ...PREMIUM_TEMPLATES.map(toStudio),
].map((t) => ({ ...t, premium: true }));
