import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  ArrowRight,
  SquaresFour,
  Image as ImageIcon,
  Play,
  Sparkle,
  Heart,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const MEDIA_PILLS = [
  { value: 'all', label: 'All', icon: SquaresFour },
  { value: 'photo', label: 'Images', icon: ImageIcon },
  { value: 'video', label: 'Videos', icon: Play },
];

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('photo');

  // Searching from the homepage takes the user to the dedicated search page.
  const runSearch = (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}&type=${type}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
    runSearch(tag);
  };

  const handlePillClick = (value) => {
    // "All" maps to the default photo feed — the app only distinguishes photo/video.
    setType(value === 'video' ? 'video' : 'photo');
  };

  return (
    <header className="hero premium-hero hero-v2">
      {/* Dynamic Background Element */}
      <div className="hero-bg-overlay"></div>

      <div className="hero-grid">
        <motion.div
          className="hero-content hero-copy"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkle weight="fill" size={14} />
            <span>Millions of free images, videos &amp; creative tools</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            Find. Create. <br /><span className="text-gradient glass-text">Inspire.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Access 100M+ copyright-safe images, videos, and AI-powered tools — all in one place.
          </motion.p>

          <motion.div
            className="hero-cta-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
          >
            <button type="button" className="btn-primary" onClick={() => runSearch('nature landscape')}>
              Start Exploring <ArrowRight weight="bold" />
            </button>
            <Link to="/studio" className="btn-outline">
              <SquaresFour weight="bold" /> Try Studio
            </Link>
          </motion.div>

          <motion.form
            className="search-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{ width: '100%' }}
          >
            <div className="hero-search-row">
              <div className="search-input-wrapper">
                <MagnifyingGlass className="search-icon" />
                <input
                  type="text"
                  placeholder="Search 'neon city', 'minimalism', 'mountains'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
                <div className="search-type-select">
                  <select
                    value={type === 'video' ? 'video' : 'all'}
                    onChange={(e) => handlePillClick(e.target.value)}
                    aria-label="Media type"
                  >
                    <option value="all">All Media</option>
                    <option value="photo">Photos</option>
                    <option value="video">Videos</option>
                  </select>
                </div>
                <button type="submit" className="search-submit-btn" aria-label="Search">
                  <MagnifyingGlass weight="bold" />
                </button>
              </div>
              <button type="submit" className="btn-outline ai-search-btn">
                <Sparkle weight="fill" /> Search with AI
              </button>
            </div>
          </motion.form>

          <motion.div
            className="media-pills"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {MEDIA_PILLS.map(({ value, label, icon: Icon }) => {
              const isActive = value === 'all' ? type !== 'video' : type === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`media-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handlePillClick(value)}
                >
                  <Icon weight="bold" size={14} /> {label}
                </button>
              );
            })}
          </motion.div>

          <motion.div
            className="trending-searches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            style={{ justifyContent: 'flex-start', marginTop: '16px' }}
          >
            {['Cyberpunk', 'Architecture', 'Moody Nature', 'Abstract', 'Neon'].map((tag) => (
              <motion.button
                key={tag}
                className="trend-tag"
                onClick={() => handleTagClick(tag)}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
              >
                {tag}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <div className="hero-float-card" style={{ top: 0, left: 0, width: '210px', height: '150px', zIndex: 2 }}>
            <img src="https://images.pexels.com/photos/38409470/pexels-photo-38409470.jpeg?auto=compress&cs=tinysrgb&w=420&h=300&fit=crop" alt="" width="210" height="150" loading="lazy" decoding="async" />
            <span className="hero-float-badge">Unsplash ✓</span>
          </div>
          <div className="hero-float-card" style={{ top: '95px', left: '130px', width: '260px', height: '220px', zIndex: 3 }}>
            <img src="https://images.pexels.com/photos/6910147/pexels-photo-6910147.jpeg?auto=compress&cs=tinysrgb&w=520&h=440&fit=crop" alt="" width="260" height="220" loading="lazy" decoding="async" />
            <span className="hero-float-play"><Play weight="fill" /></span>
            <span className="hero-float-badge">Pexels ✓</span>
          </div>
          <div className="hero-float-card" style={{ top: 0, right: 0, width: '140px', height: '180px', zIndex: 2 }}>
            <img src="https://images.pexels.com/photos/34921744/pexels-photo-34921744.jpeg?auto=compress&cs=tinysrgb&w=300&h=380&fit=crop" alt="" width="140" height="180" loading="lazy" decoding="async" />
            <span className="hero-float-badge">Openverse ✓</span>
          </div>
          <div className="hero-float-card" style={{ bottom: 0, right: '10px', width: '190px', height: '220px', zIndex: 1 }}>
            <img src="https://images.pexels.com/photos/9300768/pexels-photo-9300768.jpeg?auto=compress&cs=tinysrgb&w=380&h=440&fit=crop" alt="" width="190" height="220" loading="lazy" decoding="async" />
            <span className="hero-float-badge">Pixabay ✓</span>
          </div>
          <div className="hero-trust-card" style={{ bottom: '30px', left: '-10px' }}>
            <Heart weight="fill" className="icon" />
            <div>
              <strong>2.4M+</strong>
              <span>Creators trust us</span>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
