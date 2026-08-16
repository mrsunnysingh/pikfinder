import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlass, ArrowRight } from '@phosphor-icons/react';
import { CATEGORIES, TOOLS, toolPath, SITE_URL } from '../tools/registry';
import { useSeo } from '../hooks/useSeo';
import AdBanner from '../components/AdBanner';

export default function FreeTools() {
  const [query, setQuery] = useState('');

  useSeo({
    title: 'Free Image Tools — Compress, Resize, Convert & More | PikFinder',
    description: `${TOOLS.length}+ free online image tools: compress to exact KB sizes, resize, crop, convert formats, remove backgrounds, make PDFs, and more. No signup, files never leave your browser.`,
    canonical: `${SITE_URL}/tools`,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords?.some((k) => k.includes(q))
    );
  }, [query]);

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      tools: filtered.filter((tool) => tool.category === cat.id),
    })).filter((cat) => cat.tools.length > 0);
  }, [filtered]);

  return (
    <>
      <header className="page-header" style={{ paddingBottom: '32px' }}>
        <h1 style={{ marginBottom: '16px' }}>Free Tools</h1>
        <p className="text-pretty" style={{ marginBottom: '40px' }}>
          {TOOLS.length} free tools for images, PDFs, and design — no sign-up, no watermarks.
          Everything runs in your browser, so your files never leave your device.
        </p>
        
        <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
          <MagnifyingGlass size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search"
            placeholder="Search tools... e.g. compress, heic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
            style={{ 
              width: '100%', padding: '16px 16px 16px 48px', fontSize: '1rem',
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '50px', color: 'var(--text-color)', outline: 'none',
              boxShadow: 'var(--shadow-md)', transition: 'all 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </header>

      <main style={{ padding: '0 5% 100px', maxWidth: '1400px', margin: '0 auto', minHeight: '60vh' }}>
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', margin: '80px auto', maxWidth: '400px', color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--card-bg)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border)' }}>
              <MagnifyingGlass size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '8px' }}>No tools found</h3>
            <p>We couldn't find any tools matching &quot;{query}&quot;. Try searching for something else like "compress" or "crop".</p>
            <button onClick={() => setQuery('')} className="btn-outline" style={{ marginTop: '24px' }}>Clear Search</button>
          </div>
        )}

        {grouped.map((cat, ci) => (
          <React.Fragment key={cat.id}>
            <section style={{ marginBottom: '64px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{cat.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{cat.blurb}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {cat.tools.map((tool, i) => (
                  <motion.div
                    key={tool.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(ci * 0.03 + i * 0.02, 0.4) }}
                  >
                    <Link to={toolPath(tool)} style={{
                      display: 'flex', flexDirection: 'column', height: '100%',
                      padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '16px', textDecoration: 'none', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '8px' }}>{tool.short}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', flex: 1 }}>{tool.description.split('.')[0]}.</p>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                        Open Tool <ArrowRight weight="bold" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
            {ci === 1 && <AdBanner slot="" style={{ marginBottom: '64px' }} />}
          </React.Fragment>
        ))}
      </main>
    </>
  );
}
