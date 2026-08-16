import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, List, X } from '@phosphor-icons/react';
import Logo from './Logo';
import { AppContext } from '../context/AppContext';
import ThemeToggle from './ThemeToggle';
import { SOCIAL_LINKS } from './Footer';

const NAV_ITEMS = [
  { to: '/', label: 'Discover', end: true },
  { to: '/templates', label: 'Templates' },
  { to: '/studio', label: 'Studio', badge: 'Beta' },
  { to: '/business-automation', label: 'Documents', badge: 'New' },
  { to: '/tools', label: 'Free Tools' },
  { to: '/products', label: 'Pricing' },
];

export default function Navbar() {
  const { isLoggedIn, user, toggleAuthModal, logoutUser, favorites } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close menu if window resizes to desktop to prevent permanent scroll lock
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <Logo size={30} />
      </Link>

      <div className="nav-links">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}

        <ThemeToggle />
        {!isLoggedIn ? (
          <div className="auth-buttons">
            <button className="btn-text" onClick={() => toggleAuthModal('login')}>Log In</button>
            <button className="btn-primary" onClick={() => toggleAuthModal('signup')}>Sign Up</button>
          </div>
        ) : (
          <div className="user-profile">
            <button
              className="btn-icon favorites-nav-btn"
              title="My Favorites"
              onClick={() => navigate('/favorites')}
              style={{ position: 'relative' }}
            >
              <Heart weight="fill" />
              {favorites.length > 0 && (
                <span className="fav-count-badge">{favorites.length}</span>
              )}
            </button>
            <div className="avatar-circle" title="Logout" onClick={logoutUser} style={{ cursor: 'pointer' }}>
              {user?.photoURL ? <img src={user.photoURL} alt="" /> : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </div>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="nav-mobile-controls">
        <ThemeToggle />
        <button
          className="nav-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X weight="bold" /> : <List weight="bold" />}
        </button>
      </div>

      {/* Mobile slide-in menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="mobile-menu-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>About Us</NavLink>
          {isLoggedIn && <NavLink to="/favorites" onClick={() => setMenuOpen(false)}>My Favorites</NavLink>}
        </div>

        <div className="mobile-menu-footer">
          <div className="mobile-menu-social">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}>
                <Icon size={22} />
              </a>
            ))}
          </div>
          {!isLoggedIn ? (
            <div className="mobile-auth">
              <button className="btn-outline" onClick={() => { setMenuOpen(false); toggleAuthModal('login'); }}>Log In</button>
              <button className="btn-primary" onClick={() => { setMenuOpen(false); toggleAuthModal('signup'); }}>Sign Up</button>
            </div>
          ) : (
            <button className="btn-outline" onClick={() => { setMenuOpen(false); logoutUser(); }}>Log Out</button>
          )}
        </div>
      </div>

      {menuOpen && <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
