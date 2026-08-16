// src/studio/presets.js
// Canvas presets for the Creator Studio. Dimensions are the real export sizes;
// the on-screen canvas is scaled down with CSS for display.

export const PRESETS = [
  { id: 'instagram-post', label: 'Instagram Post', w: 1080, h: 1080, group: 'Instagram' },
  { id: 'instagram-story', label: 'Instagram Story', w: 1080, h: 1920, group: 'Instagram' },
  { id: 'whatsapp-status', label: 'WhatsApp Status', w: 1080, h: 1920, group: 'Messaging' },
  { id: 'youtube-thumbnail', label: 'YouTube Thumbnail', w: 1280, h: 720, group: 'YouTube' },
  { id: 'x-banner', label: 'X Banner', w: 1500, h: 500, group: 'Banners' },
  { id: 'linkedin-banner', label: 'LinkedIn Banner', w: 1584, h: 396, group: 'Banners' },
  { id: 'facebook-cover', label: 'Facebook Cover', w: 851, h: 315, group: 'Banners' },
  { id: 'custom', label: 'Custom', w: 1200, h: 800, group: 'Other' },
];

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

// Per-preset SEO copy for the Studio landing page.
export const PRESET_SEO = {
  'instagram-post': {
    title: 'Instagram Post Maker — Free 1080×1080 Creator | PikFinder',
    description: 'Create Instagram posts free. Start blank, upload, or use a free stock image, then add text, shapes, and filters. Export PNG, JPG, or WEBP in one click.',
  },
  'instagram-story': {
    title: 'Instagram Story Maker — Free 1080×1920 Editor | PikFinder',
    description: 'Design Instagram Stories free at the perfect 1080×1920 size. Add text, gradients, and effects, then export instantly. No sign-up, works on mobile.',
  },
  'youtube-thumbnail': {
    title: 'YouTube Thumbnail Maker — Free 1280×720 Editor | PikFinder',
    description: 'Make click-worthy YouTube thumbnails free at 1280×720. Bold text, shapes, filters, and free stock images. Export high-quality PNG or JPG in seconds.',
  },
  'x-banner': {
    title: 'X (Twitter) Banner Maker — Free 1500×500 | PikFinder',
    description: 'Create an X / Twitter header banner free at 1500×500. Add text and graphics over free stock imagery and export in the exact size X needs.',
  },
  'linkedin-banner': {
    title: 'LinkedIn Banner Maker — Free 1584×396 | PikFinder',
    description: 'Design a professional LinkedIn cover banner free at 1584×396. Add your name, tagline, and brand colors, then export a crisp PNG.',
  },
  'facebook-cover': {
    title: 'Facebook Cover Maker — Free 851×315 | PikFinder',
    description: 'Make a Facebook cover photo free at 851×315. Combine free stock images, text, and shapes, then export instantly.',
  },
  'whatsapp-status': {
    title: 'WhatsApp Status Maker — Free 1080×1920 | PikFinder',
    description: 'Create WhatsApp status images free at 1080×1920. Add text and effects over any image and download in seconds.',
  },
  default: {
    title: 'Creator Studio — Free Social Media & Image Editor | PikFinder',
    description: 'PikFinder Creator Studio: a free, lightweight editor for Instagram posts, stories, YouTube thumbnails, and banners. Crop, filter, add text and shapes, export PNG/JPG/WEBP.',
  },
};
