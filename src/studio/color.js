// src/studio/color.js
// Pure color helpers for the Studio color toolkit. No dependencies.

export function hexToRgb(hex) {
  const m = String(hex).replace('#', '');
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

/** WCAG relative luminance for a hex color. */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

/** WCAG contrast ratio (1–21) between two hex colors, plus pass/fail levels. */
export function contrastRatio(fg, bg) {
  const l1 = luminance(fg), l2 = luminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
  };
}

/** Generate a harmonious palette (analogous + complementary + triadic) from a base color. */
export function generatePalette(baseHex) {
  const { h, s, l } = rgbToHsl(hexToRgb(baseHex));
  const at = (dh, dl = 0) => hslToHex((h + dh + 360) % 360, s, Math.max(8, Math.min(92, l + dl)));
  return [
    at(-30, 8), at(-15), baseHex, at(15), at(30, -8), // analogous spread
    at(180),                                           // complementary
    at(120), at(240),                                  // triadic
  ];
}

/**
 * Extract a dominant-color palette from image pixel data via coarse quantization.
 * @param {Uint8ClampedArray} data RGBA pixels
 * @param {number} count how many swatches to return
 */
export function extractPalette(data, count = 6) {
  const buckets = new Map();
  // Sample every 4th pixel for speed; quantize to 4 bits/channel.
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = data[i] & 0xf0, g = data[i + 1] & 0xf0, b = data[i + 2] & 0xf0;
    const key = (r << 16) | (g << 8) | b;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => rgbToHex((key >> 16) & 255, (key >> 8) & 255, key & 255));
}
