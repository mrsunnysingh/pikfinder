import React, { useState, useEffect } from 'react';

export default function ProviderStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch status');
        return res.json();
      })
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="provider-status-panel">Loading provider status...</div>;
  if (error || !status) return <div className="provider-status-panel">Failed to load provider status.</div>;

  const providers = [
    { key: 'unsplash', name: 'Unsplash' },
    { key: 'pexels', name: 'Pexels' },
    { key: 'pixabay', name: 'Pixabay' },
    { key: 'openverse', name: 'Openverse' },
    { key: 'gemini', name: 'Gemini' }
  ];

  const onlineCount = providers.filter(p => status.providers[p.key]).length;

  return (
    <div className="provider-status-panel" style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Provider Status</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Last checked: {new Date(status.time).toLocaleTimeString()}
        </span>
      </div>
      <p style={{ margin: '4px 0 16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        {onlineCount} of {providers.length} providers online
      </p>
      
      <div style={gridStyle}>
        {providers.map(p => {
          const isConnected = status.providers[p.key];
          return (
            <div key={p.key} style={itemStyle}>
              <span style={{ fontSize: '1.2rem' }}>{isConnected ? '🟢' : '🟡'}</span>
              <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>{p.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                — {isConnected ? 'Connected' : 'Configure API'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const panelStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '24px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '12px'
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};
