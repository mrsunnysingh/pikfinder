// src/business/zohoClient.js
// Thin browser client for the Zoho connector API. All calls are authenticated
// with the current user's Firebase ID token. Tokens for Zoho itself live only
// on the server — this file never sees them.

import { auth } from '../firebase';

async function idToken() {
  const u = auth?.currentUser;
  if (!u) throw new Error('not_signed_in');
  return u.getIdToken();
}

async function authedFetch(url, opts = {}) {
  const token = await idToken();
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { ok: res.ok, status: res.status, data };
}

// Kick off OAuth: full-page redirect to the consent screen. The ID token rides
// as a query param because this is a top-level navigation (no headers).
export async function connectZoho(service, dc = 'us') {
  const token = await idToken();
  const p = new URLSearchParams({ service, dc, token });
  window.location.href = `/api/zoho/connect?${p.toString()}`;
}

export function getStatus(service) {
  const q = service ? `?service=${encodeURIComponent(service)}` : '';
  return authedFetch(`/api/zoho/status${q}`);
}

export function testConnection(service) {
  return authedFetch(`/api/zoho/test?service=${encodeURIComponent(service)}`, { method: 'POST' });
}

export function disconnect(service) {
  return authedFetch(`/api/zoho/disconnect?service=${encodeURIComponent(service)}`, { method: 'POST' });
}

// ── Data reads for the "generate from records" flow ──────────────────────────
export function getModules(service) {
  return authedFetch(`/api/zoho/modules?service=${encodeURIComponent(service)}`);
}

export function getFields(service, module) {
  return authedFetch(`/api/zoho/fields?service=${encodeURIComponent(service)}&module=${encodeURIComponent(module)}`);
}

export function getRecords(service, module, { page = 1, fields } = {}) {
  const p = new URLSearchParams({ service, module, page: String(page) });
  if (fields) p.set('fields', fields);
  return authedFetch(`/api/zoho/records?${p.toString()}`);
}

// ── Zoho Creator: forms list + attach a generated document to a record ───────
export function getForms(app) {
  return authedFetch(`/api/zoho/forms?service=creator&app=${encodeURIComponent(app)}`);
}

// payload: { owner, module:"app/report", field, mode:'existing'|'new',
//            recordId?, form?, createData?, filename, base64, contentType }
export function attachToCreator(payload) {
  return authedFetch('/api/zoho/creator-attach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
