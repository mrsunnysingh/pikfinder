// src/community/CreatePost.jsx
import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkle,
  Image as ImageIcon,
  LinkSimple,
  X,
  UploadSimple,
  ArrowLeft,
  Eye,
  PaperPlaneTilt,
  Lock,
  ChatCircleDots,
  Question,
  PaintBrush,
  DeviceMobile
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import {
  POST_TYPES,
  COMMUNITY_CATEGORIES,
  createCommunityPost,
  uploadCommunityImage
} from './communityService';
import { useToast } from '../components/Toast';
import PostCard from './PostCard';

export default function CreatePost() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [type, setType] = useState('showcase');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ui-ux');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['UI/UX', 'Figma']);
  const [resourceUrl, setResourceUrl] = useState('');
  const [imageAttachments, setImageAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Add tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean) && tags.length < 6) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Image Upload handler
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    if (imageAttachments.length + files.length > 4) {
      toast('You can attach a maximum of 4 images per post.', 'warning');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadProgress(10);
        const imgObj = await uploadCommunityImage(file, (prog) => {
          setUploadProgress(prog);
        });
        setImageAttachments((prev) => [...prev, imgObj]);
        setUploadProgress(null);
        toast(`Uploaded ${file.name}`, 'success');
      } catch (err) {
        setUploadProgress(null);
        toast(err.message || 'Image upload failed', 'error');
      }
    }
  };

  const removeImage = (index) => {
    setImageAttachments(imageAttachments.filter((_, i) => i !== index));
  };

  // Submit Post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }

    if (!title.trim()) {
      toast('Please enter a descriptive post title.', 'warning');
      return;
    }
    if (!content.trim()) {
      toast('Please add some details or context to your post.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createCommunityPost(
        {
          type,
          title,
          content,
          category,
          tags,
          imageAttachments,
          resourceUrl
        },
        user
      );

      toast('Post published to PikCircle!', 'success');
      navigate(`/community/post/${newPost.postId}`);
    } catch (err) {
      toast(err.message || 'Could not publish post', 'error');
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pikcircle-root">
        <div className="pikcircle-container" style={{ maxWidth: '600px', textAlign: 'center', paddingTop: '60px' }}>
          <div className="pikcircle-side-card" style={{ padding: '40px 24px' }}>
            <div className="pikcircle-brand-icon" style={{ width: '56px', height: '56px', margin: '0 auto 16px', fontSize: '1.6rem' }}>
              <Lock weight="fill" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Sign In to Create on PikCircle</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.92rem' }}>
              Join thousands of creators sharing design work, requesting critiques, and answering questions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-primary" onClick={() => toggleAuthModal('login')}>
                Sign In
              </button>
              <button type="button" className="btn-outline" onClick={() => toggleAuthModal('signup')}>
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Synthetic preview post
  const previewPost = {
    postId: 'preview_mode',
    authorId: user?.uid || 'curr_user',
    authorName: user?.displayName || user?.name || 'You',
    authorUsername: user?.username || 'you',
    authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    type,
    title: title || 'Your Post Title Here',
    content: content || 'Your post description and thoughts will appear here in the live community feed.',
    category,
    tags,
    imageAttachments,
    resourceUrl,
    likeCount: 0,
    commentCount: 0,
    saveCount: 0,
    createdAt: Date.now()
  };

  return (
    <div className="pikcircle-root">
      <div className="pikcircle-container" style={{ maxWidth: '860px' }}>
        <Link to="/community" className="pikcircle-back-nav">
          <ArrowLeft size={16} weight="bold" /> Back to Community Feed
        </Link>

        <div className="pikcircle-composer-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '4px' }}>
                Create a Post
              </h1>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Share your design work, ask for feedback, or start a creative conversation.
              </p>
            </div>

            <button
              type="button"
              className={`pikcircle-action-pill-btn ${showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye size={16} weight="bold" />
              <span>{showPreview ? 'Edit Mode' : 'Live Preview'}</span>
            </button>
          </div>

          {showPreview ? (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Feed Preview
              </div>
              <PostCard post={previewPost} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Post Type Selector */}
              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Post Format</label>
                <div className="pikcircle-type-selector">
                  {POST_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`pikcircle-type-btn ${type === t.id ? 'active' : ''}`}
                      onClick={() => setType(t.id)}
                    >
                      <span className="pikcircle-type-label" style={{ color: type === t.id ? t.color : 'inherit' }}>
                        {t.label}
                      </span>
                      <span className="pikcircle-type-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="pikcircle-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="pikcircle-form-label">Title</label>
                  <span style={{ fontSize: '0.78rem', color: title.length > 130 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {title.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  className="pikcircle-text-input"
                  placeholder="e.g. Redesigned Mobile Banking App UI in Dark Mode (Feedback requested)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              {/* Category & Tags Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                <div className="pikcircle-form-group" style={{ marginBottom: 0 }}>
                  <label className="pikcircle-form-label">Category</label>
                  <select
                    className="pikcircle-text-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {COMMUNITY_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pikcircle-form-group" style={{ marginBottom: 0 }}>
                  <label className="pikcircle-form-label">Tags (press Enter or comma)</label>
                  <input
                    type="text"
                    className="pikcircle-text-input"
                    placeholder="e.g. Figma, CleanUI, Typography"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {tags.map((tg) => (
                        <span key={tg} className="pikcircle-tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          #{tg}
                          <X size={12} weight="bold" style={{ cursor: 'pointer' }} onClick={() => removeTag(tg)} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Textarea */}
              <div className="pikcircle-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="pikcircle-form-label">Details & Context</label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {content.length}/3000
                  </span>
                </div>
                <textarea
                  className="pikcircle-comment-textarea"
                  style={{ minHeight: '140px' }}
                  placeholder="Explain your design decisions, tools used, goals, or the specific feedback you are looking for..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={3000}
                  required
                />
              </div>

              {/* Image Dropzone */}
              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">Attach Artwork / Screenshots (up to 4)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <div
                  className="pikcircle-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                >
                  <UploadSimple size={32} weight="duotone" className="pikcircle-upload-icon" />
                  <div style={{ fontWeight: '600', fontSize: '0.94rem', color: 'var(--text)', marginBottom: '4px' }}>
                    Click or drag &amp; drop images here
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    PNG, JPG, WebP, AVIF up to 8MB each (High resolution preserved)
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.2s' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      Uploading... {uploadProgress}%
                    </div>
                  </div>
                )}

                {imageAttachments.length > 0 && (
                  <div className="pikcircle-preview-grid">
                    {imageAttachments.map((img, idx) => (
                      <div key={idx} className="pikcircle-preview-item">
                        <img src={img.url} alt={`Attachment ${idx + 1}`} />
                        <button
                          type="button"
                          className="pikcircle-remove-preview-btn"
                          onClick={() => removeImage(idx)}
                          title="Remove image"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resource Link (optional) */}
              <div className="pikcircle-form-group">
                <label className="pikcircle-form-label">External Resource or Portfolio Link (optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    className="pikcircle-text-input"
                    placeholder="https://dribbble.com, https://figma.com/@..., or GitHub link"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '26px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate('/community')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish to Community'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
