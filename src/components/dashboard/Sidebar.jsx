import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import { AppContext } from '../../context/AppContext';
import {
  House, MagnifyingGlass, SquaresFour, Heart, PaintBrush, DownloadSimple,
  ClockCounterClockwise, Gear, EnvelopeSimple, GridFour, Crown, Buildings,
  FilePdf, ChartLineUp, X, Plus, Sparkle, ChatCircleDots, Sun, Moon,
  Desktop, DeviceMobile, Cpu, Code, Lightning, DotsThree, QrCode
} from '@phosphor-icons/react';
import ThemeToggle from '../ThemeToggle';
import { PAYMENTS_ENABLED } from '../../config/features';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

const SOCIALS = {
  instagram: 'https://instagram.com/pikfinder',
  twitter: 'https://twitter.com/pikfinder',
  github: 'https://github.com/mrsunnysingh/pikfinder',
};

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, openModal } = useContext(AppContext);
  const navigate = useNavigate();
  const isAdmin = ADMIN_UID && user?.uid === ADMIN_UID;
  const isPro = !!user?.isPremium || !!user?.isAdmin || isAdmin;

  const linkClass = ({ isActive }) => (isActive ? 'nav-item active' : 'nav-item');

  return (
    <aside className={`dashboard-sidebar modern-sidebar${open ? ' open' : ''}`}>
      {/* Sidebar Header with Brand */}
      <div className="sidebar-header">
        <NavLink to="/" className="logo" onClick={onClose} title="PikFinder Home">
          <Logo size={28} />
        </NavLink>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <X weight="bold" />
        </button>
      </div>

      <div className="sidebar-scrollable">
        {/* "+ Create" Action Button (Magnific Style) */}
        <div className="sidebar-create-wrap">
          <button
            type="button"
            className="sidebar-create-btn"
            onClick={() => {
              openModal('create');
              onClose();
            }}
          >
            <Plus weight="bold" size={18} />
            <span>Create</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={linkClass} end onClick={onClose}>
            <House weight="fill" size={18} /> <span>Home</span>
          </NavLink>
          <NavLink to="/community" className={linkClass} onClick={onClose}>
            <Sparkle weight="fill" size={18} /> <span>PikCircle</span>
            <span className="sidebar-chip-badge pink">Hot</span>
          </NavLink>
          <NavLink to="/search" className={linkClass} onClick={onClose}>
            <MagnifyingGlass weight="bold" size={18} /> <span>Search</span>
          </NavLink>
          <NavLink to="/search?type=photo" className={linkClass} onClick={onClose}>
            <SquaresFour weight="fill" size={18} /> <span>Stock Assets</span>
          </NavLink>
          <NavLink to="/studio" className={linkClass} onClick={onClose}>
            <PaintBrush weight="duotone" size={18} /> <span>Studio</span>
            <span className="sidebar-chip-badge new">Pro</span>
          </NavLink>
          <NavLink to="/favorites" className={linkClass} onClick={onClose}>
            <Heart weight="duotone" size={18} /> <span>Favorites</span>
          </NavLink>
        </nav>

        {/* Integrations & AI Plugins (Magnific Style) */}
        <div className="sidebar-section-label">AI &amp; Plugins</div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('ai_prompts'); onClose(); }}
          >
            <Sparkle weight="duotone" size={18} className="plugin-icon claude-color" />
            <span>Claude AI</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('ai_prompts'); onClose(); }}
          >
            <ChatCircleDots weight="duotone" size={18} className="plugin-icon chatgpt-color" />
            <span>ChatGPT</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('plugins'); onClose(); }}
          >
            <span className="adobe-badge ps-badge">Ps</span>
            <span>Photoshop</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('plugins'); onClose(); }}
          >
            <span className="adobe-badge pr-badge">Pr</span>
            <span>Premiere Pro</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('plugins'); onClose(); }}
          >
            <span className="adobe-badge figma-badge">❖</span>
            <span>Figma Plugin</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('plugins'); onClose(); }}
          >
            <Lightning weight="duotone" size={18} />
            <span>More plugins</span>
            <span className="sidebar-chip-badge pink">New</span>
          </button>
        </nav>

        {/* Multi-Platform Ecosystem */}
        <div className="sidebar-section-label">Platforms</div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('desktop'); onClose(); }}
          >
            <Desktop weight="duotone" size={18} />
            <span>Desktop App</span>
            <span className="sidebar-chip-badge">New</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('mobile'); onClose(); }}
          >
            <DeviceMobile weight="duotone" size={18} />
            <span>Mobile App</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('mcp'); onClose(); }}
          >
            <Cpu weight="duotone" size={18} />
            <span>MCP Server</span>
            <span className="sidebar-chip-badge pink">New</span>
          </button>
          <button
            type="button"
            className="nav-item-btn"
            onClick={() => { openModal('api'); onClose(); }}
          >
            <Code weight="duotone" size={18} />
            <span>API Docs</span>
          </button>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <ChartLineUp weight="fill" size={18} /> <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* Tools & Settings */}
        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav">
          <NavLink to="/tools/qr-code-generator" className={linkClass} onClick={onClose}>
            <QrCode weight="duotone" size={18} /> <span>QR Studio</span>
            <span className="sidebar-chip-badge pink">New</span>
          </NavLink>
          <NavLink to="/collections" className={linkClass} onClick={onClose}>
            <GridFour weight="duotone" size={18} /> <span>Collections</span>
          </NavLink>
          <NavLink to="/business" className={linkClass} onClick={onClose}>
            <Buildings weight="duotone" size={18} /> <span>Document AI</span>
          </NavLink>
          <NavLink to="/pdf-editor" className={linkClass} onClick={onClose}>
            <FilePdf weight="duotone" size={18} /> <span>PDF Editor</span>
          </NavLink>
          <NavLink to="/settings" className={linkClass} onClick={onClose}>
            <Gear weight="duotone" size={18} /> <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Upgrade Callout if not Pro */}
      {PAYMENTS_ENABLED && !isPro && (
        <div className="sidebar-pro-box">
          <NavLink to="/billing" className="sidebar-upgrade-card" onClick={onClose}>
            <div className="sidebar-upgrade-header">
              <span className="sidebar-upgrade-icon"><Crown weight="fill" /></span>
              <strong>Creator Pro</strong>
            </div>
            <p>Unlock 4K exports, unlimited AI search, and all integrations.</p>
            <span className="sidebar-upgrade-btn">Upgrade Now</span>
          </NavLink>
        </div>
      )}

      {/* Modern Sidebar Footer */}
      <div className="sidebar-footer-controls">
        <ThemeToggle />
        <button
          type="button"
          className="sidebar-footer-btn"
          title="Creator Studio"
          onClick={() => { navigate('/studio'); onClose(); }}
        >
          <PaintBrush size={16} />
        </button>
        <button
          type="button"
          className="sidebar-footer-btn"
          title="Settings"
          onClick={() => { navigate('/settings'); onClose(); }}
        >
          <DotsThree weight="bold" size={18} />
        </button>
      </div>
    </aside>
  );
}
