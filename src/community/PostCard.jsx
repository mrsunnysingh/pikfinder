// src/community/PostCard.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ChatCircle,
  BookmarkSimple,
  ShareNetwork,
  DotsThree,
  ArrowSquareOut,
  Trash,
  WarningCircle,
  Check,
  LinkSimple
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  POST_TYPES,
  COMMUNITY_CATEGORIES,
  toggleLikePost,
  isPostLikedByUser,
  toggleSavePost,
  isPostSavedByUser,
  deleteCommunityPost
} from './communityService';
import { useToast } from '../components/Toast';
import ReportModal from './ReportModal';

export default function PostCard({ post, onDelete = () => {}, onTagClick = () => {} }) {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(() => isPostLikedByUser(post.postId, user?.uid));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(() => isPostSavedByUser(post.postId, user?.uid));
  const [saveCount, setSaveCount] = useState(post.saveCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.uid === post.authorId;
  const postTypeInfo = POST_TYPES.find(t => t.id === post.type) || POST_TYPES[0];
  const catInfo = COMMUNITY_CATEGORIES.find(c => c.id === post.category);

  // Time format
  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - Number(ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    // Optimistic UI
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    try {
      const res = await toggleLikePost(post.postId, user);
      setIsLiked(res.isLiked);
      setLikeCount(res.likeCount);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast(err.message || 'Like failed', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    const prevSaved = isSaved;
    const prevCount = saveCount;
    setIsSaved(!prevSaved);
    setSaveCount(prevCount + (prevSaved ? -1 : 1));

    try {
      const res = await toggleSavePost(post.postId, user);
      setIsSaved(res.isSaved);
      setSaveCount(res.saveCount);
      toast(res.isSaved ? 'Post saved to your bookmarks!' : 'Post removed from saved.', 'info');
    } catch (err) {
      setIsSaved(prevSaved);
      setSaveCount(prevCount);
      toast(err.message || 'Save failed', 'error');
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/community/post/${post.postId}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast('Post link copied to clipboard!', 'success');
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await deleteCommunityPost(post.postId, user.uid);
      toast('Post deleted successfully.', 'info');
      onDelete(post.postId);
    } catch (err) {
      toast(err.message || 'Could not delete post', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <article className="pikcircle-post-card" aria-label={post.title}>
      {reportOpen && (
        <ReportModal
          targetType="post"
          targetId={post.postId}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* Header with Author and Type badge */}
      <div className="pikcircle-post-header">
        <div className="pikcircle-author-meta">
          <Link to={`/community/profile/${post.authorUsername}`}>
            <img
              src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={post.authorName}
              className="pikcircle-user-avatar"
              loading="lazy"
            />
          </Link>
          <div className="pikcircle-author-info">
            <Link to={`/community/profile/${post.authorUsername}`} className="pikcircle-author-name">
              {post.authorName}
            </Link>
            <div className="pikcircle-author-handle">
              <span>@{post.authorUsername}</span>
              <span>•</span>
              <time dateTime={new Date(post.createdAt).toISOString()}>{formatTime(post.createdAt)}</time>
            </div>
          </div>
        </div>

        <div className="pikcircle-post-badges-wrap">
          <span
            className="pikcircle-type-badge"
            style={{
              backgroundColor: `${postTypeInfo.color}18`,
              color: postTypeInfo.color,
              border: `1px solid ${postTypeInfo.color}35`
            }}
          >
            {postTypeInfo.badge}
          </span>
          {catInfo && (
            <span className="pikcircle-cat-badge">
              {catInfo.label}
            </span>
          )}

          <div className="pikcircle-menu-wrapper">
            <button
              type="button"
              className="pikcircle-dots-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Post options"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {menuOpen && (
              <div className="pikcircle-dropdown-menu" onClick={() => setMenuOpen(false)}>
                <button type="button" className="pikcircle-menu-item" onClick={handleShare}>
                  <LinkSimple size={16} /> Copy Link
                </button>
                {isOwner && (
                  <button
                    type="button"
                    className="pikcircle-menu-item danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash size={16} /> Delete Post
                  </button>
                )}
                <button
                  type="button"
                  className="pikcircle-menu-item"
                  onClick={() => setReportOpen(true)}
                >
                  <WarningCircle size={16} /> Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <Link to={`/community/post/${post.postId}`} className="pikcircle-post-title">
        {post.title}
      </Link>

      {/* Content body */}
      <p className="pikcircle-post-body">
        {post.content}
      </p>

      {/* Image Attachments */}
      {post.imageAttachments && post.imageAttachments.length > 0 && (
        <div className={`pikcircle-images-gallery ${post.imageAttachments.length === 1 ? 'single' : 'double'}`}>
          {post.imageAttachments.map((img, idx) => (
            <div
              key={idx}
              className="pikcircle-image-wrapper"
              onClick={() => navigate(`/community/post/${post.postId}`)}
            >
              <img
                src={img.url}
                alt={img.alt || post.title}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* External Resource Card */}
      {post.resourceUrl && (
        <a
          href={post.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pikcircle-resource-card"
        >
          <div className="pikcircle-resource-info">
            <ArrowSquareOut size={20} weight="bold" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div className="pikcircle-resource-link">{post.resourceUrl}</div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Visit Link ↗</span>
        </a>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="pikcircle-tags-row">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="pikcircle-tag-chip"
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="pikcircle-post-actions">
        <div className="pikcircle-action-group">
          {/* Like */}
          <button
            type="button"
            className={`pikcircle-action-btn like-btn ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={18} weight={isLiked ? 'fill' : 'bold'} />
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <Link
            to={`/community/post/${post.postId}#comments`}
            className="pikcircle-action-btn"
            title="Join discussion"
          >
            <ChatCircle size={18} weight="bold" />
            <span>{post.commentCount || 0}</span>
          </Link>
        </div>

        <div className="pikcircle-action-group">
          {/* Save */}
          <button
            type="button"
            className={`pikcircle-action-btn save-btn ${isSaved ? 'active' : ''}`}
            onClick={handleSave}
            title={isSaved ? 'Remove from saved' : 'Save post'}
          >
            <BookmarkSimple size={18} weight={isSaved ? 'fill' : 'bold'} />
          </button>

          {/* Share */}
          <button
            type="button"
            className="pikcircle-action-btn"
            onClick={handleShare}
            title="Share post"
          >
            <ShareNetwork size={18} weight="bold" />
          </button>
        </div>
      </div>
    </article>
  );
}
