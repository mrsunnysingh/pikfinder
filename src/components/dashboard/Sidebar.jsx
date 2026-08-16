import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../Logo';
import { AppContext } from '../../context/AppContext';
import {
  House, SquaresFour, Heart, PaintBrush, DownloadSimple, ClockCounterClockwise, Gear,
  EnvelopeSimple, GridFour, InstagramLogo, TwitterLogo, GithubLogo, Crown, Buildings, FilePdf,
  ChartLineUp, X
} from '@phosphor-icons/react';

// Set VITE_ADMIN_UID (your Firebase uid) in Vercel to reveal the Admin link.
// Security is still enforced server-side; this only decides who sees the link.
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || '';

const SOCIALS = {
  instagram: 'https://instagram.com/pikfinder',
  twitter: 'https://twitter.com/pikfinder',
  github: 'https://github.com/mrsunnysingh/pikfinder',
};

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user } = useContext(AppContext);
  const isAdmin = ADMIN_UID && user?.uid === ADMIN_UID;
  const isPro = !!user?.isPremium || !!user?.isAdmin || isAdmin; // hide upsell for these
  const linkClass = ({ isActive }) => (isActive ? 'nav-item active' : 'nav-item');

  return (
    <aside className={`dashboard-sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="logo" onClick={onClose}>
          <Logo size={28} />
        </NavLink>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <X weight="bold" />
        </button>
      </div>

      <div className="sidebar-scrollable">
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={linkClass} end>
            <House weight="fill" /> Home
          </NavLink>
          <NavLink to="/collections" className={linkClass}>
            <SquaresFour /> Collections
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            <Heart /> Favorites
          </NavLink>
          <NavLink to="/studio" className={linkClass}>
            <PaintBrush /> Creator Studio
          </NavLink>
          <NavLink to="/business" className={linkClass}>
            <Buildings /> Document Generator
          </NavLink>
          <NavLink to="/pdf-editor" className={linkClass}>
            <FilePdf /> PDF Editor
          </NavLink>
          <NavLink to="/dashboard#downloads" className="nav-item">
            <DownloadSimple /> Downloads
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            <ClockCounterClockwise /> AI Search History
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            <Gear /> Settings
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <ChartLineUp weight="fill" /> Admin
            </NavLink>
          )}
        </nav>

        <div className="sidebar-section-label">Tools</div>
        <nav className="sidebar-nav">
          <NavLink to="/backgrounds" className={linkClass}>
            <PaintBrush /> Backgrounds
          </NavLink>
          <NavLink to="/gradient" className={linkClass}>
            <GridFour /> Gradient
          </NavLink>
          <NavLink to="/tools" className={linkClass}>
            <GridFour /> Free Tools
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            <EnvelopeSimple /> Contact
          </NavLink>
        </nav>
      </div>

      {!isPro && (
        <NavLink to="/billing" className="sidebar-upgrade">
          <span className="sidebar-upgrade-icon"><Crown weight="fill" /></span>
          <strong>Upgrade to Pro</strong>
          <span>Unlimited downloads, premium tools, and more.</span>
          <span className="sidebar-upgrade-btn">Upgrade Now</span>
        </NavLink>
      )}

      <div className="sidebar-footer sidebar-socials">
        <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="icon-btn-small" title="Instagram"><InstagramLogo /></a>
        <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="icon-btn-small" title="Twitter"><TwitterLogo /></a>
        <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer" className="icon-btn-small" title="GitHub"><GithubLogo /></a>
      </div>
    </aside>
  );
}
