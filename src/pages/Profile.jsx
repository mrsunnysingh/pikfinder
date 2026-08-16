import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Camera } from '@phosphor-icons/react';

// Preset avatar options (generated, no upload/storage needed).
const AVATAR_STYLES = ['thumbs', 'bottts', 'avataaars', 'notionists', 'shapes', 'fun-emoji'];

export default function Profile() {
  const { user, updateUserProfile } = useContext(AppContext);
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const seed = (user?.email || user?.name || 'pikfinder').split('@')[0];
  const presets = AVATAR_STYLES.map(style => `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`);

  const initial = (name || 'U').charAt(0).toUpperCase();

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await updateUserProfile({ name: name.trim() || 'User', photoURL: photoURL || '' });
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="page-header" style={{ padding: '40px 0 24px' }}>
        <h1>Your profile</h1>
        <p>Update your name and avatar. Changes apply everywhere instantly.</p>
      </header>

      <div className="profile-card">
        <div className="profile-preview">
          {photoURL
            ? <img src={photoURL} alt="Avatar" className="profile-avatar-img" onError={() => setPhotoURL('')} />
            : <div className="profile-avatar-fallback">{initial}</div>}
          <div>
            <p className="profile-preview-name">{name || 'User'}</p>
            <p className="profile-preview-email">{user?.email}</p>
          </div>
        </div>

        <div className="input-group">
          <label>Display name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div className="input-group">
          <label>Choose an avatar</label>
          <div className="avatar-grid">
            {presets.map(url => (
              <button key={url} className={`avatar-option ${photoURL === url ? 'active' : ''}`} onClick={() => setPhotoURL(url)}>
                <img src={url} alt="avatar option" />
              </button>
            ))}
            <button className={`avatar-option none ${!photoURL ? 'active' : ''}`} onClick={() => setPhotoURL('')} title="Use initials">
              {initial}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label><Camera /> Or paste an image URL</label>
          <div className="url-row">
            <input type="url" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://…/avatar.png" />
            <button className="btn-outline" onClick={() => customUrl && setPhotoURL(customUrl)}>Use</button>
          </div>
        </div>

        <button className="btn-primary w-100" onClick={save} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }} /> : <><Check weight="bold" /> Save changes</>}
        </button>

        {status === 'ok' && <p className="form-status ok">Profile updated.</p>}
        {status === 'error' && <p className="form-status error">Couldn't save. Please try again.</p>}
      </div>
    </div>
  );
}
