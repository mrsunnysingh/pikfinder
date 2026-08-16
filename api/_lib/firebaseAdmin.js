// api/_lib/firebaseAdmin.js
// Lazy Firebase Admin init, used ONLY by the Stripe webhook to set a user's
// premium status server-side. Requires FIREBASE_SERVICE_ACCOUNT (the full service
// account JSON, as a single-line string) in the server environment.
//
// If the service account isn't configured, getAdminDb() returns null and callers
// log a clear warning instead of crashing.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let db = null;
let initTried = false;

// Ensure the Admin app is initialized once. Returns true on success.
function ensureApp() {
  if (getApps().length) return true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return false;
  try {
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    initializeApp({ credential: cert(serviceAccount) });
    return true;
  } catch (err) {
    console.error('[admin] Firebase Admin init failed:', err?.message || err);
    return false;
  }
}

export function getAdminDb() {
  if (initTried) return db;
  initTried = true;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('[admin] FIREBASE_SERVICE_ACCOUNT not set — server DB features disabled.');
    return null;
  }
  if (!ensureApp()) return null;
  db = getFirestore();
  return db;
}

// Firebase Auth admin (for verifying client ID tokens). Returns null if unconfigured.
export function getAdminAuth() {
  if (!ensureApp()) return null;
  try {
    return getAuth();
  } catch (err) {
    console.error('[admin] getAuth failed:', err?.message || err);
    return null;
  }
}
