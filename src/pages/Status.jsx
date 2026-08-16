// src/pages/Status.jsx
// Lightweight API status / trust page (/status). Pings /api/health and shows
// service + provider configuration. Confirms the serverless API is live.

import React, { useEffect, useState } from 'react';
import { useSeo } from '../hooks/useSeo';
import ProviderStatus from '../components/ProviderStatus';

const SITE_URL = 'https://pikfinder.com';
const LABELS = { unsplash: 'Unsplash', pexels: 'Pexels', pixabay: 'Pixabay', openverse: 'Openverse', gemini: 'AI Search (Gemini)' };

export default function Status() {
  const [state, setState] = useState({ loading: true, ok: false, data: null });

  useSeo({
    title: 'API Status | PikFinder',
    description: 'Live status of the PikFinder search API and its media providers.',
    canonical: `${SITE_URL}/status`,
  });

  useEffect(() => {
    let alive = true;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => alive && setState({ loading: false, ok: data.status === 'ok', data }))
      .catch(() => alive && setState({ loading: false, ok: false, data: null }));
    return () => { alive = false; };
  }, []);

  return (
    <>
      <header className="page-header" style={{ paddingBottom: 24 }}>
        <h1>API Status</h1>
        <p>Live health of the PikFinder search API and connected providers.</p>
      </header>

      <div className="legal-container">
        <ProviderStatus />
        
        <p className="studio-hint">If you are running locally, use <code>vercel dev</code> so the /api routes are available.</p>
      </div>
    </>
  );
}
