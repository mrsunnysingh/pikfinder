import React from 'react';
import { Link } from 'react-router-dom';
import { LinkedinLogo, XLogo, FacebookLogo, InstagramLogo, YoutubeLogo, PinterestLogo } from '@phosphor-icons/react';
import Logo from './Logo';
import { SOCIAL_LIST } from '../config/socialLinks';

const ICONS = { LinkedinLogo, XLogo, FacebookLogo, InstagramLogo, YoutubeLogo, PinterestLogo };

// Built from the single source of truth in src/config/socialLinks.js.
// Re-exported so existing importers (e.g. About) keep working.
export const SOCIAL_LINKS = SOCIAL_LIST.map((s) => ({ label: s.label, href: s.href, Icon: ICONS[s.icon] }));

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo">
            <Logo size={30} />
          </div>
          <p>A creator platform for discovering, editing, and organizing free media. Built for web designers, marketers, and content creators.</p>
          <div className="social-links">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}>
                <Icon weight="fill" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-links">
          <div className="link-group">
            <h4>Platform</h4>
            <Link to="/">Discover</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/studio">Creator Studio</Link>
            <Link to="/business-automation">Document Generator</Link>
            <Link to="/pdf-editor">PDF Editor</Link>
            <Link to="/tools">Free Tools</Link>
            <a href="https://www.figma.com/community/plugin/1663285303127319860" target="_blank" rel="noopener noreferrer">Figma Plugin ↗</a>
            <Link to="/waitlist">Creator Pro</Link>
          </div>
          <div className="link-group">
            <h4>Generators</h4>
            <Link to="/certificate-generator">Certificate Generator</Link>
            <Link to="/invoice-generator">Invoice Generator</Link>
            <Link to="/business-card-maker">Business Card Maker</Link>
            <Link to="/flyer-maker">Flyer Maker</Link>
            <Link to="/coupon-maker">Coupon Maker</Link>
            <Link to="/templates">All Templates</Link>
          </div>
          <div className="link-group">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/help">Help Center</Link>
            <Link to="/billing">Pricing</Link>
          </div>
          <div className="link-group">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/licenses">License Center</Link>
            <Link to="/dmca">DMCA / Copyright</Link>
          </div>
        </div>
      </div>
      <div className="footer-ph">
        <a href="https://www.producthunt.com/products/pik-finder?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-pik-finder" target="_blank" rel="noopener noreferrer">
          <img alt="Pik Finder - Find. Create. Inspire. | Product Hunt" width="250" height="54" loading="lazy"
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1204323&theme=light&t=1784799270297" />
        </a>
      </div>
      <div className="footer-bottom">
        <p className="footer-disclaimer">
          PikFinder aggregates media from third-party providers including Unsplash, Pexels, Pixabay, Openverse, and Wikimedia Commons.
          Licenses and attribution are supplied by the original source. Users are responsible for reviewing license
          terms before use. PikFinder cannot guarantee any media is free of copyright, trademark, or other rights.
        </p>
        <p>&copy; 2026 PikFinder. All rights reserved.</p>
        <p className="footer-love">Made with <span className="footer-heart" role="img" aria-label="love">💜</span> for creators, in India</p>
      </div>
    </footer>
  );
}
