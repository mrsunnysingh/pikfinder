// src/community/CommunityNotifications.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Heart,
  ChatCircle,
  UserPlus,
  Checks,
  Lock,
  ArrowRight
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  fetchNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from './communityService';

export default function CommunityNotifications() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    if (user?.uid) {
      const list = fetchNotificationsForUser(user.uid);
      setNotifications(list);
    }
  }, [user]);

  const handleMarkAllRead = () => {
    if (!user?.uid) return;
    markAllNotificationsAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notif.notificationId ? { ...n, isRead: true } : n))
    );

    if (notif.postId) {
      navigate(`/community/post/${notif.postId}`);
    } else if (notif.actorName) {
      navigate(`/community/profile/${notif.actorName.toLowerCase().replace(/\s+/g, '_')}`);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - Number(ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isLoggedIn) {
    return (
      <div className="pikcircle-empty-box">
        <Lock size={44} weight="duotone" className="pikcircle-empty-icon" />
        <h3 className="pikcircle-empty-title">Sign in to view notifications</h3>
        <p className="pikcircle-empty-desc">
          Get notified when fellow creators appreciate your work, reply to your questions, or follow you.
        </p>
        <button
          type="button"
          className="pikcircle-compose-btn"
          style={{ width: 'auto' }}
          onClick={() => toggleAuthModal('login')}
        >
          Sign In
        </button>
      </div>
    );
  }

  const filteredNotifs = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="pikcircle-notifications-view">
      <div className="pikcircle-feed-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={22} weight="fill" style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pikcircle-feed-tabs" role="tablist">
              <button
                type="button"
                className={`pikcircle-tab-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`pikcircle-tab-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="pikcircle-action-pill-btn"
                onClick={handleMarkAllRead}
              >
                <Checks size={16} weight="bold" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredNotifs.length === 0 ? (
        <div className="pikcircle-empty-box">
          <Bell size={48} weight="duotone" className="pikcircle-empty-icon" />
          <h3 className="pikcircle-empty-title">All caught up!</h3>
          <p className="pikcircle-empty-desc">
            You don't have any {filter === 'unread' ? 'unread ' : ''}notifications at the moment.
          </p>
          <Link
            to="/community"
            className="pikcircle-compose-btn"
            style={{ width: 'auto', textDecoration: 'none' }}
          >
            Go to Community Feed
          </Link>
        </div>
      ) : (
        <div className="pikcircle-side-card" style={{ padding: '8px 16px' }}>
          {filteredNotifs.map((n) => {
            let Icon = Bell;
            let iconColor = 'var(--primary)';
            let actionText = 'interacted with your content';

            if (n.type === 'like') {
              Icon = Heart;
              iconColor = '#ec4899';
              actionText = `liked your post "${n.postTitle || 'Creative Showcase'}"`;
            } else if (n.type === 'comment') {
              Icon = ChatCircle;
              iconColor = '#3b82f6';
              actionText = `commented on "${n.postTitle || 'your post'}"`;
            } else if (n.type === 'reply') {
              Icon = ChatCircle;
              iconColor = '#8b5cf6';
              actionText = `replied to your comment in "${n.postTitle || 'discussion'}"`;
            } else if (n.type === 'follow') {
              Icon = UserPlus;
              iconColor = '#10b981';
              actionText = 'started following your creative profile';
            }

            return (
              <div
                key={n.notificationId}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 8px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: n.isRead ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                  borderRadius: '10px',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={n.actorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={n.actorName}
                      className="pikcircle-user-avatar"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={12} weight="fill" style={{ color: iconColor }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.4' }}>
                      <strong style={{ fontWeight: '700' }}>{n.actorName}</strong> {actionText}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
