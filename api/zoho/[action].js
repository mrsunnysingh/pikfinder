// api/zoho/[action].js
// Single serverless function that routes ALL Zoho endpoints by the dynamic path
// segment (req.query.action) — /api/zoho/connect, /callback, /status, /test,
// /disconnect, /modules, /fields, /records. Consolidated into one function to
// stay under Vercel's Hobby-plan limit (12 functions). URLs are unchanged, so
// the client and the Zoho OAuth redirect URI keep working as-is.

import { applyCors, json, guardMethod, clampInt } from '../_lib/http.js';
import { requireUser, authDiagnostic } from '../_lib/authUser.js';
import { getAdminAuth } from '../_lib/firebaseAdmin.js';
const hasServiceAccount = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
import { signState, verifyState } from '../_lib/crypto.js';
import {
  buildAuthUrl, exchangeCode, saveConnection, getStatus, testRead, touchSync,
  deleteConnection, listModules, listFields, listRecords, SERVICES,
  isSupportedService, zohoConfig, normalizeDc, crmCreateLead,
  listForms, creatorAddRecord, creatorUploadFile,
} from '../_lib/zoho.js';

export default async function handler(req, res) {
  const action = String(req.query.action || '');
  try {
    applyCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    const routes = { connect, callback, status, test, disconnect, modules, fields, records, lead, forms, 'creator-attach': creatorAttach };
    const fn = routes[action];
    if (!fn) return json(res, 404, { ok: false, error: 'unknown_action', action });
    return await fn(req, res);
  } catch (e) {
    // Never crash the function — log the real cause (visible in Vercel logs) and
    // respond gracefully. Redirect flows bounce back; JSON endpoints return 500.
    console.error(`[zoho:${action}]`, e && (e.stack || e.message || e));
    if (res.headersSent) return;
    const appUrl = process.env.APP_URL || '';
    if (action === 'connect' || action === 'callback') {
      res.writeHead(302, { Location: `${appUrl}/business?zoho_error=server_error` });
      return res.end();
    }
    return json(res, 500, { ok: false, error: 'server_error', detail: String((e && e.message) || e) });
  }
}

// ── Public: capture ANY website form submission into the owner's Zoho CRM ─────
// No login required (visitors are anonymous). Writes to the business owner's
// connected CRM, gated by ZOHO_OWNER_UID. Best-effort — never fails the form.
async function lead(req, res) {
  if (guardMethod(req, res, ['POST'])) return;
  const ownerUid = process.env.ZOHO_OWNER_UID;
  if (!ownerUid) return json(res, 200, { ok: false, skipped: 'no_owner' });
  const b = req.body || {};
  // Require at least an email or a name so we don't push empty leads.
  if (!b.email && !b.name) return json(res, 400, { ok: false, error: 'missing_fields' });
  try {
    const { leadId } = await crmCreateLead({
      uid: ownerUid,
      name: b.name, email: b.email, phone: b.phone, company: b.company,
      subject: b.subject, message: b.message,
      source: b.source || 'PikFinder Website',
    });
    return json(res, 200, { ok: true, leadId });
  } catch (e) {
    console.error('[zoho:lead]', e?.message || e);
    return json(res, 200, { ok: false, error: 'crm_failed' }); // don't block the form UX
  }
}

// ── OAuth redirect flow ──────────────────────────────────────────────────────
async function connect(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const cfg = zohoConfig();
  const service = String(req.query.service || '');
  const dc = normalizeDc(req.query.dc || 'us');
  const idToken = String(req.query.token || '');
  // On error, bounce back to /business with a readable code (not raw JSON).
  if (!isSupportedService(service)) return bounce(res, cfg.appUrl, { zoho_error: 'bad_service' });
  if (cfg.missing.length) return bounce(res, cfg.appUrl, { zoho_error: 'not_configured' });
  const auth = getAdminAuth();
  if (!auth) return bounce(res, cfg.appUrl, { zoho_error: 'server_not_ready' });
  let uid;
  try { uid = (await auth.verifyIdToken(idToken)).uid; }
  catch { return bounce(res, cfg.appUrl, { zoho_error: 'sign_in_required' }); }
  const state = signState({ uid, service, dc });
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: buildAuthUrl({ service, dc, state }) });
  res.end();
}

function bounce(res, appUrl, params) {
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: `${appUrl || ''}/business?${new URLSearchParams(params).toString()}` });
  res.end();
}
async function callback(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const cfg = zohoConfig();
  const { code, state, error } = req.query;
  const dc = normalizeDc(req.query.location || req.query['accounts-server'] || 'us');
  if (error) return bounce(res, cfg.appUrl, { zoho_error: String(error) });
  const st = verifyState(state);
  if (!st || !st.uid || !st.service || !SERVICES[st.service]) return bounce(res, cfg.appUrl, { zoho_error: 'bad_state' });
  if (!code) return bounce(res, cfg.appUrl, { zoho_error: 'no_code' });
  try {
    const tok = await exchangeCode({ code: String(code), dc });
    if (!tok.refresh_token) return bounce(res, cfg.appUrl, { zoho_error: 'no_refresh_token', service: st.service });
    await saveConnection({
      uid: st.uid, service: st.service, dc, apiDomain: tok.api_domain || '',
      scopes: tok.scope ? String(tok.scope).split(',') : SERVICES[st.service].scopes,
      refreshToken: tok.refresh_token,
    });
    return bounce(res, cfg.appUrl, { connected: st.service });
  } catch (e) {
    return bounce(res, cfg.appUrl, { zoho_error: String(e.message || 'exchange_failed'), service: st.service });
  }
}

// ── Authenticated JSON endpoints ─────────────────────────────────────────────
async function status(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const cfg = zohoConfig();
  const auth = await authDiagnostic(req);
  if (!auth.ok) {
    // Surface WHY the session was rejected + config health (readable at the plain
    // URL). adminReady=false means FIREBASE_SERVICE_ACCOUNT is missing/malformed.
    return json(res, 401, {
      ok: false, error: 'unauthenticated', reason: auth.reason, detail: auth.detail,
      configured: cfg.missing.length === 0, missing: cfg.missing,
      serviceAccountSet: hasServiceAccount(), adminReady: Boolean(getAdminAuth()),
    });
  }
  const user = { uid: auth.uid, email: auth.email };
  const one = req.query.service ? String(req.query.service) : null;
  if (one && !isSupportedService(one)) return json(res, 400, { ok: false, error: 'bad_service' });
  try {
    const services = one ? [one] : Object.keys(SERVICES);
    const out = {};
    for (const s of services) out[s] = await getStatus({ uid: user.uid, service: s });
    return json(res, 200, { ok: true, configured: cfg.missing.length === 0, services: out });
  } catch (e) { return json(res, 500, { ok: false, error: String(e.message || e) }); }
}

async function test(req, res) {
  if (guardMethod(req, res, ['POST'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const service = String(req.query.service || (req.body && req.body.service) || '');
  if (!isSupportedService(service)) return json(res, 400, { ok: false, error: 'bad_service' });
  try {
    const result = await testRead({ uid: user.uid, service });
    await touchSync({ uid: user.uid, service });
    return json(res, 200, { ok: true, ...result });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : msg === 'unauthorized' ? 401 : 502, { ok: false, error: msg });
  }
}

async function disconnect(req, res) {
  if (guardMethod(req, res, ['POST'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const service = String(req.query.service || (req.body && req.body.service) || '');
  if (!isSupportedService(service)) return json(res, 400, { ok: false, error: 'bad_service' });
  try {
    await deleteConnection({ uid: user.uid, service });
    return json(res, 200, { ok: true, service, connected: false });
  } catch (e) { return json(res, 500, { ok: false, error: String(e.message || e) }); }
}

async function modules(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const service = String(req.query.service || '');
  if (!isSupportedService(service)) return json(res, 400, { ok: false, error: 'bad_service' });
  try {
    const list = await listModules({ uid: user.uid, service });
    return json(res, 200, { ok: true, service, modules: list }, { cache: 'private, max-age=300' });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : 502, { ok: false, error: msg });
  }
}

async function fields(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const service = String(req.query.service || '');
  const module = String(req.query.module || '');
  if (!isSupportedService(service)) return json(res, 400, { ok: false, error: 'bad_service' });
  if (!module) return json(res, 400, { ok: false, error: 'module_required' });
  try {
    const list = await listFields({ uid: user.uid, service, module });
    return json(res, 200, { ok: true, service, module, fields: list }, { cache: 'private, max-age=300' });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : 502, { ok: false, error: msg });
  }
}

async function records(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const service = String(req.query.service || '');
  const module = String(req.query.module || '');
  if (!isSupportedService(service)) return json(res, 400, { ok: false, error: 'bad_service' });
  if (!module) return json(res, 400, { ok: false, error: 'module_required' });
  const page = clampInt(req.query.page, { min: 1, max: 500, fallback: 1 });
  const perPage = clampInt(req.query.per_page, { min: 1, max: 200, fallback: 50 });
  const fieldsParam = req.query.fields ? String(req.query.fields).slice(0, 2000) : undefined;
  try {
    const result = await listRecords({ uid: user.uid, service, module, page, perPage, fields: fieldsParam });
    touchSync({ uid: user.uid, service }).catch(() => {});
    return json(res, 200, { ok: true, service, module, ...result });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : msg === 'unauthorized' ? 401 : 502, { ok: false, error: msg });
  }
}

// List a Creator app's forms (for the "create new record" path).
async function forms(req, res) {
  if (guardMethod(req, res, ['GET'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const app = String(req.query.app || '');
  if (!app) return json(res, 400, { ok: false, error: 'app_required' });
  try {
    const list = await listForms({ uid: user.uid, service: 'creator', app });
    return json(res, 200, { ok: true, forms: list }, { cache: 'private, max-age=300' });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : 502, { ok: false, error: msg });
  }
}

// Attach a generated document to a Zoho Creator record's file field.
// body: { owner, module: "app/report", field, mode: 'existing'|'new',
//         recordId?, form?, createData?, filename, base64, contentType }
async function creatorAttach(req, res) {
  if (guardMethod(req, res, ['POST'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'unauthenticated' });
  const b = req.body || {};
  const owner = String(b.owner || '').trim();
  const field = String(b.field || '').trim();
  const [app, report] = String(b.module || '').split('/');
  if (!owner || !field || !app || !report || !b.base64) {
    return json(res, 400, { ok: false, error: 'missing_fields' });
  }
  try {
    let recordId = b.recordId;
    if (b.mode === 'new') {
      if (!b.form) return json(res, 400, { ok: false, error: 'form_required' });
      const add = await creatorAddRecord({ uid: user.uid, owner, app, form: b.form, data: b.createData || {} });
      recordId = add.recordId;
      if (!recordId) return json(res, 502, { ok: false, error: 'create_failed', detail: add.data });
    }
    if (!recordId) return json(res, 400, { ok: false, error: 'record_required' });
    const up = await creatorUploadFile({
      uid: user.uid, owner, app, report, recordId, field,
      filename: b.filename, base64: String(b.base64), contentType: b.contentType,
    });
    if (up.status >= 400) return json(res, 502, { ok: false, error: 'upload_failed', detail: up.data });
    touchSync({ uid: user.uid, service: 'creator' }).catch(() => {});
    return json(res, 200, { ok: true, recordId, result: up.data });
  } catch (e) {
    const msg = String(e.message || e);
    return json(res, msg === 'not_connected' ? 409 : msg === 'unauthorized' ? 401 : 502, { ok: false, error: msg });
  }
}
