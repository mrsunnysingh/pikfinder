// src/community/CommunitySidebar.jsx
import React, { useContext } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  House,
  Compass,
  Users,
  BookmarkSimple,
  Bell,
  User,
  Plus,
  Sparkle,
  DeviceMobile,
  PaintBrush,
  Desktop,
  Palette,
  Camera,
  Play,
  Cpu,
  FolderSimple,
  ChatCircleDots,
  Buildings,
  ShieldCheck,
  SquaresFour
} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { COMMUNITY_CATEGORIES } from './communityService';

const CATEGORY_ICONS = {
  SquaresFour,
  DeviceMobile,
  PaintBrush,
  Desktop,
  Sparkle,
  Palette,
  Camera,
  Play,
  Cpu,
  FolderSimple,
  ChatCircleDots,
  Buildings
};

export default function CommunitySidebar({ activeCategory = 'all', onSelectCategory = () => {} }) {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCompose = () => {
    if (!isLoggedIn) {
      toggleAuthModal('login');
      return;
    }
    navigate('/community/create');
  };

  const username = user?.username || (user?.email ? user.email.split('@')[0] : 'me');

  return (
    <aside className="pikcircle-left-sidebar" aria-label="Community Navigation">
      {/* Brand & Quick Actions Card */}
      <div className="pikcircle-side-card">
        <Link to="/community" className="pikcircle-brand-banner">
          <div className="pikcircle-brand-icon">
            <Sparkle weight="fill" />
          </div>
          <div>
            <div className="pikcircle-brand-title">PikCircle</div>
            <div className="pikcircle-brand-tagline">Your Creative Space</div>
          </div>
        </Link>

        <button
          type="button"
          className="pikcircle-compose-btn"
          onClick={handleCompose}
          title="Create a new design post"
        >
          <Plus weight="bold" size={18} />
          <span>Create Post</span>
        </button>

        <div style={{ height: '14px' }}></div>

        <nav className="pikcircle-nav-menu">
          <NavLink
            to="/community"
            end
            className={({ isActive }) => `pikcircle-nav-item ${isActive ? 'active' : ''}`}
          >
            <House size={20} weight="duotone" />
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/community/explore"
            className={({ isActive }) => `pikcircle-nav-item ${isActive ? 'active' : ''}`}
          >
            <Compass size={20} weight="duotone" />
            <span>Explore</span>
          </NavLink>

          <NavLink
            to="/community?tab=following"
            className={`pikcircle-nav-item ${location.search.includes('tab=following') ? 'active' : ''}`}
          >
            <Users size={20} weight="duotone" />
            <span>Following</span>
          </NavLink>

          <NavLink
            to="/community/saved"
            className={({ isActive }) => `pikcircle-nav-item ${isActive ? 'active' : ''}`}
          >
            <BookmarkSimple size={20} weight="duotone" />
            <span>Saved Posts</span>
          </NavLink>

          <NavLink
            to="/community/notifications"
            className={({ isActive }) => `pikcircle-nav-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={20} weight="duotone" />
            <span>Notifications</span>
          </NavLink>

          {isLoggedIn ? (
            <NavLink
              to={`/community/profile/${username}`}
              className={({ isActive }) => `pikcircle-nav-item ${isActive ? 'active' : ''}`}
            >
              <User size={20} weight="duotone" />
              <span>My Profile</span>
            </NavLink>
          ) : (
            <div
              className="pikcircle-nav-item"
              onClick={() => toggleAuthModal('login')}
            >
              <User size={20} weight="duotone" />
              <span>Sign In / Profile</span>
            </div>
          )}
        </nav>
      </div>

      {/* Categories Filter Card */}
      <div className="pikcircle-side-card">
        <div className="pikcircle-cat-title">Categories</div>
        <div className="pikcircle-cat-list">
          {COMMUNITY_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] || SquaresFour;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`pikcircle-cat-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <Icon size={16} weight={isSelected ? 'fill' : 'duotone'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Guidelines Mini Card */}
      <div className="pikcircle-side-card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
          <ShieldCheck size={16} weight="fill" style={{ color: 'var(--primary)' }} />
          <span>Community Standards</span>
        </div>
        <p style={{ lineHeight: '1.45', marginBottom: '8px' }}>
          Be constructive, credit original authors, and help fellow designers grow.
        </p>
        <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: '600' }}>
          Read Guidelines →
        </Link>
      </div>
    </aside>
  );
}
