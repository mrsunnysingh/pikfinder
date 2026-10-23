// src/community/CommunityFeed.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  MagnifyingGlass,
  Plus,
  Sparkle,
  Image as ImageIcon,
  ChatCircleDots,
  Question,
  PaintBrush,
  ArrowClockwise,
  SlidersHorizontal,
  XCircle,
  Funnel
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  fetchCommunityPosts,
  COMMUNITY_CATEGORIES
} from './communityService';
import PostCard from './PostCard';

const FEED_TABS = [
  { id: 'for-you', label: 'For You' },
  { id: 'latest', label: 'Latest' },
  { id: 'following', label: 'Following' },
  { id: 'popular', label: 'Popular' },
  { id: 'unanswered', label: 'Unanswered' },
];

export default function CommunityFeed() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};

  const tabParam = searchParams.get('tab') || 'for-you';
  const catParam = searchParams.get('cat') || outletCtx.activeCategory || 'all';
  const tagParam = searchParams.get('tag') || outletCtx.selectedTag || '';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [activeCategory, setActiveCategory] = useState(catParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync state if URL search params change
  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
    if (searchParams.get('cat')) {
      setActiveCategory(searchParams.get('cat'));
      if (outletCtx.setActiveCategory) outletCtx.setActiveCategory(searchParams.get('cat'));
    }
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load posts
  const loadPosts = async (pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetchCommunityPosts({
        category: activeCategory,
        tab: activeTab,
        searchQuery: tagParam ? `#${tagParam}` : debouncedQuery,
        page: pageNum,
        limitCount: 8,
        currentUserId: user?.uid
      });

      if (append) {
        setPosts((prev) => [...prev, ...res.posts]);
      } else {
        setPosts(res.posts);
      }
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('[PikCircle] Error loading posts:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(1, false);
  }, [activeTab, activeCategory, debouncedQuery, tagParam, user]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    setSearchParams(newParams);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    if (outletCtx.setActiveCategory) outletCtx.setActiveCategory(catId);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('cat');
    } else {
      newParams.set('cat', catId);
    }
    setSearchParams(newParams);
  };

  const handleTagClick = (tag) => {
    const clean = tag.replace(/^#/, '');
    if (outletCtx.setSelectedTag) outletCtx.setSelectedTag(clean);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tag', clean);
    setSearchParams(newParams);
  };

  const clearTagFilter = () => {
    if (outletCtx.setSelectedTag) outletCtx.setSelectedTag('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams);
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p.postId !== deletedPostId));
  };

  const handleQuickComposerClick = () => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    navigate('/community/create');
  };

  const currentCatObj = COMMUNITY_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="pikcircle-feed-wrapper">
      {/* Feed Filter Header */}
      <div className="pikcircle-feed-header">
        <div className="pikcircle-feed-tabs-row">
          {/* Tabs */}
          <div className="pikcircle-feed-tabs" role="tablist">
            {FEED_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                type="button"
                className={`pikcircle-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="pikcircle-search-input-wrap">
            <MagnifyingGlass size={16} weight="bold" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search design discussions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search community posts"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={15} weight="fill" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Bar if tag or specific category is selected */}
        {(tagParam || (activeCategory && activeCategory !== 'all')) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Funnel size={13} weight="bold" /> Filtering by:
            </span>

            {activeCategory && activeCategory !== 'all' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                <span>Category: {currentCatObj?.label || activeCategory}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('all')}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  title="Remove category filter"
                >
                  <XCircle size={14} weight="fill" />
                </button>
              </div>
            )}

            {tagParam && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(236, 72, 153, 0.12)',
                  color: '#ec4899',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                <span>#{tagParam}</span>
                <button
                  type="button"
                  onClick={clearTagFilter}
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  title="Clear tag filter"
                >
                  <XCircle size={14} weight="fill" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Feed Composer Trigger Card */}
      <div className="pikcircle-quick-composer" onClick={handleQuickComposerClick}>
        <img
          src={
            user?.photoURL ||
            user?.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          }
          alt={user?.displayName || 'Your avatar'}
          className="pikcircle-user-avatar"
        />
        <div className="pikcircle-composer-placeholder">
          <span>Share your design work, ask for feedback, or post a question...</span>
          <div className="pikcircle-composer-actions">
            <span className="pikcircle-action-pill-btn">
              <ImageIcon size={15} weight="bold" />
              <span>Image</span>
            </span>
            <span className="pikcircle-action-pill-btn">
              <Question size={15} weight="bold" />
              <span>Question</span>
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="pikcircle-post-card"
              style={{ minHeight: '180px', opacity: 0.6, animation: 'pulse 1.4s ease-in-out infinite' }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: '120px', height: '14px', borderRadius: '4px', background: 'var(--border)' }} />
                  <div style={{ width: '80px', height: '10px', borderRadius: '4px', background: 'var(--border)' }} />
                </div>
              </div>
              <div style={{ width: '70%', height: '20px', borderRadius: '4px', background: 'var(--border)', marginBottom: '12px' }} />
              <div style={{ width: '100%', height: '14px', borderRadius: '4px', background: 'var(--border)', marginBottom: '8px' }} />
              <div style={{ width: '90%', height: '14px', borderRadius: '4px', background: 'var(--border)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.length > 0 && (
        <div className="pikcircle-posts-stream">
          {posts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onDelete={handlePostDeleted}
              onTagClick={handleTagClick}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '30px' }}>
              <button
                type="button"
                className="pikcircle-action-pill-btn"
                style={{ padding: '12px 28px', fontSize: '0.92rem', borderRadius: '999px' }}
                onClick={() => loadPosts(page + 1, true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <ArrowClockwise size={18} className="spin" />
                    <span>Loading more inspiration...</span>
                  </>
                ) : (
                  <span>Load More Posts</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="pikcircle-empty-box">
          <ChatCircleDots className="pikcircle-empty-icon" weight="duotone" />
          <h3 className="pikcircle-empty-title">
            {activeTab === 'following'
              ? 'No posts from creators you follow yet'
              : 'No community posts found'}
          </h3>
          <p className="pikcircle-empty-desc">
            {activeTab === 'following'
              ? 'Follow top designers from the sidebar to curate a personal feed of creative projects and advice.'
              : debouncedQuery || tagParam
              ? 'Try searching for different keywords or clear your active tag and category filters.'
              : 'Be the first creator to start a conversation, share a design showcase, or ask a question!'}
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            {(tagParam || debouncedQuery || (activeCategory && activeCategory !== 'all')) && (
              <button
                type="button"
                className="pikcircle-action-pill-btn"
                onClick={() => {
                  setSearchQuery('');
                  clearTagFilter();
                  handleCategoryChange('all');
                }}
              >
                Reset All Filters
              </button>
            )}
            <button
              type="button"
              className="pikcircle-compose-btn"
              style={{ width: 'auto', padding: '10px 22px' }}
              onClick={handleQuickComposerClick}
            >
              <Plus weight="bold" size={17} />
              <span>Create First Post</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
