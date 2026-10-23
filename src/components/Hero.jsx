import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  MagnifyingGlass,
  ArrowRight,
  SquaresFour,
  Image as ImageIcon,
  Play,
  Sparkle,
  Heart,
  Star,
  Microphone,
  Camera,
  X,
  Desktop,
  DeviceMobile,
  Cpu,
  Code,
  Lightning,
  CheckCircle,
  CaretDown,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useToast } from './Toast';

const MEDIA_PILLS = [
  { value: 'all', label: 'All', icon: SquaresFour },
  { value: 'photo', label: 'Images', icon: ImageIcon },
  { value: 'video', label: 'Videos', icon: Play },
  { value: 'icon', label: 'Icons', icon: Star },
];

const QUICK_TAGS = [
  { label: '✨ Create an AI image', q: 'studio', isAction: true },
  { label: '🎬 Create an AI video', q: 'video', isVideo: true },
  { label: 'Location', q: 'location map travel' },
  { label: 'Computer', q: 'computer technology setup' },
  { label: 'Magnifying glass', q: 'magnifying glass search 3d' },
  { label: 'Success', q: 'success achievement growth' },
  { label: 'Spotlight', q: 'spotlight stage lighting' },
  { label: 'Target', q: 'target goal accuracy' },
  { label: 'Highlight', q: 'highlight aesthetic abstract' },
  { label: 'Search bar', q: 'search bar ui modern' },
  { label: 'Review', q: 'review feedback customer' },
  { label: 'Goal', q: 'goal motivation futuristic' },
];

const ECOSYSTEM_BADGES = [
  { label: 'Desktop', badge: 'New', icon: Desktop, modal: 'desktop' },
  { label: 'Mobile', badge: null, icon: DeviceMobile, modal: 'mobile' },
  { label: 'MCP', badge: 'New', icon: Cpu, modal: 'mcp' },
  { label: 'Plugins', badge: null, icon: Lightning, modal: 'plugins' },
  { label: 'API', badge: null, icon: Code, modal: 'api' },
];

export default function Hero() {
  const navigate = useNavigate();
  const toast = useToast();
  const { openModal } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('photo');
  const [finderMode, setFinderMode] = useState('Finder');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const runSearch = (q, forceType = type) => {
    const term = (q ?? query).trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}&type=${forceType}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  const handleQuickTag = (tag) => {
    if (tag.isAction) {
      openModal('create');
      return;
    }
    if (tag.isVideo) {
      setType('video');
      runSearch('motion video', 'video');
      return;
    }
    setQuery(tag.label);
    runSearch(tag.q || tag.label);
  };

  const selectFinderMode = (mode, mediaType) => {
    setFinderMode(mode);
    setType(mediaType);
    setIsModeOpen(false);
    toast(`Search mode switched to: ${mode}`, 'info');
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Voice search is not supported in this browser.', 'info');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening... Speak your prompt', 'info');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        runSearch(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast('Voice input stopped or canceled.', 'info');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      toast('Could not start voice search.', 'info');
    }
  };

  const handleCameraSearch = () => {
    toast('Reverse Image Search: Drag and drop or select an image in Studio to find visually similar assets.', 'info');
    navigate('/studio');
  };

  return (
    <header className="hero premium-hero hero-magnific-style">
      {/* Background Ambience */}
      <div className="hero-bg-overlay"></div>

      <div className="hero-grid hero-grid-centered">
        <motion.div
          className="hero-content hero-copy-centered"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Top Pill / Badge */}
          <motion.div
            className="hero-pill-badge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Sparkle weight="fill" size={14} className="badge-sparkle" />
            <span>Next-Gen Creative Finder &amp; AI Studio</span>
          </motion.div>

          <motion.h1
            className="hero-title-big"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Find, Create &amp; Supercharge <br />
            <span className="text-gradient glass-text">Every Creative Asset</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Access 100M+ royalty-free 4K photos, vectors, 3D icons, and AI templates across every design tool.
          </motion.p>

          {/* Sleek Magnific Style Search Bar */}
          <motion.form
            className="magnific-search-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            <div className="magnific-search-bar">
              {/* Category Pill / Mode Selector */}
              <div className="magnific-mode-pill-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="magnific-mode-pill"
                  onClick={() => setIsModeOpen(!isModeOpen)}
                >
                  <SquaresFour weight="duotone" size={18} className="mode-icon" />
                  <span className="mode-label">{finderMode}</span>
                  <CaretDown size={12} weight="bold" />
                </button>

                {isModeOpen && (
                  <div className="filter-dropdown-menu" style={{ top: 'calc(100% + 10px)', minWidth: '160px', zIndex: 500 }}>
                    <button type="button" className={`dropdown-item ${finderMode === 'Finder' ? 'active' : ''}`} onClick={() => selectFinderMode('Finder', 'photo')}>
                      <span>All Assets (Finder)</span>
                    </button>
                    <button type="button" className={`dropdown-item ${finderMode === 'Photos' ? 'active' : ''}`} onClick={() => selectFinderMode('Photos', 'photo')}>
                      <span>Photos (HD/4K)</span>
                    </button>
                    <button type="button" className={`dropdown-item ${finderMode === 'Videos' ? 'active' : ''}`} onClick={() => selectFinderMode('Videos', 'video')}>
                      <span>Videos (Motion)</span>
                    </button>
                    <button type="button" className={`dropdown-item ${finderMode === 'Icons' ? 'active' : ''}`} onClick={() => selectFinderMode('Icons', 'icon')}>
                      <span>Icons &amp; 3D</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Input */}
              <input
                type="text"
                className="magnific-search-input"
                placeholder="Search photos, videos, 3D assets, AI prompts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  className="magnific-action-btn"
                  onClick={() => setQuery('')}
                  title="Clear"
                >
                  <X weight="bold" size={16} />
                </button>
              )}

              {/* Voice Search */}
              <button
                type="button"
                className={`magnific-action-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceSearch}
                title="Voice Search"
              >
                <Microphone weight={isListening ? 'fill' : 'bold'} size={18} />
              </button>

              {/* Visual Camera Search */}
              <button
                type="button"
                className="magnific-action-btn"
                onClick={() => openModal('visual_search')}
                title="Reverse Image Search / Drop Photo"
              >
                <Camera weight="bold" size={18} />
              </button>

              {/* Primary Search Submit */}
              <button
                type="submit"
                className="magnific-submit-btn"
                aria-label="Search"
              >
                <MagnifyingGlass weight="bold" size={18} />
              </button>
            </div>
          </motion.form>

          {/* Quick Action Tag Chips (Magnific Style) */}
          <motion.div
            className="magnific-quick-chips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                className={`quick-chip ${tag.isAction ? 'quick-chip-accent' : ''}`}
                onClick={() => handleQuickTag(tag)}
              >
                {tag.label}
              </button>
            ))}
          </motion.div>

          {/* Ecosystem Promo Bar (Magnific style "Use PikFinder everywhere you create") */}
          <motion.div
            className="magnific-ecosystem-bar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <div className="ecosystem-intro">
              <Sparkle weight="fill" size={15} />
              <span>Use PikFinder everywhere you create</span>
            </div>
            <div className="ecosystem-badges-list">
              {ECOSYSTEM_BADGES.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => openModal(b.modal)}
                  className="ecosystem-badge-chip"
                  style={{ background: 'var(--bg-elevated)', cursor: 'pointer' }}
                >
                  <b.icon size={15} weight="duotone" />
                  <span>{b.label}</span>
                  {b.badge && <span className="eco-pill-badge">{b.badge}</span>}
                  <span className="eco-arrow">↗</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
