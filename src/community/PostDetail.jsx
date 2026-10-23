// src/community/PostDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  ChatCircle,
  BookmarkSimple,
  ShareNetwork,
  DotsThree,
  ArrowSquareOut,
  Trash,
  WarningCircle,
  Check,
  PaperPlaneTilt,
  Sparkle,
  X,
  UserPlus,
  UserCheck
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  getPostById,
  deleteCommunityPost,
  fetchComments,
  addComment,
  deleteComment,
  toggleLikePost,
  isPostLikedByUser,
  toggleSavePost,
  isPostSavedByUser,
  toggleFollowUser,
  isUserFollowing,
  POST_TYPES,
  COMMUNITY_CATEGORIES
} from './communityService';
import { useToast } from '../components/Toast';
import ReportModal from './ReportModal';

export default function PostDetail() {
  const { postId } = useParams();
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentSort, setCommentSort] = useState('newest'); // 'newest' | 'oldest'

  // Like & Save state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Load post & comments
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const found = await getPostById(postId);
        if (!isMounted) return;
        if (!found) {
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(found);
        setLikeCount(found.likeCount || 0);
        setSaveCount(found.saveCount || 0);
        setIsLiked(isPostLikedByUser(postId, user?.uid));
        setIsSaved(isPostSavedByUser(postId, user?.uid));
        if (user?.uid && found.authorId) {
          setIsFollowingAuthor(isUserFollowing(user.uid, found.authorId));
        }

        // Fetch comments
        setCommentsLoading(true);
        const fetchedComments = await fetchComments(postId);
        if (isMounted) {
          setComments(fetchedComments);
          setCommentsLoading(false);
        }
      } catch (err) {
        console.error('[PikCircle] Error loading post detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [postId, user]);

  const isOwner = user?.uid === post?.authorId;
  const postTypeInfo = POST_TYPES.find((t) => t.id === post?.type) || POST_TYPES[0];
  const catInfo = COMMUNITY_CATEGORIES.find((c) => c.id === post?.category);

  // Format relative time
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
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
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

  const handleSave = async () => {
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
      toast(res.isSaved ? 'Post bookmarked to your saved collection!' : 'Removed from saved.', 'info');
    } catch (err) {
      setIsSaved(prevSaved);
      setSaveCount(prevCount);
      toast(err.message || 'Bookmark action failed', 'error');
    }
  };

  const handleFollowAuthor = async () => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    try {
      const res = await toggleFollowUser(user.uid, post.authorId, user);
      setIsFollowingAuthor(res.isFollowing);
      toast(
        res.isFollowing
          ? `Now following ${post.authorName}!`
          : `Unfollowed ${post.authorName}.`,
        'success'
      );
    } catch (err) {
      toast(err.message || 'Follow failed', 'error');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast('Post link copied to clipboard!', 'success');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteCommunityPost(post.postId, user.uid);
      toast('Post deleted successfully.', 'info');
      navigate('/community');
    } catch (err) {
      toast(err.message || 'Failed to delete post.', 'error');
    }
  };

  // Submit main comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const added = await addComment(post.postId, { content: newCommentText }, user);
      setComments((prev) => [...prev, added]);
      setNewCommentText('');
      setPost((prev) => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      toast('Comment posted!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit reply
  const handleAddReply = async (parentCommentId) => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    if (!replyText.trim()) return;

    try {
      const added = await addComment(
        post.postId,
        { content: replyText, parentCommentId },
        user
      );
      setComments((prev) => [...prev, added]);
      setReplyText('');
      setReplyingToId(null);
      setPost((prev) => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      toast('Reply posted!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to post reply', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId, post.postId, user.uid);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      setPost((prev) => ({ ...prev, commentCount: Math.max(0, (prev.commentCount || 0) - 1) }));
      toast('Comment deleted.', 'info');
    } catch (err) {
      toast(err.message || 'Failed to delete comment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="pikcircle-detail-view">
        <Link to="/community" className="pikcircle-back-nav">
          <ArrowLeft size={16} weight="bold" />
          <span>Back to Feed</span>
        </Link>
        <div className="pikcircle-post-card" style={{ minHeight: '340px', opacity: 0.6 }}>
          <div style={{ width: '60%', height: '24px', background: 'var(--border)', borderRadius: '6px', marginBottom: '16px' }} />
          <div style={{ width: '100%', height: '180px', background: 'var(--border)', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pikcircle-detail-view">
        <Link to="/community" className="pikcircle-back-nav">
          <ArrowLeft size={16} weight="bold" />
          <span>Back to Feed</span>
        </Link>
        <div className="pikcircle-empty-box">
          <WarningCircle size={48} weight="duotone" style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 className="pikcircle-empty-title">Post Not Found</h3>
          <p className="pikcircle-empty-desc">
            This design post may have been removed or the link is incorrect.
          </p>
          <Link to="/community" className="pikcircle-compose-btn" style={{ width: 'auto', textDecoration: 'none' }}>
            Return to Community
          </Link>
        </div>
      </div>
    );
  }

  // Organize comments into root + replies
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = {};
  comments.forEach((c) => {
    if (c.parentCommentId) {
      if (!repliesByParent[c.parentCommentId]) repliesByParent[c.parentCommentId] = [];
      repliesByParent[c.parentCommentId].push(c);
    }
  });

  const sortedRootComments = [...rootComments].sort((a, b) => {
    if (commentSort === 'oldest') return Number(a.createdAt) - Number(b.createdAt);
    return Number(b.createdAt) - Number(a.createdAt);
  });

  return (
    <div className="pikcircle-detail-view">
      {/* Back Link */}
      <Link to="/community" className="pikcircle-back-nav">
        <ArrowLeft size={16} weight="bold" />
        <span>Back to Feed</span>
      </Link>

      {/* Main Post Card */}
      <article className="pikcircle-post-card" style={{ padding: '28px' }}>
        {/* Header */}
        <header className="pikcircle-post-header">
          <div className="pikcircle-author-meta">
            <Link to={`/community/profile/${post.authorUsername}`}>
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="pikcircle-user-avatar"
                style={{ width: '48px', height: '48px' }}
              />
            </Link>
            <div className="pikcircle-author-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to={`/community/profile/${post.authorUsername}`}
                  className="pikcircle-author-name"
                  style={{ fontSize: '1.05rem' }}
                >
                  {post.authorName}
                </Link>

                {/* Follow author button if not own post */}
                {user?.uid !== post.authorId && (
                  <button
                    type="button"
                    className={`pikcircle-follow-btn ${isFollowingAuthor ? 'following' : ''}`}
                    onClick={handleFollowAuthor}
                    style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                  >
                    {isFollowingAuthor ? (
                      <>
                        <UserCheck size={12} weight="bold" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={12} weight="bold" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="pikcircle-author-handle">
                <span>@{post.authorUsername}</span>
                <span>•</span>
                <time dateTime={new Date(post.createdAt).toISOString()}>
                  {formatTime(post.createdAt)}
                </time>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pikcircle-post-badges-wrap">
              <span
                className="pikcircle-type-badge"
                style={{
                  backgroundColor: `${postTypeInfo.color}1a`,
                  color: postTypeInfo.color,
                  border: `1px solid ${postTypeInfo.color}40`,
                }}
              >
                {postTypeInfo.badge}
              </span>
              {catInfo && (
                <span className="pikcircle-cat-badge">{catInfo.label}</span>
              )}
            </div>

            {/* Context Menu */}
            <div className="pikcircle-menu-wrapper">
              <button
                type="button"
                className="pikcircle-dots-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Post actions"
              >
                <DotsThree size={24} weight="bold" />
              </button>

              {menuOpen && (
                <div className="pikcircle-dropdown-menu">
                  {isOwner && (
                    <button
                      type="button"
                      className="pikcircle-menu-item danger"
                      onClick={handleDeletePost}
                    >
                      <Trash size={16} />
                      <span>Delete Post</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="pikcircle-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                  >
                    <WarningCircle size={16} />
                    <span>Report Post</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Title */}
        <h1 className="pikcircle-post-title" style={{ fontSize: '1.6rem', marginBottom: '14px' }}>
          {post.title}
        </h1>

        {/* Content Body */}
        <div className="pikcircle-post-body" style={{ fontSize: '1.02rem', lineHeight: '1.7', marginBottom: '20px' }}>
          {post.content}
        </div>

        {/* Image Attachments */}
        {post.imageAttachments && post.imageAttachments.length > 0 && (
          <div
            className={`pikcircle-images-gallery ${
              post.imageAttachments.length === 1 ? 'single' : 'double'
            }`}
            style={{ marginBottom: '22px' }}
          >
            {post.imageAttachments.map((img, idx) => (
              <div
                key={idx}
                className="pikcircle-image-wrapper"
                onClick={() => setLightboxImg(img.url)}
                title="Click to zoom image"
              >
                <img
                  src={img.url}
                  alt={img.alt || `Attachment ${idx + 1}`}
                  loading="lazy"
                  style={{ maxHeight: '680px' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Resource link */}
        {post.resourceUrl && (
          <a
            href={post.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pikcircle-resource-card"
            style={{ marginBottom: '20px' }}
          >
            <div className="pikcircle-resource-info">
              <Sparkle size={20} weight="fill" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Attached Resource</div>
                <div className="pikcircle-resource-link">{post.resourceUrl}</div>
              </div>
            </div>
            <ArrowSquareOut size={18} style={{ color: 'var(--text-muted)' }} />
          </a>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pikcircle-tags-row" style={{ marginBottom: '22px' }}>
            {post.tags.map((tag, idx) => (
              <Link
                key={idx}
                to={`/community?tag=${encodeURIComponent(tag)}`}
                className="pikcircle-tag-chip"
                style={{ fontSize: '0.84rem', padding: '4px 12px' }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="pikcircle-post-actions" style={{ paddingTop: '18px' }}>
          <div className="pikcircle-action-group">
            {/* Like */}
            <button
              type="button"
              className={`pikcircle-action-btn like-btn ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <Heart size={20} weight={isLiked ? 'fill' : 'regular'} />
              <span>{likeCount}</span>
            </button>

            {/* Comment count display */}
            <div className="pikcircle-action-btn">
              <ChatCircle size={20} weight="regular" />
              <span>{post.commentCount || 0}</span>
            </div>

            {/* Save */}
            <button
              type="button"
              className={`pikcircle-action-btn save-btn ${isSaved ? 'active' : ''}`}
              onClick={handleSave}
            >
              <BookmarkSimple size={20} weight={isSaved ? 'fill' : 'regular'} />
              <span>{saveCount > 0 ? saveCount : 'Save'}</span>
            </button>
          </div>

          <button
            type="button"
            className="pikcircle-action-btn"
            onClick={handleShare}
            title="Share post link"
          >
            <ShareNetwork size={18} />
            <span>Share</span>
          </button>
        </div>
      </article>

      {/* Comments & Discussion Card */}
      <section className="pikcircle-comments-card" aria-label="Discussion">
        <div className="pikcircle-comments-header">
          <h3>Discussion ({comments.length})</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={commentSort}
              onChange={(e) => setCommentSort(e.target.value)}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Add Comment Input */}
        {isLoggedIn ? (
          <form onSubmit={handleAddComment} className="pikcircle-comment-form">
            <textarea
              className="pikcircle-comment-textarea"
              placeholder="What are your thoughts on this design? Share helpful critique..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={3}
            />
            <div className="pikcircle-comment-submit-row">
              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim()}
                className="pikcircle-compose-btn"
                style={{ width: 'auto', padding: '9px 20px', fontSize: '0.88rem' }}
              >
                <PaperPlaneTilt weight="bold" size={16} />
                <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}
          >
            <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Sign in to share feedback and join the conversation.
            </span>
            <button
              type="button"
              className="pikcircle-compose-btn"
              style={{ width: 'auto', padding: '8px 18px', fontSize: '0.86rem' }}
              onClick={() => toggleAuthModal('login')}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Comment Thread List */}
        {commentsLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
            Loading comments...
          </div>
        ) : sortedRootComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <ChatCircle size={36} weight="duotone" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
              No comments yet
            </div>
            <div style={{ fontSize: '0.86rem' }}>
              Be the first to share your thoughts, advice, or appreciation!
            </div>
          </div>
        ) : (
          <div className="pikcircle-comments-list">
            {sortedRootComments.map((comment) => {
              const replies = repliesByParent[comment.commentId] || [];
              const isCommentAuthor = user?.uid === comment.authorId;
              const isReplying = replyingToId === comment.commentId;

              return (
                <div key={comment.commentId} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Root comment */}
                  <div className="pikcircle-comment-item">
                    <Link to={`/community/profile/${comment.authorUsername}`}>
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="pikcircle-user-avatar"
                        style={{ width: '36px', height: '36px' }}
                      />
                    </Link>
                    <div className="pikcircle-comment-content">
                      <div className="pikcircle-comment-author-row">
                        <Link
                          to={`/community/profile/${comment.authorUsername}`}
                          style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text)' }}
                        >
                          {comment.authorName}
                        </Link>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          • {formatTime(comment.createdAt)}
                        </span>
                      </div>

                      <div className="pikcircle-comment-text">{comment.content}</div>

                      <div className="pikcircle-comment-actions">
                        <button
                          type="button"
                          className="pikcircle-comment-action-btn"
                          onClick={() => {
                            if (!isLoggedIn) {
                              toggleAuthModal('login');
                              return;
                            }
                            setReplyingToId(isReplying ? null : comment.commentId);
                            setReplyText('');
                          }}
                        >
                          <ChatCircle size={14} />
                          <span>{isReplying ? 'Cancel' : 'Reply'}</span>
                        </button>

                        {isCommentAuthor && (
                          <button
                            type="button"
                            className="pikcircle-comment-action-btn"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteComment(comment.commentId)}
                          >
                            <Trash size={14} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {/* Inline reply composer */}
                      {isReplying && (
                        <div style={{ marginTop: '12px' }}>
                          <textarea
                            className="pikcircle-comment-textarea"
                            placeholder={`Reply to ${comment.authorName}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            style={{ minHeight: '60px' }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                              type="button"
                              className="pikcircle-action-pill-btn"
                              onClick={() => setReplyingToId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="pikcircle-compose-btn"
                              style={{ width: 'auto', padding: '6px 16px', fontSize: '0.82rem' }}
                              onClick={() => handleAddReply(comment.commentId)}
                              disabled={!replyText.trim()}
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nested replies */}
                  {replies.map((reply) => {
                    const isReplyAuthor = user?.uid === reply.authorId;
                    return (
                      <div key={reply.commentId} className="pikcircle-comment-item is-reply">
                        <Link to={`/community/profile/${reply.authorUsername}`}>
                          <img
                            src={reply.authorAvatar}
                            alt={reply.authorName}
                            className="pikcircle-user-avatar"
                            style={{ width: '30px', height: '30px' }}
                          />
                        </Link>
                        <div className="pikcircle-comment-content">
                          <div className="pikcircle-comment-author-row">
                            <Link
                              to={`/community/profile/${reply.authorUsername}`}
                              style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text)' }}
                            >
                              {reply.authorName}
                            </Link>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              • {formatTime(reply.createdAt)}
                            </span>
                          </div>

                          <div className="pikcircle-comment-text" style={{ fontSize: '0.88rem' }}>
                            {reply.content}
                          </div>

                          <div className="pikcircle-comment-actions">
                            {isReplyAuthor && (
                              <button
                                type="button"
                                className="pikcircle-comment-action-btn"
                                style={{ color: '#ef4444' }}
                                onClick={() => handleDeleteComment(reply.commentId)}
                              >
                                <Trash size={13} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lightbox zoom modal */}
      {lightboxImg && (
        <div
          className="pikcircle-modal-overlay"
          onClick={() => setLightboxImg(null)}
          style={{ zIndex: 2000, padding: '20px' }}
        >
          <button
            type="button"
            className="pikcircle-remove-preview-btn"
            style={{ position: 'fixed', top: '24px', right: '24px', width: '38px', height: '38px', fontSize: '1.2rem', zIndex: 2010 }}
            onClick={() => setLightboxImg(null)}
          >
            <X size={20} weight="bold" />
          </button>
          <img
            src={lightboxImg}
            alt="Preview"
            style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <ReportModal
          targetType="post"
          targetId={post.postId}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
