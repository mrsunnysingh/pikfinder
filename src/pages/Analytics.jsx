// src/pages/Analytics.jsx
// Lightweight analytics dashboard (/analytics). Reads recent events from
// analytics/{bucket}/events and computes simple widgets client-side. Reads are
// admin-gated in firestore.rules — non-admins get a friendly message.
//
// NOTE: this is a foundation. For large volumes, aggregate server-side (a
// scheduled function writing daily rollups) rather than reading raw events.

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useSeo } from '../hooks/useSeo';

const SITE_URL = 'https://pikfinder.com';
const today = () => new Date().toISOString().slice(0, 10);

async function fetchBucket(bucket, max = 300) {
  const q = query(collection(db, 'analytics', bucket, 'events'), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

function topCounts(items, key, n = 5) {
  const counts = {};
  for (const it of items) {
    const v = it[key];
    if (!v) continue;
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default function Analytics() {
  const [state, setState] = useState({ loading: true, denied: false, data: null });

  useSeo({ title: 'Analytics | PikFinder', description: 'Internal analytics dashboard.', canonical: `${SITE_URL}/analytics` });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!db) { if (alive) setState({ loading: false, denied: false, data: null }); return; }
      try {
        const [searches, downloads, tools, waitlist] = await Promise.all([
          fetchBucket('searches'), fetchBucket('downloads'), fetchBucket('tools'), fetchBucket('waitlist'),
        ]);
        const t = today();
        if (alive) setState({
          loading: false, denied: false,
          data: {
            searchesToday: searches.filter((e) => e.day === t).length,
            downloadsToday: downloads.filter((e) => e.day === t).length,
            waitlistTotal: waitlist.length,
            waitlistToday: waitlist.filter((e) => e.day === t).length,
            topSearches: topCounts(searches, 'term'),
            topTools: topCounts(tools, 'slug'),
            providerUsage: topCounts(downloads, 'source'),
          },
        });
      } catch (err) {
        console.warn('[Analytics] read blocked:', err?.code || err?.message);
        if (alive) setState({ loading: false, denied: true, data: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="legal-container subpage-wrap">
      <header className="page-header" style={{ padding: 0, marginBottom: 24 }}>
        <h1>Analytics</h1>
        <p>Recent activity across PikFinder.</p>
      </header>

      {state.loading && <div className="loader"><div className="spinner" /><p>Loading…</p></div>}

      {!state.loading && state.denied && (
        <p className="studio-hint">Analytics reads are restricted to admins. Grant your account admin read access in <code>firestore.rules</code> (see ANALYTICS_SETUP.md), or view the data in the Firebase console.</p>
      )}

      {!state.loading && !state.denied && !state.data && (
        <p className="studio-hint">No analytics available (Firebase not configured).</p>
      )}

      {state.data && (
        <>
          <div className="analytics-widgets">
            <Stat label="Searches today" value={state.data.searchesToday} />
            <Stat label="Downloads today" value={state.data.downloadsToday} />
            <Stat label="Waitlist signups (today)" value={state.data.waitlistToday} />
            <Stat label="Waitlist total (recent)" value={state.data.waitlistTotal} />
          </div>

          <div className="analytics-lists">
            <RankList title="Top search terms" rows={state.data.topSearches} />
            <RankList title="Most used tools" rows={state.data.topTools} />
            <RankList title="Provider usage (downloads)" rows={state.data.providerUsage} />
          </div>
          <p className="studio-hint">Showing the most recent events. For full history and true active-user counts, aggregate server-side (see ANALYTICS_SETUP.md).</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="analytics-stat">
      <span className="analytics-stat-value">{value}</span>
      <span className="analytics-stat-label">{label}</span>
    </div>
  );
}
function RankList({ title, rows }) {
  return (
    <div className="analytics-rank">
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="studio-hint">No data yet.</p> : (
        <ol>{rows.map(([name, count]) => <li key={name}><span>{name}</span><b>{count}</b></li>)}</ol>
      )}
    </div>
  );
}
