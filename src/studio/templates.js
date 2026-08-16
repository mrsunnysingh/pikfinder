// src/studio/templates.js
// Each template carries `cat` (top-level filter: social | marketing | business)
// and `group` (the section heading it appears under in the Templates panel).

// ── Template builder ─────────────────────────────────────────────────────────
// Generates clean, centre-composed 1080×1080 social posts from compact recipes,
// so we can ship many well-balanced templates without hand-placing every layer.
const PAL = {
  purple: ['#4c1d95', '#1e1b4b'], sunset: ['#f6d365', '#fda085'], ocean: ['#0ea5e9', '#0c4a6e'],
  rose: ['#e11d48', '#7c2d12'], forest: ['#10b981', '#064e3b'], night: ['#0f172a', '#334155'],
  gold: ['#f59e0b', '#7c2d12'], berry: ['#8b5cf6', '#ec4899'], sky: ['#38bdf8', '#1e3a8a'],
  coral: ['#fb7185', '#be123c'], mint: ['#34d399', '#0f766e'], slate: ['#1e293b', '#0f172a'],
  grape: ['#7c3aed', '#4c1d95'], lime: ['#84cc16', '#3f6212'], plum: ['#a21caf', '#4a044e'],
  cream: ['#fef3c7', '#fde68a'], ink: ['#111827', '#000000'], teal: ['#14b8a6', '#134e4a'],
};
const G = (p, angle = 145) => ({ type: 'gradient', color: PAL[p][0], color2: PAL[p][1], angle });
const S = (color) => ({ type: 'solid', color });

function poster(name, group, cat, bg, lines, opts = {}) {
  const align = opts.align || 'center';
  const cx = align === 'left' ? 120 : 540;
  const gap = 1.16;
  let total = lines.reduce((s, l) => s + l.size * gap, 0);
  if (opts.button) total += 130;
  let y = 540 - total / 2 + (opts.topBias || 0);
  const layers = [];
  if (opts.badge) {
    const bx = opts.badge.x ?? 830, by = opts.badge.y ?? 120;
    layers.push({ type: 'ellipse', x: bx, y: by, w: 190, h: 190, color: opts.badge.bg });
    layers.push({ type: 'text', text: opts.badge.text, x: bx + 95, y: by + 66, size: 34, weight: 900, align: 'center', spacing: 0, color: opts.badge.color, font: 'Anton', _w: 180, _h: 44 });
  }
  for (const l of lines) {
    layers.push({ type: 'text', text: l.t, x: cx, y: Math.round(y), size: l.size, weight: l.weight ?? 800, align, spacing: l.spacing ?? 0, color: l.color, font: l.font ?? 'Poppins', _w: align === 'left' ? 840 : 960, _h: Math.round(l.size * 1.3) });
    y += l.size * gap;
  }
  if (opts.button) {
    y += 34;
    const bw = opts.button.w ?? 300, bx = align === 'left' ? 120 : cx - bw / 2;
    layers.push({ type: 'rect', x: bx, y: Math.round(y), w: bw, h: 84, color: opts.button.bg, radius: opts.button.radius ?? 42 });
    layers.push({ type: 'text', text: opts.button.text, x: align === 'left' ? bx + bw / 2 : cx, y: Math.round(y) + 28, size: 24, weight: 700, align: 'center', spacing: 1, color: opts.button.color, font: 'Inter', _w: bw - 16, _h: 30 });
  }
  return { name, group, cat, category: group, presetId: 'instagram-post', bg, layers };
}

const GENERATED = [
  // ── Sale & Promo (marketing) ──
  poster('Mega Sale', 'Sale & Promo', 'marketing', G('rose', 160), [{ t: 'MEGA', size: 130, weight: 900, color: '#fff', font: 'Anton' }, { t: 'SALE', size: 130, weight: 900, color: '#facc15', font: 'Anton' }, { t: 'UP TO 70% OFF', size: 34, weight: 700, color: '#ffe4e6', font: 'Inter', spacing: 4 }], { button: { text: 'SHOP NOW', bg: '#fff', color: '#be123c' } }),
  poster('Black Friday', 'Sale & Promo', 'marketing', S('#0a0a0a'), [{ t: 'BLACK', size: 120, weight: 900, color: '#fff', font: 'Anton' }, { t: 'FRIDAY', size: 120, weight: 900, color: '#f59e0b', font: 'Anton' }, { t: 'DOORBUSTERS ALL WEEKEND', size: 26, weight: 600, color: '#a1a1aa', font: 'Inter', spacing: 3 }], { button: { text: 'GRAB DEALS', bg: '#f59e0b', color: '#000' } }),
  poster('Flash Deal', 'Sale & Promo', 'marketing', G('gold', 150), [{ t: 'FLASH', size: 128, weight: 900, color: '#fff', font: 'Bebas Neue' }, { t: 'DEAL', size: 128, weight: 900, color: '#7c2d12', font: 'Bebas Neue' }], { badge: { text: '50%', bg: '#fff', color: '#b45309' }, button: { text: 'TODAY ONLY', bg: '#111', color: '#fff' } }),
  poster('Weekend Offer', 'Sale & Promo', 'marketing', G('berry'), [{ t: 'WEEKEND', size: 76, weight: 800, color: '#fff', font: 'Poppins' }, { t: 'SPECIAL', size: 110, weight: 900, color: '#fde047', font: 'Anton' }, { t: 'Buy one, get one free', size: 30, weight: 500, color: '#f5d0fe', font: 'Inter' }], { button: { text: 'CLAIM OFFER', bg: '#fde047', color: '#4c1d95' } }),
  poster('Clearance', 'Sale & Promo', 'marketing', G('coral', 160), [{ t: 'FINAL', size: 96, weight: 900, color: '#fff', font: 'Montserrat' }, { t: 'CLEARANCE', size: 84, weight: 900, color: '#fff1f2', font: 'Anton', spacing: 2 }, { t: 'Everything must go', size: 30, weight: 500, color: '#ffe4e6', font: 'Inter' }]),
  poster('New Arrival', 'Sale & Promo', 'marketing', G('teal'), [{ t: 'NEW', size: 150, weight: 900, color: '#fff', font: 'Anton' }, { t: 'ARRIVAL', size: 70, weight: 800, color: '#99f6e4', font: 'Poppins', spacing: 6 }], { button: { text: 'DISCOVER', bg: '#fff', color: '#134e4a' } }),
  poster('Coupon Code', 'Sale & Promo', 'marketing', G('grape'), [{ t: 'SAVE 25%', size: 96, weight: 900, color: '#fff', font: 'Montserrat' }, { t: 'USE CODE: SAVE25', size: 32, weight: 700, color: '#e9d5ff', font: 'Space Grotesk', spacing: 3 }], { button: { text: 'REDEEM NOW', bg: '#fde047', color: '#4c1d95' } }),
  poster('Cyber Monday', 'Sale & Promo', 'marketing', G('sky', 160), [{ t: 'CYBER', size: 118, weight: 900, color: '#fff', font: 'Space Grotesk' }, { t: 'MONDAY', size: 118, weight: 900, color: '#38bdf8', font: 'Space Grotesk' }, { t: 'Biggest tech deals of the year', size: 26, weight: 500, color: '#dbeafe', font: 'Inter' }]),

  // ── Quotes (social) ──
  poster('Dream Big', 'Quotes', 'social', G('night', 160), [{ t: 'Dream', size: 110, weight: 500, color: '#fff', font: 'Playfair Display' }, { t: 'Big.', size: 110, weight: 500, color: '#f59e0b', font: 'Playfair Display' }, { t: 'START TODAY', size: 24, weight: 700, color: '#94a3b8', font: 'Inter', spacing: 6 }]),
  poster('Stay Focused', 'Quotes', 'social', S('#0c0a09'), [{ t: 'STAY', size: 120, weight: 900, color: '#fff', font: 'Anton' }, { t: 'FOCUSED', size: 120, weight: 900, color: '#f59e0b', font: 'Anton' }, { t: 'THE REST WILL FOLLOW', size: 24, weight: 600, color: '#a8a29e', font: 'Inter', spacing: 5 }]),
  poster('Good Vibes', 'Quotes', 'social', G('sunset', 120), [{ t: 'Good', size: 100, weight: 700, color: '#fff', font: 'Dancing Script' }, { t: 'Vibes', size: 130, weight: 700, color: '#7c2d12', font: 'Dancing Script' }, { t: 'ONLY', size: 30, weight: 800, color: '#fff7ed', font: 'Inter', spacing: 12 }]),
  poster('Keep Going', 'Quotes', 'social', G('forest', 160), [{ t: 'Keep', size: 112, weight: 600, color: '#fff', font: 'Playfair Display' }, { t: 'Going', size: 112, weight: 600, color: '#6ee7b7', font: 'Playfair Display' }, { t: 'ONE STEP AT A TIME', size: 24, weight: 600, color: '#a7f3d0', font: 'Inter', spacing: 5 }]),
  poster('Be Yourself', 'Quotes', 'social', G('plum', 150), [{ t: 'Be', size: 96, weight: 500, color: '#fff', font: 'Playfair Display' }, { t: 'Yourself', size: 96, weight: 500, color: '#f0abfc', font: 'Playfair Display' }, { t: 'EVERYONE ELSE IS TAKEN', size: 22, weight: 600, color: '#f5d0fe', font: 'Inter', spacing: 4 }]),
  poster('Hustle', 'Quotes', 'social', S('#111827'), [{ t: 'HUSTLE', size: 130, weight: 900, color: '#fff', font: 'Anton' }, { t: 'IN SILENCE', size: 54, weight: 800, color: '#f59e0b', font: 'Poppins', spacing: 4 }, { t: 'LET SUCCESS MAKE THE NOISE', size: 22, weight: 500, color: '#6b7280', font: 'Inter', spacing: 3 }]),
  poster('Grow', 'Quotes', 'social', G('lime', 150), [{ t: 'GROW', size: 150, weight: 900, color: '#fff', font: 'Anton' }, { t: 'through what you', size: 34, weight: 500, color: '#ecfccb', font: 'Inter' }, { t: 'GO THROUGH', size: 44, weight: 800, color: '#fff', font: 'Poppins', spacing: 2 }]),
  poster('Create', 'Quotes', 'social', G('berry', 135), [{ t: 'CREATE', size: 120, weight: 900, color: '#fff', font: 'Outfit' }, { t: 'the things you wish', size: 30, weight: 400, color: '#fbcfe8', font: 'Inter' }, { t: 'EXISTED', size: 56, weight: 800, color: '#fde047', font: 'Outfit', spacing: 4 }]),

  // ── Business (business) ──
  poster('We Are Hiring', 'Business', 'business', G('sky', 135), [{ t: "WE'RE", size: 92, weight: 900, color: '#fff', font: 'Poppins', align: 'left' }, { t: 'HIRING', size: 120, weight: 900, color: '#38bdf8', font: 'Anton', align: 'left' }, { t: 'Join our growing team', size: 30, weight: 400, color: '#dbeafe', font: 'Inter', align: 'left' }], { align: 'left', button: { text: 'APPLY NOW', bg: '#38bdf8', color: '#0f172a' } }),
  poster('Webinar', 'Business', 'business', G('grape', 135), [{ t: 'FREE', size: 64, weight: 800, color: '#e9d5ff', font: 'Poppins', align: 'left' }, { t: 'WEBINAR', size: 104, weight: 900, color: '#fff', font: 'Space Grotesk', align: 'left' }, { t: 'Save your seat — limited spots', size: 28, weight: 400, color: '#f5d0fe', font: 'Inter', align: 'left' }], { align: 'left', button: { text: 'REGISTER', bg: '#fff', color: '#4c1d95' } }),
  poster('Case Study', 'Business', 'business', S('#0f172a'), [{ t: 'CASE STUDY', size: 40, weight: 700, color: '#38bdf8', font: 'Inter', align: 'left', spacing: 4 }, { t: '3× revenue', size: 96, weight: 900, color: '#fff', font: 'Poppins', align: 'left' }, { t: 'in 90 days', size: 96, weight: 900, color: '#38bdf8', font: 'Poppins', align: 'left' }], { align: 'left' }),
  poster('Testimonial', 'Business', 'business', G('slate', 160), [{ t: '"Best decision', size: 58, weight: 600, color: '#fff', font: 'Playfair Display', align: 'left' }, { t: 'we ever made."', size: 58, weight: 600, color: '#38bdf8', font: 'Playfair Display', align: 'left' }, { t: '— Happy Customer', size: 26, weight: 500, color: '#94a3b8', font: 'Inter', align: 'left' }], { align: 'left' }),
  poster('Coming Soon', 'Business', 'business', G('ink', 160), [{ t: 'COMING', size: 96, weight: 900, color: '#fff', font: 'Anton' }, { t: 'SOON', size: 150, weight: 900, color: '#f59e0b', font: 'Anton' }, { t: 'STAY TUNED', size: 26, weight: 700, color: '#9ca3af', font: 'Inter', spacing: 8 }]),
  poster('Thank You', 'Business', 'business', G('teal', 135), [{ t: 'THANK', size: 110, weight: 900, color: '#fff', font: 'Poppins' }, { t: 'YOU', size: 150, weight: 900, color: '#99f6e4', font: 'Anton' }, { t: 'FOR 10K FOLLOWERS', size: 26, weight: 700, color: '#ccfbf1', font: 'Inter', spacing: 4 }]),

  // ── Fashion & Lifestyle (marketing) ──
  poster('Fashion Week', 'Fashion & Lifestyle', 'marketing', S('#18181b'), [{ t: 'FASHION', size: 100, weight: 300, color: '#fff', font: 'Poppins', spacing: 16 }, { t: 'WEEK', size: 100, weight: 300, color: '#d4d4d8', font: 'Poppins', spacing: 24 }, { t: 'NEW COLLECTION 2026', size: 22, weight: 500, color: '#a1a1aa', font: 'Inter', spacing: 6 }]),
  poster('Style Guide', 'Fashion & Lifestyle', 'marketing', G('cream', 120), [{ t: 'STYLE', size: 120, weight: 800, color: '#78350f', font: 'Playfair Display' }, { t: 'guide', size: 96, weight: 500, color: '#b45309', font: 'Dancing Script' }, { t: 'YOUR SEASONAL EDIT', size: 22, weight: 700, color: '#92400e', font: 'Inter', spacing: 5 }]),
  poster('Lookbook', 'Fashion & Lifestyle', 'marketing', S('#f5f5f4'), [{ t: 'THE', size: 44, weight: 400, color: '#78716c', font: 'Inter', spacing: 12 }, { t: 'LOOKBOOK', size: 96, weight: 800, color: '#1c1917', font: 'Poppins', spacing: 4 }, { t: 'SPRING / SUMMER', size: 24, weight: 500, color: '#78716c', font: 'Inter', spacing: 8 }]),
  poster('Minimal Beauty', 'Fashion & Lifestyle', 'marketing', S('#faf5ff'), [{ t: 'glow', size: 130, weight: 500, color: '#7c3aed', font: 'Dancing Script' }, { t: 'FROM WITHIN', size: 34, weight: 700, color: '#4c1d95', font: 'Poppins', spacing: 6 }], { button: { text: 'SHOP SKINCARE', bg: '#7c3aed', color: '#fff' } }),

  // ── Food & Cafe (marketing) ──
  poster('Coffee Time', 'Food & Cafe', 'marketing', G('gold', 150), [{ t: 'COFFEE', size: 120, weight: 900, color: '#fff', font: 'Bebas Neue' }, { t: 'O’CLOCK', size: 84, weight: 800, color: '#78350f', font: 'Poppins', spacing: 4 }], { button: { text: 'ORDER NOW', bg: '#78350f', color: '#fff' } }),
  poster('Fresh Menu', 'Food & Cafe', 'marketing', G('forest', 150), [{ t: 'FRESH', size: 130, weight: 900, color: '#fff', font: 'Anton' }, { t: 'MENU', size: 90, weight: 800, color: '#bbf7d0', font: 'Poppins', spacing: 6 }, { t: 'FARM TO TABLE', size: 24, weight: 700, color: '#dcfce7', font: 'Inter', spacing: 5 }]),
  poster('Foodie Special', 'Food & Cafe', 'marketing', G('rose', 150), [{ t: 'TASTE', size: 110, weight: 900, color: '#fff', font: 'Anton' }, { t: 'THE BEST', size: 60, weight: 800, color: '#fecdd3', font: 'Poppins', spacing: 4 }], { badge: { text: 'NEW', bg: '#facc15', color: '#7c2d12' }, button: { text: 'BOOK TABLE', bg: '#fff', color: '#be123c' } }),
  poster('Happy Hour', 'Food & Cafe', 'marketing', S('#1c1917'), [{ t: 'HAPPY', size: 120, weight: 900, color: '#fff', font: 'Bebas Neue' }, { t: 'HOUR', size: 120, weight: 900, color: '#f59e0b', font: 'Bebas Neue' }, { t: '5PM – 7PM · HALF PRICE', size: 26, weight: 600, color: '#a8a29e', font: 'Inter', spacing: 3 }]),

  // ── Fitness (marketing) ──
  poster('No Excuses', 'Fitness', 'marketing', S('#0a0a0a'), [{ t: 'NO', size: 150, weight: 900, color: '#fff', font: 'Anton' }, { t: 'EXCUSES', size: 96, weight: 900, color: '#84cc16', font: 'Anton', spacing: 4 }, { t: 'JUST RESULTS', size: 26, weight: 700, color: '#a3a3a3', font: 'Inter', spacing: 6 }]),
  poster('Join The Gym', 'Fitness', 'marketing', G('lime', 160), [{ t: 'TRAIN', size: 110, weight: 900, color: '#fff', font: 'Anton' }, { t: 'HARD', size: 130, weight: 900, color: '#1a2e05', font: 'Anton' }], { button: { text: 'JOIN TODAY', bg: '#111', color: '#84cc16' } }),
  poster('Yoga Class', 'Fitness', 'marketing', G('teal', 135), [{ t: 'find your', size: 60, weight: 400, color: '#ccfbf1', font: 'Inter' }, { t: 'BALANCE', size: 110, weight: 800, color: '#fff', font: 'Poppins', spacing: 4 }, { t: 'MORNING YOGA · DAILY', size: 24, weight: 600, color: '#99f6e4', font: 'Inter', spacing: 5 }]),
  poster('Challenge', 'Fitness', 'marketing', G('rose', 160), [{ t: '30 DAY', size: 76, weight: 800, color: '#fecdd3', font: 'Poppins' }, { t: 'CHALLENGE', size: 96, weight: 900, color: '#fff', font: 'Anton', spacing: 2 }], { button: { text: 'START NOW', bg: '#fff', color: '#be123c' } }),

  // ── Real Estate (business) ──
  poster('For Sale', 'Real Estate', 'business', G('slate', 160), [{ t: 'FOR', size: 90, weight: 900, color: '#fff', font: 'Poppins', align: 'left' }, { t: 'SALE', size: 130, weight: 900, color: '#38bdf8', font: 'Anton', align: 'left' }, { t: 'Modern 3-bed family home', size: 30, weight: 400, color: '#cbd5e1', font: 'Inter', align: 'left' }], { align: 'left', button: { text: 'VIEW LISTING', bg: '#38bdf8', color: '#0f172a' } }),
  poster('Open House', 'Real Estate', 'business', S('#0f172a'), [{ t: 'OPEN', size: 110, weight: 900, color: '#fff', font: 'Poppins' }, { t: 'HOUSE', size: 130, weight: 900, color: '#f59e0b', font: 'Anton' }, { t: 'SATURDAY · 11AM – 3PM', size: 26, weight: 600, color: '#94a3b8', font: 'Inter', spacing: 3 }]),
  poster('Just Listed', 'Real Estate', 'business', G('ocean', 150), [{ t: 'JUST', size: 84, weight: 800, color: '#e0f2fe', font: 'Poppins' }, { t: 'LISTED', size: 130, weight: 900, color: '#fff', font: 'Anton' }], { badge: { text: 'NEW', bg: '#facc15', color: '#0c4a6e' }, button: { text: 'BOOK A TOUR', bg: '#fff', color: '#0c4a6e' } }),

  // ── Events (marketing) ──
  poster('Live Concert', 'Events', 'marketing', G('plum', 160), [{ t: 'LIVE', size: 150, weight: 900, color: '#fff', font: 'Anton' }, { t: 'CONCERT', size: 76, weight: 800, color: '#f0abfc', font: 'Poppins', spacing: 6 }, { t: 'SAT 20 SEP · CITY ARENA', size: 24, weight: 600, color: '#f5d0fe', font: 'Inter', spacing: 3 }], { button: { text: 'GET TICKETS', bg: '#fde047', color: '#4a044e' } }),
  poster('Workshop', 'Events', 'marketing', G('sky', 135), [{ t: 'DESIGN', size: 84, weight: 800, color: '#dbeafe', font: 'Poppins' }, { t: 'WORKSHOP', size: 96, weight: 900, color: '#fff', font: 'Space Grotesk', spacing: 2 }, { t: 'HANDS-ON · BEGINNER FRIENDLY', size: 22, weight: 600, color: '#bfdbfe', font: 'Inter', spacing: 3 }], { button: { text: 'SIGN UP', bg: '#fff', color: '#1e3a8a' } }),
  poster('Grand Opening', 'Events', 'marketing', G('gold', 150), [{ t: 'GRAND', size: 96, weight: 900, color: '#fff', font: 'Bebas Neue' }, { t: 'OPENING', size: 120, weight: 900, color: '#7c2d12', font: 'Bebas Neue' }, { t: 'FREE GIFTS FOR FIRST 100', size: 24, weight: 700, color: '#fffbeb', font: 'Inter', spacing: 3 }]),
  poster('Party Night', 'Events', 'marketing', S('#0a0a0a'), [{ t: 'PARTY', size: 130, weight: 900, color: '#fff', font: 'Anton' }, { t: 'NIGHT', size: 130, weight: 900, color: '#ec4899', font: 'Anton' }, { t: 'FRIDAY · 9PM TILL LATE', size: 26, weight: 600, color: '#a3a3a3', font: 'Inter', spacing: 3 }]),

  // ── Tech & Startup (business) ──
  poster('Product Launch', 'Tech & Startup', 'business', G('grape', 135), [{ t: 'NOW', size: 60, weight: 700, color: '#e9d5ff', font: 'Space Grotesk', align: 'left', spacing: 4 }, { t: 'LAUNCHING', size: 100, weight: 900, color: '#fff', font: 'Space Grotesk', align: 'left' }, { t: 'The future of your workflow', size: 28, weight: 400, color: '#f5d0fe', font: 'Inter', align: 'left' }], { align: 'left', button: { text: 'TRY IT FREE', bg: '#fde047', color: '#4c1d95' } }),
  poster('App Update', 'Tech & Startup', 'business', S('#0b1120'), [{ t: 'v2.0', size: 130, weight: 900, color: '#38bdf8', font: 'Space Grotesk', align: 'left' }, { t: 'IS HERE', size: 84, weight: 800, color: '#fff', font: 'Poppins', align: 'left' }, { t: 'Faster. Smarter. Redesigned.', size: 28, weight: 400, color: '#94a3b8', font: 'Inter', align: 'left' }], { align: 'left' }),
  poster('AI Powered', 'Tech & Startup', 'business', G('berry', 135), [{ t: 'AI', size: 160, weight: 900, color: '#fff', font: 'Space Grotesk' }, { t: 'POWERED', size: 74, weight: 800, color: '#fbcfe8', font: 'Poppins', spacing: 6 }], { button: { text: 'LEARN MORE', bg: '#fff', color: '#7c3aed' } }),
];

import { PREMIUM_STUDIO } from './premiumStudio.js';

export const TEMPLATES = [
  ...PREMIUM_STUDIO,
  ...GENERATED,
  {
    name: 'Explore The World', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#0b3d5c', color2: '#0a2540', angle: 160 },
    layers: [
      { type: 'text', text: 'Explore The', x: 540, y: 200, size: 58, weight: 500, align: 'center', spacing: 1, color: '#ffffff', font: 'Dancing Script', _w: 500, _h: 72 },
      { type: 'text', text: 'WORLD', x: 540, y: 290, size: 150, weight: 900, align: 'center', spacing: 4, color: '#ffffff', font: 'Anton', _w: 720, _h: 170 },
      { type: 'text', text: "IT'S TIME FOR A NEW ADVENTURE", x: 540, y: 470, size: 26, weight: 600, align: 'center', spacing: 4, color: '#e2e8f0', font: 'Inter', _w: 720, _h: 34 },
      { type: 'ellipse', x: 800, y: 470, w: 180, h: 180, color: '#facc15' },
      { type: 'text', text: '30% OFF', x: 890, y: 548, size: 32, weight: 900, align: 'center', spacing: 0, color: '#7c2d12', font: 'Anton', _w: 160, _h: 40 },
      { type: 'rect', x: 400, y: 900, w: 280, h: 80, color: '#facc15', radius: 12 },
      { type: 'text', text: 'BOOK NOW', x: 540, y: 928, size: 28, weight: 800, align: 'center', spacing: 2, color: '#1e293b', font: 'Inter', _w: 220, _h: 34 },
      { type: 'text', text: 'WWW.PIKFINDER.COM', x: 540, y: 1010, size: 20, weight: 600, align: 'center', spacing: 3, color: '#ffffff', font: 'Inter', _w: 420, _h: 26 },
    ]
  },
  {
    name: 'Business Growth', cat: 'business', group: 'Business', category: 'Business', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#0f2027', color2: '#2c5364', angle: 135 },
    layers: [
      { type: 'rect', x: 120, y: 250, w: 90, h: 10, color: '#38bdf8', radius: 5 },
      { type: 'text', text: 'BUSINESS', x: 120, y: 300, size: 92, weight: 900, align: 'left', spacing: 0, color: '#ffffff', font: 'Poppins', _w: 720, _h: 110 },
      { type: 'text', text: 'GROWTH', x: 120, y: 400, size: 92, weight: 900, align: 'left', spacing: 0, color: '#38bdf8', font: 'Poppins', _w: 720, _h: 110 },
      { type: 'text', text: 'Strategies that scale your revenue and build a brand people trust.', x: 120, y: 545, size: 30, weight: 400, align: 'left', spacing: 0, color: '#cbd5e1', font: 'Inter', _w: 800, _h: 90 },
      { type: 'rect', x: 120, y: 770, w: 300, h: 84, color: '#38bdf8', radius: 42 },
      { type: 'text', text: 'GET STARTED', x: 150, y: 798, size: 26, weight: 700, align: 'left', spacing: 1, color: '#0f172a', font: 'Inter', _w: 240, _h: 32 },
    ]
  },
  {
    name: 'New Collection', cat: 'marketing', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#4c1d95', color2: '#1e1b4b', angle: 145 },
    layers: [
      { type: 'text', text: 'NEW', x: 120, y: 330, size: 150, weight: 900, align: 'left', spacing: -2, color: '#ffffff', font: 'Poppins', _w: 420, _h: 170 },
      { type: 'text', text: 'COLLECTION', x: 122, y: 480, size: 74, weight: 800, align: 'left', spacing: 2, color: '#c4b5fd', font: 'Poppins', _w: 760, _h: 88 },
      { type: 'rect', x: 120, y: 660, w: 250, h: 78, color: '#ffffff', radius: 39 },
      { type: 'text', text: 'SHOP NOW', x: 150, y: 686, size: 24, weight: 700, align: 'left', spacing: 2, color: '#4c1d95', font: 'Inter', _w: 200, _h: 30 },
    ]
  },
  {
    name: 'Special Offer', cat: 'marketing', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#dc2626', color2: '#7f1d1d', angle: 160 },
    layers: [
      { type: 'text', text: 'SPECIAL', x: 540, y: 330, size: 92, weight: 900, align: 'center', spacing: 2, color: '#ffffff', font: 'Montserrat', _w: 720, _h: 110 },
      { type: 'text', text: 'OFFER', x: 540, y: 440, size: 150, weight: 900, align: 'center', spacing: 4, color: '#fde047', font: 'Anton', _w: 600, _h: 170 },
      { type: 'text', text: 'LIMITED TIME ONLY', x: 540, y: 640, size: 28, weight: 600, align: 'center', spacing: 6, color: '#fecaca', font: 'Inter', _w: 640, _h: 34 },
      { type: 'rect', x: 390, y: 760, w: 300, h: 84, color: '#ffffff', radius: 42 },
      { type: 'text', text: 'GRAB NOW', x: 540, y: 788, size: 26, weight: 800, align: 'center', spacing: 1, color: '#dc2626', font: 'Inter', _w: 240, _h: 32 },
    ]
  },
  {
    name: 'Minimal Style', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'solid', color: '#f3f4f6' },
    layers: [
      { type: 'rect', x: 110, y: 110, w: 860, h: 860, color: 'transparent', radius: 0, border: '2px solid #111827' },
      { type: 'text', text: 'MINIMAL', x: 540, y: 460, size: 84, weight: 300, align: 'center', spacing: 14, color: '#111827', font: 'Poppins', _w: 720, _h: 100 },
      { type: 'text', text: 'STYLE', x: 540, y: 560, size: 38, weight: 400, align: 'center', spacing: 20, color: '#6b7280', font: 'Inter', _w: 420, _h: 46 },
    ]
  },
  {
    name: 'Travel More', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#0ea5e9', color2: '#0c4a6e', angle: 150 },
    layers: [
      { type: 'text', text: 'TRAVEL', x: 540, y: 360, size: 130, weight: 900, align: 'center', spacing: 2, color: '#ffffff', font: 'Bebas Neue', _w: 640, _h: 150 },
      { type: 'text', text: 'MORE', x: 540, y: 500, size: 130, weight: 900, align: 'center', spacing: 6, color: '#fbbf24', font: 'Bebas Neue', _w: 420, _h: 150 },
      { type: 'text', text: 'WORRY LESS · EXPLORE THE WORLD', x: 540, y: 660, size: 24, weight: 600, align: 'center', spacing: 4, color: '#e0f2fe', font: 'Inter', _w: 740, _h: 30 },
    ]
  },
  {
    name: 'Digital Marketing Agency', cat: 'business', group: 'Business', category: 'Business', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#0f172a', color2: '#1e3a8a', angle: 135 },
    layers: [
      { type: 'text', text: 'DIGITAL', x: 120, y: 290, size: 76, weight: 900, align: 'left', spacing: 0, color: '#38bdf8', font: 'Space Grotesk', _w: 640, _h: 90 },
      { type: 'text', text: 'MARKETING', x: 120, y: 370, size: 76, weight: 900, align: 'left', spacing: 0, color: '#ffffff', font: 'Space Grotesk', _w: 760, _h: 90 },
      { type: 'text', text: 'AGENCY', x: 120, y: 450, size: 76, weight: 900, align: 'left', spacing: 0, color: '#ffffff', font: 'Space Grotesk', _w: 640, _h: 90 },
      { type: 'text', text: 'Grow your brand with data-driven campaigns.', x: 120, y: 590, size: 28, weight: 400, align: 'left', spacing: 0, color: '#cbd5e1', font: 'Inter', _w: 800, _h: 40 },
      { type: 'rect', x: 120, y: 710, w: 320, h: 80, color: '#38bdf8', radius: 12 },
      { type: 'text', text: 'WORK WITH US', x: 150, y: 738, size: 24, weight: 700, align: 'left', spacing: 1, color: '#0f172a', font: 'Inter', _w: 260, _h: 30 },
    ]
  },
  {
    name: 'Believe In Yourself', cat: 'social', group: 'Quotes', category: 'Quotes', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#292524', color2: '#0c0a09', angle: 160 },
    layers: [
      { type: 'text', text: 'Believe', x: 540, y: 350, size: 92, weight: 500, align: 'center', spacing: 0, color: '#ffffff', font: 'Playfair Display', _w: 640, _h: 112 },
      { type: 'text', text: 'In Yourself', x: 540, y: 460, size: 92, weight: 500, align: 'center', spacing: 0, color: '#f59e0b', font: 'Playfair Display', _w: 640, _h: 112 },
      { type: 'rect', x: 470, y: 630, w: 140, h: 4, color: '#f59e0b' },
      { type: 'text', text: 'AND YOU ARE HALFWAY THERE', x: 540, y: 670, size: 22, weight: 600, align: 'center', spacing: 5, color: '#a8a29e', font: 'Inter', _w: 680, _h: 28 },
    ]
  },
  {
    name: 'Make It Happen', cat: 'social', group: 'Quotes', category: 'Quotes', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#1e293b', color2: '#0f172a', angle: 145 },
    layers: [
      { type: 'text', text: 'MAKE', x: 120, y: 300, size: 140, weight: 900, align: 'left', spacing: 0, color: '#ffffff', font: 'Anton', _w: 520, _h: 160 },
      { type: 'text', text: 'IT', x: 120, y: 450, size: 140, weight: 900, align: 'left', spacing: 0, color: '#facc15', font: 'Anton', _w: 300, _h: 160 },
      { type: 'text', text: 'HAPPEN', x: 120, y: 600, size: 140, weight: 900, align: 'left', spacing: 0, color: '#ffffff', font: 'Anton', _w: 720, _h: 160 },
    ]
  },
  {
    name: 'Hello World', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#ff9a9e', color2: '#fecfef', angle: 120 },
    layers: [
      { type: 'ellipse', x: 240, y: 240, w: 600, h: 600, color: 'rgba(255,255,255,0.4)' },
      { type: 'text', text: 'HELLO', x: 540, y: 320, size: 100, weight: 800, align: 'center', spacing: 10, color: '#ff0844', font: 'Montserrat', _w: 400, _h: 120 },
      { type: 'text', text: 'WORLD', x: 540, y: 440, size: 120, weight: 900, align: 'center', spacing: 12, color: '#ffffff', font: 'Montserrat', _w: 500, _h: 144 },
    ]
  },
  {
    name: 'Explore Create', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#0f172a', color2: '#334155', angle: 160 },
    layers: [
      { type: 'text', text: 'Explore.', x: 120, y: 300, size: 96, weight: 800, align: 'left', spacing: -2, color: '#ffffff', font: 'Outfit', _w: 500, _h: 110 },
      { type: 'text', text: 'Create.', x: 120, y: 420, size: 96, weight: 800, align: 'left', spacing: -2, color: '#a78bfa', font: 'Outfit', _w: 500, _h: 110 },
      { type: 'text', text: 'Inspire.', x: 120, y: 540, size: 96, weight: 800, align: 'left', spacing: -2, color: '#ffffff', font: 'Outfit', _w: 500, _h: 110 },
      { type: 'rect', x: 120, y: 720, w: 260, h: 76, color: '#a78bfa', radius: 38 },
      { type: 'text', text: 'LEARN MORE', x: 150, y: 744, size: 24, weight: 700, align: 'left', spacing: 2, color: '#0f172a', font: 'Inter', _w: 220, _h: 30 },
    ]
  },
  {
    name: 'Summer Vibes', cat: 'social', group: 'Instagram Post', category: 'Instagram Post', presetId: 'instagram-post',
    bg: { type: 'gradient', color: '#f6d365', color2: '#fda085', angle: 45 },
    layers: [
      { type: 'text', text: 'SUMMER', x: 540, y: 380, size: 130, weight: 900, align: 'center', spacing: 8, color: '#ffffff', font: 'Bebas Neue', _w: 600, _h: 150 },
      { type: 'text', text: 'VIBES', x: 540, y: 520, size: 130, weight: 900, align: 'center', spacing: 8, color: '#c2410c', font: 'Bebas Neue', _w: 500, _h: 150 },
    ]
  },
  {
    name: 'Flash Sale', cat: 'social', group: 'Instagram Story', category: 'Instagram Story', presetId: 'instagram-story',
    bg: { type: 'gradient', color: '#e52d27', color2: '#b31217', angle: 160 },
    layers: [
      { type: 'text', text: 'FLASH', x: 540, y: 600, size: 150, weight: 900, align: 'center', spacing: 6, color: '#ffffff', font: 'Anton', _w: 600, _h: 170 },
      { type: 'text', text: 'SALE', x: 540, y: 780, size: 150, weight: 900, align: 'center', spacing: 6, color: '#facc15', font: 'Anton', _w: 500, _h: 170 },
      { type: 'rect', x: 290, y: 1020, w: 500, h: 110, color: '#ffffff', radius: 55 },
      { type: 'text', text: 'UP TO 50% OFF', x: 540, y: 1052, size: 40, weight: 800, align: 'center', spacing: 2, color: '#b31217', font: 'Inter', _w: 440, _h: 48 },
    ]
  },
  {
    name: 'Tech Meetup', cat: 'social', group: 'Instagram Story', category: 'Instagram Story', presetId: 'instagram-story',
    bg: { type: 'gradient', color: '#141E30', color2: '#243B55', angle: 180 },
    layers: [
      { type: 'rect', x: 50, y: 50, w: 980, h: 1820, color: 'transparent', radius: 40, border: '4px solid #ffffff' },
      { type: 'text', text: 'DEV', x: 540, y: 200, size: 120, weight: 900, align: 'center', spacing: 10, color: '#38bdf8', font: 'Space Grotesk', _w: 500, _h: 144 },
      { type: 'text', text: 'MEETUP', x: 540, y: 320, size: 120, weight: 900, align: 'center', spacing: 10, color: '#ffffff', font: 'Space Grotesk', _w: 600, _h: 144 },
      { type: 'text', text: 'Building the Future of Web', x: 540, y: 480, size: 40, weight: 400, align: 'center', spacing: 0, color: '#94a3b8', font: 'Inter', _w: 800, _h: 48 },
      { type: 'rect', x: 340, y: 1600, w: 400, h: 100, color: '#38bdf8', radius: 50 },
      { type: 'text', text: 'RSVP NOW', x: 540, y: 1630, size: 32, weight: 700, align: 'center', spacing: 2, color: '#0f172a', font: 'Inter', _w: 300, _h: 40 }
    ]
  },
  {
    name: 'We Are Creative', cat: 'social', group: 'Facebook Cover', category: 'Facebook Cover', presetId: 'facebook-cover',
    bg: { type: 'gradient', color: '#4e54c8', color2: '#8f94fb', angle: 120 },
    layers: [
      { type: 'text', text: 'WE ARE CREATIVE', x: 425, y: 120, size: 54, weight: 900, align: 'center', spacing: 2, color: '#ffffff', font: 'Poppins', _w: 700, _h: 64 },
      { type: 'text', text: 'Digital Studio & Branding Agency', x: 425, y: 200, size: 22, weight: 400, align: 'center', spacing: 1, color: '#e0e7ff', font: 'Inter', _w: 600, _h: 28 },
    ]
  },
  {
    name: 'Watch Now', cat: 'marketing', group: 'YouTube Thumbnail', category: 'YouTube Thumbnail', presetId: 'youtube-thumbnail',
    bg: { type: 'gradient', color: '#200122', color2: '#6f0000', angle: 135 },
    layers: [
      { type: 'text', text: 'HOW I BUILT', x: 80, y: 180, size: 70, weight: 800, align: 'left', spacing: 0, color: '#ffffff', font: 'Outfit', _w: 700, _h: 84 },
      { type: 'text', text: 'THIS IN 24H', x: 80, y: 280, size: 110, weight: 900, align: 'left', spacing: -1, color: '#fbbf24', font: 'Outfit', _w: 800, _h: 130 },
      { type: 'rect', x: 80, y: 470, w: 260, h: 80, color: '#ef4444', radius: 12 },
      { type: 'text', text: 'WATCH', x: 110, y: 494, size: 32, weight: 800, align: 'left', spacing: 1, color: '#ffffff', font: 'Inter', _w: 220, _h: 40 },
    ]
  },
  {
    name: 'Festival Poster', cat: 'marketing', group: 'Poster', category: 'Poster', presetId: 'custom', custom: { w: 800, h: 1200 },
    bg: { type: 'gradient', color: '#4facfe', color2: '#00f2fe', angle: 45 },
    layers: [
      { type: 'text', text: 'SUMMER', x: 400, y: 150, size: 140, weight: 900, align: 'center', spacing: 15, color: '#ffffff', font: 'Bebas Neue', _w: 500, _h: 168 },
      { type: 'text', text: 'FESTIVAL', x: 400, y: 300, size: 180, weight: 900, align: 'center', spacing: 20, color: '#ffea00', font: 'Bebas Neue', _w: 600, _h: 216 },
      { type: 'rect', x: 200, y: 550, w: 400, h: 80, color: '#ffea00', radius: 40 },
      { type: 'text', text: 'JULY 15-18 • MIAMI', x: 400, y: 575, size: 30, weight: 700, align: 'center', spacing: 4, color: '#000000', font: 'Inter', _w: 300, _h: 36 },
      { type: 'text', text: 'LIVE MUSIC | FOOD | ARTS', x: 400, y: 680, size: 24, weight: 500, align: 'center', spacing: 8, color: '#ffffff', font: 'Inter', _w: 400, _h: 28 },
    ]
  },
  {
    name: 'New Arrival Flyer', cat: 'marketing', group: 'Flyer', category: 'Flyer', presetId: 'instagram-story',
    bg: { type: 'solid', color: '#ffffff' },
    layers: [
      { type: 'ellipse', x: -100, y: -100, w: 600, h: 600, color: '#8b5cf6' },
      { type: 'text', text: 'NEW', x: 100, y: 100, size: 80, weight: 900, align: 'left', spacing: 2, color: '#ffffff', font: 'Poppins', _w: 200, _h: 96 },
      { type: 'text', text: 'ARRIVAL', x: 100, y: 180, size: 80, weight: 900, align: 'left', spacing: 2, color: '#ffffff', font: 'Poppins', _w: 350, _h: 96 },
      { type: 'rect', x: 100, y: 600, w: 880, h: 700, color: '#f1f5f9', radius: 24 },
      { type: 'text', text: 'Spring Collection 2025', x: 540, y: 1350, size: 60, weight: 700, align: 'center', spacing: 0, color: '#0f172a', font: 'Playfair Display', _w: 600, _h: 72 },
      { type: 'text', text: 'Shop now at www.brand.com', x: 540, y: 1450, size: 30, weight: 400, align: 'center', spacing: 2, color: '#64748b', font: 'Inter', _w: 400, _h: 36 },
    ]
  },
  {
    name: 'Minimal Invitation', cat: 'marketing', group: 'Invitation', category: 'Invitation', presetId: 'instagram-post',
    bg: { type: 'solid', color: '#fdfbf7' },
    layers: [
      { type: 'ellipse', x: -100, y: 800, w: 500, h: 500, color: '#fce7f3' },
      { type: 'ellipse', x: 700, y: -100, w: 500, h: 500, color: '#e0f2fe' },
      { type: 'text', text: 'You are invited', x: 540, y: 200, size: 30, weight: 400, align: 'center', spacing: 6, color: '#94a3b8', font: 'Outfit', _w: 400, _h: 40 },
      { type: 'text', text: 'ALEX & SAM', x: 540, y: 350, size: 110, weight: 400, align: 'center', spacing: 4, color: '#0f172a', font: 'Playfair Display', _w: 800, _h: 130 },
      { type: 'text', text: 'Wedding Celebration', x: 540, y: 550, size: 45, weight: 400, align: 'center', spacing: 2, color: '#cbd5e1', font: 'Dancing Script', _w: 600, _h: 60 },
      { type: 'text', text: 'Saturday, August 24\n2026', x: 540, y: 750, size: 24, weight: 300, align: 'center', spacing: 2, color: '#475569', font: 'Inter', _w: 400, _h: 70 }
    ]
  },
  {
    name: 'Q3 Presentation', cat: 'business', group: 'Presentation', category: 'Presentation', presetId: 'youtube-thumbnail',
    bg: { type: 'solid', color: '#0f172a' },
    layers: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 100, color: '#1e293b', radius: 0 },
      { type: 'text', text: 'Q3 Financial Review', x: 50, y: 30, size: 36, weight: 600, align: 'left', spacing: 1, color: '#ffffff', font: 'Inter', _w: 400, _h: 42 },
      { type: 'text', text: '2025 Growth Strategy', x: 100, y: 220, size: 90, weight: 800, align: 'left', spacing: -2, color: '#38bdf8', font: 'Outfit', _w: 800, _h: 108 },
      { type: 'rect', x: 100, y: 380, w: 300, h: 180, color: '#1e293b', radius: 16 },
      { type: 'text', text: '+45%', x: 130, y: 420, size: 60, weight: 700, align: 'left', spacing: 0, color: '#10b981', font: 'Inter', _w: 200, _h: 72 },
      { type: 'text', text: 'Revenue Growth', x: 130, y: 500, size: 24, weight: 400, align: 'left', spacing: 0, color: '#94a3b8', font: 'Inter', _w: 200, _h: 30 },
    ]
  },
  {
    name: 'Creative Portfolio', cat: 'business', group: 'Portfolio', category: 'Portfolio', presetId: 'youtube-thumbnail',
    bg: { type: 'solid', color: '#f8fafc' },
    layers: [
      { type: 'rect', x: 800, y: 0, w: 480, h: 720, color: '#cbd5e1', radius: 0 },
      { type: 'text', text: 'PORTFOLIO', x: 100, y: 100, size: 24, weight: 700, align: 'left', spacing: 4, color: '#0f172a', font: 'Manrope', _w: 300, _h: 30 },
      { type: 'text', text: 'Jane', x: 100, y: 250, size: 140, weight: 300, align: 'left', spacing: -4, color: '#0f172a', font: 'Playfair Display', _w: 500, _h: 150 },
      { type: 'text', text: 'Doe.', x: 100, y: 400, size: 140, weight: 700, align: 'left', spacing: -4, color: '#0f172a', font: 'Playfair Display', _w: 500, _h: 150 },
      { type: 'text', text: 'Creative Director & Designer', x: 100, y: 600, size: 20, weight: 400, align: 'left', spacing: 1, color: '#64748b', font: 'Inter', _w: 400, _h: 24 }
    ]
  },
  {
    name: 'Open To Work', cat: 'business', group: 'LinkedIn Banner', category: 'LinkedIn Banner', presetId: 'linkedin-banner',
    bg: { type: 'gradient', color: '#1e3a8a', color2: '#0ea5e9', angle: 120 },
    layers: [
      { type: 'text', text: 'John Carter', x: 100, y: 130, size: 60, weight: 800, align: 'left', spacing: 0, color: '#ffffff', font: 'Outfit', _w: 700, _h: 72 },
      { type: 'text', text: 'Product Designer · Open to Work', x: 100, y: 220, size: 28, weight: 400, align: 'left', spacing: 1, color: '#bae6fd', font: 'Inter', _w: 800, _h: 34 },
    ]
  },
];

// Top-level category tabs for the Templates panel.
export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social Media' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'business', label: 'Business' },
];
