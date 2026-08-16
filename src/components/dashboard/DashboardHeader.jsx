import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Bell, Plus, FolderPlus, PaintBrush, ClockCounterClockwise, List, Sparkle, FileText, Crown, HandWaving } from '@phosphor-icons/react';
import { AppContext } from '../../context/AppContext';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from '../ThemeToggle';
import { buildNotifications, getReadIds, markAllRead, unreadCount } from '../../lib/notifications';

const NOTIF_ICONS = { sparkle: Sparkle, file: FileText, crown: Crown, clock: ClockCounterClockwise, hand: HandWaving };

export default function DashboardHeader({ onMenu = () => {} }) {
  const { user, searchHistory } = useContext(AppContext);
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const quickRef = useRef(null);

  const notifications = useMemo(() => buildNotifications(user, searchHistory), [user, searchHistory]);
  const [readIds, setReadIds] = useState(() => getReadIds());
  const unread = unreadCount(notifications, readIds);

  const toggleNotif = () => {
    setIsNotifOpen((v) => {
      const next = !v;
      if (next) { markAllRead(notifications.map((n) => n.id)); setReadIds(getReadIds()); }
      return next;
    });
  };

  // Close any open popover when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (quickRef.current && !quickRef.current.contains(event.target)) setIsQuickOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const quickActions = [
    { label: 'Start a search', icon: MagnifyingGlass, onClick: () => navigate('/search') },
    { label: 'Open Studio', icon: PaintBrush, onClick: () => navigate('/studio') },
    { label: 'Create a collection', icon: FolderPlus, onClick: () => navigate('/collections?create=1') },
  ];

  return (
    <header className="dashboard-header">
      <button type="button" className="dashboard-menu-btn" onClick={onMenu} aria-label="Open menu">
        <List weight="bold" />
      </button>
      <div className="header-left">
        <form className="dashboard-header-search" onSubmit={submitSearch}>
          <MagnifyingGlass />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search PikFinder..."
          />
        </form>
      </div>

      <div className="header-right">
        <div className="profile-menu-container" ref={quickRef}>
          <button
            type="button"
            className="quick-actions-trigger"
            onClick={() => setIsQuickOpen((v) => !v)}
          >
            <Plus weight="bold" /> <span className="qa-label">Quick actions</span>
          </button>
          {isQuickOpen && (
            <div className="header-popover">
              <div className="header-popover-title">Quick actions</div>
              {quickActions.map(({ label, icon: Icon, onClick }) => (
                <div
                  key={label}
                  className="header-popover-item"
                  onClick={() => { onClick(); setIsQuickOpen(false); }}
                >
                  <Icon /> {label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-menu-container" ref={notifRef}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={toggleNotif}
            aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
          >
            <Bell weight={isNotifOpen ? 'fill' : 'regular'} />
            {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {isNotifOpen && (
            <div className="header-popover notif-popover">
              <div className="header-popover-title">Notifications</div>
              {notifications.length ? (
                <div className="notif-list">
                  {notifications.map((n) => {
                    const Icon = NOTIF_ICONS[n.icon] || Bell;
                    return (
                      <button key={n.id} className="notif-item" onClick={() => { if (n.link) navigate(n.link); setIsNotifOpen(false); }}>
                        <span className="notif-item-icon"><Icon weight="duotone" /></span>
                        <span className="notif-item-text">
                          <strong>{n.title}</strong>
                          <span>{n.body}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="header-popover-empty">No notifications yet.</div>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className="profile-menu-container" ref={dropdownRef}>
          <div
            className="avatar-circle"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
          </div>

          {isDropdownOpen && <ProfileDropdown onClose={() => setIsDropdownOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
