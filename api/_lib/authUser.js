// api/_lib/authUser.js
// Resolve the calling user from a Firebase ID token in the Authorization header
// ("Bearer <token>"). Every Zoho endpoint is per-user, so this ties a request
// to a uid the server can trust. Returns { uid, email } or null.
//
// Also supports the OAuth callback path where the token can't ride in a header
// (it's a top-level browser redirect) — there we trust the HMAC-signed `state`
// instead (see crypto.signState/verifyState), not this helper.

import { getAdminAuth } from './firebaseAdmin.js';

// Detailed auth check — returns a reason so endpoints can report WHY a request
// was rejected (helps diagnose 401s without digging through server logs).
export async function authDiagnostic(req) {
  const hdr = req.headers.authorization || req.headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(hdr);
  if (!m) return { ok: false, reason: 'no_bearer_token' };
  const auth = getAdminAuth();
  if (!auth) return { ok: false, reason: 'admin_sdk_unavailable' }; // FIREBASE_SERVICE_ACCOUNT missing/malformed in the environment
  try {
    const decoded = await auth.verifyIdToken(m[1]);
    return { ok: true, uid: decoded.uid, email: decoded.email || '' };
  } catch (e) {
    return { ok: false, reason: 'verify_failed', detail: String((e && e.message) || e).slice(0, 160) };
  }
}

export async function requireUser(req) {
  const d = await authDiagnostic(req);
  return d.ok ? { uid: d.uid, email: d.email } : null;
}
