// src/community/SavedPosts.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkSimple, Compass, Sparkle, Lock } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { getSavedPostsForUser } from './communityService';
import PostCard from './PostCard';

export default function SavedPosts() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const posts = await getSavedPostsForUser(user.uid);
        if (isMounted) setSavedPosts(posts);
      } catch (err) {
        console.error('[PikCircle] Error loading saved posts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!isLoggedIn) {
    return (
      <div className="pikcircle-empty-box">
        <Lock size={44} weight="duotone" className="pikcircle-empty-icon" />
        <h3 className="pikcircle-empty-title">Sign in to view your bookmarks</h3>
        <p className="pikcircle-empty-desc">
          Save design inspirations, helpful tutorials, and critiques to your personal library.
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

  return (
    <div className="pikcircle-saved-view">
      <div className="pikcircle-feed-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookmarkSimple size={22} weight="fill" style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
            Saved Posts ({savedPosts.length})
          </h1>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
          Loading your bookmarks...
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="pikcircle-empty-box">
          <BookmarkSimple size={48} weight="duotone" className="pikcircle-empty-icon" />
          <h3 className="pikcircle-empty-title">No saved posts yet</h3>
          <p className="pikcircle-empty-desc">
            Whenever you find a design showcase or resource you want to revisit later, click the bookmark icon on any post card.
          </p>
          <Link
            to="/community"
            className="pikcircle-compose-btn"
            style={{ width: 'auto', textDecoration: 'none' }}
          >
            <Compass size={17} weight="bold" />
            <span>Explore Community Feed</span>
          </Link>
        </div>
      ) : (
        <div className="pikcircle-posts-stream">
          {savedPosts.map((post) => (
            <PostCard
              key={post.postId}
              post={post}
              onDelete={(delId) => setSavedPosts((prev) => prev.filter((p) => p.postId !== delId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
