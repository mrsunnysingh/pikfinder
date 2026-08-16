// src/pages/Admin.jsx
// Owner-only dashboard. Shows real customer + revenue data pulled from the
// secure /api/admin endpoint (which verifies the caller is ADMIN_UID). Anyone
// else who reaches this page just gets an "access denied" message.

import React, { useEffect, useState } from 'react';
import { Users, CurrencyInr, Crown, EnvelopeSimple, ChatCircleText, ClockCounterClockwise, ArrowClockwise, Lock, ChartBar, Article, X, DownloadSimple } from '@phosphor-icons/react';
import { fetchAdminData } from '../lib/adminApi';
import AdminBlog from './AdminBlog';

// Export a table to a CSV file (opens directly in Excel/Google Sheets). The
// leading BOM makes Excel read UTF-8 (₹, accents) correctly.
function downloadCsv(head, rows, filename) {
  const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return String(s); }
};
const money = (n, cur) => {
  const sym = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : `${cur} `;
  return `${sym}${Number(n || 0).toLocaleString()}`;
};

function Kpi({ icon, label, value, accent, onClick }) {
  return (
    <button
      type="button"
      className={`admin-kpi${onClick ? ' clickable' : ''}`}
      style={accent ? { borderTopColor: accent } : undefined}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="admin-kpi-icon">{icon}</div>
      <div className="admin-kpi-value">{value}</div>
      <div className="admin-kpi-label">{label}</div>
    </button>
  );
}

const DRILL_TITLES = {
  customers: 'All customers',
  premium: 'Premium members',
  subscribers: 'Newsletter subscribers',
  paidOrders: 'Paid orders',
  waitlist: 'Waitlist signups',
  contacts: 'Contact messages',
};

function DrillModal({ which, data, onClose }) {
  const lists = data.lists || {};
  let head = [];
  let rows = [];

  if (which === 'customers' || which === 'premium') {
    head = ['Name', 'Email', 'Username', 'Plan', 'Joined'];
    rows = (lists[which] || []).map((u) => [u.name, u.email, u.username || '—', u.isPremium ? 'Premium' : 'Free', fmtDate(u.at)]);
  } else if (which === 'subscribers') {
    head = ['Email', 'Joined'];
    rows = (lists.subscribers || []).map((s) => [s.email, fmtDate(s.at)]);
  } else if (which === 'paidOrders') {
    head = ['Customer', 'Plan', 'Amount', 'When'];
    rows = (data.recentPayments || []).map((p) => [p.email, p.plan, money(p.amount, p.currency), fmtDate(p.at)]);
  } else if (which === 'waitlist') {
    head = ['Name', 'Email', 'Profession', 'When'];
    rows = (data.recentSignups || []).map((s) => [s.name, s.email, s.profession || '—', fmtDate(s.at)]);
  } else if (which === 'contacts') {
    head = ['Name', 'Email', 'Category', 'Message', 'When'];
    rows = (data.recentContacts || []).map((m) => [m.name, m.email, m.category || '—', m.message, fmtDate(m.at)]);
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h3>{DRILL_TITLES[which] || 'Details'} <span className="admin-modal-count">{rows.length}</span></h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => downloadCsv(head, rows, `pikfinder-${which}-${new Date().toISOString().slice(0, 10)}.csv`)}
              disabled={!rows.length} title="Export to Excel/CSV">
              <DownloadSimple size={15} /> Export Excel
            </button>
            <button className="admin-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <div className="admin-modal-body">
          {rows.length === 0 ? (
            <p className="admin-none">Nothing here yet.</p>
          ) : (
            <table className="admin-table">
              <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>{r.map((cell, j) => <td key={j} className={head[j] === 'Message' ? 'admin-msg' : undefined}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tab, setTab] = useState('overview');
  const [drill, setDrill] = useState(null); // which KPI drill-down modal is open

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchAdminData();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e, data: null });
    }
  };

  useEffect(() => { load(); }, []);

  if (state.loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty"><div className="admin-spinner" /> Loading your dashboard…</div>
      </div>
    );
  }

  if (state.error) {
    const denied = state.error.status === 403;
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <Lock size={40} weight="duotone" />
          <h2>{denied ? 'Access restricted' : 'Could not load'}</h2>
          <p>
            {denied
              ? 'This dashboard is only for the site owner. If that’s you, make sure your ADMIN_UID is set in Vercel and you’re signed in with the owner account.'
              : 'Something went wrong loading the data. Check that the admin API is deployed and try again.'}
          </p>
          {state.error.why && <code className="admin-why">reason: {state.error.why}</code>}
          <button className="btn btn-secondary" onClick={load}><ArrowClockwise size={16} /> Retry</button>
        </div>
      </div>
    );
  }

  const d = state.data || {};
  const c = d.counts || {};
  const rev = d.revenue || {};
  const revEntries = Object.entries(rev);

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="admin-sub">Manage your customers, revenue and website content.</p>
        </div>
        {tab === 'overview' && <button className="btn btn-secondary" onClick={load}><ArrowClockwise size={16} /> Refresh</button>}
      </div>

      <div className="admin-tabs">
        <button className={tab === 'overview' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('overview')}>
          <ChartBar size={16} /> Overview
        </button>
        <button className={tab === 'blog' ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab('blog')}>
          <Article size={16} /> Blog / CMS
        </button>
      </div>

      {tab === 'blog' ? <AdminBlog /> : (
      <>
      <div className="admin-kpis">
        <Kpi icon={<Users size={22} weight="duotone" />} label="Total customers" value={c.customers ?? 0} accent="#6366f1" onClick={() => setDrill('customers')} />
        <Kpi icon={<Crown size={22} weight="duotone" />} label="Premium members" value={c.premium ?? 0} accent="#f59e0b" onClick={() => setDrill('premium')} />
        <Kpi icon={<CurrencyInr size={22} weight="duotone" />} label="Paid orders" value={c.paidOrders ?? 0} accent="#10b981" onClick={() => setDrill('paidOrders')} />
        <Kpi icon={<EnvelopeSimple size={22} weight="duotone" />} label="Subscribers" value={c.subscribers ?? 0} accent="#0ea5e9" onClick={() => setDrill('subscribers')} />
        <Kpi icon={<ClockCounterClockwise size={22} weight="duotone" />} label="Waitlist" value={c.waitlist ?? 0} accent="#8b5cf6" onClick={() => setDrill('waitlist')} />
        <Kpi icon={<ChatCircleText size={22} weight="duotone" />} label="Contact messages" value={c.contacts ?? 0} accent="#ec4899" onClick={() => setDrill('contacts')} />
      </div>

      {drill && <DrillModal which={drill} data={d} onClose={() => setDrill(null)} />}

      {revEntries.length > 0 && (
        <div className="admin-revenue">
          <span className="admin-revenue-label">Revenue collected</span>
          {revEntries.map(([cur, amt]) => (
            <span key={cur} className="admin-revenue-amt">{money(amt, cur)}</span>
          ))}
        </div>
      )}

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Recent payments</h3>
          {(d.recentPayments || []).length === 0 ? (
            <p className="admin-none">No payments yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>When</th></tr></thead>
                <tbody>
                  {d.recentPayments.map((p, i) => (
                    <tr key={i}>
                      <td>{p.email}</td>
                      <td>{p.plan}</td>
                      <td>{money(p.amount, p.currency)}</td>
                      <td>{fmtDate(p.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <h3>Recent signups</h3>
          {(d.recentSignups || []).length === 0 ? (
            <p className="admin-none">No signups yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Profession</th><th>When</th></tr></thead>
                <tbody>
                  {d.recentSignups.map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.profession || '—'}</td>
                      <td>{fmtDate(s.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card admin-card-wide">
          <h3>Recent contact messages</h3>
          {(d.recentContacts || []).length === 0 ? (
            <p className="admin-none">No messages yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Category</th><th>Message</th><th>When</th></tr></thead>
                <tbody>
                  {d.recentContacts.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.category || '—'}</td>
                      <td className="admin-msg">{m.message}</td>
                      <td>{fmtDate(m.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      </>
      )}
    </div>
  );
}
