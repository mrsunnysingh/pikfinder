import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { CaretRight, CheckCircle } from '@phosphor-icons/react';
import { getToolBySlug, getRelatedTools, toolPath, SITE_URL } from '../tools/registry';
import { ENGINES } from '../tools/engines';
import { useSeo, buildToolJsonLd } from '../hooks/useSeo';
import ToolShell from '../tools/ToolShell';

function EngineFallback() {
  return (
    <div className="loader" style={{ padding: 60 }}>
      <div className="spinner"></div>
      <p>Loading tool...</p>
    </div>
  );
}

export default function ToolPage() {
  const { slug } = useParams();
  const tool = getToolBySlug(slug);

  const url = `${SITE_URL}/tools/${slug}`;
  const jsonLd = useMemo(() => (tool ? buildToolJsonLd(tool, url) : null), [tool, url]);

  useSeo({
    title: tool ? `${tool.name} — Free Online Tool | PikFinder` : 'Tool not found | PikFinder',
    description: tool?.description,
    canonical: url,
    jsonLd,
  });

  // After any download finishes, reset the tool to a clean state (fresh dropzone)
  // for the next file — professional, and clears the previous image from memory.
  const [resetKey, setResetKey] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const onDone = () => {
      setDone(true);
      setResetKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('pikfinder:downloaded', onDone);
    return () => window.removeEventListener('pikfinder:downloaded', onDone);
  }, []);
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 2600); return () => clearTimeout(t); }, [done]);
  // Reset the confirmation whenever the user switches tools.
  useEffect(() => { setDone(false); setResetKey(0); }, [slug]);

  if (!tool) return <Navigate to="/tools" replace />;
  if (tool.engine === 'external') return <Navigate to={tool.route} replace />;

  const Engine = ENGINES[tool.engine];
  const related = getRelatedTools(tool);

  return (
    <div className="tool-page">
      <nav className="tool-breadcrumb" aria-label="Breadcrumb">
        <Link to="/tools">Free Tools</Link>
        <CaretRight size={12} />
        <span>{tool.short}</span>
      </nav>

      <header className="tool-page-header">
        <h1>{tool.name}</h1>
        <p className="text-pretty">{tool.description}</p>
      </header>

      <ToolShell>
        <Suspense fallback={<EngineFallback />}>
          {Engine ? <Engine key={resetKey} {...tool.presetProps} /> : <EngineFallback />}
        </Suspense>
      </ToolShell>

      {done && (
        <div className="tool-toast" role="status">
          <CheckCircle size={18} weight="fill" /> Downloaded — the tool is ready for your next file.
        </div>
      )}

      {tool.howTo?.length > 0 && (
        <section className="tool-seo-section">
          <h2>How to use {tool.name}</h2>
          <ol className="tool-howto">
            {tool.howTo.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {tool.faq?.length > 0 && (
        <section className="tool-seo-section">
          <h2>Frequently asked questions</h2>
          <div className="tool-faq">
            {tool.faq.map((f, i) => (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="tool-seo-section">
          <h2>Related tools</h2>
          <div className="tool-related">
            {related.map((r) => (
              <Link key={r.slug} to={toolPath(r)} className="tool-related-card">
                <strong>{r.short}</strong>
                <span>{r.description.split('.')[0]}.</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
