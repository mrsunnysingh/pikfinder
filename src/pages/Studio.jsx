// src/pages/Studio.jsx
// Route wrapper for /studio. Keeps SEO eager and cheap; lazy-loads the heavy
// canvas editor so it is code-split out of the main bundle.

import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PRESET_SEO } from '../studio/presets';

const StudioApp = lazy(() => import('../studio/StudioApp'));
const SITE_URL = 'https://pikfinder.com';

export default function Studio() {
  const [params] = useSearchParams();
  const preset = params.get('preset');
  const seo = PRESET_SEO[preset] || PRESET_SEO.default;

  useSeo({
    title: seo.title,
    description: seo.description,
    canonical: `${SITE_URL}/studio${preset ? `?preset=${preset}` : ''}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PikFinder Creator Studio',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: seo.description,
    },
  });

  return (
    <Suspense fallback={<div className="loader"><div className="spinner" /><p>Loading Studio…</p></div>}>
      <StudioApp />
    </Suspense>
  );
}
