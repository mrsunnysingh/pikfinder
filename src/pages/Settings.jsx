import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { User, Camera, Trash, Bell, Warning, Check, GlobeSimple, Moon, Sun, PuzzlePiece, Copy } from '@phosphor-icons/react';
import ProviderStatus from '../components/ProviderStatus';

const AVATAR_STYLES = ['thumbs', 'bottts', 'avataaars', 'notionists', 'shapes', 'fun-emoji'];


function Toggle({ checked, onChange }) {
  return (
    <button className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className="switch-knob" />
    </button>
  );
}

export default function Settings() {
  const { user, theme, toggleTheme, updateUserProfile, saveExtras, claimUsername, deleteAccount } = useContext(AppContext);
  const toast = useToast();
  const [usernameErr, setUsernameErr] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [newsletter, setNewsletter] = useState(!!user?.newsletter);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const seed = (user?.email || 'pikfinder').split('@')[0];
  const presets = AVATAR_STYLES.map(s => `https://api.dicebear.com/7.x/${s}/svg?seed=${encodeURIComponent(seed)}`);
  const initial = (name || 'U').charAt(0).toUpperCase();

  const saveProfile = async () => {
    setSavingProfile(true);
    setUsernameErr('');
    try {
      await updateUserProfile({ name: name.trim() || 'User', photoURL });
      const wanted = username.trim();
      if (wanted) {
        try {
          const claimed = await claimUsername(wanted);
          setUsername(claimed);
        } catch (err) {
          const code = String(err?.code || '');
          const msg = code.includes('taken') ? 'That username is already taken — try another.'
            : code.includes('too-short') ? 'Username must be at least 3 characters.'
            : code.includes('invalid') ? 'Use only letters, numbers, and underscores.'
            : 'Could not save username. Try again.';
          setUsernameErr(msg);
          toast(msg, 'error');
          return; // stop before the success toast
        }
      }
      toast('Profile saved');
    } finally {
      setSavingProfile(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoURL(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleNewsletter = async (val) => { setNewsletter(val); await saveExtras({ newsletter: val }); toast(val ? 'Subscribed to newsletter' : 'Unsubscribed', 'info'); };

  const copyPluginKey = async () => {
    try { await navigator.clipboard.writeText(user?.uid || ''); toast('Pro key copied'); }
    catch { toast('Select the key and copy it manually', 'error'); }
  };

  const inviteLink = `https://www.pikfinder.com/?ref=${user?.uid || ''}`;
  const inviteText = 'Found this — free stock media search, a design studio and 30+ image/PDF tools, all free: ';
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteLink); toast('Invite link copied'); }
    catch { toast('Select the link and copy it manually', 'error'); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      if (String(err?.code).includes('requires-recent-login')) {
        toast('Please log out and back in, then delete again.', 'error');
      } else {
        toast('Could not delete account. Try again.', 'error');
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header" style={{ padding: '40px 0 24px' }}>
        <h1>Settings</h1>
        <p>Manage your profile, preferences, and account.</p>
      </header>

      {/* PROFILE */}
      <section className="settings-section">
        <div className="settings-section-title"><User weight="fill" /> Profile</div>

        <div className="settings-row avatar-row">
          <span className="settings-label">Avatar</span>
          <div className="avatar-edit">
            {photoURL ? <img src={photoURL} alt="" className="settings-avatar" onError={() => setPhotoURL('')} /> : <div className="settings-avatar fallback">{initial}</div>}
            <div className="avatar-edit-btns">
              <button className="btn-outline" onClick={() => setEditingAvatar(v => !v)}><Camera /> Change photo</button>
              <button className="btn-text-danger-btn" onClick={() => { setPhotoURL(''); }}><Trash /> Remove</button>
            </div>
          </div>
        </div>

        {editingAvatar && (
          <div className="settings-row avatar-picker-row">
            <span className="settings-label"></span>
            <div className="avatar-picker">
              <div className="avatar-grid">
                {presets.map(url => (
                  <button key={url} className={`avatar-option ${photoURL === url ? 'active' : ''}`} onClick={() => setPhotoURL(url)}><img src={url} alt="" /></button>
                ))}
                <label className="avatar-option upload" title="Upload"><Camera /><input type="file" accept="image/*" hidden onChange={onFile} /></label>
              </div>
              <div className="url-row">
                <input type="url" placeholder="…or paste an image URL" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
                <button className="btn-outline" onClick={() => customUrl && setPhotoURL(customUrl)}>Use</button>
              </div>
            </div>
          </div>
        )}

        <div className="settings-row">
          <span className="settings-label">Name</span>
          <input className="settings-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="settings-row">
          <span className="settings-label">Username</span>
          <div className="settings-input-col">
            <input
              className={`settings-input${usernameErr ? ' has-error' : ''}`}
              value={username}
              onChange={e => { setUsername(e.target.value); if (usernameErr) setUsernameErr(''); }}
              placeholder="username"
            />
            {usernameErr
              ? <span className="settings-field-error">{usernameErr}</span>
              : <span className="settings-hint">Must be unique. Letters, numbers, and underscores only.</span>}
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <input className="settings-input" value={user?.email || ''} disabled />
        </div>

        <div className="settings-actions">
          <button className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} /> : <><Check weight="bold" /> Save profile</>}
          </button>
        </div>
      </section>

      {/* SYSTEM PREFERENCES */}
      <section className="settings-section">
        <div className="settings-section-title"><GlobeSimple weight="fill" /> Appearance</div>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <div className="theme-switch">
            <button className={`theme-choice ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}><Sun weight="fill" /> Light</button>
            <button className={`theme-choice ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}><Moon weight="fill" /> Dark</button>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      <section className="settings-section">
        <div className="settings-section-title"><Bell weight="fill" /> Notifications</div>
        <div className="settings-row toggle-row">
          <div>
            <span className="settings-label">Newsletter</span>
            <p className="settings-hint">Receive product news, tips, and updates from Pik Finder.</p>
          </div>
          <Toggle checked={newsletter} onChange={toggleNewsletter} />
        </div>
      </section>

      {/* FIGMA PLUGIN */}
      <section className="settings-section">
        <div className="settings-section-title"><PuzzlePiece weight="fill" /> Figma plugin</div>
        {user?.isPremium ? (
          <div className="settings-row">
            <div>
              <span className="settings-label">Your Pro key</span>
              <p className="settings-hint">Paste this into the PikFinder Figma plugin → “Activate” to unlock unlimited inserts.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, maxWidth: 360 }}>
              <input className="settings-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }} value={user?.uid || ''} readOnly onFocus={(e) => e.target.select()} />
              <button className="btn-outline" onClick={copyPluginKey}><Copy /> Copy</button>
            </div>
          </div>
        ) : (
          <div className="settings-row toggle-row">
            <div>
              <span className="settings-label">Unlock the Figma plugin</span>
              <p className="settings-hint">Free users get {10} inserts/day in the plugin. Go Pro for unlimited inserts here and everything on PikFinder.</p>
            </div>
            <a className="btn-primary" href="/billing" style={{ textDecoration: 'none' }}><Check weight="bold" /> Upgrade to Pro</a>
          </div>
        )}
      </section>

      {/* INVITE FRIENDS */}
      <section className="settings-section">
        <div className="settings-section-title"><User weight="fill" /> Invite friends</div>
        <div className="settings-row">
          <div>
            <span className="settings-label">Share PikFinder</span>
            <p className="settings-hint">Send friends your link — help more creators discover free tools (and grow the community).</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1, maxWidth: 420 }}>
            <input className="settings-input" style={{ flex: 1, minWidth: 160, fontSize: 12 }} value={inviteLink} readOnly onFocus={(e) => e.target.select()} />
            <button className="btn-outline" onClick={copyInvite}><Copy /> Copy</button>
            <a className="btn-outline" href={`https://wa.me/?text=${encodeURIComponent(inviteText + inviteLink)}`} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>WhatsApp</a>
            <a className="btn-outline" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteText)}&url=${encodeURIComponent(inviteLink)}`} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>X</a>
          </div>
        </div>
      </section>

      {/* PROVIDER STATUS */}
      <section className="settings-section">
        <ProviderStatus />
      </section>

      {/* DANGER ZONE */}
      <section className="settings-section danger">
        <div className="settings-section-title danger"><Warning weight="fill" /> Danger zone</div>
        {!confirmDelete ? (
          <div className="settings-row toggle-row">
            <div>
              <span className="settings-label">Delete account</span>
              <p className="settings-hint">Permanently remove your account, favorites, and history. This can't be undone.</p>
            </div>
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete account</button>
          </div>
        ) : (
          <div className="delete-confirm">
            <p>Are you absolutely sure? This permanently deletes your account and data.</p>
            <div className="delete-confirm-btns">
              <button className="btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={doDelete} disabled={deleting}>
                {deleting ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} /> : 'Yes, delete forever'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
