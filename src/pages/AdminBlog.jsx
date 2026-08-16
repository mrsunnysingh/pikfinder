// src/pages/AdminBlog.jsx
// Blog CMS inside the admin dashboard. Lists posts (drafts + published), lets the
// owner create/edit/publish/delete. Everything saves to Firestore `blogPosts`
// through the secure /api/admin endpoint. For these posts to appear on the public
// blog, set VITE_BLOG_SOURCE=firebase in Vercel.

import React, { useEffect, useState } from 'react';
import { Plus, PencilSimple, Trash, ArrowLeft, Eye, EyeSlash, FloppyDisk, ArrowClockwise, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react';
import { listPosts, savePost, deletePost } from '../lib/adminApi';
import { searchMedia } from '../lib/mediaApi';

// Find a relevant landscape cover photo from the providers (Pexels first, then
// any). Returns an image URL, or '' if nothing was found.
async function findCover({ title, tags }) {
  const q = (Array.isArray(tags) && tags.length ? tags.slice(0, 3).join(' ') : String(title || '')).trim();
  if (!q) return '';
  const pick = (r) => {
    const hit = (r && r.results ? r.results : []).find((x) => x.preview || x.thumbnail || x.originalUrl);
    return hit ? (hit.preview || hit.originalUrl || hit.thumbnail) : '';
  };
  try {
    let url = pick(await searchMedia(q, { perPage: 15, orientation: 'landscape', sources: 'pexels' }));
    if (!url) url = pick(await searchMedia(q, { perPage: 15, orientation: 'landscape' }));
    return url;
  } catch { return ''; }
}

const BLANK = { title: '', slug: '', description: '', tags: '', author: 'PikFinder', coverImage: '', body: '', published: false };

const fmt = (s) => { try { return s ? new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'; } catch { return '—'; } };

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null); // null = list view; object = editor
  const [saving, setSaving] = useState(false);
  const [finding, setFinding] = useState(false);
  const [notice, setNotice] = useState('');

  const tagList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

  const load = async () => {
    setLoading(true); setErr(null);
    try { setPosts(await listPosts()); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ ...BLANK });
  const startEdit = (p) => setEditing({
    ...BLANK, ...p,
    tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
  });

  const onSave = async (publishOverride) => {
    if (!editing.title.trim()) { setNotice('Please add a title first.'); return; }
    setSaving(true); setNotice('');
    try {
      const payload = { ...editing };
      if (typeof publishOverride === 'boolean') payload.published = publishOverride;
      // Auto-find a relevant cover photo from the providers if none was set.
      if (!String(payload.coverImage || '').trim()) {
        const url = await findCover({ title: payload.title, tags: tagList(payload.tags) });
        if (url) payload.coverImage = url;
      }
      await savePost(payload);
      setEditing(null);
      await load();
    } catch (e) {
      setNotice(`Save failed: ${e.detail || e.message}`);
    } finally { setSaving(false); }
  };

  const togglePublish = async (p) => {
    setNotice('');
    try {
      await savePost({ ...p, tags: p.tags, published: !p.published });
      await load();
    } catch (e) { setNotice(`Could not update: ${e.detail || e.message}`); }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setNotice('');
    try { await deletePost(p.slug); await load(); }
    catch (e) { setNotice(`Delete failed: ${e.detail || e.message}`); }
  };

  // ---------- Editor view ----------
  if (editing) {
    const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));
    return (
      <div className="admin-blog">
        <div className="admin-blog-head">
          <button className="btn btn-secondary" onClick={() => setEditing(null)}><ArrowLeft size={16} /> Back</button>
          <div className="admin-blog-actions">
            <button className="btn btn-secondary" disabled={saving} onClick={() => onSave(false)}><FloppyDisk size={16} /> Save draft</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => onSave(true)}><Eye size={16} /> {saving ? 'Saving…' : 'Publish'}</button>
          </div>
        </div>
        {notice && <div className="admin-notice">{notice}</div>}

        <div className="admin-form">
          <label className="admin-field">
            <span>Title *</span>
            <input value={editing.title} onChange={(e) => set('title', e.target.value)} placeholder="How to make a free certificate online" />
          </label>
          <label className="admin-field">
            <span>URL slug <em>(leave blank to auto-generate)</em></span>
            <input value={editing.slug} onChange={(e) => set('slug', e.target.value)} placeholder="free-certificate-online" />
          </label>
          <label className="admin-field">
            <span>Short description <em>(shown in listings & search)</em></span>
            <textarea rows={2} value={editing.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div className="admin-field-row">
            <label className="admin-field">
              <span>Tags <em>(comma separated)</em></span>
              <input value={editing.tags} onChange={(e) => set('tags', e.target.value)} placeholder="tutorial, design" />
            </label>
            <label className="admin-field">
              <span>Author</span>
              <input value={editing.author} onChange={(e) => set('author', e.target.value)} />
            </label>
          </div>
          <div className="admin-field">
            <span>
              Cover image <em>(leave blank to auto-find on save)</em>
            </span>
            <div className="admin-cover-row">
              <input value={editing.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="Paste an image URL, or find one →" />
              <button
                type="button"
                className="btn btn-secondary admin-cover-gen"
                disabled={finding}
                onClick={async () => {
                  if (!editing.title.trim()) { setNotice('Add a title (or tags) first, then find a cover.'); return; }
                  setFinding(true); setNotice('');
                  const url = await findCover({ title: editing.title, tags: tagList(editing.tags) });
                  setFinding(false);
                  if (url) set('coverImage', url);
                  else setNotice('No matching photo found — try different tags, or paste a URL.');
                }}
              >
                {finding ? <><CircleNotch size={16} className="admin-spin" /> Finding…</> : <><MagnifyingGlass size={16} /> Find image</>}
              </button>
            </div>
            {editing.coverImage && (
              <div className="admin-cover-preview">
                <img src={editing.coverImage} alt="Cover preview" />
                <button type="button" className="admin-cover-clear" onClick={() => set('coverImage', '')}>Remove</button>
              </div>
            )}
          </div>
          <label className="admin-field">
            <span>Body <em>(Markdown — # heading, **bold**, - list, [link](url))</em></span>
            <textarea className="admin-body" rows={16} value={editing.body} onChange={(e) => set('body', e.target.value)} placeholder="Write your post here…" />
          </label>
        </div>
      </div>
    );
  }

  // ---------- List view ----------
  return (
    <div className="admin-blog">
      <div className="admin-blog-head">
        <div>
          <h2 style={{ margin: 0 }}>Blog posts</h2>
          <p className="admin-sub">Write, publish, and manage your blog.</p>
        </div>
        <div className="admin-blog-actions">
          <button className="btn btn-secondary" onClick={load}><ArrowClockwise size={16} /> Refresh</button>
          <button className="btn btn-primary" onClick={startNew}><Plus size={16} /> New post</button>
        </div>
      </div>
      {notice && <div className="admin-notice">{notice}</div>}

      {loading ? (
        <div className="admin-empty"><div className="admin-spinner" /> Loading posts…</div>
      ) : err ? (
        <div className="admin-notice">Could not load posts: {err.detail || err.message}</div>
      ) : posts.length === 0 ? (
        <div className="admin-empty">No posts yet. Click <strong>New post</strong> to write your first one.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.slug}>
                  <td>
                    <strong>{p.title}</strong>
                    <div className="admin-slug">/blog/{p.slug}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.published ? 'is-live' : 'is-draft'}`}>
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{fmt(p.updatedAt || p.publishedAt)}</td>
                  <td className="admin-row-actions">
                    <button className="icon-btn-small" title="Edit" onClick={() => startEdit(p)}><PencilSimple /></button>
                    <button className="icon-btn-small" title={p.published ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(p)}>
                      {p.published ? <EyeSlash /> : <Eye />}
                    </button>
                    <button className="icon-btn-small danger" title="Delete" onClick={() => onDelete(p)}><Trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
