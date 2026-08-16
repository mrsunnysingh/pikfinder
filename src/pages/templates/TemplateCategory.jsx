import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { BUSINESS_TEMPLATES } from '../../business/templates';
import { PREMIUM_TEMPLATES } from '../../business/premiumTemplates';
import { renderTemplate } from '../../lib/render/renderTemplate';
import { sceneToSvg } from '../../lib/render/sceneToSvg.node.js';
import { TEMPLATE_SEO, seoBySlug, SITE } from './seoData';
import EmailCapture from '../../components/EmailCapture';

// Premium (modern) designs first, then base templates — same category filter.
const CATALOGUE = [...PREMIUM_TEMPLATES, ...BUSINESS_TEMPLATES];

function previewSvg(t) {
  const data = {};
  (t.fields || []).forEach((f) => { data[f.key] = f.sample; });
  try { return sceneToSvg({ dims: t.dims, bg: t.bg, layers: renderTemplate(t.layers, data) }); }
  catch { return ''; }
}

export default function TemplateCategory() {
  const { slug } = useParams();
  const cat = seoBySlug(slug);

  const items = useMemo(
    () => (cat ? CATALOGUE.filter((t) => t.category === cat.businessCategory) : []),
    [cat]
  );

  const canonical = cat ? `${SITE}/templates/${cat.slug}` : SITE;
  const jsonLd = cat
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: cat.h1,
            description: cat.description,
            url: canonical,
          },
          {
            '@type': 'ItemList',
            itemListElement: items.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: t.name,
              url: `${SITE}/studio?template=${t.id}`,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: cat.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ],
      }
    : null;

  useSeo({ title: cat?.title, description: cat?.description, canonical, jsonLd });

  if (!cat) return <Navigate to="/templates" replace />;

  const others = TEMPLATE_SEO.filter((c) => c.slug !== cat.slug);

  return (
    <div className="tpl-seo page-shell">
      <nav className="tpl-seo-crumbs" aria-label="Breadcrumb">
        <Link to="/templates">Templates</Link> <span>/</span> <span>{cat.name}</span>
      </nav>

      <header className="tpl-seo-head">
        <h1>{cat.h1}</h1>
        <p>{cat.intro}</p>
        <div className="tpl-seo-badges">
          <span>✓ Free to download</span>
          <span>✓ No watermark</span>
          <span>✓ No signup</span>
          <span>{items.length} templates</span>
        </div>
      </header>

      <div className="tpl-seo-grid">
        {items.map((t) => (
          <Link key={t.id} to={`/studio?template=${t.id}`} className="tpl-seo-card" title={`Customize “${t.name}” free`}>
            <span
              className="tpl-seo-preview"
              style={{ aspectRatio: `${t.dims.w} / ${t.dims.h}` }}
              dangerouslySetInnerHTML={{ __html: previewSvg(t) }}
            />
            <span className="tpl-seo-card-foot">
              <strong>{t.name}</strong>
              <em>Customize free →</em>
            </span>
          </Link>
        ))}
      </div>

      <section className="tpl-seo-how">
        <h2>How to customize a {cat.keyword} template</h2>
        <ol>
          <li><strong>Pick a design</strong> above and open it in the free editor.</li>
          <li><strong>Edit the text, colours and fonts</strong> — add your logo and details.</li>
          <li><strong>Download</strong> a print-ready PDF or a high-resolution PNG. No signup, no watermark.</li>
        </ol>
        <p className="tpl-seo-bulk">
          Need lots of them? <Link to="/business">Generate {cat.keyword}s in bulk</Link> from a spreadsheet or your CRM in the Document Generator.
        </p>
      </section>

      <section className="tpl-seo-faq">
        <h2>Frequently asked questions</h2>
        {cat.faq.map((f, i) => (
          <div key={i} className="tpl-seo-faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <EmailCapture source={`templates-${cat.slug}`} />

      <section className="tpl-seo-more">
        <h2>More free template categories</h2>
        <div className="tpl-seo-more-links">
          {others.map((c) => (
            <Link key={c.slug} to={`/templates/${c.slug}`}>{c.name}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
