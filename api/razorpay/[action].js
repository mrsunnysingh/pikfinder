// api/razorpay/[action].js
// Single serverless function for Razorpay Standard Checkout, routed by the
// dynamic path segment (req.query.action): /api/razorpay/create-order and
// /api/razorpay/verify-payment. Consolidated into ONE function to stay under
// Vercel's Hobby-plan 12-function limit. Matches the project style (raw fetch +
// _lib/http helpers + node crypto) — no SDK needed. Secrets stay server-side.

import crypto from 'crypto';
import { applyCors, json, guardMethod } from '../_lib/http.js';
import { getAdminDb } from '../_lib/firebaseAdmin.js';
import { requireUser } from '../_lib/authUser.js';
import { crmRecordPayment } from '../_lib/zoho.js';

const RZP_BASE = 'https://api.razorpay.com/v1';
const keys = () => ({ id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET });

// Server-authoritative price catalogue. The browser sends a plan id; the server
// decides the amount so a tampered client can't pay ₹1 for Pro. Amounts are in
// the currency's smallest unit (paise for INR, cents for USD). Keep in sync with
// src/pages/Billing.jsx PRICING.
const CATALOG = {
  'creator-pro-monthly': { INR: 19900, USD: 400 },
  'creator-pro-yearly': { INR: 199000, USD: 3900 },
};
const SUPPORTED_CURRENCIES = ['INR', 'USD'];

// Resolve {amount, currency} for a plan, or null if the plan/currency is unknown.
function priceFor(plan, currency) {
  const row = CATALOG[String(plan || '')];
  if (!row) return null;
  const cur = SUPPORTED_CURRENCIES.includes(currency) ? currency : 'INR';
  const amount = row[cur];
  return amount ? { amount, currency: cur } : null;
}

// Best-effort payment tracking in Firestore (admin writes bypass security rules).
// Never blocks the payment flow if Firestore isn't configured.
async function recordPayment(docId, patch) {
  if (!docId) return;
  try {
    const db = getAdminDb();
    if (!db) return;
    await db.collection('payments').doc(String(docId)).set(patch, { merge: true });
  } catch (e) {
    console.error('[razorpay] payment record failed:', e?.message || e);
  }
}

async function getPayment(docId) {
  try {
    const db = getAdminDb();
    if (!db) return null;
    const snap = await db.collection('payments').doc(String(docId)).get();
    return snap.exists ? snap.data() : null;
  } catch { return null; }
}

// Grant Creator Pro to the paying user after a verified payment. The uid was
// captured on the payment record at order-creation time (from the Firebase ID
// token). Admin writes bypass Firestore rules, so no rules change is needed.
// Yearly plans expire in 365 days, monthly in 31; entitlement is best-effort and
// never fails the payment response.
async function grantPremium(orderId) {
  try {
    const db = getAdminDb();
    if (!db) return;
    const rec = await getPayment(orderId);
    const uid = rec?.uid;
    if (!uid) return; // anonymous purchase — nothing to grant
    const plan = String(rec?.plan || rec?.notes?.plan || '');
    // Only recognised, server-priced plans unlock Pro. This prevents a tampered
    // order (unknown plan + tiny amount) from ever granting entitlement.
    if (!CATALOG[plan]) {
      await recordPayment(orderId, { entitlementGranted: false, entitlementError: 'unknown_plan' });
      return;
    }
    const days = plan.includes('yearly') ? 365 : 31;
    const now = Date.now();
    const currentPeriodEnd = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
    await db.collection('users').doc(String(uid)).set({
      isPremium: true,
      subscription: {
        status: 'active', provider: 'razorpay', plan: plan || 'creator-pro',
        currentPeriodEnd, lastOrderId: orderId, updatedAt: new Date().toISOString(),
      },
    }, { merge: true });
    await recordPayment(orderId, { entitlementGranted: true });
  } catch (e) {
    console.error('[razorpay] grantPremium failed:', e?.message || e);
    await recordPayment(orderId, { entitlementGranted: false, entitlementError: String(e?.message || e).slice(0, 140) });
  }
}

// Mirror a verified payment into the connected Zoho CRM (owner's account set via
// ZOHO_OWNER_UID). Fully optional and non-blocking — CRM errors never fail the
// payment; we just note the sync status on the Firestore record.
async function syncToZohoCrm(orderId, paymentId) {
  const ownerUid = process.env.ZOHO_OWNER_UID;
  if (!ownerUid) return;
  try {
    const rec = await getPayment(orderId);
    const r = await crmRecordPayment({
      uid: ownerUid,
      email: rec?.email || null,
      name: rec?.notes?.name || null,
      amountInr: (Number(rec?.amount) || 0) / 100,
      currency: rec?.currency || 'INR',
      plan: rec?.plan || rec?.notes?.plan || null,
      paymentId, orderId,
    });
    await recordPayment(orderId, { crmSynced: true, zohoContactId: r.contactId || null, zohoDealId: r.dealId || null });
  } catch (e) {
    console.error('[razorpay] Zoho CRM sync failed:', e?.message || e);
    await recordPayment(orderId, { crmSynced: false, crmError: String(e?.message || e).slice(0, 140) });
  }
}

async function createOrder(req, res) {
  const { id, secret } = keys();
  if (!id || !secret) {
    return json(res, 501, { ok: false, error: 'not_configured', detail: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server env, then redeploy.' });
  }
  const body = req.body || {};
  const notes = (body.notes && typeof body.notes === 'object') ? body.notes : {};
  const reqCurrency = String(body.currency || 'INR').toUpperCase();
  const plan = notes.plan || body.plan || null;

  // Price is server-authoritative: for a known plan we use the catalogue amount
  // and ignore whatever the client sent (prevents amount tampering). Unknown
  // plans fall back to the client amount with strict validation.
  let amount, currency;
  const priced = priceFor(plan, reqCurrency);
  if (priced) {
    amount = priced.amount;
    currency = priced.currency;
  } else if (plan) {
    // A plan was named but isn't in the catalogue — reject rather than trust a
    // client-supplied price for what claims to be a plan purchase.
    return json(res, 400, { ok: false, error: 'unknown_plan', detail: `Unknown plan "${plan}".` });
  } else {
    // No plan: a generic order. Validate the client amount strictly. This path
    // never grants Pro (grantPremium requires a known catalogue plan).
    amount = Math.round(Number(body.amount));
    currency = SUPPORTED_CURRENCIES.includes(reqCurrency) ? reqCurrency : 'INR';
    if (!Number.isFinite(amount) || amount < 100) {
      return json(res, 400, { ok: false, error: 'invalid_amount', detail: 'amount must be an integer of at least 100 (smallest currency unit).' });
    }
  }
  const receipt = String(body.receipt || `rcpt_${Date.now()}`).slice(0, 40);

  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  let data;
  try {
    const r = await fetch(`${RZP_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    data = await r.json().catch(() => ({}));
    if (r.status === 401) return json(res, 401, { ok: false, error: 'auth_failed', detail: 'Razorpay rejected the API keys.' });
    if (!r.ok || !data.id) {
      return json(res, 500, { ok: false, error: 'order_failed', detail: (data && data.error && data.error.description) || `HTTP ${r.status}` });
    }
  } catch (e) {
    return json(res, 500, { ok: false, error: 'order_failed', detail: String(e?.message || e) });
  }

  const user = await requireUser(req); // {uid,email} or null
  await recordPayment(data.id, {
    orderId: data.id, amount, currency, receipt,
    plan: plan || null, notes,
    uid: user?.uid || null, email: user?.email || notes.email || null,
    status: 'created', provider: 'razorpay', createdAt: new Date().toISOString(),
  });

  // keyId is the publishable id — safe to return so the browser can open checkout.
  return json(res, 200, { ok: true, orderId: data.id, amount: data.amount, currency: data.currency, keyId: id });
}

async function verifyPayment(req, res) {
  const { secret } = keys();
  if (!secret) return json(res, 501, { ok: false, error: 'not_configured' });

  const b = req.body || {};
  const orderId = b.razorpay_order_id;
  const paymentId = b.razorpay_payment_id;
  const signature = b.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return json(res, 400, { ok: false, error: 'missing_fields' });
  }

  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  let valid = false;
  try {
    const a = Buffer.from(expected);
    const bsig = Buffer.from(String(signature));
    valid = a.length === bsig.length && crypto.timingSafeEqual(a, bsig);
  } catch { valid = false; }

  if (!valid) {
    await recordPayment(orderId, { status: 'signature_mismatch', paymentId, verifiedAt: new Date().toISOString() });
    return json(res, 400, { ok: false, error: 'invalid_signature' });
  }

  await recordPayment(orderId, { status: 'paid', paymentId, signatureVerified: true, paidAt: new Date().toISOString() });
  await grantPremium(orderId); // unlock Creator Pro for the paying user
  await syncToZohoCrm(orderId, paymentId); // optional; no-op unless ZOHO_OWNER_UID is set
  return json(res, 200, { ok: true, orderId, paymentId });
}

// Public licence check for external surfaces (e.g. the Figma plugin). The "key"
// is the user's Firebase uid, which premium users copy from their PikFinder
// Settings. We only ever return a boolean entitlement — never any personal data.
async function verifyLicense(req, res) {
  const key = String((req.body && (req.body.key || req.body.license)) || req.query.key || '').trim();
  if (!key || key.length > 128) return json(res, 200, { ok: true, pro: false });
  try {
    const db = getAdminDb();
    if (!db) return json(res, 200, { ok: true, pro: false });
    const snap = await db.collection('users').doc(key).get();
    if (!snap.exists) return json(res, 200, { ok: true, pro: false });
    const u = snap.data() || {};
    const end = u?.subscription?.currentPeriodEnd ? Date.parse(u.subscription.currentPeriodEnd) : 0;
    const pro = !!u.isPremium && (!end || end > Date.now());
    return json(res, 200, { ok: true, pro, plan: (u?.subscription?.plan) || null, expires: (u?.subscription?.currentPeriodEnd) || null });
  } catch (e) {
    console.error('[razorpay] verifyLicense failed:', e?.message || e);
    return json(res, 200, { ok: true, pro: false });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECURRING (auto-renew) via Razorpay Subscriptions
// Needs, in the Razorpay dashboard: Subscriptions enabled, two Plans created
// (monthly + yearly), and a webhook pointing at /api/razorpay/webhook. Env vars:
//   RAZORPAY_PLAN_MONTHLY, RAZORPAY_PLAN_YEARLY, RAZORPAY_WEBHOOK_SECRET
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_IDS = () => ({ monthly: process.env.RAZORPAY_PLAN_MONTHLY, yearly: process.env.RAZORPAY_PLAN_YEARLY });
const planKindFrom = (p) => (String(p || '').includes('yearly') ? 'yearly' : 'monthly');
const daysFor = (kind) => (kind === 'yearly' ? 365 : 31);

// Map a Razorpay subscription id back to the user who started it (saved at
// create-subscription time), so webhooks can find the right account.
async function mapSubscription(subId, data) {
  try { const db = getAdminDb(); if (db) await db.collection('subscriptions').doc(String(subId)).set(data, { merge: true }); } catch (e) { /* non-fatal */ }
}
async function getSubscriptionMap(subId) {
  try { const db = getAdminDb(); if (!db) return null; const s = await db.collection('subscriptions').doc(String(subId)).get(); return s.exists ? s.data() : null; } catch { return null; }
}

// Write Pro entitlement to a user, extending to `periodEndISO` (or now + days).
async function grantToUser(uid, { plan, subId, periodEndISO, status = 'active', cancelAtPeriodEnd = false }) {
  const db = getAdminDb(); if (!db || !uid) return;
  const kind = planKindFrom(plan);
  const end = periodEndISO || new Date(Date.now() + daysFor(kind) * 864e5).toISOString();
  await db.collection('users').doc(String(uid)).set({
    isPremium: status === 'active' || status === 'authenticated',
    subscription: {
      status, provider: 'razorpay', plan: plan || `creator-pro-${kind}`,
      currentPeriodEnd: end, razorpaySubscriptionId: subId || null,
      cancelAtPeriodEnd, updatedAt: new Date().toISOString(),
    },
  }, { merge: true });
}

async function createSubscription(req, res) {
  const { id, secret } = keys();
  if (!id || !secret) return json(res, 501, { ok: false, error: 'not_configured', detail: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
  const kind = planKindFrom((req.body || {}).plan);
  const planId = PLAN_IDS()[kind];
  if (!planId) return json(res, 501, { ok: false, error: 'plan_not_configured', detail: `Create a ${kind} Plan in Razorpay and set RAZORPAY_PLAN_${kind.toUpperCase()}.` });

  const user = await requireUser(req);
  if (!user?.uid) return json(res, 401, { ok: false, error: 'auth_required', detail: 'Sign in to subscribe.' });

  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const totalCount = kind === 'yearly' ? 10 : 120; // long-running; user can cancel anytime
  let data;
  try {
    const r = await fetch(`${RZP_BASE}/subscriptions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ plan_id: planId, total_count: totalCount, quantity: 1, customer_notify: 1, notes: { uid: user.uid, plan: `creator-pro-${kind}` } }),
    });
    data = await r.json().catch(() => ({}));
    if (!r.ok || !data.id) return json(res, 500, { ok: false, error: 'subscription_failed', detail: (data && data.error && data.error.description) || `HTTP ${r.status}` });
  } catch (e) { return json(res, 500, { ok: false, error: 'subscription_failed', detail: String(e?.message || e) }); }

  await mapSubscription(data.id, { uid: user.uid, email: user.email || null, plan: `creator-pro-${kind}`, createdAt: new Date().toISOString() });
  return json(res, 200, { ok: true, subscriptionId: data.id, keyId: id });
}

async function verifySubscription(req, res) {
  const { secret } = keys();
  if (!secret) return json(res, 501, { ok: false, error: 'not_configured' });
  const b = req.body || {};
  const paymentId = b.razorpay_payment_id, subId = b.razorpay_subscription_id, signature = b.razorpay_signature;
  if (!paymentId || !subId || !signature) return json(res, 400, { ok: false, error: 'missing_fields' });

  // Razorpay subscription signature = HMAC(payment_id + '|' + subscription_id).
  const expected = crypto.createHmac('sha256', secret).update(`${paymentId}|${subId}`).digest('hex');
  let valid = false;
  try { const a = Buffer.from(expected), c = Buffer.from(String(signature)); valid = a.length === c.length && crypto.timingSafeEqual(a, c); } catch { valid = false; }
  if (!valid) return json(res, 400, { ok: false, error: 'signature_mismatch' });

  const map = await getSubscriptionMap(subId);
  const user = await requireUser(req);
  const uid = map?.uid || user?.uid;
  const plan = map?.plan || 'creator-pro-monthly';
  if (uid) await grantToUser(uid, { plan, subId, status: 'active' });
  return json(res, 200, { ok: true, subscriptionId: subId });
}

// Razorpay → us. Verifies the webhook signature, then keeps entitlement in sync
// on every auto-charge / cancellation. Access always runs until currentPeriodEnd.
async function handleWebhook(req, res) {
  const wsecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!wsecret) return json(res, 501, { ok: false, error: 'webhook_not_configured' });
  const raw = req.rawBody || '';
  const sig = req.headers['x-razorpay-signature'] || '';
  const expected = crypto.createHmac('sha256', wsecret).update(raw).digest('hex');
  let valid = false;
  try { const a = Buffer.from(expected), c = Buffer.from(String(sig)); valid = a.length === c.length && crypto.timingSafeEqual(a, c); } catch { valid = false; }
  if (!valid) return json(res, 400, { ok: false, error: 'bad_signature' });

  let event;
  try { event = JSON.parse(raw); } catch { return json(res, 400, { ok: false, error: 'bad_json' }); }
  const type = event?.event || '';
  const subEntity = event?.payload?.subscription?.entity;
  const subId = subEntity?.id;

  try {
    if (subId) {
      const map = await getSubscriptionMap(subId);
      const uid = map?.uid;
      const plan = map?.plan || 'creator-pro-monthly';
      const periodEndISO = subEntity?.current_end ? new Date(subEntity.current_end * 1000).toISOString() : null;
      if (uid) {
        if (type === 'subscription.charged' || type === 'subscription.activated' || type === 'subscription.authenticated' || type === 'subscription.resumed') {
          await grantToUser(uid, { plan, subId, periodEndISO, status: 'active' });
        } else if (type === 'subscription.cancelled' || type === 'subscription.completed' || type === 'subscription.halted' || type === 'subscription.paused') {
          // Keep access until the current period ends; just flag it.
          await grantToUser(uid, { plan, subId, periodEndISO, status: type.split('.')[1], cancelAtPeriodEnd: true });
        }
      }
    }
  } catch (e) { console.error('[razorpay] webhook handling failed:', e?.message || e); }

  // Always 200 so Razorpay doesn't retry a handled event.
  return json(res, 200, { ok: true });
}

// Read the raw request body (bodyParser is disabled below so the webhook can
// verify its signature). We JSON-parse it into req.body for the other actions.
function readRawBody(req) {
  return new Promise((resolve) => {
    let d = ''; req.on('data', (c) => { d += c; }); req.on('end', () => resolve(d)); req.on('error', () => resolve(''));
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (guardMethod(req, res, ['POST'])) return;

  const raw = await readRawBody(req);
  req.rawBody = raw;
  try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }

  const action = String(req.query.action || '');
  try {
    if (action === 'create-order') return await createOrder(req, res);
    if (action === 'verify-payment') return await verifyPayment(req, res);
    if (action === 'verify-license') return await verifyLicense(req, res);
    if (action === 'create-subscription') return await createSubscription(req, res);
    if (action === 'verify-subscription') return await verifySubscription(req, res);
    if (action === 'webhook') return await handleWebhook(req, res);
    return json(res, 404, { ok: false, error: 'unknown_action', action });
  } catch (e) {
    console.error('[razorpay] fatal:', e?.message || e);
    return json(res, 500, { ok: false, error: 'server_error' });
  }
}
