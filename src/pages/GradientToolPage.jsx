// src/pages/GradientToolPage.jsx
// Exposes the existing GradientGenerator at /tools/gradient-generator with proper
// SEO, without modifying the original component.

import React from 'react';
import { useSeo } from '../hooks/useSeo';
import GradientGenerator from './GradientGenerator';

const SITE_URL = 'https://pikfinder.com';

export default function GradientToolPage() {
  useSeo({
    title: 'Gradient Generator — Free CSS Linear & Radial Gradients | PikFinder',
    description: 'Create beautiful CSS gradients free. Linear and radial, angle control, unlimited color stops, live preview. Copy CSS or download SVG in one click.',
    canonical: `${SITE_URL}/tools/gradient-generator`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Gradient Generator',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  });

  return <GradientGenerator />;
}
