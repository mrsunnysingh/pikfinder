import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Users,
  Clock,
  Star,
  MagnifyingGlass,
  PaintBrush,
  FolderSimple,
  ShieldCheck,
  Buildings,
  FilePdf,
  ArrowRight,
  CheckCircle,
  Lightning,
  Sparkle,
  DownloadSimple,
  Heart,
  Copy,
} from '@phosphor-icons/react';
import Hero from '../components/Hero';
import SearchFilters from '../components/SearchFilters';
import Gallery from '../components/Gallery';
import { GENERATORS } from './generators/generators';
import { PAYMENTS_ENABLED } from '../config/features';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast';

const HERO_STATS = [
  { icon: ImageIcon, value: '100M+', label: 'Free Media & Assets' },
  { icon: Users, value: '2.4M+', label: 'Global Creators' },
  { icon: Clock, value: '99.9%', label: 'Uptime & Speed' },
  { icon: Star, value: '4.9/5', label: 'User Satisfaction' },
];

const CURATED_ASSETS = [
  {
    id: 'cur-1',
    title: 'Minimal Glass Magnifying Glass 3D',
    q: '3d magnifying glass search',
    type: '3D Render',
    img: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=600&auto=format&fit=crop',
    author: 'Studio Craft',
    badge: 'Trending 3D',
  },
  {
    id: 'cur-2',
    title: 'Neon Cyberpunk Futuristic Cityscape',
    q: 'cyberpunk neon city night',
    type: 'AI Concept',
    img: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=600&auto=format&fit=crop',
    author: 'Neo Visions',
    badge: 'Popular',
  },
  {
    id: 'cur-3',
    title: 'Minimalist Clean Desk Workspace',
    q: 'minimal desk workspace modern',
    type: 'Photography',
    img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop',
    author: 'Nordic Studio',
    badge: 'Staff Pick',
  },
  {
    id: 'cur-4',
    title: 'Vibrant Abstract Holographic Gradient',
    q: 'abstract liquid gradient 4k',
    type: 'Vector/3D',
    img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
    author: 'Prism Lab',
    badge: '4K Asset',
  },
  {
    id: 'cur-5',
    title: 'Emerald Forest Misty Sunlight',
    q: 'misty nature mountain forest',
    type: 'Landscape',
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop',
    author: 'Alpine Shots',
    badge: 'High-Res',
  },
  {
    id: 'cur-6',
    title: 'Modern Architectural Geometry',
    q: 'modern architecture geometry white',
    type: 'Architecture',
    img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=600&auto=format&fit=crop',
    author: 'Urban Form',
    badge: 'Creative Safe',
  },
];

const HOME_FEATURES = [
  { icon: MagnifyingGlass, title: 'AI Search & Prompt Finder', description: 'Search across 100M+ assets with natural language prompt optimization.', link: '/search' },
  { icon: PaintBrush, title: 'Creator Studio & Canvas', description: 'Design, edit, add filters, remove backgrounds and export in 4K.', link: '/studio' },
  { icon: Buildings, title: 'Document Automation', description: 'Auto-generate bulk invoices, certificates & badges directly from Zoho CRM.', link: '/business-automation' },
  { icon: FilePdf, title: 'PDF Editor & Form Filler', description: 'Edit text, replace images & sign documents in your browser for free.', link: '/pdf-editor' },
  { icon: FolderSimple, title: 'Cloud Collections', description: 'Organize your design assets into synced team collections with 1 click.', link: '/collections' },
  { icon: ShieldCheck, title: '100% Copyright Safe', description: 'Commercial-ready licenses for YouTube, clients, advertising and websites.', link: '/licenses' },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({});
  const [type, setType] = useState('photo');

  const copyPrompt = (e, promptText) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    toast(`Copied prompt: "${promptText}"`, 'success');
  };

  return (
    <>
      {/* Magnific / Finder Hero */}
      <Hero />

      {/* Stats Bar */}
      <section className="hero-stats-bar" aria-label="PikFinder at a glance">
        {HERO_STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="hero-stat">
            <span className="icon"><Icon weight="fill" /></span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Magnific Finder Asset Explorer */}
      <section className="home-finder-explorer" aria-label="Explore Finder Images">
        <div className="finder-explorer-inner">
          <SearchFilters
            filters={filters}
            setFilters={setFilters}
            type={type}
            setType={setType}
            title="Finder Images"
          />

          {/* Curated High-Intent Asset Grid */}
          <div className="magnific-asset-grid">
            {CURATED_ASSETS.map((asset) => (
              <div
                key={asset.id}
                className="magnific-card"
                onClick={() => navigate(`/search?q=${encodeURIComponent(asset.q)}&type=${type}`)}
              >
                <div className="magnific-card-media">
                  <img src={asset.img} alt={asset.title} loading="lazy" />
                  <span className="magnific-card-badge">{asset.badge}</span>
                  <div className="magnific-card-hover-actions">
                    <button
                      type="button"
                      className="card-quick-btn"
                      title="Copy Prompt"
                      onClick={(e) => copyPrompt(e, asset.q)}
                    >
                      <Copy size={16} weight="bold" />
                      <span>Prompt</span>
                    </button>
                    <button
                      type="button"
                      className="card-quick-btn card-quick-primary"
                      title="Open in Studio"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/studio');
                      }}
                    >
                      <PaintBrush size={16} weight="bold" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <div className="magnific-card-info">
                  <strong>{asset.title}</strong>
                  <div className="magnific-card-meta">
                    <span>{asset.type}</span>
                    <span className="meta-author">by {asset.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="finder-explore-more">
            <Link to="/search" className="btn-primary finder-more-btn">
              Explore 100M+ Stock Assets <ArrowRight weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="home-features-section" aria-label="Platform features">
        <span className="section-eyebrow">{t('home.everything_you_need')}</span>
        <div className="section-header">
          <h2>{t('home.powerful_tools')}</h2>
          <p>{t('home.powerful_tools_desc')}</p>
        </div>
        <div className="features-grid">
          {HOME_FEATURES.map(({ icon: Icon, title, description, link }) => (
            <Link key={title} to={link} className="feature-card">
              <div className="feature-icon-wrap">
                <Icon size={26} weight="duotone" />
              </div>
              <h4>{title}</h4>
              <p>{description}</p>
              <ArrowRight className="card-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* Spotlight - Document Automation */}
      <section className="home-docgen" aria-label="Document automation">
        <div className="home-docgen-inner">
          <div className="home-docgen-copy">
            <span className="section-eyebrow"><Lightning weight="fill" /> New · For businesses</span>
            <h2>Turn your data into finished documents</h2>
            <p>
              Design a certificate, invoice, letter or ID card <strong>once</strong>, then generate a
              personalized copy for every client or customer. Auto-fill directly from Zoho CRM, Zoho Creator, or a
              simple spreadsheet in seconds.
            </p>
            <ul className="home-docgen-points">
              <li><CheckCircle weight="fill" /> Dynamic logos, names, dates and custom fields</li>
              <li><CheckCircle weight="fill" /> Connect to Zoho records without writing code</li>
              <li><CheckCircle weight="fill" /> Bulk export high-resolution PDF and PNG files</li>
            </ul>
            <Link to="/business-automation" className="btn-primary home-docgen-cta">
              Try the Document Generator <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-docgen-visual" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`docgen-card docgen-card-${i}`}>
                <span className="docgen-logo" />
                <span className="docgen-line docgen-line-lg" />
                <span className="docgen-line" />
                <span className="docgen-line docgen-line-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlight - Creator Studio */}
      <section className="home-docgen home-studio" aria-label="Creator Studio">
        <div className="home-docgen-inner">
          <div className="home-docgen-visual home-studio-visual" aria-hidden="true">
            <div className="studio-mock">
              <div className="studio-mock-bar"><span /><span /><span /></div>
              <div className="studio-mock-canvas">
                <span className="studio-mock-head" />
                <span className="studio-mock-line" />
                <span className="studio-mock-line short" />
                <span className="studio-mock-cta" />
              </div>
            </div>
          </div>
          <div className="home-docgen-copy">
            <span className="section-eyebrow"><PaintBrush weight="fill" /> Design studio</span>
            <h2>Design anything, right in your browser</h2>
            <p>
              A fast, browser-based editor packed with clean templates, curated fonts, photo filters, custom shadows,
              and instant background removal, ready for crisp HD exports.
            </p>
            <ul className="home-docgen-points">
              <li><CheckCircle weight="fill" /> 90+ designer templates and 55 curated fonts</li>
              <li><CheckCircle weight="fill" /> Effects: glows, shadows, glass styling and gradients</li>
              <li><CheckCircle weight="fill" /> Sharp exports in PNG, SVG and PDF formats</li>
            </ul>
            <Link to="/studio" className="btn-primary home-docgen-cta">
              Open Creator Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Free generators & makers */}
      <section className="home-generators" aria-label="Free generators">
        <div className="section-header">
          <h2>Free generators &amp; makers</h2>
          <p>Create certificates, invoices, flyers and cards in minutes: 100% free with no signup needed.</p>
        </div>
        <div className="home-gen-grid">
          {GENERATORS.map((g) => (
            <Link key={g.slug} to={`/${g.slug}`} className="home-gen-chip">{g.name}</Link>
          ))}
          <Link to="/templates" className="home-gen-chip home-gen-all">Browse all templates →</Link>
        </div>
      </section>

      {/* Call to action */}
      <section className="home-pricing" aria-label={PAYMENTS_ENABLED ? 'Pricing' : 'Get Started'}>
        <h2>{PAYMENTS_ENABLED ? t('home.ready_for_more') : 'Ready to start creating?'}</h2>
        <p>
          {PAYMENTS_ENABLED
            ? t('home.ready_for_more_desc')
            : 'Explore millions of free visual assets, templates, and creative tools — 100% free.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {PAYMENTS_ENABLED ? (
            <>
              <Link to="/billing" className="btn-primary">
                Upgrade to Creator Pro
              </Link>
              <Link to="/products" className="btn-outline">{t('home.see_pricing')}</Link>
            </>
          ) : (
            <>
              <Link to="/studio" className="btn-primary">
                Launch Creator Studio
              </Link>
              <Link to="/tools" className="btn-outline">Explore Free Tools</Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}
