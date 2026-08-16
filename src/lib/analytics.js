// src/lib/analytics.js
// Fire-and-forget analytics logging. Writes anonymous event docs to Firestore
// under analytics/{bucket}/events/{autoId}. Analytics must NEVER block or break
// the UI, so every write is best-effort and errors are swallowed.
//
// Buckets: 'searches' | 'downloads' | 'tools' | 'waitlist'
// Dashboard reads are admin-gated in firestore.rules (see ANALYTICS_SETUP.md).

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

async function logEvent(bucket, data) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'analytics', bucket, 'events'), {
      ...data,
      createdAt: serverTimestamp(),
      day: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for quick daily grouping
    });
  } catch {
    // Analytics is non-critical; never surface an error to the user.
  }
}

export const trackSearch = (term, provider) => logEvent('searches', { term: String(term || '').slice(0, 120), provider: provider || null });
export const trackDownload = (source, type) => logEvent('downloads', { source: source || null, type: type || 'photo' });
export const trackTool = (slug) => logEvent('tools', { slug: slug || null });
export const trackWaitlist = (profession, feature) => logEvent('waitlist', { profession: profession || null, feature: feature || null });
