// src/community/CommunityExplore.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkle,
  Compass,
  Fire,
  TrendUp,
  UserPlus,
  UserCheck,
  MagnifyingGlass,
  ArrowRight,
  Eye,
  Heart,
  ChatCircle
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  getFeaturedCreators,
  getTrendingTopics,
  fetchCommunityPosts,
  toggleFollowUser,
  isUserFollowing
} from './communityService';
import { useToast } from '../components/Toast';

export default function CommunityExplore() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [creators, setCreators] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const creatorList = getFeaturedCreators();
        const trendList = getTrendingTopics();
        const res = await fetchCommunityPosts({ tab: 'popular', limitCount: 12 });

        if (!isMounted) return;
        setCreators(creatorList);
        setTrending(trendList);
        setPopularPosts(res.posts);

        if (user?.uid) {
          const map = {};
          creatorList.forEach((c) => {
            map[c.uid] = isUserFollowing(user.uid, c.uid);
          });
          setFollowingMap(map);
        }
      } catch (err) {
        console.error('[PikCircle] Explore load failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
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
      toast(err.message || 'Follow failed', 'error');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/community?tab=popular&tag=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="pikcircle-explore-view" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Banner & Search Hero */}
      <div
        className="pikcircle-side-card"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(236, 72, 153, 0.08))',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          padding: '32px 28px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '999px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: 'var(--primary)',
            marginBottom: '14px'
          }}
        >
          <Compass size={16} weight="fill" />
          <span>Discover PikCircle</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontSize: '1.9rem',
            fontWeight: '800',
            color: 'var(--text)',
            marginBottom: '10px',
            lineHeight: '1.2'
          }}
        >
          Explore Creators & Trending Design Work
        </h1>
        <p
          style={{
            fontSize: '0.96rem',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            margin: '0 auto 24px',
            lineHeight: '1.5'
          }}
        >
          Find visionary UI/UX designers, 3D artists, brand strategists, and illustrators shaping next-generation interfaces.
        </p>

        {/* Search input form */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: '520px',
            margin: '0 auto',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '6px 8px 6px 18px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <MagnifyingGlass size={18} weight="bold" style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
          <input
            type="text"
            placeholder="Search tags, topics (e.g. FigmaVariables, 3D)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '0.94rem'
            }}
          />
          <button
            type="submit"
            className="pikcircle-compose-btn"
            style={{ width: 'auto', padding: '8px 20px', fontSize: '0.86rem' }}
          >
            Explore
          </button>
        </form>
      </div>

      {/* Featured Creators Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>
            <Sparkle size={20} weight="fill" style={{ color: 'var(--primary)' }} />
            <span>Featured Creators</span>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Curated weekly</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {creators.map((c) => {
            const isFollowing = followingMap[c.uid];
            return (
              <div
                key={c.uid}
                className="pikcircle-side-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '18px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Link to={`/community/profile/${c.username}`}>
                    <img
                      src={c.avatarUrl}
                      alt={c.displayName}
                      className="pikcircle-user-avatar"
                      style={{ width: '48px', height: '48px' }}
                    />
                  </Link>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <Link
                      to={`/community/profile/${c.username}`}
                      style={{ fontWeight: '700', fontSize: '0.96rem', color: 'var(--text)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {c.displayName}
                    </Link>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{c.username}</div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.45',
                    marginBottom: '14px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {c.bio}
                </p>

                {/* Skills */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {(c.skills || []).slice(0, 3).map((sk, idx) => (
                    <span key={idx} className="pikcircle-skill-tag" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Bottom row: followers + follow button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>{c.followersCount}</strong> followers
                  </span>
                  <button
                    type="button"
                    className={`pikcircle-follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => handleFollowClick(c)}
                  >
                    {isFollowing ? 'Following' : '+ Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending Topics Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)', marginBottom: '16px' }}>
          <Fire size={20} weight="fill" style={{ color: '#f59e0b' }} />
          <span>Hot Discussions & Tags</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {trending.map((t, idx) => (
            <Link
              key={idx}
              to={`/community?tag=${encodeURIComponent(t.tag)}`}
              className="pikcircle-side-card"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                transition: 'border-color 0.18s, transform 0.18s'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.94rem', color: 'var(--primary)', marginBottom: '2px' }}>
                  #{t.tag}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.count} posts this week</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>
      </section>

      {/* Showcase Visual Gallery */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)', marginBottom: '16px' }}>
          <TrendUp size={20} weight="bold" style={{ color: 'var(--primary)' }} />
          <span>Top Visual Showcases</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px'
          }}
        >
          {popularPosts
            .filter((p) => p.imageAttachments && p.imageAttachments.length > 0)
            .slice(0, 6)
            .map((post) => (
              <Link
                key={post.postId}
                to={`/community/post/${post.postId}`}
                className="pikcircle-side-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: 'var(--bg-inset)' }}>
                  <img
                    src={post.imageAttachments[0].url}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px 12px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#fff',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span>{post.authorName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={14} weight="fill" style={{ color: '#ec4899' }} /> {post.likeCount || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChatCircle size={14} weight="fill" /> {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '0.94rem',
                      color: 'var(--text)',
                      marginBottom: '4px',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {post.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    #{post.tags?.[0] || 'Design'}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
