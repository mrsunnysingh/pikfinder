// src/community/CommunityRightSidebar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fire,
  Sparkle,
  TrendUp,
  ArrowRight,
  ShieldCheck,
  Check,
  Plus
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  getFeaturedCreators,
  getTrendingTopics,
  toggleFollowUser,
  isUserFollowing
} from './communityService';
import { useToast } from '../components/Toast';

export default function CommunityRightSidebar({ onSelectTag = () => {} }) {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [trending, setTrending] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    const list = getFeaturedCreators();
    setCreators(list);
    setTrending(getTrendingTopics());

    if (user?.uid) {
      const map = {};
      list.forEach((c) => {
        map[c.uid] = isUserFollowing(user.uid, c.uid);
      });
      setFollowingMap(map);
    }
  }, [user]);

  const handleFollowClick = async (targetCreator) => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    try {
      const res = await toggleFollowUser(user.uid, targetCreator.uid, user);
      setFollowingMap((prev) => ({ ...prev, [targetCreator.uid]: res.isFollowing }));
      toast(
        res.isFollowing
          ? `Now following ${targetCreator.displayName}!`
          : `Unfollowed ${targetCreator.displayName}.`,
        'success'
      );
    } catch (err) {
      toast(err.message || 'Follow action failed', 'error');
    }
  };

  return (
    <aside className="pikcircle-right-sidebar" aria-label="Community Discovery Sidebar">
      {/* Featured Creators Card */}
      <div className="pikcircle-side-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.94rem' }}>
            <Sparkle size={17} weight="fill" style={{ color: 'var(--primary)' }} />
            <span>Featured Creators</span>
          </div>
          <Link to="/community/explore" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}>
            View all →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {creators.map((c) => {
            const isSelf = user?.uid === c.uid;
            const isFollowing = followingMap[c.uid];
            return (
              <div key={c.uid} className="pikcircle-creator-item">
                <div className="pikcircle-creator-left">
                  <Link to={`/community/profile/${c.username}`}>
                    <img
                      src={c.avatarUrl}
                      alt={c.displayName}
                      className="pikcircle-user-avatar"
                      style={{ width: '38px', height: '38px' }}
                      loading="lazy"
                    />
                  </Link>
                  <div style={{ overflow: 'hidden' }}>
                    <Link
                      to={`/community/profile/${c.username}`}
                      style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {c.displayName}
                    </Link>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      @{c.username}
                    </div>
                  </div>
                </div>

                {!isSelf && (
                  <button
                    type="button"
                    className={`pikcircle-follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => handleFollowClick(c)}
                  >
                    {isFollowing ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={12} weight="bold" /> Following
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Plus size={12} weight="bold" /> Follow
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Topics Card */}
      <div className="pikcircle-side-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.94rem', marginBottom: '12px' }}>
          <Fire size={18} weight="fill" style={{ color: '#f59e0b' }} />
          <span>Trending in Design</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {trending.map((t) => (
            <div
              key={t.tag}
              className="pikcircle-topic-item"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectTag(t.tag)}
            >
              <div>
                <div className="pikcircle-topic-tag">#{t.tag}</div>
                <div className="pikcircle-topic-count">{t.count} posts this week</div>
              </div>
              <TrendUp size={16} weight="bold" style={{ color: 'var(--text-subtle)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* About PikCircle Card */}
      <div className="pikcircle-side-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.05))', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
          PikCircle by PikFinder
        </h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
          An open space for UI/UX, graphic, motion, and digital designers to discover work, share critique, and exchange commercial assets.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/studio" className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.78rem', flex: 1, textAlign: 'center' }}>
            Open Studio
          </Link>
          <Link to="/tools" className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.78rem', flex: 1, textAlign: 'center' }}>
            Free Tools
          </Link>
        </div>
      </div>
    </aside>
  );
}
