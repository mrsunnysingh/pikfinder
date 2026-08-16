// Single source of truth for every free tool.
// Each entry drives: the /tools/:slug route, hub cards, SEO meta,
// JSON-LD structured data, the sitemap, and the prerender script.

export const SITE_URL = 'https://www.pikfinder.com';

export const CATEGORIES = [
  { id: 'compress', name: 'Compress & reduce size', blurb: 'Shrink files for uploads, email, and faster pages — including exact-KB targets for forms.' },
  { id: 'resize', name: 'Resize, crop & rotate', blurb: 'Set exact dimensions, crop to a ratio, fix orientation, or enlarge small images.' },
  { id: 'convert', name: 'Convert format', blurb: 'Move between JPG, PNG, WebP, AVIF, HEIC, SVG, and ICO.' },
  { id: 'pdf', name: 'Documents & PDF', blurb: 'Move between images and PDF pages, and shrink heavy PDFs.' },
  { id: 'web', name: 'Web, favicons & icons', blurb: 'Prepare assets for websites and apps.' },
  { id: 'photo', name: 'Photo prep & ID', blurb: 'Get photos ready for applications, profiles, and listings.' },
  { id: 'privacy', name: 'Privacy & metadata', blurb: 'Inspect or strip the hidden data inside your photos.' },
  { id: 'creative', name: 'Creative & editing', blurb: 'Watermark, obscure, and animate images.' },
  { id: 'color', name: 'Color & inspection', blurb: 'Read colors and compare images.' },
  { id: 'generate', name: 'Generate & extract text', blurb: 'Create codes and pull text out of images.' },
  { id: 'design', name: 'Design & code', blurb: 'Backgrounds and gradients for your projects.' },
  { id: 'create', name: 'Create & social', blurb: 'Design social posts, thumbnails, and banners in the Creator Studio.' },
];

const PRIVACY_FAQ = {
  q: 'Are my files uploaded to a server?',
  a: 'No. This tool runs 100% in your browser. Your files never leave your device, which makes it fast and completely private.',
};
const FREE_FAQ = {
  q: 'Is this tool free for commercial use?',
  a: 'Yes. All PikFinder tools are free with no sign-up, no watermarks, and no usage limits. Files you process belong entirely to you.',
};

// helper: build a tool entry with sensible defaults
const t = (entry) => ({
  faq: [PRIVACY_FAQ, FREE_FAQ],
  presetProps: {},
  ...entry,
});

const convertTool = (from, to, desc, extra = {}) =>
  t({
    slug: `${from.toLowerCase()}-to-${to.toLowerCase()}`,
    name: `${from} to ${to} Converter`,
    short: `${from} to ${to}`,
    category: 'convert',
    engine: 'convert',
    presetProps: { from: from.toLowerCase(), to: to.toLowerCase() },
    description: desc,
    keywords: [`${from.toLowerCase()} to ${to.toLowerCase()}`, `convert ${from.toLowerCase()} to ${to.toLowerCase()}`, `${from.toLowerCase()} ${to.toLowerCase()} converter online free`],
    howTo: [
      `Drop your ${from} file into the upload area or click to browse.`,
      `The tool converts it to ${to} instantly in your browser.`,
      `Preview the result and download your ${to} file.`,
    ],
    faq: [
      { q: `Why convert ${from} to ${to}?`, a: desc },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
    ...extra,
  });

export const TOOLS = [
  // ============ COMPRESS ============
  t({
    slug: 'compress-image', name: 'Compress Image', short: 'Compress Image', category: 'compress', engine: 'compress',
    description: 'Reduce image file size with quality, target-size, and max-width controls. Free online image compressor that runs in your browser.',
    keywords: ['compress image', 'image compressor', 'reduce image size', 'compress jpg', 'compress png online free'],
    howTo: ['Upload an image (JPG, PNG, or WebP).', 'Choose a quality level or an exact target size in KB.', 'Download the compressed image.'],
    faq: [
      { q: 'How does image compression work?', a: 'The tool re-encodes your image at a lower quality setting and can also scale down oversized dimensions. For exact targets it binary-searches the quality value until the output hits your KB goal.' },
      { q: 'Will compression ruin my image quality?', a: 'Moderate compression (60–80% quality) is usually invisible to the eye. The live preview lets you compare before and after so you can pick the sweet spot.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'compress-image-to-20kb', name: 'Compress Image to 20KB', short: 'Compress to 20KB', category: 'compress', engine: 'compress',
    presetProps: { targetKB: 20 },
    description: 'Compress any image to exactly 20KB or less — perfect for strict exam-form and government-portal upload limits.',
    keywords: ['compress image to 20kb', 'reduce image size to 20kb', '20kb photo compressor', 'compress photo 20kb online'],
    howTo: ['Upload your photo.', 'The tool automatically compresses and resizes it to fit under 20KB.', 'Download the result and upload it to your form.'],
    faq: [
      { q: 'Why do forms ask for 20KB images?', a: 'Many exam portals, visa applications, and government forms enforce a 20KB limit to keep their systems fast. This tool hits that target automatically by tuning quality and dimensions together.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'compress-image-to-50kb', name: 'Compress Image to 50KB', short: 'Compress to 50KB', category: 'compress', engine: 'compress',
    presetProps: { targetKB: 50 },
    description: 'Compress any image to 50KB or less — the most common application-photo and portal upload limit.',
    keywords: ['compress image to 50kb', 'reduce image size to 50kb', '50kb photo compressor'],
    howTo: ['Upload your photo.', 'The tool automatically compresses it to fit under 50KB.', 'Download the compressed file.'],
  }),
  t({
    slug: 'compress-image-to-100kb', name: 'Compress Image to 100KB', short: 'Compress to 100KB', category: 'compress', engine: 'compress',
    presetProps: { targetKB: 100 },
    description: 'Compress any image to 100KB or less — a frequent upload cap for forms, CMS uploads, and email attachments.',
    keywords: ['compress image to 100kb', 'reduce image size to 100kb', '100kb image compressor'],
    howTo: ['Upload your photo.', 'The tool automatically compresses it to fit under 100KB.', 'Download the compressed file.'],
  }),

  t({
    slug: 'increase-image-size', name: 'Increase Image File Size', short: 'Increase Image Size', category: 'compress', engine: 'filesize-increase',
    description: 'Increase a photo\'s file size to an exact target in KB without changing how it looks or its dimensions. For forms that require a minimum image size — the opposite of a compressor.',
    keywords: ['increase image size in kb', 'increase jpg file size', 'make image bigger in kb', 'photo size increase for form', 'image size badhaye', 'increase photo size to 50kb', 'minimum image size for form'],
    howTo: ['Upload your photo.', 'Enter the target size in KB (e.g. 20 or 50).', 'Download the resized file — same image, larger file size.'],
    faq: [
      { q: 'Why would I need to increase an image\'s file size?', a: 'Many exam and government upload forms require a photo to be at least a minimum size (e.g. "20KB to 50KB"). If your photo is too small, the form rejects it. This tool pads the file up to the size you need.' },
      { q: 'Does it change how my photo looks?', a: 'No. The pixels and dimensions stay exactly the same — the tool adds standards-compliant filler data (a JPEG comment segment) that every viewer ignores, so only the file size changes.' },
      { q: 'Is the file still a valid image?', a: 'Yes. It remains a valid JPEG that opens everywhere and passes upload checks; we simply enlarge the file to your target byte size.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'increase-image-size-to-20kb', name: 'Increase Image Size to 20KB', short: 'Increase to 20KB', category: 'compress', engine: 'filesize-increase',
    presetProps: { targetKB: 20 },
    description: 'Make a too-small photo exactly 20KB for forms that require a minimum 20KB image — without changing how it looks.',
    keywords: ['increase image size to 20kb', 'photo minimum 20kb', 'make image 20kb', 'increase jpg to 20kb'],
    howTo: ['Upload your photo.', 'It is set to 20KB automatically.', 'Download and upload it to your form.'],
  }),
  t({
    slug: 'increase-image-size-to-50kb', name: 'Increase Image Size to 50KB', short: 'Increase to 50KB', category: 'compress', engine: 'filesize-increase',
    presetProps: { targetKB: 50 },
    description: 'Make a too-small photo exactly 50KB for forms that require a minimum 50KB image — without changing how it looks.',
    keywords: ['increase image size to 50kb', 'photo minimum 50kb', 'make image 50kb', 'increase jpg to 50kb'],
    howTo: ['Upload your photo.', 'It is set to 50KB automatically.', 'Download and upload it to your form.'],
  }),

  // ============ RESIZE / CROP / ROTATE ============
  t({
    slug: 'resize-image', name: 'Resize Image', short: 'Resize Image', category: 'resize', engine: 'resize',
    description: 'Resize images to exact pixel dimensions online. Keep or change the aspect ratio, with presets for common sizes.',
    keywords: ['resize image', 'image resizer', 'resize photo online', 'change image dimensions'],
    howTo: ['Upload an image.', 'Enter a width and height in pixels, or pick a preset.', 'Download the resized image.'],
  }),
  t({
    slug: 'crop-image', name: 'Crop Image', short: 'Crop Image', category: 'resize', engine: 'crop',
    description: 'Crop images online to 1:1 square, 16:9, 9:16, or any free selection. Drag to select exactly the area you want.',
    keywords: ['crop image', 'image cropper', 'crop photo online', 'crop to square', 'crop 16:9'],
    howTo: ['Upload an image.', 'Pick an aspect ratio or drag a free selection over the image.', 'Download the cropped result.'],
  }),
  t({
    slug: 'rotate-image', name: 'Rotate Image', short: 'Rotate Image', category: 'resize', engine: 'rotate',
    description: 'Rotate images 90, 180, or 270 degrees and flip horizontally or vertically to fix orientation. Free and instant.',
    keywords: ['rotate image', 'flip image', 'rotate photo online', 'fix image orientation'],
    howTo: ['Upload an image.', 'Use the rotate and flip buttons until the orientation is right.', 'Download the fixed image.'],
  }),
  t({
    slug: 'image-upscaler', name: 'Image Upscaler', short: 'Image Upscaler', category: 'resize', engine: 'upscale',
    description: 'Enlarge images 2x, 3x, or 4x with high-quality multi-pass bicubic resampling — no signup, right in your browser.',
    keywords: ['image upscaler', 'enlarge image', 'upscale image online', 'increase image resolution'],
    howTo: ['Upload a small image.', 'Choose 2x, 3x, or 4x enlargement.', 'Download the upscaled image.'],
    faq: [
      { q: 'How does upscaling work without AI?', a: 'The tool enlarges in multiple smaller steps using high-quality bicubic resampling with smoothing, which produces noticeably cleaner edges than a single big jump.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'resize-image-to-20kb', name: 'Resize Image to 20KB', short: 'Resize to 20KB', category: 'resize', engine: 'resize',
    presetProps: { targetKB: 20 },
    description: 'Resize and compress an image to hit a strict 20KB target — a resize-first workflow for form and portal uploads.',
    keywords: ['resize image to 20kb', 'resize photo 20kb', 'reduce photo to 20kb'],
    howTo: ['Upload your photo.', 'Set your dimensions — the tool then compresses to fit 20KB.', 'Download the result.'],
  }),
  t({
    slug: 'resize-image-for-instagram', name: 'Resize Image for Instagram', short: 'Instagram Resizer', category: 'resize', engine: 'resize',
    presetProps: {
      presets: [
        { label: 'Post — Square (1080x1080)', w: 1080, h: 1080 },
        { label: 'Post — Portrait (1080x1350)', w: 1080, h: 1350 },
        { label: 'Story / Reel (1080x1920)', w: 1080, h: 1920 },
        { label: 'Landscape (1080x566)', w: 1080, h: 566 },
      ],
    },
    description: 'Resize photos to the exact sizes Instagram uses for posts, portraits, stories, and reels — 1080x1080, 1080x1350, 1080x1920.',
    keywords: ['resize image for instagram', 'instagram photo size', 'instagram post size 1080', 'instagram story size'],
    howTo: ['Upload your photo.', 'Pick a size preset for posts, stories, or reels.', 'Download and post.'],
  }),

  // ============ CONVERT ============
  t({
    slug: 'image-format-converter', name: 'Image Format Converter', short: 'Format Converter', category: 'convert', engine: 'convert',
    presetProps: { from: 'any', to: 'any' },
    description: 'Convert images between JPG, PNG, WebP, AVIF, HEIC, and SVG in one place. Free, fast, and private — files never leave your browser.',
    keywords: ['image converter', 'convert image format', 'image format converter online free'],
    howTo: ['Upload any image (JPG, PNG, WebP, AVIF, HEIC, or SVG).', 'Choose the output format.', 'Download the converted file.'],
  }),
  t({
    slug: 'convert-images', name: 'Convert Images', short: 'Convert Images', category: 'convert', engine: 'convert',
    presetProps: { from: 'any', to: 'any' },
    description: 'Free online image conversion between JPG, PNG, WebP, AVIF, HEIC, and SVG formats, processed entirely on your device.',
    keywords: ['convert images', 'convert image online', 'free image conversion'],
    howTo: ['Upload any image.', 'Choose the output format.', 'Download the converted file.'],
  }),
  convertTool('PNG', 'JPG', 'JPG flattens transparency and produces much smaller files for photo-style images — ideal for email and web uploads.'),
  convertTool('JPG', 'PNG', 'PNG is lossless, so it is ideal for editing workflows, screenshots, and UI assets where quality must not degrade.'),
  convertTool('PNG', 'WebP', 'WebP delivers smaller files than PNG while keeping transparency — perfect for modern, faster-loading web pages.'),
  convertTool('JPG', 'WebP', 'WebP compresses photos 25-35% smaller than JPG at the same visual quality, making pages load faster.'),
  convertTool('WebP', 'PNG', 'PNG output is lossless and universally supported — useful when a tool or platform cannot open WebP files.'),
  convertTool('WebP', 'JPG', 'JPG is supported everywhere, making it the safest choice for older software, printing services, and uploads.'),
  convertTool('JPG', 'AVIF', 'AVIF is the most aggressive modern format, often halving file size versus JPG at equal quality.'),
  convertTool('PNG', 'AVIF', 'AVIF keeps transparency like PNG but at a fraction of the file size — great for modern web delivery.'),
  convertTool('AVIF', 'JPG', 'JPG output ensures compatibility with older browsers, editors, and systems that cannot open AVIF.'),
  convertTool('AVIF', 'PNG', 'PNG gives you a lossless working copy of an AVIF image for editing or maximum compatibility.'),
  convertTool('HEIC', 'JPG', 'iPhone photos are saved as HEIC, which many apps and websites reject. JPG works everywhere.'),
  convertTool('HEIC', 'PNG', 'Convert iPhone HEIC photos to lossless PNG for editing without any quality loss.'),
  convertTool('SVG', 'PNG', 'Rasterize vector graphics into PNG at any resolution — needed for platforms that do not accept SVG uploads.'),

  // ============ PDF ============
  t({
    slug: 'compress-pdf', name: 'Compress PDF', short: 'Compress PDF', category: 'pdf', engine: 'pdf-compress',
    description: 'Shrink scanned and image-heavy PDFs for email and uploads. Compression runs entirely in your browser — documents stay private.',
    keywords: ['compress pdf', 'pdf compressor', 'reduce pdf size online free'],
    howTo: ['Upload your PDF.', 'Choose a compression level.', 'Download the smaller PDF.'],
    faq: [
      { q: 'How much smaller will my PDF get?', a: 'Scanned and image-heavy PDFs typically shrink 50-80%. Text-only PDFs are already efficient and compress less.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'pdf-to-jpg', name: 'PDF to JPG', short: 'PDF to JPG', category: 'pdf', engine: 'pdf-to-jpg',
    description: 'Extract PDF pages as high-quality JPG images. Convert every page or pick the ones you need — all in your browser.',
    keywords: ['pdf to jpg', 'convert pdf to image', 'pdf to jpg converter online free'],
    howTo: ['Upload your PDF.', 'Each page renders as a JPG preview.', 'Download individual pages or all at once.'],
  }),
  t({
    slug: 'image-to-pdf', name: 'Image to PDF', short: 'Image to PDF', category: 'pdf', engine: 'image-to-pdf',
    description: 'Combine JPG and PNG images into a single PDF document. Reorder pages, pick a page size, and download instantly.',
    keywords: ['image to pdf', 'jpg to pdf', 'convert images to pdf online free'],
    howTo: ['Upload one or more images.', 'Arrange them in the order you want.', 'Download the combined PDF.'],
  }),

  // ============ WEB / FAVICON ============
  t({
    slug: 'png-to-ico', name: 'PNG to ICO', short: 'PNG to ICO', category: 'web', engine: 'favicon',
    presetProps: { icoOnly: true },
    description: 'Turn a PNG logo into a favicon.ico file with multiple embedded sizes (16, 32, 48px) — the format browsers expect.',
    keywords: ['png to ico', 'convert png to ico', 'ico converter', 'make favicon from png'],
    howTo: ['Upload a square PNG logo.', 'The tool packs 16, 32, and 48px versions into one ICO.', 'Download favicon.ico and drop it in your site root.'],
  }),
  t({
    slug: 'favicon-generator', name: 'Favicon Generator', short: 'Favicon Generator', category: 'web', engine: 'favicon',
    description: 'Generate a complete favicon package: favicon.ico, PNG sizes for every device, apple-touch-icon, and a web manifest — from one image.',
    keywords: ['favicon generator', 'create favicon', 'favicon package', 'apple touch icon generator'],
    howTo: ['Upload a square logo (at least 512x512 recommended).', 'The tool generates every size plus the HTML snippet.', 'Download the ZIP and copy the HTML into your <head>.'],
  }),
  t({
    slug: 'image-to-base64', name: 'Image to Base64', short: 'Image to Base64', category: 'web', engine: 'base64',
    description: 'Convert any image into a Base64 data URI for inlining in HTML, CSS, or JSON. Includes ready-to-copy img tag and CSS snippets.',
    keywords: ['image to base64', 'base64 encoder', 'data uri generator', 'convert image to base64 online'],
    howTo: ['Upload an image.', 'The Base64 data URI is generated instantly.', 'Copy the raw string, HTML tag, or CSS snippet.'],
  }),

  // ============ PHOTO PREP ============
  t({
    slug: 'passport-photo-maker', name: 'Passport Photo Maker', short: 'Passport Photo', category: 'photo', engine: 'resize',
    presetProps: {
      presets: [
        { label: 'US Passport (2x2 in, 600x600)', w: 600, h: 600 },
        { label: 'India Passport (35x45 mm, 413x531)', w: 413, h: 531 },
        { label: 'UK / EU Passport (35x45 mm, 413x531)', w: 413, h: 531 },
        { label: 'Visa Photo (2x2 in, 600x600)', w: 600, h: 600 },
        { label: 'PAN Card (25x35 mm, 295x413)', w: 295, h: 413 },
      ],
    },
    description: 'Resize photos to common passport and visa dimensions for online applications — US 2x2, India and EU 35x45mm, and more.',
    keywords: ['passport photo maker', 'passport size photo online', 'visa photo resize', '35x45 photo'],
    howTo: ['Upload a clear, front-facing photo.', 'Pick your country or document preset.', 'Download the correctly sized photo.'],
  }),
  t({
    slug: 'signature-resizer', name: 'Signature Resizer', short: 'Signature Resizer', category: 'photo', engine: 'resize',
    presetProps: {
      targetKB: 20,
      presets: [
        { label: 'Standard (140x60)', w: 140, h: 60 },
        { label: 'Wide (200x80)', w: 200, h: 80 },
        { label: 'Exam Portal (256x64)', w: 256, h: 64 },
      ],
    },
    description: 'Resize signature images to the exact dimensions and KB limits required by exam forms, banking portals, and applications.',
    keywords: ['signature resizer', 'resize signature for exam', 'signature size for online form'],
    howTo: ['Upload a photo or scan of your signature.', 'Pick the required dimension preset.', 'Download a file that fits the portal limits.'],
  }),
  t({
    slug: 'social-media-resizer', name: 'Social Media Resizer', short: 'Social Resizer', category: 'photo', engine: 'resize',
    presetProps: {
      presets: [
        { label: 'Instagram Post (1080x1080)', w: 1080, h: 1080 },
        { label: 'Instagram Story (1080x1920)', w: 1080, h: 1920 },
        { label: 'YouTube Thumbnail (1280x720)', w: 1280, h: 720 },
        { label: 'Open Graph / Link Preview (1200x630)', w: 1200, h: 630 },
        { label: 'X / Twitter Post (1600x900)', w: 1600, h: 900 },
        { label: 'LinkedIn Post (1200x627)', w: 1200, h: 627 },
        { label: 'Facebook Cover (820x312)', w: 820, h: 312 },
      ],
    },
    description: 'Resize images to the exact sizes used by Instagram, YouTube thumbnails, Open Graph link previews, X, LinkedIn, and Facebook.',
    keywords: ['social media image resizer', 'youtube thumbnail size', 'og image size', 'social media image sizes'],
    howTo: ['Upload your image.', 'Pick the platform preset you need.', 'Download the perfectly sized image.'],
  }),
  t({
    slug: 'background-remover', name: 'Background Remover', short: 'Background Remover', category: 'photo', engine: 'bg-remove', heavy: true,
    description: 'Remove image backgrounds automatically, right in your browser. AI runs locally on your device — photos are never uploaded.',
    keywords: ['background remover', 'remove background from image', 'transparent background maker', 'free background remover no signup'],
    howTo: ['Upload a photo with a clear subject.', 'The on-device AI model separates the subject from the background.', 'Download a transparent PNG cutout.'],
    faq: [
      { q: 'Is this really free? Other background removers charge.', a: 'Yes. The AI model (U2-Net, Apache 2.0 licensed) runs entirely in your browser, so there are no server costs to pass on. No watermarks, no credits, no signup.' },
      { q: 'Why does the first run take a moment?', a: 'Your browser downloads the AI model (~40MB) once, then caches it. Subsequent images process in seconds.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'add-background', name: 'Add Background', short: 'Add Background', category: 'photo', engine: 'add-background',
    description: 'Add a solid color background to transparent images, or pad photos to a square or custom canvas — great after background removal.',
    keywords: ['add background to image', 'add white background', 'pad image to square', 'change photo background color'],
    howTo: ['Upload an image (transparent PNGs work great).', 'Pick a background color and canvas size.', 'Download the composited image.'],
  }),

  // ============ PRIVACY ============
  t({
    slug: 'remove-metadata', name: 'Remove Metadata from Photos', short: 'Remove Metadata', category: 'privacy', engine: 'metadata',
    presetProps: { mode: 'strip' },
    description: 'Strip EXIF, GPS location, and other hidden metadata from photos before sharing them. Processing happens on your device.',
    keywords: ['remove exif data', 'remove metadata from photo', 'strip gps from photo', 'exif remover online'],
    howTo: ['Upload a photo.', 'See exactly what hidden data it contains.', 'Download a clean copy with all metadata removed.'],
    faq: [
      { q: 'What hidden data do photos contain?', a: 'Photos often embed the GPS location where they were taken, the exact time, your camera or phone model, and sometimes the owner name — all invisible in the image itself.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),
  t({
    slug: 'exif-viewer', name: 'EXIF Viewer', short: 'EXIF Viewer', category: 'privacy', engine: 'metadata',
    presetProps: { mode: 'view' },
    description: 'View all EXIF, GPS, and IPTC metadata inside a photo: camera model, exposure settings, location, timestamps, and more.',
    keywords: ['exif viewer', 'view photo metadata', 'exif data reader online', 'check photo gps location'],
    howTo: ['Upload a photo.', 'All embedded metadata is displayed in a readable table.', 'Optionally download a metadata-free copy.'],
  }),

  // ============ CREATIVE ============
  t({
    slug: 'watermark-image', name: 'Watermark Image', short: 'Watermark', category: 'creative', engine: 'edit',
    presetProps: { mode: 'watermark' },
    description: 'Add a text watermark to your images — control the text, position, size, opacity, and color. Protect your photos before sharing.',
    keywords: ['watermark image', 'add watermark to photo', 'text watermark online free'],
    howTo: ['Upload an image.', 'Type your watermark text and adjust position, size, and opacity.', 'Download the watermarked image.'],
  }),
  t({
    slug: 'blur-image', name: 'Blur / Pixelate Image', short: 'Blur / Pixelate', category: 'creative', engine: 'edit',
    presetProps: { mode: 'blur' },
    description: 'Blur or pixelate parts of an image to hide faces, license plates, and sensitive details. Drag to select the exact area.',
    keywords: ['blur image', 'pixelate image', 'blur face in photo', 'censor image online'],
    howTo: ['Upload an image.', 'Drag over the areas you want to obscure and pick blur or pixelate.', 'Download the redacted image.'],
  }),
  t({
    slug: 'gif-maker', name: 'GIF Maker', short: 'GIF Maker', category: 'creative', engine: 'gif',
    description: 'Turn a series of images into an animated GIF. Set the frame delay, reorder frames, and download — all in your browser.',
    keywords: ['gif maker', 'create gif from images', 'animated gif maker online free'],
    howTo: ['Upload 2 or more images as frames.', 'Arrange the order and set the speed.', 'Download your animated GIF.'],
  }),

  // ============ COLOR ============
  t({
    slug: 'color-palette-extractor', name: 'Color Palette Extractor', short: 'Palette Extractor', category: 'color', engine: 'color',
    presetProps: { mode: 'palette' },
    description: 'Extract the dominant colors from any image and copy their HEX codes — perfect for building palettes from photos and designs.',
    keywords: ['color palette extractor', 'get colors from image', 'extract hex colors from photo'],
    howTo: ['Upload an image.', 'The dominant colors appear as swatches.', 'Click any swatch to copy its HEX code.'],
  }),
  t({
    slug: 'color-picker', name: 'Image Color Picker', short: 'Color Picker', category: 'color', engine: 'color',
    presetProps: { mode: 'picker' },
    description: 'Pick the exact RGB and HEX color of any pixel in an image. Hover to inspect, click to copy.',
    keywords: ['image color picker', 'get hex color from image', 'eyedropper online', 'pick color from photo'],
    howTo: ['Upload an image.', 'Move your cursor over the image to read colors live.', 'Click to copy the HEX value.'],
  }),
  t({
    slug: 'image-diff', name: 'Image Diff Checker', short: 'Image Diff', category: 'color', engine: 'color',
    presetProps: { mode: 'diff' },
    description: 'Compare two images pixel-by-pixel and highlight every difference — useful for design reviews and visual regression checks.',
    keywords: ['image diff', 'compare two images', 'find differences between images', 'image comparison tool'],
    howTo: ['Upload two images of the same size.', 'Differing pixels are highlighted in the diff view.', 'Review the difference percentage and map.'],
  }),

  // ============ GENERATE ============
  t({
    slug: 'qr-code-generator', name: 'QR Code Generator', short: 'QR Generator', category: 'generate', engine: 'qr',
    description: 'Generate QR codes for links, text, WiFi, and more. Customize the size and colors, and export as PNG or SVG — free, no signup.',
    keywords: ['qr code generator', 'create qr code free', 'qr code for link', 'qr code png svg'],
    howTo: ['Type or paste your link or text.', 'Adjust size and colors if you like.', 'Download as PNG or SVG.'],
  }),
  t({
    slug: 'ocr-image-to-text', name: 'OCR — Image to Text', short: 'Image to Text (OCR)', category: 'generate', engine: 'ocr', heavy: true,
    description: 'Extract text from photos, screenshots, and scans with on-device OCR in 12 languages. Images never leave your browser.',
    keywords: ['image to text', 'ocr online free', 'extract text from image', 'photo to text converter'],
    howTo: ['Upload a photo or scan containing text.', 'Pick the language and run OCR.', 'Copy or download the extracted text.'],
    faq: [
      { q: 'Which languages are supported?', a: 'English, Spanish, French, German, Portuguese, Italian, Dutch, Hindi, Arabic, Chinese (Simplified), Japanese, and Korean.' },
      { q: 'Why does the first run take a moment?', a: 'The OCR engine downloads a language model (~15MB) once, then caches it for instant future use.' },
      PRIVACY_FAQ, FREE_FAQ,
    ],
  }),

  // ============ EXISTING DESIGN TOOLS (external routes) ============
  t({
    slug: 'background-generator', name: 'Background Generator', short: 'Background Generator', category: 'design', engine: 'external', route: '/backgrounds',
    description: 'Create gradient, mesh, and abstract backgrounds and export them as PNG.',
    keywords: ['background generator', 'gradient background maker'],
    howTo: ['Open the generator.', 'Pick a style and colors.', 'Export as PNG.'],
  }),
  t({
    slug: 'gradient-generator', name: 'Gradient Generator', short: 'Gradient Generator', category: 'design', engine: 'external', route: '/tools/gradient-generator',
    description: 'Design beautiful gradients and export them as CSS or SVG.',
    keywords: ['gradient generator', 'css gradient maker'],
    howTo: ['Open the generator.', 'Adjust colors and angle.', 'Copy the CSS or SVG.'],
  }),

  // ============ CREATE & SOCIAL (Creator Studio) ============
  t({
    slug: 'creator-studio', name: 'Creator Studio', short: 'Creator Studio', category: 'create', engine: 'external', route: '/studio',
    description: 'A free, lightweight editor for social posts, thumbnails, and banners. Crop, filter, add text and shapes, then export PNG, JPG, or WEBP.',
    keywords: ['creator studio', 'free image editor', 'social media maker', 'online photo editor'],
    howTo: ['Pick a preset size.', 'Start blank, upload, or use a free stock image.', 'Add text and shapes, then export.'],
  }),
  t({
    slug: 'instagram-post-maker', name: 'Instagram Post Maker', short: 'Instagram Post', category: 'create', engine: 'external', route: '/studio?preset=instagram-post',
    description: 'Design Instagram posts free at the perfect 1080×1080 size. Add text, filters, and shapes, then export in one click.',
    keywords: ['instagram post maker', 'instagram post creator', 'ig post editor', '1080x1080 maker'],
    howTo: ['Open the Instagram Post preset.', 'Add your image and text.', 'Export as PNG or JPG.'],
  }),
  t({
    slug: 'youtube-thumbnail-maker', name: 'YouTube Thumbnail Maker', short: 'YouTube Thumbnail', category: 'create', engine: 'external', route: '/studio?preset=youtube-thumbnail',
    description: 'Make click-worthy YouTube thumbnails free at 1280×720. Bold text, shapes, and free stock images. Export high quality instantly.',
    keywords: ['youtube thumbnail maker', 'thumbnail creator', '1280x720 thumbnail', 'yt thumbnail editor'],
    howTo: ['Open the YouTube Thumbnail preset.', 'Add a background and bold text.', 'Export a high-quality image.'],
  }),
  t({
    slug: 'social-media-tools', name: 'Social Media Tools', short: 'Social Tools', category: 'create', engine: 'external', route: '/studio',
    description: 'Everything you need to create social media graphics: Instagram posts and stories, YouTube thumbnails, X, LinkedIn, and Facebook banners.',
    keywords: ['social media tools', 'banner maker', 'social media image maker', 'story maker'],
    howTo: ['Pick your platform preset.', 'Design with text, shapes, and images.', 'Export in the exact required size.'],
  }),
];

export function getToolBySlug(slug) {
  return TOOLS.find((tool) => tool.slug === slug) || null;
}

export function getToolsByCategory(categoryId) {
  return TOOLS.filter((tool) => tool.category === categoryId);
}

/** Related tools: same category first, then same engine, capped at 6. */
export function getRelatedTools(tool, limit = 6) {
  const sameCategory = TOOLS.filter((x) => x.slug !== tool.slug && x.category === tool.category);
  const sameEngine = TOOLS.filter(
    (x) => x.slug !== tool.slug && x.category !== tool.category && x.engine === tool.engine
  );
  return [...sameCategory, ...sameEngine].slice(0, limit);
}

export function toolPath(tool) {
  return tool.route || `/tools/${tool.slug}`;
}
