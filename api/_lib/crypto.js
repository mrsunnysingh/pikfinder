// api/_lib/crypto.js
// Server-only cryptography for the Zoho connector:
//   • AES-256-GCM encrypt/decrypt for refresh tokens at rest (Firestore).
//   • HMAC-signed OAuth `state` so the callback can trust uid + service and
//     resist CSRF, without a server session store.
//
// The key comes from ZOHO_TOKEN_KEY (server env only). Accepts either a 64-char
// hex string (32 bytes) or any passphrase (hashed to 32 bytes via SHA-256).
// If the key is missing, functions throw a clear error — callers surface it as
// "connector not configured" rather than leaking a stack trace.

import crypto from 'node:crypto';

function keyBytes() {
  const raw = process.env.ZOHO_TOKEN_KEY;
  if (!raw) throw new Error('ZOHO_TOKEN_KEY is not set (server env).');
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  // Derive a stable 32-byte key from an arbitrary passphrase.
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

/** Encrypt a UTF-8 string → compact "v1:iv:tag:ciphertext" (all base64url). */
export function encrypt(plaintext) {
  const key = keyBytes();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', b64u(iv), b64u(tag), b64u(ct)].join(':');
}

/** Decrypt a value produced by encrypt(). Throws on tamper / wrong key. */
export function decrypt(token) {
  const key = keyBytes();
  const [v, ivB, tagB, ctB] = String(token).split(':');
  if (v !== 'v1' || !ivB || !tagB || !ctB) throw new Error('bad ciphertext format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ub64(ivB));
  decipher.setAuthTag(ub64(tagB));
  return Buffer.concat([decipher.update(ub64(ctB)), decipher.final()]).toString('utf8');
}

/** Sign an OAuth state object (adds a timestamp). Returns base64url(payload).sig. */
export function signState(obj) {
  const key = keyBytes();
  const payload = b64u(Buffer.from(JSON.stringify({ ...obj, t: Date.now() }), 'utf8'));
  const sig = b64u(crypto.createHmac('sha256', key).update(payload).digest());
  return `${payload}.${sig}`;
}

/** Verify a signed state (default 15-min TTL). Returns the object or null. */
export function verifyState(state, maxAgeMs = 15 * 60 * 1000) {
  try {
    const key = keyBytes();
    const [payload, sig] = String(state).split('.');
    if (!payload || !sig) return null;
    const expect = b64u(crypto.createHmac('sha256', key).update(payload).digest());
    // Constant-time compare.
    const a = Buffer.from(sig), b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const obj = JSON.parse(ub64(payload).toString('utf8'));
    if (!obj.t || Date.now() - obj.t > maxAgeMs) return null;
    return obj;
  } catch {
    return null;
  }
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const ub64 = (s) => Buffer.from(s, 'base64url');
