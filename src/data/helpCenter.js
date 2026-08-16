// src/data/helpCenter.js
// Content for the PikFinder Help Center. Structured so the page can search,
// filter by category, and render rich articles (paragraphs, steps, code, notes).

export const HELP_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket', blurb: 'New to PikFinder? Start here.' },
  { id: 'search', label: 'Searching Media', icon: 'MagnifyingGlass', blurb: 'Find free photos, vectors & video.' },
  { id: 'studio', label: 'Creator Studio', icon: 'PaintBrush', blurb: 'Design, edit and export like a pro.' },
  { id: 'pdf', label: 'PDF Editor', icon: 'FilePdf', blurb: 'Edit text & images in any PDF.' },
  { id: 'business', label: 'Document Generator & Zoho', icon: 'Buildings', blurb: 'Generate documents from your data.' },
  { id: 'tools', label: 'Free Tools', icon: 'Wrench', blurb: 'Compress, convert, resize & more.' },
  { id: 'account', label: 'Account & Billing', icon: 'UserCircle', blurb: 'Sign in, profile, subscription.' },
  { id: 'best-practices', label: 'Best Practices', icon: 'Sparkle', blurb: 'Tips to get pro results.' },
  { id: 'api', label: 'API & Developers', icon: 'Code', blurb: 'Build on the PikFinder API.' },
];

export const HELP_ARTICLES = [
  // ── Getting Started ────────────────────────────────────────────────────────
  {
    id: 'what-is-pikfinder', cat: 'getting-started', title: 'What is PikFinder?',
    tags: ['overview', 'about', 'start'],
    blocks: [
      { t: 'p', c: 'PikFinder is a free creator platform that combines a multi-source media search engine with a full design suite. In one place you can find copyright-safe photos and video, design graphics in the Creator Studio, edit PDFs, run in-browser image tools, and auto-generate business documents from your data.' },
      { t: 'list', c: ['Search millions of free images & videos across providers', 'Design social posts, banners and more in the Creator Studio', 'Edit PDFs — text, images, signatures — in your browser', 'Generate certificates, invoices and cards (optionally from Zoho)', 'Use 20+ free image tools (compress, convert, resize, OCR, QR…)'] },
      { t: 'note', c: 'Everything core is free, and most features work without an account.' },
    ],
  },
  {
    id: 'do-i-need-account', cat: 'getting-started', title: 'Do I need an account?',
    tags: ['account', 'signup', 'free'],
    blocks: [
      { t: 'p', c: 'No. You can search, download, use the tools, and design in the Studio without signing in. An account simply lets you save favorites, build collections, sync history across devices, and connect integrations like Zoho.' },
    ],
  },
  {
    id: 'navigating', cat: 'getting-started', title: 'Finding your way around',
    tags: ['navigation', 'menu', 'dashboard'],
    blocks: [
      { t: 'p', c: 'The main areas are reachable from the top navigation and your dashboard:' },
      { t: 'list', c: ['Search — find free media with filters', 'Creator Studio — the full design editor', 'PDF Editor — edit any PDF', 'Document Generator — data-driven document generation', 'Free Tools — quick image utilities', 'Collections & Favorites — your saved items'] },
    ],
  },

  // ── Searching ──────────────────────────────────────────────────────────────
  {
    id: 'how-to-search', cat: 'search', title: 'How to search for media',
    tags: ['search', 'photos', 'images', 'video', 'filters'],
    blocks: [
      { t: 'steps', c: ['Open Search and type what you need in plain language (e.g. "mountain lake sunrise").', 'Browse results — scroll to load more automatically.', 'Use the source buttons to include/exclude specific providers.', 'Open any result for a larger preview, download options and license details.'] },
      { t: 'note', c: 'If a very specific phrase returns little, the search auto-broadens the term. Try fewer, broader keywords for more results.' },
    ],
  },
  {
    id: 'using-filters', cat: 'search', title: 'Using filters to refine results',
    tags: ['filter', 'orientation', 'color', 'style'],
    blocks: [
      { t: 'p', c: 'Click Filters above the results to narrow by orientation (landscape / portrait / square), dominant color, style, and intended usage. Active filters show as chips you can remove individually, or clear all at once.' },
    ],
  },
  {
    id: 'downloads-licenses', cat: 'search', title: 'Downloads, licenses & attribution',
    tags: ['license', 'download', 'commercial', 'attribution'],
    blocks: [
      { t: 'p', c: 'Most results are public-domain or CC0 and can be used commercially without attribution. Some carry other licenses, so always check the source page shown on each item. When attribution is requested, the creator and source links are provided in the image detail view.' },
    ],
  },
  {
    id: 'favorites-collections', cat: 'search', title: 'Favorites & collections',
    tags: ['favorites', 'collections', 'save'],
    blocks: [
      { t: 'p', c: 'Signed-in users can tap the heart to save Favorites, and group items into Collections for projects or moodboards. Access them anytime from the dashboard.' },
    ],
  },

  // ── Creator Studio ─────────────────────────────────────────────────────────
  {
    id: 'studio-start', cat: 'studio', title: 'Starting a design',
    tags: ['studio', 'template', 'blank', 'photo', 'canvas'],
    blocks: [
      { t: 'p', c: 'When you open the Studio you can choose how to begin:' },
      { t: 'steps', c: ['Blank canvas — start from scratch at any size.', 'Edit a photo — upload an image; the canvas auto-fits it.', 'Browse templates — pick a ready-made design and customize.'] },
      { t: 'p', c: 'Set a preset size (e.g. Instagram Post 1080×1080) from the top bar, or Custom for exact dimensions.' },
    ],
  },
  {
    id: 'studio-elements', cat: 'studio', title: 'Adding text, images, shapes & icons',
    tags: ['text', 'image', 'shape', 'icon', 'elements'],
    blocks: [
      { t: 'list', c: ['Text — Text tool or Elements → Text presets.', 'Images — Uploads, drag-and-drop onto the canvas, paste (Ctrl/⌘+V), or the free Photos search.', 'Shapes — the Shape/Elements panel (rectangles, circles, lines and more).', 'Icons — Elements → "Icons from the web": search 200k+ open-source icons and click to place.'] },
    ],
  },
  {
    id: 'studio-properties', cat: 'studio', title: 'Position, size, radius & aspect lock',
    tags: ['properties', 'size', 'radius', 'aspect ratio', 'resize', 'crop'],
    blocks: [
      { t: 'p', c: 'Select any layer to open Properties on the right. There you can set exact X/Y, width and height, rotation, opacity, and corner Radius (for shapes and images).' },
      { t: 'steps', c: ['To keep proportions, turn on the chain / aspect-lock next to W and H — changing one updates the other.', 'To round corners, set the Radius value.', 'To crop an image, double-click it. To resize the whole artboard, use the Crop button in the top bar.'] },
    ],
  },
  {
    id: 'studio-brandkit', cat: 'studio', title: 'Backgrounds & Brand Kit',
    tags: ['background', 'brand kit', 'colors', 'logo'],
    blocks: [
      { t: 'p', c: 'Use the Background tab for solid colors and gradients. The Brand Kit tab stores your brand colors and logo — click a color to apply it to the selection or background, and add your logo to drop it onto the canvas.' },
    ],
  },
  {
    id: 'studio-export', cat: 'studio', title: 'Exporting your design',
    tags: ['export', 'png', 'jpg', 'svg', 'pdf', 'scale', 'transparent'],
    blocks: [
      { t: 'steps', c: ['Click Export (top-right).', 'Choose a format: PNG, JPG, WebP, SVG or PDF.', 'Pick a scale up to 4× for high-resolution output.', 'For PNG/SVG, tick "Transparent background" if needed, then download.'] },
    ],
  },

  // ── PDF Editor ─────────────────────────────────────────────────────────────
  {
    id: 'pdf-edit', cat: 'pdf', title: 'Editing a PDF',
    tags: ['pdf', 'edit text', 'image', 'sign', 'whiteout'],
    blocks: [
      { t: 'steps', c: ['Open the PDF Editor and upload a file or paste a link.', 'Double-click any text to edit it in place; drag to move elements.', 'Use the tools to add text, images, highlights, whiteout, shapes or a signature.', 'Adjust font, size, color, alignment and opacity in the right panel.', 'Click Download PDF (or export the current page as PNG).'] },
      { t: 'note', c: 'Everything runs in your browser — your document is not uploaded to a server.' },
    ],
  },

  // ── Document Generator ───────────────────────────────────────────────────────────
  {
    id: 'business-generate', cat: 'business', title: 'Generating documents',
    tags: ['business', 'certificate', 'invoice', 'template', 'generate'],
    blocks: [
      { t: 'steps', c: ['Open the Document Generator and pick a template (certificate, invoice, card, banner).', 'Fill in the fields — the preview updates live.', 'Download as SVG, PNG or PDF.'] },
    ],
  },
  {
    id: 'business-zoho', cat: 'business', title: 'Connecting Zoho (CRM & Creator)',
    tags: ['zoho', 'crm', 'creator', 'oauth', 'connect', 'security'],
    blocks: [
      { t: 'steps', c: ['Sign in, open the Document Generator → Connections tab.', 'Click Connect on Zoho CRM or Zoho Creator and approve the consent screen.', 'Use Test to confirm, then click "Fill from Zoho" on a template to auto-fill from your records.'] },
      { t: 'note', c: 'PikFinder never sees your Zoho password. Access tokens are encrypted and stored server-side only; read-only permissions are requested and you can disconnect anytime.' },
    ],
  },
  {
    id: 'business-bulk', cat: 'business', title: 'Bulk-generating from records',
    tags: ['bulk', 'zip', 'records', 'mapping'],
    blocks: [
      { t: 'p', c: 'In the "Fill from Zoho" dialog, PikFinder auto-maps template fields to your Zoho fields (adjust any mapping — it is remembered). Select multiple records, choose a format, and PikFinder renders one document per record and downloads them together as a zip.' },
    ],
  },

  // ── Free Tools ─────────────────────────────────────────────────────────────
  {
    id: 'tools-overview', cat: 'tools', title: 'What free tools are available?',
    tags: ['tools', 'compress', 'convert', 'resize', 'crop', 'ocr', 'qr', 'background'],
    blocks: [
      { t: 'p', c: 'PikFinder includes 20+ browser-based image and PDF utilities, including: compress, convert (JPG/PNG/WebP/AVIF/HEIC/SVG/ICO), resize & crop, rotate, background removal, favicon generator, image-to-PDF and PDF-to-JPG, OCR (extract text), QR codes, color picker and palette extraction, metadata inspection, and more.' },
      { t: 'note', c: 'After a download finishes, the tool resets so it is ready for your next file.' },
    ],
  },
  {
    id: 'tools-privacy', cat: 'tools', title: 'Are the tools private?',
    tags: ['privacy', 'browser', 'upload'],
    blocks: [
      { t: 'p', c: 'Yes. The image tools process files entirely in your browser — your images are not uploaded to a server, and nothing is retained after you close the tab.' },
    ],
  },

  // ── Account & Billing ──────────────────────────────────────────────────────
  {
    id: 'account-signup', cat: 'account', title: 'Sign up & verify your email',
    tags: ['signup', 'verify', 'login'],
    blocks: [
      { t: 'steps', c: ['Create an account with email or Google.', 'For email sign-ups, open the verification link we send you.', 'Log in — you can now save favorites, collections and history.'] },
    ],
  },
  {
    id: 'account-profile', cat: 'account', title: 'Profile & settings',
    tags: ['profile', 'avatar', 'name', 'settings'],
    blocks: [
      { t: 'p', c: 'Open Settings from your profile menu to change your name and avatar (generated, image URL, or upload), and manage preferences.' },
    ],
  },
  {
    id: 'account-delete', cat: 'account', title: 'Delete your account',
    tags: ['delete', 'account', 'data'],
    blocks: [
      { t: 'p', c: 'Go to Settings → Danger zone → Delete account to permanently remove your account and data. If prompted, log out and back in first for security.' },
    ],
  },

  // ── Best Practices ─────────────────────────────────────────────────────────
  {
    id: 'bp-design', cat: 'best-practices', title: 'Design best practices',
    tags: ['design', 'tips', 'typography', 'layout'],
    blocks: [
      { t: 'list', c: ['Start from a template, then make it yours.', 'Limit to 2–3 fonts; pair a bold display font with a clean body font.', 'Reuse your Brand Kit colors for consistency across posts.', 'Build hierarchy with size, weight and contrast — one clear focal point.', 'Leave breathing room near the edges (safe margins).', 'Export at 2× for crisp results on modern screens.'] },
    ],
  },
  {
    id: 'bp-search', cat: 'best-practices', title: 'Getting better search results',
    tags: ['search tips', 'keywords'],
    blocks: [
      { t: 'list', c: ['Use broad, descriptive keywords ("team meeting office" beats a long sentence).', 'Add a mood or color word for a specific feel ("calm blue ocean").', 'Use filters for orientation and color instead of cramming it into the query.', 'Check the license on the source page before commercial use.'] },
    ],
  },

  // ── API & Developers ───────────────────────────────────────────────────────
  {
    id: 'api-overview', cat: 'api', title: 'API overview',
    tags: ['api', 'developers', 'endpoints', 'rest'],
    blocks: [
      { t: 'p', c: 'PikFinder exposes a small set of serverless REST endpoints under /api. Responses are JSON unless a binary asset is requested. All endpoints accept standard HTTP and CORS is restricted to allowed origins.' },
      { t: 'note', c: 'These endpoints power the app. If you want programmatic access for your own product, contact us — some endpoints require configuration or keys.' },
    ],
  },
  {
    id: 'api-search', cat: 'api', title: 'Media search endpoint',
    tags: ['api', 'search', 'GET'],
    blocks: [
      { t: 'p', c: 'Search free media across providers. Query is validated and length-limited server-side.' },
      { t: 'code', c: 'GET /api/search?q=mountain%20lake&page=1\n\n200 OK\n{\n  "results": [\n    { "id": "…", "thumbnail": "…", "preview": "…",\n      "source": "openverse", "creator": "…", "licenseUrl": "…" }\n  ],\n  "page": 1,\n  "hasMore": true\n}' },
    ],
  },
  {
    id: 'api-template', cat: 'api', title: 'Document render endpoint',
    tags: ['api', 'template', 'render', 'POST', 'pdf', 'svg'],
    blocks: [
      { t: 'p', c: 'Render a template (Studio layer JSON) with a data record into SVG, PNG or PDF. Substitutes {{placeholders}} in text and image binds.' },
      { t: 'code', c: 'POST /api/template/generate\nContent-Type: application/json\n\n{\n  "dims": { "w": 1200, "h": 850 },\n  "bg":   { "type": "solid", "color": "#0b1020" },\n  "layers": [\n    { "type": "text", "text": "{{recipient_name}}", "x": 600, "y": 320,\n      "size": 66, "align": "center", "color": "#ffffff" }\n  ],\n  "data": { "recipient_name": "Sunny Kumar Singh" },\n  "format": "svg"   // or "png" | "pdf"\n}' },
      { t: 'note', c: 'SVG works with zero extra setup. PNG/PDF require the server-side render dependency to be installed.' },
    ],
  },
  {
    id: 'api-zoho', cat: 'api', title: 'Zoho connector endpoints',
    tags: ['api', 'zoho', 'oauth', 'auth'],
    blocks: [
      { t: 'p', c: 'The Zoho endpoints are per-user and require a Firebase ID token in the Authorization header (except the OAuth redirect flow). Tokens for Zoho are encrypted and never returned to the client.' },
      { t: 'code', c: 'GET  /api/zoho/connect?service=crm      → redirect to consent\nGET  /api/zoho/callback                  → stores encrypted token\nGET  /api/zoho/status                    → { services: { crm, creator } }\nPOST /api/zoho/test?service=crm          → cheap read to verify\nGET  /api/zoho/modules?service=crm       → list modules\nGET  /api/zoho/records?service=crm&module=Contacts&page=1\nPOST /api/zoho/disconnect?service=crm    → revoke + delete\n\nAuthorization: Bearer <firebase-id-token>' },
    ],
  },
  {
    id: 'api-auth', cat: 'api', title: 'Authentication',
    tags: ['api', 'auth', 'token', 'firebase'],
    blocks: [
      { t: 'p', c: 'User-scoped endpoints authenticate with a Firebase ID token passed as a Bearer token. The server verifies it with the Firebase Admin SDK and derives the user id — the client never handles third-party secrets.' },
    ],
  },
];
