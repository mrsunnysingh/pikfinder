// Post-build prerender: generates static, SEO-ready HTML for every tool page
// plus sitemap.xml. Run automatically after `vite build`.
//
// For each tool in the registry it writes dist/tools/<slug>/index.html with:
//   - unique <title>, meta description, canonical, Open Graph tags
//   - JSON-LD (SoftwareApplication + FAQPage + HowTo)
//   - static HTML content (h1, intro, how-to, FAQ) inside #root so Google
//     sees real content before JavaScript loads. React hydrates over it.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

// Import the registry (plain JS module, no JSX)
const { TOOLS, CATEGORIES, SITE_URL, getRelatedTools } = await import(
  pathToFileURL(join(ROOT, 'src/tools/registry.js')).href
);

// Template SEO landing pages (plain JS + pure render core — safe in Node).
const { BUSINESS_TEMPLATES } = await import(pathToFileURL(join(ROOT, 'src/business/templates.js')).href);
const { TEMPLATE_SEO } = await import(pathToFileURL(join(ROOT, 'src/pages/templates/seoData.js')).href);
const { GENERATORS } = await import(pathToFileURL(join(ROOT, 'src/pages/generators/generators.js')).href);
const { renderTemplate } = await import(pathToFileURL(join(ROOT, 'src/lib/render/renderTemplate.js')).href);
const { sceneToSvg } = await import(pathToFileURL(join(ROOT, 'src/lib/render/sceneToSvg.node.js')).href);

function tplPreview(t) {
  const data = {};
  (t.fields || []).forEach((f) => { data[f.key] = f.sample; });
  try { return sceneToSvg({ dims: t.dims, bg: t.bg, layers: renderTemplate(t.layers, data) }); } catch { return ''; }
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('[prerender] dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headTags({ title, description, path }) {
  const url = `${SITE_URL}${path}`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary">`,
  ].join('\n    ');
}

function jsonLd(tool, path) {
  const blocks = [];
  blocks.push({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    url: `${SITE_URL}${path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description: tool.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  });
  if (tool.faq?.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  if (tool.howTo?.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${tool.name}`,
      step: tool.howTo.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
    });
  }
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n    ');
}

function staticBody(tool) {
  const related = getRelatedTools(tool, 6);
  return `
    <div class="tool-page" data-prerender>
      <nav class="tool-breadcrumb"><a href="/tools">Free Tools</a> / ${esc(tool.short || tool.name)}</nav>
      <header class="tool-page-header">
        <h1>${esc(tool.name)}</h1>
        <p>${esc(tool.description)}</p>
      </header>
      <section class="tool-seo-section">
        <h2>How to use ${esc(tool.name)}</h2>
        <ol class="tool-howto">${(tool.howTo || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      </section>
      <section class="tool-seo-section">
        <h2>Frequently asked questions</h2>
        <div class="tool-faq">${(tool.faq || [])
          .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
          .join('')}</div>
      </section>
      <section class="tool-seo-section">
        <h2>Related tools</h2>
        <div class="tool-related">${related
          .map(
            (r) =>
              `<a class="tool-related-card" href="/tools/${r.slug}"><strong>${esc(r.name)}</strong><span>${esc(r.description)}</span></a>`
          )
          .join('')}</div>
      </section>
    </div>`;
}

function renderPage({ title, description, path, ld = '', body = '' }) {
  let html = template;
  // Replace existing <title> and description with page-specific ones
  html = html.replace(/<title>[\s\S]*?<\/title>/, '');
  html = html.replace(/<meta name="description"[^>]*>/, '');
  html = html.replace(/<link rel="canonical"[^>]*>/, '');
  html = html.replace(
    '</head>',
    `    ${headTags({ title, description, path })}\n    ${ld}\n  </head>`
  );
  if (body) {
    html = html.replace(
      /(<div id="root">)([\s\S]*?)(<\/div>)/,
      (_m, open, _inner, close) => `${open}${body}${close}`
    );
  }
  return html;
}

function writePage(path, html) {
  const dir = join(DIST, path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

// ---- Tool pages ----
let count = 0;
for (const tool of TOOLS) {
  const path = `/tools/${tool.slug}`;
  const title = `${tool.name} — Free Online Tool | PikFinder`;
  const html = renderPage({
    title,
    description: tool.description,
    path,
    ld: jsonLd(tool, path),
    body: staticBody(tool),
  });
  writePage(path, html);
  count++;
}

// ---- Tools hub ----
{
  const path = '/tools';
  const title = `${TOOLS.length}+ Free Image & PDF Tools — No Signup | PikFinder`;
  const description =
    'Free browser-based tools: compress images to exact KB targets, resize, crop, convert formats (JPG, PNG, WebP, AVIF, HEIC), remove backgrounds, edit PDFs, extract text, and more. Your files never leave your device.';
  const body = `
    <div class="tool-page" data-prerender>
      <header class="tool-page-header"><h1>Free Image &amp; PDF Tools</h1><p>${esc(description)}</p></header>
      ${CATEGORIES.map((cat) => {
        const tools = TOOLS.filter((t) => t.category === cat.id);
        if (!tools.length) return '';
        return `<section class="tools-hub-category"><h2>${esc(cat.name)}</h2><p>${esc(cat.blurb)}</p><div class="tools-hub-grid">${tools
          .map(
            (t) =>
              `<a class="tools-hub-card" href="/tools/${t.slug}"><strong>${esc(t.name)}</strong><span>${esc(t.description)}</span></a>`
          )
          .join('')}</div></section>`;
      }).join('')}
    </div>`;
  writePage(path, renderPage({ title, description, path, body }));
  count++;
}

// ---- Template SEO: index ----
{
  const path = '/templates';
  const title = 'Free Templates — Certificates, Invoices, Flyers & More | PikFinder';
  const description = 'Browse free, professionally designed templates for certificates, invoices, business cards, flyers, gift certificates, coupons, proposals and more. Customize online and download — no signup, no watermark.';
  const body = `
    <div class="tpl-seo" data-prerender>
      <header class="tpl-seo-head"><h1>Free Templates</h1><p>${esc(description)}</p></header>
      <div class="tpl-seo-cat-grid">${TEMPLATE_SEO.map((c) => {
        const t = BUSINESS_TEMPLATES.find((x) => x.category === c.businessCategory);
        return `<a class="tpl-seo-cat-card" href="/templates/${c.slug}"><span class="tpl-seo-preview">${t ? tplPreview(t) : ''}</span><span class="tpl-seo-cat-body"><strong>${esc(c.name)}</strong><em>Browse &amp; customize →</em></span></a>`;
      }).join('')}</div>
    </div>`;
  writePage(path, renderPage({ title, description, path, body }));
  count++;
}

// ---- Template SEO: one page per category ----
for (const c of TEMPLATE_SEO) {
  const path = `/templates/${c.slug}`;
  const url = `${SITE_URL}${path}`;
  const items = BUSINESS_TEMPLATES.filter((t) => t.category === c.businessCategory);
  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: c.h1, description: c.description, url },
      { '@type': 'ItemList', itemListElement: items.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${SITE_URL}/studio?template=${t.id}` })) },
      { '@type': 'FAQPage', mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  })}</script>`;
  const body = `
    <div class="tpl-seo" data-prerender>
      <nav class="tpl-seo-crumbs"><a href="/templates">Templates</a> / <span>${esc(c.name)}</span></nav>
      <header class="tpl-seo-head"><h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p></header>
      <div class="tpl-seo-grid">${items.map((t) => `<a class="tpl-seo-card" href="/studio?template=${t.id}"><span class="tpl-seo-preview">${tplPreview(t)}</span><span class="tpl-seo-card-foot"><strong>${esc(t.name)}</strong><em>Customize free →</em></span></a>`).join('')}</div>
      <section class="tpl-seo-how"><h2>How to customize a ${esc(c.keyword)} template</h2><ol><li>Pick a design and open it in the free editor.</li><li>Edit the text, colours and fonts — add your logo and details.</li><li>Download a print-ready PDF or high-resolution PNG. No signup, no watermark.</li></ol></section>
      <section class="tpl-seo-faq"><h2>Frequently asked questions</h2>${c.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
      <section class="tpl-seo-more"><h2>More free template categories</h2><div class="tpl-seo-more-links">${TEMPLATE_SEO.filter((x) => x.slug !== c.slug).map((x) => `<a href="/templates/${x.slug}">${esc(x.name)}</a>`).join('')}</div></section>
    </div>`;
  writePage(path, renderPage({ title: c.title, description: c.description, path, ld, body }));
  count++;
}

// ---- Generators: one landing page per generator ----
for (const g of GENERATORS) {
  const path = `/${g.slug}`;
  const url = `${SITE_URL}${path}`;
  const items = BUSINESS_TEMPLATES.filter((t) => t.category === g.businessCategory);
  const featured = items.slice(0, 3);
  const startId = items[0] ? items[0].id : '';
  const startHref = startId ? `/studio?template=${startId}` : `/templates/${g.templatesSlug}`;
  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'SoftwareApplication', name: g.name, description: g.description, url, applicationCategory: 'DesignApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'HowTo', name: `How to use the ${g.name}`, step: g.howTo.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) },
      { '@type': 'FAQPage', mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  })}</script>`;
  const body = `
    <div class="tpl-seo gen-page" data-prerender>
      <header class="gen-hero"><span class="gen-eyebrow">Free ${esc(g.keyword)} generator</span><h1>${esc(g.h1)}</h1><p class="gen-tagline">${esc(g.tagline)}</p>
        <div class="gen-cta-row"><a class="btn-primary gen-cta" href="${startHref}">Create your ${esc(g.keyword)} free →</a><a class="btn-outline" href="/templates/${g.templatesSlug}">Browse all ${items.length} templates</a></div></header>
      <section class="gen-props">${g.valueProps.map((v) => `<div class="gen-prop"><span class="gen-prop-dot"></span>${esc(v)}</div>`).join('')}</section>
      <section class="gen-featured"><h2>Popular ${esc(g.keyword)} designs</h2><div class="tpl-seo-grid">${featured.map((t) => `<a class="tpl-seo-card" href="/studio?template=${t.id}"><span class="tpl-seo-preview">${tplPreview(t)}</span><span class="tpl-seo-card-foot"><strong>${esc(t.name)}</strong><em>Customize free →</em></span></a>`).join('')}</div></section>
      <section class="tpl-seo-how"><h2>How the ${esc(g.name.toLowerCase())} works</h2><ol>${g.howTo.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
      <section class="gen-usecases"><h2>Made for</h2><div class="gen-usecase-chips">${g.useCases.map((u) => `<span>${esc(u)}</span>`).join('')}</div></section>
      <section class="tpl-seo-faq"><h2>Frequently asked questions</h2>${g.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
      <section class="tpl-seo-more"><h2>More free generators</h2><div class="tpl-seo-more-links">${GENERATORS.filter((x) => x.slug !== g.slug).map((x) => `<a href="/${x.slug}">${esc(x.name)}</a>`).join('')}</div></section>
    </div>`;
  writePage(path, renderPage({ title: g.title, description: g.description, path, ld, body }));
  count++;
}

// ---- Other static pages: give Google real HTML (title + meta + H1 + intro) ----
const STATIC_PAGES = [
  { slug: 'business-automation', title: 'Document Automation for Zoho — Certificates & Invoices | PikFinder', description: 'Design a certificate, invoice, letter or ID card once, then auto-generate a personalised copy for every customer from Zoho CRM & Creator or a spreadsheet. One document or a thousand, in a click.', h1: 'Turn your data into finished documents', intro: 'Design once, then generate a personalised, on-brand document for every record — auto-filled from Zoho CRM & Creator or a spreadsheet. Export as PDF or PNG.' },
  { slug: 'pdf-editor', title: 'Free Online PDF Editor — Edit, Annotate & Export | PikFinder', description: 'Edit PDFs free in your browser: add text and images, annotate, fill forms, rotate pages, and export a clean PDF or PNG. No signup, files stay on your device.', h1: 'Free online PDF editor', intro: 'Add text, images and annotations to any PDF, fill forms, and export — right in your browser. No signup, no watermark.' },
  { slug: 'business', title: 'Document Generator — Create Documents from Your Data | PikFinder', description: 'Pick a premium template, add your details, and export a finished certificate, invoice or card in seconds — or connect Zoho to auto-fill from your records.', h1: 'Document Generator', intro: 'Pick a template, add your details, and export a finished document in seconds — or connect Zoho to auto-fill from your records.' },
  { slug: 'collections', title: 'Curated Collections — Free Media Sets for Every Project | PikFinder', description: 'Hand-picked, ready-to-use collections of free stock photos and assets for websites, presentations, social media and marketing.', h1: 'Curated collections', intro: 'Hand-picked, ready-to-use asset sets for every kind of project.' },
  { slug: 'backgrounds', title: 'Free Background Generator — Gradients, Patterns & Mesh | PikFinder', description: 'Create beautiful backgrounds free: gradients, mesh, patterns and solid colours. Export in HD for websites, slides and social posts.', h1: 'Free background generator', intro: 'Generate gradient, mesh and pattern backgrounds and export them in HD — free, no signup.' },
  { slug: 'gradient', title: 'Free Gradient Generator — CSS & Image Export | PikFinder', description: 'Build smooth CSS gradients and export them as CSS or high-resolution images. Free, no signup.', h1: 'Free gradient generator', intro: 'Design smooth gradients and copy the CSS or export a high-resolution image — free.' },
  { slug: 'about', title: 'About PikFinder — A Creator Platform for Free Media & Design', description: 'PikFinder is a creator platform for discovering, editing and organising free media — built for web designers, marketers and content creators.', h1: 'About PikFinder', intro: 'A creator platform for discovering, editing and organising free media — built for web designers, marketers and content creators.' },
  { slug: 'products', title: 'Products — Studio, Document Generator, PDF Editor & Tools | PikFinder', description: 'Everything PikFinder offers: free multi-source media search, Creator Studio, Document Generator, PDF editor and dozens of free image tools.', h1: 'Everything in one creator platform', intro: 'Free media search, Creator Studio, Document Generator, PDF editor and dozens of free tools — in one place.' },
  { slug: 'blog', title: 'Blog — Guides for Creators | PikFinder', description: 'Practical guides on free stock media, image formats, licensing, and design — from the PikFinder team.', h1: 'Guides for creators', intro: 'Clear, practical writing on free media, formats, licensing and design.' },
  { slug: 'help', title: 'Help Center | PikFinder', description: 'Guides and answers for using PikFinder — search, Studio, the Document Generator, PDF editor and free tools.', h1: 'Help Center', intro: 'Guides and answers for getting the most out of PikFinder.' },
  { slug: 'contact', title: 'Contact PikFinder', description: 'Get in touch with the PikFinder team — support, feedback, partnerships and press.', h1: 'Contact us', intro: 'Questions, feedback or partnership ideas? We’d love to hear from you.' },
];
for (const p of STATIC_PAGES) {
  const path = `/${p.slug}`;
  const body = `
    <div class="page-shell" data-prerender>
      <header class="page-header"><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p></header>
    </div>`;
  writePage(path, renderPage({ title: p.title, description: p.description, path, body }));
  count++;
}

// ---- Blog posts: prerender each Markdown post to real HTML for indexing ----
function parseFrontmatter(raw) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i === -1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[line.slice(0, i).trim()] = v;
  }
  return { meta, body: m[2] };
}
// Tiny, safe Markdown → HTML (headings, bold, links, lists, paragraphs).
function mdToHtml(md) {
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, h) => `<a href="${h}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const lines = md.split('\n'); const out = []; let para = [], list = [];
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushL = () => { if (list.length) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = []; } };
  for (const ln of lines) {
    if (/^#{2,3}\s/.test(ln)) { flushP(); flushL(); const lvl = ln.startsWith('###') ? 3 : 2; out.push(`<h${lvl}>${inline(ln.replace(/^#{2,3}\s/, ''))}</h${lvl}>`); }
    else if (/^[-*]\s+/.test(ln)) { flushP(); list.push(ln.replace(/^[-*]\s+/, '')); }
    else if (/^\d+\.\s+/.test(ln)) { flushP(); list.push(ln.replace(/^\d+\.\s+/, '')); }
    else if (ln.trim() === '') { flushP(); flushL(); }
    else { flushL(); para.push(ln.trim()); }
  }
  flushP(); flushL();
  return out.join('\n');
}
const blogDir = join(ROOT, 'src/content/blog');
const blogPosts = [];
if (existsSync(blogDir)) {
  for (const file of readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
    const slug = file.replace(/\.md$/, '');
    const { meta, body } = parseFrontmatter(readFileSync(join(blogDir, file), 'utf8'));
    const path = `/blog/${slug}`;
    const url = `${SITE_URL}${path}`;
    const title = `${meta.title || slug} | PikFinder`;
    const description = meta.description || '';
    blogPosts.push({ slug, publishedAt: meta.publishedAt || '' });
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: meta.title || slug, description, image: meta.coverImage || undefined,
      author: { '@type': 'Organization', name: meta.author || 'PikFinder' },
      publisher: { '@type': 'Organization', name: 'PikFinder' },
      datePublished: meta.publishedAt || undefined, dateModified: meta.updatedAt || meta.publishedAt || undefined,
      mainEntityOfPage: url,
    })}</script>`;
    const cover = meta.coverImage ? `<div class="blog-article-cover"><img src="${esc(meta.coverImage)}" alt=""></div>` : '';
    const bodyHtml = `
    <article class="blog-article" data-prerender>
      <div class="blog-article-head">
        <a class="blog-back" href="/blog">All articles</a>
        <h1>${esc(meta.title || slug)}</h1>
        <p class="blog-article-lead">${esc(description)}</p>
      </div>
      ${cover}
      <div class="blog-body">${mdToHtml(body)}</div>
    </article>`;
    writePage(path, renderPage({ title, description, path, ld, body: bodyHtml }));
    count++;
  }
}

// ---- Sitemap ----
{
  const templateUrls = [
    { loc: '/templates', priority: '0.9', changefreq: 'weekly' },
    ...TEMPLATE_SEO.map((c) => ({ loc: `/templates/${c.slug}`, priority: '0.8', changefreq: 'weekly' })),
    ...GENERATORS.map((g) => ({ loc: `/${g.slug}`, priority: '0.9', changefreq: 'weekly' })),
  ];
  const staticUrls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/tools', priority: '0.9', changefreq: 'weekly' },
    { loc: '/business-automation', priority: '0.9', changefreq: 'weekly' },
    { loc: '/pdf-editor', priority: '0.9', changefreq: 'weekly' },
    { loc: '/business', priority: '0.8', changefreq: 'weekly' },
    { loc: '/business/help', priority: '0.6', changefreq: 'monthly' },
    { loc: '/help', priority: '0.7', changefreq: 'monthly' },
    { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
    { loc: '/collections', priority: '0.8', changefreq: 'weekly' },
    { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    { loc: '/backgrounds', priority: '0.7', changefreq: 'weekly' },
    { loc: '/gradient', priority: '0.7', changefreq: 'monthly' },
    { loc: '/products', priority: '0.6', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/license', priority: '0.4', changefreq: 'yearly' },
    { loc: '/legal', priority: '0.3', changefreq: 'yearly' },
  ];
  const toolUrls = TOOLS.map((t) => ({
    loc: `/tools/${t.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));
  const blogUrls = blogPosts.map((p) => ({ loc: `/blog/${p.slug}`, priority: '0.6', changefreq: 'monthly' }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...templateUrls, ...toolUrls, ...blogUrls]
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
  writeFileSync(join(DIST, 'sitemap.xml'), xml);
  // Also keep the source copy in sync so dev serves the same file
  writeFileSync(join(ROOT, 'public', 'sitemap.xml'), xml);
}

console.log(`[prerender] Wrote ${count} prerendered pages + sitemap.xml (${TOOLS.length} tools).`);
