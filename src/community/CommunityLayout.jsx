// src/community/CommunityLayout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  Compass,
  PlusCircle,
  BookmarkSimple,
  Bell,
  Sparkle
} from '@phosphor-icons/react';
import CommunitySidebar from './CommunitySidebar';
import CommunityRightSidebar from './CommunityRightSidebar';
import './community.css';

export default function CommunityLayout() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // If user clicks a category on sidebar, navigate to /community with cat filter
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    if (location.pathname !== '/community') {
      navigate(`/community?cat=${catId}`);
    }
  };

  // If user clicks a trending tag on right sidebar
  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    navigate(`/community?tag=${encodeURIComponent(tag)}`);
  };

  const isCreatePage = location.pathname.includes('/community/create');

  return (
    <div className="pikcircle-root">
      <div className="pikcircle-container">
        {/* Mobile Quick Navigation Bar */}
        <div className="pikcircle-mobile-nav-bar" role="navigation" aria-label="Mobile Navigation">
          <NavLink
            to="/community"
            end
            className={({ isActive }) => `pikcircle-mobile-nav-pill ${isActive ? 'active' : ''}`}
          >
            <House size={16} weight="fill" />
            <span>Feed</span>
          </NavLink>
          <NavLink
            to="/community/explore"
            className={({ isActive }) => `pikcircle-mobile-nav-pill ${isActive ? 'active' : ''}`}
          >
            <Compass size={16} weight="fill" />
            <span>Explore</span>
          </NavLink>
          <NavLink
            to="/community/create"
            className={({ isActive }) => `pikcircle-mobile-nav-pill ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={16} weight="fill" />
            <span>New Post</span>
          </NavLink>
          <NavLink
            to="/community/saved"
            className={({ isActive }) => `pikcircle-mobile-nav-pill ${isActive ? 'active' : ''}`}
          >
            <BookmarkSimple size={16} weight="fill" />
            <span>Saved</span>
          </NavLink>
          <NavLink
            to="/community/notifications"
            className={({ isActive }) => `pikcircle-mobile-nav-pill ${isActive ? 'active' : ''}`}
          >
            <Bell size={16} weight="fill" />
            <span>Alerts</span>
          </NavLink>
        </div>

        {/* 3-Column Community Grid */}
        <div className="pikcircle-layout-grid">
          {/* Left Navigation & Category Sidebar */}
          <CommunitySidebar
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
          />

          {/* Main Content Area */}
          <main className="pikcircle-main-col" id="pikcircle-main-content">
            <Outlet
              context={{
                activeCategory,
                setActiveCategory,
                selectedTag,
                setSelectedTag
              }}
            />
          </main>

          {/* Right Discovery & Spotlight Sidebar */}
          {!isCreatePage && (
            <CommunityRightSidebar onSelectTag={handleSelectTag} />
          )}
        </div>
      </div>
    </div>
  );
}
