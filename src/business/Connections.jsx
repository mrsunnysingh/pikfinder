import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Plug, CheckCircle, XCircle, ArrowClockwise, LinkSimple, Warning } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { SERVICE_META } from './serviceMeta';
import ZohoLogo from './ZohoLogos';
import { connectZoho, getStatus, testConnection, disconnect } from './zohoClient';

const fmtDate = (ms) => (ms ? new Date(ms).toLocaleString() : '—');

export default function Connections() {
  const { user, toggleAuthModal } = useContext(AppContext);
  const [configured, setConfigured] = useState(true);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState({});   // { [service]: 'test' | 'disconnect' }
  const [flash, setFlash] = useState(null); // { type, msg }
  const [dc, setDc] = useState('in');       // Zoho data center / region

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { ok, data, status } = await getStatus();
      if (ok && data?.services) { setStatuses(data.services); setConfigured(data.configured); }
      else if (status === 401) setStatuses({});
      else if (data && data.configured === false) setConfigured(false);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Surface the callback result (?connected= / ?zoho_error=) then clean the URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const connected = p.get('connected');
    const err = p.get('zoho_error');
    if (connected) setFlash({ type: 'ok', msg: `${SERVICE_META[connected]?.label || connected} connected.` });
    else if (err) setFlash({ type: 'err', msg: `Zoho: ${err.replace(/_/g, ' ')}` });
    if (connected || err) {
      window.history.replaceState({}, '', '/business');
      refresh();
    }
  }, [refresh]);

  const onConnect = async (service) => {
    if (!user) return toggleAuthModal('login');
    try { await connectZoho(service, dc); }
    catch { setFlash({ type: 'err', msg: 'Please sign in first.' }); }
  };
  const onTest = async (service) => {
    setBusy((b) => ({ ...b, [service]: 'test' }));
    const { ok, data } = await testConnection(service);
    setFlash(ok
      ? { type: 'ok', msg: `${SERVICE_META[service]?.label}: OK${data?.org?.name ? ` — ${data.org.name}` : ''} (${data.latencyMs}ms)` }
      : { type: 'err', msg: `${SERVICE_META[service]?.label}: ${String(data?.error || 'test failed').replace(/_/g, ' ')}` });
    setBusy((b) => ({ ...b, [service]: null }));
    refresh();
  };
  const onDisconnect = async (service) => {
    setBusy((b) => ({ ...b, [service]: 'disconnect' }));
    await disconnect(service);
    setBusy((b) => ({ ...b, [service]: null }));
    setFlash({ type: 'ok', msg: `${SERVICE_META[service]?.label} disconnected.` });
    refresh();
  };

  return (
    <div className="biz-conn">
      <div className="biz-conn-intro">
        <p>Connect your Zoho apps once. PikFinder then auto-fills your templates with real records — no copy-paste. Tokens are encrypted and stored server-side; your browser never sees them.</p>
        <label className="biz-conn-dc">
          <span>Your Zoho region</span>
          <select value={dc} onChange={(e) => setDc(e.target.value)}>
            <option value="in">India (zoho.in)</option>
            <option value="us">United States (zoho.com)</option>
            <option value="eu">Europe (zoho.eu)</option>
            <option value="au">Australia (zoho.com.au)</option>
            <option value="jp">Japan (zoho.jp)</option>
            <option value="ca">Canada (zohocloud.ca)</option>
          </select>
          <small>Pick the region where your Zoho account lives — it must match, or the connection will fail.</small>
        </label>
      </div>

      {!configured && (
        <div className="biz-flash warn">
          <Warning size={16} /> Zoho isn’t configured on the server yet. Add <code>ZOHO_CLIENT_ID</code>, <code>ZOHO_CLIENT_SECRET</code> and <code>ZOHO_TOKEN_KEY</code> to enable connecting.
        </div>
      )}
      {flash && <div className={`biz-flash ${flash.type === 'ok' ? 'ok' : 'err'}`}>{flash.type === 'ok' ? <CheckCircle size={16} /> : <XCircle size={16} />} {flash.msg}</div>}

      {!user && (
        <div className="biz-flash">
          <LinkSimple size={16} /> <button className="biz-linkbtn" onClick={() => toggleAuthModal('login')}>Sign in</button> to connect your Zoho account.
        </div>
      )}

      <div className="biz-conn-grid">
        {Object.entries(SERVICE_META).map(([id, meta]) => {
          const s = statuses[id] || {};
          const connected = s.connected;
          const b = busy[id];
          return (
            <div key={id} className={`biz-conn-card ${connected ? 'connected' : ''}`}>
              <div className="biz-conn-top">
                <span className="biz-conn-icon biz-conn-logo"><ZohoLogo service={id} size={40} /></span>
                <div className="biz-conn-title">
                  <strong>{meta.label}</strong>
                  <span className={`biz-conn-badge ${connected ? 'on' : s.needsReauth ? 'warn' : 'off'}`}>
                    {connected ? 'Connected' : s.needsReauth ? 'Needs re-auth' : 'Not connected'}
                  </span>
                </div>
              </div>
              <p className="biz-conn-desc">{meta.desc}</p>

              {connected && (
                <dl className="biz-conn-meta">
                  {s.orgId ? (<><dt>Org</dt><dd>{s.orgId}</dd></>) : null}
                  <dt>Scopes</dt><dd>{(s.scopes || []).length} granted</dd>
                  <dt>Last sync</dt><dd>{fmtDate(s.lastSync)}</dd>
                </dl>
              )}

              <div className="biz-conn-actions">
                {connected ? (
                  <>
                    <button className="btn-outline" disabled={b === 'test' || !configured} onClick={() => onTest(id)}>
                      <ArrowClockwise size={15} /> {b === 'test' ? 'Testing…' : 'Test'}
                    </button>
                    <button className="btn-ghost-danger" disabled={b === 'disconnect'} onClick={() => onDisconnect(id)}>
                      {b === 'disconnect' ? 'Removing…' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" disabled={!configured} onClick={() => onConnect(id)}>
                    <Plug size={15} /> Connect {meta.label.replace('Zoho ', '')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && <p className="biz-conn-loading">Checking connections…</p>}
    </div>
  );
}
