// api/admin.js
// Secure admin dashboard data. Only the owner (ADMIN_UID) can call this — we
// verify the caller's Firebase ID token and compare its uid to ADMIN_UID. Reads
// use the admin SDK (bypass Firestore rules), so no collection is exposed to the
// browser. Returns KPIs + recent activity for the /admin page.

import { applyCors, json, guardMethod } from './_lib/http.js';
import { getAdminDb, getAdminAuth } from './_lib/firebaseAdmin.js';

// Firestore Timestamps → ISO strings; pass through ISO strings we already store.
const iso = (v) => {
  try {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
    return null;
  } catch { return null; }
};

async function verifyAdmin(req) {
  const admin = process.env.ADMIN_UID;
  if (!admin) return { ok: false, why: 'no_admin_configured' };
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return { ok: false, why: 'no_token' };
  const auth = getAdminAuth();
  if (!auth) return { ok: false, why: 'auth_not_ready' };
  try {
    const dec = await auth.verifyIdToken(m[1]);
    return dec.uid === admin ? { ok: true } : { ok: false, why: 'not_admin' };
  } catch { return { ok: false, why: 'bad_token' }; }
}

function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}

const slugify = (s) =>
  String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `post-${Date.now()}`;

const asArray = (v) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean)
    : String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

export default async function handler(req, res) {
  applyCors(req, res, { anyOrigin: true });
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (guardMethod(req, res, ['GET', 'POST'])) return;

  const gate = await verifyAdmin(req);
  if (!gate.ok) return json(res, 403, { ok: false, error: 'forbidden', why: gate.why });

  const db = getAdminDb();
  if (!db) return json(res, 501, { ok: false, error: 'db_not_ready' });

  const body = readBody(req);
  const action = (req.method === 'POST' ? body.action : (req.query && req.query.action)) || 'overview';

  // ---- Blog CMS actions (admin SDK writes bypass Firestore rules safely) ----
  if (action === 'blog-list') {
    try {
      const snap = await db.collection('blogPosts').limit(200).get();
      const posts = snap.docs.map((d) => {
        const x = d.data();
        return {
          slug: x.slug || d.id, title: x.title || d.id, description: x.description || '',
          tags: x.tags || [], author: x.author || 'PikFinder', coverImage: x.coverImage || '',
          published: !!x.published, publishedAt: iso(x.publishedAt), updatedAt: iso(x.updatedAt),
          body: x.body || '',
        };
      }).sort((a, b) => String(b.updatedAt || b.publishedAt || '').localeCompare(String(a.updatedAt || a.publishedAt || '')));
      return json(res, 200, { ok: true, posts });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'server_error', detail: String(e?.message || e) });
    }
  }

  if (action === 'blog-save') {
    try {
      const title = String(body.title || '').trim();
      if (!title) return json(res, 400, { ok: false, error: 'title_required' });
      const slug = slugify(body.slug || title);
      const ref = db.collection('blogPosts').doc(slug);
      const existing = await ref.get();
      const nowIso = new Date().toISOString();
      const published = !!body.published;
      const prev = existing.exists ? existing.data() : {};
      const doc = {
        slug,
        title,
        description: String(body.description || '').trim(),
        coverImage: String(body.coverImage || '').trim(),
        author: String(body.author || 'PikFinder').trim(),
        tags: asArray(body.tags),
        body: String(body.body || ''),
        published,
        // Stamp publishedAt the first time it goes public; keep it thereafter.
        publishedAt: published ? (iso(prev.publishedAt) || nowIso) : (iso(prev.publishedAt) || ''),
        updatedAt: nowIso,
      };
      await ref.set(doc, { merge: true });
      return json(res, 200, { ok: true, slug, post: { ...doc, publishedAt: doc.publishedAt, updatedAt: doc.updatedAt } });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'server_error', detail: String(e?.message || e) });
    }
  }

  if (action === 'blog-delete') {
    try {
      const slug = slugify(body.slug || '');
      if (!body.slug) return json(res, 400, { ok: false, error: 'slug_required' });
      await db.collection('blogPosts').doc(slug).delete();
      return json(res, 200, { ok: true, slug });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'server_error', detail: String(e?.message || e) });
    }
  }

  // ---- Default: overview KPIs ----
  const safeGet = (p) => p.get().catch(() => ({ docs: [], size: 0 }));
  try {
    const [users, payments, waitlist, subs, contacts] = await Promise.all([
      safeGet(db.collection('users').limit(1000)),
      safeGet(db.collection('payments').orderBy('createdAt', 'desc').limit(200)),
      safeGet(db.collection('waitlist').orderBy('createdAt', 'desc').limit(100)),
      safeGet(db.collection('subscribers').limit(1000)),
      safeGet(db.collection('contact_messages').orderBy('timestamp', 'desc').limit(50)),
    ]);

    const pays = payments.docs.map((d) => d.data());
    const paid = pays.filter((p) => p.status === 'paid');
    // Revenue by currency (amounts are in the smallest unit — paise/cents).
    const revenue = {};
    for (const p of paid) {
      const cur = (p.currency || 'INR').toUpperCase();
      revenue[cur] = (revenue[cur] || 0) + (Number(p.amount) || 0) / 100;
    }
    Object.keys(revenue).forEach((k) => { revenue[k] = Math.round(revenue[k] * 100) / 100; });

    // Full lists for the clickable drill-down panels.
    const customerList = users.docs.map((d) => {
      const x = d.data();
      return {
        name: x.name || '—', email: x.email || '—', username: x.username || '',
        isPremium: !!x.isPremium, at: iso(x.createdAt),
      };
    });
    const subscriberList = subs.docs.map((d) => {
      const x = d.data();
      return { email: x.email || x.id || '—', at: iso(x.createdAt) };
    });

    return json(res, 200, {
      ok: true,
      data: {
        counts: {
          customers: users.size,
          premium: users.docs.filter((d) => d.data().isPremium).length,
          paidOrders: paid.length,
          waitlist: waitlist.size,
          subscribers: subs.size,
          contacts: contacts.size,
        },
        lists: {
          customers: customerList,
          premium: customerList.filter((c) => c.isPremium),
          subscribers: subscriberList,
        },
        revenue,
        recentPayments: paid.slice(0, 25).map((p) => ({
          email: p.email || '—', amount: (Number(p.amount) || 0) / 100,
          currency: (p.currency || 'INR').toUpperCase(), plan: p.plan || '—',
          at: iso(p.paidAt) || iso(p.createdAt),
        })),
        recentSignups: waitlist.docs.slice(0, 25).map((d) => {
          const x = d.data();
          return { name: x.name || '—', email: x.email || '—', profession: x.profession || '', at: iso(x.createdAt) };
        }),
        recentContacts: contacts.docs.slice(0, 25).map((d) => {
          const x = d.data();
          return { name: x.name || '—', email: x.email || '—', category: x.category || '', message: String(x.message || '').slice(0, 160), at: iso(x.timestamp) };
        }),
      },
    });
  } catch (e) {
    return json(res, 500, { ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}
