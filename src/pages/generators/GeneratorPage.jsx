import React, { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { BUSINESS_TEMPLATES } from '../../business/templates';
import { renderTemplate } from '../../lib/render/renderTemplate';
import { sceneToSvg } from '../../lib/render/sceneToSvg.node.js';
import { GENERATORS, generatorBySlug, SITE } from './generators';
import EmailCapture from '../../components/EmailCapture';

function previewSvg(t) {
  const data = {};
  (t.fields || []).forEach((f) => { data[f.key] = f.sample; });
  try { return sceneToSvg({ dims: t.dims, bg: t.bg, layers: renderTemplate(t.layers, data) }); }
  catch { return ''; }
}

export default function GeneratorPage({ slug }) {
  const g = generatorBySlug(slug);

  const templates = useMemo(
    () => (g ? BUSINESS_TEMPLATES.filter((t) => t.category === g.businessCategory) : []),
    [g]
  );
  const featured = templates.slice(0, 3);
  const startId = templates[0]?.id;

  const canonical = g ? `${SITE}/${g.slug}` : SITE;
  const jsonLd = g
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: g.name,
            description: g.description,
            url: canonical,
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
          {
            '@type': 'HowTo',
            name: `How to use the ${g.name}`,
            step: g.howTo.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
        ],
      }
    : null;

  useSeo({ title: g?.title, description: g?.description, canonical, jsonLd });

  if (!g) return <Navigate to="/templates" replace />;

  const startHref = startId ? `/studio?template=${startId}` : `/templates/${g.templatesSlug}`;
  const others = GENERATORS.filter((x) => x.slug !== g.slug);

  return (
    <div className="tpl-seo gen-page page-shell">
      <header className="gen-hero">
        <span className="gen-eyebrow">Free {g.keyword} generator</span>
        <h1>{g.h1}</h1>
        <p className="gen-tagline">{g.tagline}</p>
        <div className="gen-cta-row">
          <Link to={startHref} className="btn-primary gen-cta">Create your {g.keyword} free →</Link>
          <Link to={`/templates/${g.templatesSlug}`} className="btn-outline">Browse all {templates.length} templates</Link>
        </div>
        <div className="tpl-seo-badges">
          <span>✓ Free</span><span>✓ No watermark</span><span>✓ No signup</span><span>PDF · PNG</span>
        </div>
      </header>

      <section className="gen-props">
        {g.valueProps.map((v, i) => (
          <div key={i} className="gen-prop"><span className="gen-prop-dot" />{v}</div>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="gen-featured">
          <h2>Popular {g.keyword} designs</h2>
          <div className="tpl-seo-grid">
            {featured.map((t) => (
              <Link key={t.id} to={`/studio?template=${t.id}`} className="tpl-seo-card" title={`Customize “${t.name}” free`}>
                <span className="tpl-seo-preview" style={{ aspectRatio: `${t.dims.w} / ${t.dims.h}` }} dangerouslySetInnerHTML={{ __html: previewSvg(t) }} />
                <span className="tpl-seo-card-foot"><strong>{t.name}</strong><em>Customize free →</em></span>
              </Link>
            ))}
          </div>
          <p className="tpl-seo-bulk"><Link to={`/templates/${g.templatesSlug}`}>See all {templates.length} {g.keyword} templates →</Link></p>
        </section>
      )}

      <section className="tpl-seo-how">
        <h2>How the {g.name.toLowerCase()} works</h2>
        <ol>{g.howTo.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p className="tpl-seo-bulk">Need many at once? <Link to="/business">Bulk-generate {g.keyword}s</Link> from a spreadsheet or your CRM.</p>
      </section>

      <section className="gen-usecases">
        <h2>Made for</h2>
        <div className="gen-usecase-chips">{g.useCases.map((u, i) => <span key={i}>{u}</span>)}</div>
      </section>

      <section className="tpl-seo-faq">
        <h2>Frequently asked questions</h2>
        {g.faq.map((f, i) => (
          <div key={i} className="tpl-seo-faq-item"><h3>{f.q}</h3><p>{f.a}</p></div>
        ))}
      </section>

      <EmailCapture source={`generator-${g.slug}`} />

      <section className="tpl-seo-more">
        <h2>More free generators</h2>
        <div className="tpl-seo-more-links">
          {others.map((x) => <Link key={x.slug} to={`/${x.slug}`}>{x.name}</Link>)}
        </div>
      </section>
    </div>
  );
}
