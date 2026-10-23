// src/community/CreatorProfile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkle,
  LinkSimple,
  CalendarBlank,
  Users,
  PencilSimple,
  Check,
  Plus,
  X,
  UserPlus,
  UserCheck,
  FolderSimple,
  Globe,
  TwitterLogo,
  DribbbleLogo,
  GithubLogo,
  InstagramLogo
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  getCreatorProfile,
  updateCreatorProfile,
  toggleFollowUser,
  isUserFollowing,
  fetchCommunityPosts,
  getSavedPostsForUser
} from './communityService';
import { useToast } from '../components/Toast';
import PostCard from './PostCard';

export default function CreatorProfile() {
  const { username } = useParams();
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'saved'
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    skills: '',
    portfolioUrl: '',
    avatarUrl: '',
    coverUrl: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const isOwner =
    user?.uid &&
    (user.uid === profile?.uid ||
      user.username === username ||
      (user.email && user.email.split('@')[0].toLowerCase() === username?.toLowerCase()));

  // Load profile and their posts
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const p = await getCreatorProfile(username);
        if (!isMounted) return;
        setProfile(p);
        setEditForm({
          displayName: p.displayName || '',
          bio: p.bio || '',
          skills: (p.skills || []).join(', '),
          portfolioUrl: p.portfolioUrl || '',
          avatarUrl: p.avatarUrl || '',
          coverUrl: p.coverUrl || ''
        });

        if (user?.uid && p.uid) {
          setIsFollowing(isUserFollowing(user.uid, p.uid));
        }

        // Fetch their posts
        const res = await fetchCommunityPosts({
          category: 'all',
          tab: 'latest',
          limitCount: 50,
          currentUserId: user?.uid
        });

        if (isMounted) {
          const filtered = res.posts.filter(
            (item) =>
              item.authorId === p.uid ||
              item.authorUsername?.toLowerCase() === username?.toLowerCase()
          );
          setUserPosts(filtered);
        }

        // If viewing own profile, also load saved posts
        if (user?.uid && (user.uid === p.uid || user.username === username)) {
          const saved = await getSavedPostsForUser(user.uid);
          if (isMounted) setSavedPosts(saved);
        }
      } catch (err) {
        console.error('[PikCircle] Error loading creator profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [username, user]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    try {
      const res = await toggleFollowUser(user.uid, profile.uid, user);
      setIsFollowing(res.isFollowing);
      setProfile((prev) => ({
        ...prev,
        followersCount: Math.max(0, (prev.followersCount || 0) + (res.isFollowing ? 1 : -1))
      }));
      toast(
        res.isFollowing
          ? `Now following ${profile.displayName}!`
          : `Unfollowed ${profile.displayName}.`,
        'success'
      );
    } catch (err) {
      toast(err.message || 'Follow failed', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const skillsArray = editForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateCreatorProfile(profile.uid, {
        displayName: editForm.displayName.trim(),
        bio: editForm.bio.trim(),
        skills: skillsArray,
        portfolioUrl: editForm.portfolioUrl.trim(),
        avatarUrl: editForm.avatarUrl.trim() || profile.avatarUrl,
        coverUrl: editForm.coverUrl.trim() || profile.coverUrl
      });

      setProfile(updated);
      setEditModalOpen(false);
      toast('Profile updated successfully!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="pikcircle-profile-header" style={{ minHeight: '380px', opacity: 0.6 }}>
        <div style={{ height: '200px', background: 'var(--border)' }} />
        <div style={{ padding: '24px' }}>
          <div style={{ width: '160px', height: '24px', background: 'var(--border)', borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ width: '100px', height: '14px', background: 'var(--border)', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <div className="pikcircle-profile-view">
      {/* Profile Header Banner */}
      <section className="pikcircle-profile-header">
        <img
          src={profile.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'}
          alt="Profile cover banner"
          className="pikcircle-profile-cover"
        />

        <div className="pikcircle-profile-info-row">
          <div className="pikcircle-profile-avatar-wrap">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="pikcircle-profile-avatar"
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isOwner ? (
              <button
                type="button"
                className="pikcircle-action-pill-btn"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => setEditModalOpen(true)}
              >
                <PencilSimple size={16} weight="bold" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                className={`pikcircle-compose-btn ${isFollowing ? 'following' : ''}`}
                style={{
                  width: 'auto',
                  padding: '9px 22px',
                  fontSize: '0.9rem',
                  background: isFollowing ? 'var(--card-bg)' : undefined,
                  color: isFollowing ? 'var(--text)' : undefined,
                  border: isFollowing ? '1px solid var(--border)' : undefined,
                  boxShadow: isFollowing ? 'none' : undefined
                }}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} weight="bold" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} weight="bold" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="pikcircle-profile-body">
          <h1 className="pikcircle-profile-name">{profile.displayName}</h1>
          <div className="pikcircle-profile-handle">@{profile.username}</div>

          {/* Bio */}
          {profile.bio && <p className="pikcircle-profile-bio">{profile.bio}</p>}

          {/* Skills / Disciplines */}
          {profile.skills && profile.skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="pikcircle-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Metadata & Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
              >
                <Globe size={16} weight="bold" />
                <span>{profile.portfolioUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarBlank size={16} />
              <span>Joined {joinDate}</span>
            </div>
          </div>

          {/* Followers / Following Stats */}
          <div className="pikcircle-profile-stats">
            <div className="pikcircle-stat-unit">
              <strong>{userPosts.length}</strong>
              <span>Posts</span>
            </div>
            <div className="pikcircle-stat-unit">
              <strong>{profile.followersCount || 0}</strong>
              <span>Followers</span>
            </div>
            <div className="pikcircle-stat-unit">
              <strong>{profile.followingCount || 0}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="pikcircle-feed-header" style={{ marginBottom: '20px', padding: '12px 20px' }}>
        <div className="pikcircle-feed-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'posts'}
            className={`pikcircle-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Showcases & Posts ({userPosts.length})
          </button>
          {isOwner && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              className={`pikcircle-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Bookmarks ({savedPosts.length})
            </button>
          )}
        </div>
      </div>

      {/* Posts Stream */}
      {activeTab === 'posts' && (
        <div>
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onDelete={(delId) => setUserPosts((prev) => prev.filter((p) => p.postId !== delId))}
              />
            ))
          ) : (
            <div className="pikcircle-empty-box">
              <FolderSimple size={48} weight="duotone" className="pikcircle-empty-icon" />
              <h3 className="pikcircle-empty-title">No showcases published yet</h3>
              <p className="pikcircle-empty-desc">
                {isOwner
                  ? 'Upload your first creative showcase to share your portfolio with the designer community.'
                  : `${profile.displayName} hasn't published any public showcases yet.`}
              </p>
              {isOwner && (
                <Link
                  to="/community/create"
                  className="pikcircle-compose-btn"
                  style={{ width: 'auto', textDecoration: 'none' }}
                >
                  <Plus size={16} weight="bold" />
                  <span>Create First Post</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Saved Bookmarks tab */}
      {activeTab === 'saved' && isOwner && (
        <div>
          {savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onDelete={(delId) => setSavedPosts((prev) => prev.filter((p) => p.postId !== delId))}
              />
            ))
          ) : (
            <div className="pikcircle-empty-box">
              <FolderSimple size={48} weight="duotone" className="pikcircle-empty-icon" />
              <h3 className="pikcircle-empty-title">No saved bookmarks yet</h3>
              <p className="pikcircle-empty-desc">
                When you bookmark design inspiration or discussions, they will appear here.
              </p>
              <Link to="/community" className="pikcircle-compose-btn" style={{ width: 'auto', textDecoration: 'none' }}>
                Browse Community Feed
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="pikcircle-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div
            className="pikcircle-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px' }}
          >
            <div className="pikcircle-modal-header">
              <h3>Edit Creator Profile</h3>
              <button
                type="button"
                className="pikcircle-dots-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Display Name</label>
                <input
                  type="text"
                  className="pikcircle-text-input"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Bio / Tagline</label>
                <textarea
                  className="pikcircle-comment-textarea"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell designers about your design focus, tools, and background..."
                />
              </div>

              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Skills & Disciplines (comma separated)</label>
                <input
                  type="text"
                  className="pikcircle-text-input"
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  placeholder="Figma, UI/UX, Design Systems, 3D, Blender"
                />
              </div>

              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Portfolio or Website URL</label>
                <input
                  type="url"
                  className="pikcircle-text-input"
                  value={editForm.portfolioUrl}
                  onChange={(e) => setEditForm({ ...editForm, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.design"
                />
              </div>

              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Avatar Image URL</label>
                <input
                  type="url"
                  className="pikcircle-text-input"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Cover Banner URL</label>
                <input
                  type="url"
                  className="pikcircle-text-input"
                  value={editForm.coverUrl}
                  onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="pikcircle-action-pill-btn"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="pikcircle-compose-btn"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
