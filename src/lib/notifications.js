// src/lib/notifications.js
// Lightweight, client-side notification feed. It derives real, useful items from
// the user's own state (Pro status + expiry, recent activity) plus product
// announcements — no backend needed. Read state is remembered in localStorage so
// the unread badge behaves correctly across visits.

const READ_KEY = 'pf-notif-read';

const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch { return ''; } };

// Product announcements — bump the id when you post a new one so it shows as unread.
const ANNOUNCEMENTS = [
  { id: 'feat-increase-size-2026-08', icon: 'sparkle', title: 'New tool: Increase Image Size', body: 'Make a photo hit an exact KB — perfect for exam-form minimums.', link: '/tools/increase-image-size' },
  { id: 'feat-pdf-editor-2026-07', icon: 'file', title: 'New: Free PDF Editor', body: 'Edit text & images, sign, highlight and whiteout any PDF.', link: '/pdf-editor' },
];

/** Build the notification list for the current user. Most-relevant first. */
export function buildNotifications(user, searchHistory = []) {
  const list = [];
  const now = Date.now();

  if (user) {
    const sub = user.subscription;
    const end = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0;
    if (user.isPremium && end) {
      const days = Math.ceil((end - now) / 864e5);
      if (days >= 0 && days <= 7) {
        list.push({ id: `sub-renew-${sub.currentPeriodEnd}`, icon: 'crown', title: sub.cancelAtPeriodEnd ? 'Pro access ending soon' : 'Pro renews soon', body: `Your Creator Pro ${sub.cancelAtPeriodEnd ? 'access ends' : 'renews'} on ${fmtDate(end)}.`, link: '/billing' });
      } else {
        list.push({ id: 'sub-active', icon: 'crown', title: 'Creator Pro is active', body: 'All Pro features are unlocked — enjoy!', link: '/billing' });
      }
    } else if (end && end < now) {
      list.push({ id: `sub-expired-${sub.currentPeriodEnd}`, icon: 'crown', title: 'Your Pro plan expired', body: `It ended on ${fmtDate(end)}. Renew to unlock Pro again.`, link: '/billing' });
    }
  }

  for (const a of ANNOUNCEMENTS) list.push(a);

  if (searchHistory && searchHistory[0]) {
    list.push({ id: `search-${searchHistory[0]}`, icon: 'clock', title: 'Pick up where you left off', body: `You searched “${searchHistory[0]}” recently.`, link: `/search?q=${encodeURIComponent(searchHistory[0])}` });
  }

  if (user) {
    list.push({ id: 'welcome', icon: 'hand', title: `Welcome, ${user.name || 'there'} 👋`, body: 'Search millions of free assets, or open Studio to start designing.', link: '/search' });
  }

  return list;
}

export function getReadIds() {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
}

export function markAllRead(ids = []) {
  try { const set = new Set([...getReadIds(), ...ids]); localStorage.setItem(READ_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

export function unreadCount(list = [], readIds = getReadIds()) {
  const set = new Set(readIds);
  return list.filter((n) => !set.has(n.id)).length;
}
