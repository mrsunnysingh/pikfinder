// src/lib/adminApi.js
// Calls the secure /api/admin endpoint with the signed-in user's Firebase ID
// token. The server checks that token's uid == ADMIN_UID, so only the owner
// gets data back. Everyone else gets a 403.

import { auth } from '../firebase';

async function token() {
  const u = auth?.currentUser;
  if (!u) throw new Error('not_signed_in');
  return u.getIdToken();
}

function raise(res, body) {
  const err = new Error(body.error || `http_${res.status}`);
  err.why = body.why;
  err.status = res.status;
  err.detail = body.detail;
  return err;
}

export async function fetchAdminData() {
  const t = await token();
  const res = await fetch('/api/admin', { method: 'GET', headers: { Authorization: `Bearer ${t}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw raise(res, body);
  return body.data;
}

// Generic POST action helper for the blog CMS.
async function adminPost(action, payload = {}) {
  const t = await token();
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw raise(res, body);
  return body;
}

export async function listPosts() {
  return (await adminPost('blog-list')).posts || [];
}
export async function savePost(post) {
  return (await adminPost('blog-save', post)).post;
}
export async function deletePost(slug) {
  return adminPost('blog-delete', { slug });
}
