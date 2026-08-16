import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { BUSINESS_TEMPLATES } from '../../business/templates';
import { PREMIUM_TEMPLATES } from '../../business/premiumTemplates';
import { renderTemplate } from '../../lib/render/renderTemplate';
import { sceneToSvg } from '../../lib/render/sceneToSvg.node.js';
import { TEMPLATE_SEO, SITE } from './seoData';
import EmailCapture from '../../components/EmailCapture';

// Premium (modern) designs are shown first, base templates as a fallback.
const CATALOGUE = [...PREMIUM_TEMPLATES, ...BUSINESS_TEMPLATES];

function sampleSvg(businessCategory) {
  const t = CATALOGUE.find((x) => x.category === businessCategory);
  if (!t) return { svg: '', dims: { w: 4, h: 3 } };
  const data = {};
  (t.fields || []).forEach((f) => { data[f.key] = f.sample; });
  try { return { svg: sceneToSvg({ dims: t.dims, bg: t.bg, layers: renderTemplate(t.layers, data) }), dims: t.dims }; }
  catch { return { svg: '', dims: t.dims }; }
}

export default function TemplatesIndex() {
  const canonical = `${SITE}/templates`;
  useSeo({
    title: 'Free Templates — Certificates, Invoices, Flyers & More | PikFinder',
    description: 'Browse free, professionally designed templates for certificates, invoices, business cards, flyers, gift certificates, coupons, proposals and more. Customize online and download — no signup, no watermark.',
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Free Templates',
      url: canonical,
      description: 'Free, customizable templates for business and personal use.',
    },
  });

  return (
    <div className="tpl-seo page-shell">
      <header className="tpl-seo-head">
        <h1>Free Templates</h1>
        <p>Professionally designed, fully editable templates for every occasion — certificates, invoices, cards, flyers and more. Customize online in minutes and download a print-ready PDF or high-resolution PNG. No signup, no watermark.</p>
      </header>

      <div className="tpl-seo-cat-grid">
        {TEMPLATE_SEO.map((c) => {
          const { svg, dims } = sampleSvg(c.businessCategory);
          return (
            <Link key={c.slug} to={`/templates/${c.slug}`} className="tpl-seo-cat-card">
              <span
                className="tpl-seo-preview"
                style={{ aspectRatio: `${dims.w} / ${dims.h}` }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <span className="tpl-seo-cat-body">
                <strong>{c.name}</strong>
                <em>Browse & customize →</em>
              </span>
            </Link>
          );
        })}
      </div>

      <EmailCapture source="templates-index" />
    </div>
  );
}
