// src/lib/coverImage.js
// Generates a branded blog cover banner (1200x630, OG-image ratio) from a post's
// title + description — no external service, no cost. Returns a JPEG data URL
// suitable for storing as `coverImage` and using directly in <img src>.

function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // Ellipsis if we ran out of room.
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

// A few on-brand gradient pairs; pick one deterministically from the title so a
// given post always regenerates the same look.
const GRADIENTS = [
  ['#4c1d95', '#831843'],
  ['#1e1b4b', '#6d28d9'],
  ['#0f766e', '#4c1d95'],
  ['#7c2d12', '#831843'],
  ['#312e81', '#0e7490'],
];

export function generateCover({ title = '', description = '', brand = 'PikFinder' } = {}) {
  const W = 1200, H = 630, PAD = 84;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const seed = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [c1, c2] = GRADIENTS[seed % GRADIENTS.length];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Subtle glow blob for depth
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.15, 40, W * 0.82, H * 0.15, 520);
  glow.addColorStop(0, 'rgba(255,255,255,0.18)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // Brand label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '600 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`◈  ${brand}`, PAD, PAD + 18);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 66px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  const titleLines = wrap(ctx, title || 'Untitled post', W - PAD * 2, 4);
  let y = 250;
  const titleLH = 80;
  for (const ln of titleLines) { ctx.fillText(ln, PAD, y); y += titleLH; }

  // Description
  if (description) {
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '400 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    y += 12;
    const remaining = Math.max(1, Math.floor((H - PAD - y) / 44));
    const descLines = wrap(ctx, description, W - PAD * 2, Math.min(3, remaining));
    for (const ln of descLines) { ctx.fillText(ln, PAD, y); y += 44; }
  }

  // Accent underline bottom-left
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(PAD, H - PAD, 90, 6);

  return canvas.toDataURL('image/jpeg', 0.82);
}
