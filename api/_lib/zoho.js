// api/_lib/zoho.js
// Server-side Zoho helper: OAuth (multi-DC), on-demand access tokens, a thin
// authenticated fetch, connection storage (encrypted refresh token in
// Firestore via the Admin SDK), and a per-service "cheap read" for the Test
// Connection button. Browser NEVER sees a Zoho token.

import { getAdminDb } from './firebaseAdmin.js';
import { encrypt, decrypt } from './crypto.js';

// ── Data centers ────────────────────────────────────────────────────────────
// Zoho accounts live in one DC; the correct one is discovered at callback time
// from the `location`/`accounts-server` param and stored per connection.
export const DC_ACCOUNTS = {
  us: 'https://accounts.zoho.com',
  eu: 'https://accounts.zoho.eu',
  in: 'https://accounts.zoho.in',
  au: 'https://accounts.zoho.com.au',
  jp: 'https://accounts.zoho.jp',
  ca: 'https://accounts.zohocloud.ca',
};
// Default API domains per DC (Zoho also returns api_domain on token exchange —
// we prefer that when present).
const DC_APIROOT = {
  us: 'https://www.zohoapis.com',
  eu: 'https://www.zohoapis.eu',
  in: 'https://www.zohoapis.in',
  au: 'https://www.zohoapis.com.au',
  jp: 'https://www.zohoapis.jp',
  ca: 'https://www.zohoapis.ca',
};
export function normalizeDc(loc) {
  const s = String(loc || 'us').toLowerCase();
  if (DC_ACCOUNTS[s]) return s;
  if (s.includes('.eu')) return 'eu';
  if (s.includes('.in')) return 'in';
  if (s.includes('.com.au') || s === 'au') return 'au';
  if (s.includes('.jp')) return 'jp';
  if (s.includes('ca')) return 'ca';
  return 'us';
}
export const accountsBase = (dc) => DC_ACCOUNTS[normalizeDc(dc)] || DC_ACCOUNTS.us;
export const apiRoot = (dc, apiDomain) => apiDomain || DC_APIROOT[normalizeDc(dc)] || DC_APIROOT.us;

// ── Services & scopes (minimal, read-first) ─────────────────────────────────
export const SERVICES = {
  crm: {
    label: 'Zoho CRM',
    scopes: ['ZohoCRM.modules.READ', 'ZohoCRM.settings.READ', 'ZohoCRM.org.READ'],
  },
  creator: {
    label: 'Zoho Creator',
    // READ powers the record picker; CREATE lets us add a record and upload the
    // generated document into a file field. (Reconnect Creator after this change
    // so the new write scopes are granted.)
    scopes: [
      'ZohoCreator.report.READ', 'ZohoCreator.form.READ', 'ZohoCreator.meta.READ',
      'ZohoCreator.form.CREATE', 'ZohoCreator.report.CREATE',
    ],
  },
};
export const isSupportedService = (s) => Object.prototype.hasOwnProperty.call(SERVICES, s);

// ── Config guard ────────────────────────────────────────────────────────────
export function zohoConfig() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || '';
  const missing = [];
  if (!clientId) missing.push('ZOHO_CLIENT_ID');
  if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
  if (!process.env.ZOHO_TOKEN_KEY) missing.push('ZOHO_TOKEN_KEY');
  if (!appUrl) missing.push('APP_URL');
  return { clientId, clientSecret, appUrl, redirectUri: `${appUrl}/api/zoho/callback`, missing };
}

// ── OAuth ───────────────────────────────────────────────────────────────────
export function buildAuthUrl({ service, dc, state }) {
  const cfg = zohoConfig();
  const scope = SERVICES[service].scopes.join(',');
  const p = new URLSearchParams({
    scope,
    client_id: cfg.clientId,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: cfg.redirectUri,
    state,
  });
  return `${accountsBase(dc)}/oauth/v2/auth?${p.toString()}`;
}

// Exchange an authorization code for tokens. `dc` is the account location.
export async function exchangeCode({ code, dc }) {
  const cfg = zohoConfig();
  const p = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    code,
  });
  const r = await fetch(`${accountsBase(dc)}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString(),
  });
  const data = await r.json();
  if (!data.access_token) throw new Error(data.error || 'token_exchange_failed');
  return data; // { access_token, refresh_token, api_domain, expires_in, scope }
}

// Mint a fresh access token from a stored refresh token.
async function accessTokenFromRefresh({ refreshToken, dc }) {
  const cfg = zohoConfig();
  const p = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
  });
  const r = await fetch(`${accountsBase(dc)}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p.toString(),
  });
  const data = await r.json();
  if (!data.access_token) throw new Error(data.error || 'refresh_failed');
  return data.access_token;
}

export async function revokeToken({ refreshToken, dc }) {
  try {
    await fetch(`${accountsBase(dc)}/oauth/v2/token/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' });
  } catch { /* best-effort */ }
}

// ── Connection storage (Firestore, Admin SDK) ───────────────────────────────
// zohoConnections/{uid}/services/{service}
function connRef(db, uid, service) {
  return db.collection('zohoConnections').doc(uid).collection('services').doc(service);
}

export async function saveConnection({ uid, service, dc, apiDomain, scopes, refreshToken, orgId = '' }) {
  const db = getAdminDb();
  if (!db) throw new Error('admin_db_unavailable');
  await connRef(db, uid, service).set({
    status: 'connected',
    dc: normalizeDc(dc),
    apiDomain: apiDomain || '',
    orgId,
    scopes: scopes || SERVICES[service]?.scopes || [],
    encryptedRefreshToken: encrypt(refreshToken),
    connectedAt: Date.now(),
    lastSync: null,
  }, { merge: true });
}

export async function getConnection({ uid, service }) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await connRef(db, uid, service).get();
  return snap.exists ? snap.data() : null;
}

// Public status shape — NEVER includes tokens.
export async function getStatus({ uid, service }) {
  const c = await getConnection({ uid, service });
  if (!c || c.status !== 'connected') return { service, connected: false };
  return {
    service,
    connected: true,
    dc: c.dc,
    orgId: c.orgId || '',
    scopes: c.scopes || [],
    connectedAt: c.connectedAt || null,
    lastSync: c.lastSync || null,
    needsReauth: c.status === 'needs_reauth',
  };
}

export async function markNeedsReauth({ uid, service }) {
  const db = getAdminDb();
  if (!db) return;
  await connRef(db, uid, service).set({ status: 'needs_reauth' }, { merge: true });
}

export async function touchSync({ uid, service }) {
  const db = getAdminDb();
  if (!db) return;
  await connRef(db, uid, service).set({ lastSync: Date.now() }, { merge: true });
}

export async function deleteConnection({ uid, service }) {
  const db = getAdminDb();
  if (!db) return;
  const c = await getConnection({ uid, service });
  if (c?.encryptedRefreshToken) {
    try { await revokeToken({ refreshToken: decrypt(c.encryptedRefreshToken), dc: c.dc }); } catch { /* ignore */ }
  }
  await connRef(db, uid, service).delete();
}

// ── Authenticated Zoho API call (mints a token per request) ─────────────────
export async function zohoApi({ uid, service, path, method = 'GET', body, query }) {
  const c = await getConnection({ uid, service });
  if (!c || c.status !== 'connected') throw new Error('not_connected');
  const refreshToken = decrypt(c.encryptedRefreshToken);
  let accessToken;
  try {
    accessToken = await accessTokenFromRefresh({ refreshToken, dc: c.dc });
  } catch (e) {
    if (String(e.message).includes('invalid')) await markNeedsReauth({ uid, service });
    throw e;
  }
  const root = apiRoot(c.dc, c.apiDomain);
  const url = new URL(root + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (r.status === 401) { await markNeedsReauth({ uid, service }); throw new Error('unauthorized'); }
  return { status: r.status, data };
}

// ── Data reads for the "generate from records" flow ─────────────────────────
// All return a normalized shape so the client is service-agnostic.

// List selectable sources. CRM → modules; Creator → "app/report" pairs.
export async function listModules({ uid, service }) {
  if (service === 'crm') {
    const { data } = await zohoApi({ uid, service, path: '/crm/v6/settings/modules' });
    const mods = Array.isArray(data?.modules) ? data.modules : [];
    return mods
      .filter((m) => m.api_supported && m.generated_type !== 'subform' && m.api_name)
      .map((m) => ({ key: m.api_name, label: m.plural_label || m.module_name || m.api_name }));
  }
  if (service === 'creator') {
    const { data } = await zohoApi({ uid, service, path: '/creator/v2.1/meta/applications' });
    const apps = Array.isArray(data?.applications) ? data.applications : [];
    const out = [];
    for (const app of apps.slice(0, 20)) {
      const link = app.link_name || app.application_name;
      try {
        const rep = await zohoApi({ uid, service, path: `/creator/v2.1/meta/${encodeURIComponent(link)}/reports` });
        const reports = Array.isArray(rep.data?.reports) ? rep.data.reports : [];
        for (const r of reports) out.push({ key: `${link}/${r.link_name}`, label: `${app.application_name} › ${r.display_name || r.link_name}` });
      } catch { /* skip inaccessible app */ }
    }
    return out;
  }
  return [];
}

// Field metadata for a module → [{ key, label }].
export async function listFields({ uid, service, module }) {
  if (service === 'crm') {
    const { data } = await zohoApi({ uid, service, path: '/crm/v6/settings/fields', query: { module } });
    const fields = Array.isArray(data?.fields) ? data.fields : [];
    return fields
      .filter((f) => f.api_name && f.data_type !== 'subform')
      .map((f) => ({ key: f.api_name, label: f.field_label || f.api_name }));
  }
  if (service === 'creator') {
    const [app, report] = String(module).split('/');
    const { data } = await zohoApi({ uid, service, path: `/creator/v2.1/meta/${encodeURIComponent(app)}/report/${encodeURIComponent(report)}/fields` });
    const fields = Array.isArray(data?.fields) ? data.fields : [];
    return fields.map((f) => ({ key: f.link_name || f.field_name, label: f.display_name || f.field_name }));
  }
  return [];
}

// Flatten a CRM value (which may be a lookup object / array) to a display string.
function flatValue(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(flatValue).filter(Boolean).join(', ');
  if (typeof v === 'object') return v.name || v.display_value || v.value || v.id || '';
  return String(v);
}

// Paged records → { records: [{ id, label, fields: {key: string} }], page, hasMore }.
export async function listRecords({ uid, service, module, page = 1, perPage = 50, fields }) {
  if (service === 'crm') {
    const query = { page, per_page: Math.min(200, perPage) };
    if (fields) query.fields = fields; // comma list from client (CRM v6 requires it)
    const { data, status } = await zohoApi({ uid, service, path: `/crm/v6/${encodeURIComponent(module)}`, query });
    if (status === 204 || !data?.data) return { records: [], page, hasMore: false };
    const rows = data.data.map((r) => {
      const flat = {};
      for (const [k, v] of Object.entries(r)) flat[k] = flatValue(v);
      return { id: r.id, label: flat.Full_Name || flat.Name || flat.Deal_Name || flat.Email || r.id, fields: flat };
    });
    return { records: rows, page, hasMore: Boolean(data.info?.more_records) };
  }
  if (service === 'creator') {
    const [app, report] = String(module).split('/');
    const from = (page - 1) * perPage + 1;
    const { data } = await zohoApi({ uid, service, path: `/creator/v2.1/data/${encodeURIComponent(app)}/report/${encodeURIComponent(report)}`, query: { from, limit: perPage } });
    const rows = Array.isArray(data?.data) ? data.data : [];
    const mapped = rows.map((r) => {
      const flat = {};
      for (const [k, v] of Object.entries(r)) flat[k] = flatValue(v);
      return { id: r.ID, label: flat.Name || flat.Title || flat.Email || r.ID, fields: flat };
    });
    return { records: mapped, page, hasMore: rows.length >= perPage };
  }
  return { records: [], page, hasMore: false };
}

// Cheap read used by the Test Connection button.
export async function testRead({ uid, service }) {
  const t0 = Date.now();
  if (service === 'crm') {
    const { data } = await zohoApi({ uid, service, path: '/crm/v6/org' });
    const org = data?.org?.[0];
    return { ok: true, latencyMs: Date.now() - t0, org: org ? { name: org.company_name, id: org.id } : null };
  }
  if (service === 'creator') {
    const { data } = await zohoApi({ uid, service, path: '/creator/v2.1/meta/applications' });
    const count = Array.isArray(data?.applications) ? data.applications.length : 0;
    return { ok: true, latencyMs: Date.now() - t0, org: { name: `${count} app(s)`, id: '' } };
  }
  throw new Error('unsupported_service');
}

// ── Payments → Zoho CRM ─────────────────────────────────────────────────────
// Mirror a completed payment into the connected CRM: upsert a Contact by email,
// then log a "Closed Won" Deal linked to it. Uses only standard modules
// (Contacts + Deals) so it works on Zoho CRM's free edition. `uid` is the CRM
// account owner's Firebase uid (whoever connected Zoho in the Business Hub).
export async function crmRecordPayment({ uid, email, name, amountInr, currency = 'INR', plan, paymentId, orderId }) {
  let contactId = null;
  if (email) {
    const last = (name && String(name).trim()) || String(email).split('@')[0];
    const up = await zohoApi({
      uid, service: 'crm', path: '/crm/v6/Contacts/upsert', method: 'POST',
      body: { data: [{ Last_Name: last, Email: email }], duplicate_check_fields: ['Email'] },
    });
    contactId = up?.data?.data?.[0]?.details?.id || null;
  }

  const deal = {
    Deal_Name: `${plan || 'PikFinder'} — ${email || paymentId || orderId}`,
    Stage: 'Closed Won',
    Closing_Date: new Date().toISOString().slice(0, 10),
    Description: `PikFinder payment via Razorpay. Order ${orderId || '—'}, Payment ${paymentId || '—'} (${currency} ${amountInr}).`,
  };
  if (Number.isFinite(amountInr)) deal.Amount = amountInr;
  if (contactId) deal.Contact_Name = { id: contactId };

  const res = await zohoApi({ uid, service: 'crm', path: '/crm/v6/Deals', method: 'POST', body: { data: [deal] } });
  const dealId = res?.data?.data?.[0]?.details?.id || null;
  return { contactId, dealId };
}

// ── Zoho Creator: write (add record + upload document to a file field) ───────
// Mint a fresh access token + resolve the API root for direct fetches (used for
// multipart uploads that zohoApi's JSON path can't do).
export async function getAccessToken({ uid, service }) {
  const c = await getConnection({ uid, service });
  if (!c || c.status !== 'connected') throw new Error('not_connected');
  const refreshToken = decrypt(c.encryptedRefreshToken);
  const token = await accessTokenFromRefresh({ refreshToken, dc: c.dc });
  return { token, root: apiRoot(c.dc, c.apiDomain), conn: c };
}

// List a Creator app's forms → [{ key: form link_name, label }] (for "create new record").
export async function listForms({ uid, service = 'creator', app }) {
  const { data } = await zohoApi({ uid, service, path: `/creator/v2.1/meta/${encodeURIComponent(app)}/forms` });
  const forms = Array.isArray(data?.forms) ? data.forms : [];
  return forms.map((f) => ({ key: f.link_name || f.form_name, label: f.display_name || f.form_name || f.link_name }));
}

// Add a record to a Creator form. Returns the new record's ID.
export async function creatorAddRecord({ uid, owner, app, form, data = {} }) {
  const { token, root } = await getAccessToken({ uid, service: 'creator' });
  const url = `${root}/creator/v2.1/data/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/form/${encodeURIComponent(form)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const text = await r.text();
  let d; try { d = JSON.parse(text); } catch { d = { raw: text }; }
  const recordId = d?.data?.ID || d?.data?.id || (Array.isArray(d?.result) ? d.result[0]?.data?.ID : null);
  return { status: r.status, data: d, recordId };
}

// Upload a file (base64) into a record's file-upload field. Multipart, so it
// bypasses zohoApi and posts FormData directly.
export async function creatorUploadFile({ uid, owner, app, report, recordId, field, filename, base64, contentType }) {
  const { token, root } = await getAccessToken({ uid, service: 'creator' });
  const buf = Buffer.from(base64, 'base64');
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: contentType || 'application/octet-stream' }), filename || 'document');
  const url = `${root}/creator/v2.1/data/${encodeURIComponent(owner)}/${encodeURIComponent(app)}/report/${encodeURIComponent(report)}/${encodeURIComponent(recordId)}/${encodeURIComponent(field)}/upload`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Zoho-oauthtoken ${token}` }, body: fd });
  const text = await r.text();
  let d; try { d = JSON.parse(text); } catch { d = { raw: text }; }
  return { status: r.status, data: d };
}

// Create a Lead in the owner's Zoho CRM from any website form submission.
// Company + Last_Name are mandatory on the Leads module, so we default them.
export async function crmCreateLead({ uid, name, email, phone, company, message, subject, source = 'PikFinder Website' }) {
  const lead = {
    Last_Name: (name && String(name).trim()) || (email ? String(email).split('@')[0] : 'Website Lead'),
    Company: (company && String(company).trim()) || 'N/A',
    Lead_Source: source,
  };
  if (email) lead.Email = String(email).slice(0, 100);
  if (phone) lead.Phone = String(phone).slice(0, 30);
  const desc = [subject && `Subject: ${subject}`, message].filter(Boolean).join('\n\n');
  if (desc) lead.Description = desc.slice(0, 2000);
  const res = await zohoApi({ uid, service: 'crm', path: '/crm/v6/Leads', method: 'POST', body: { data: [lead] } });
  const leadId = res?.data?.data?.[0]?.details?.id || null;
  return { leadId };
}
