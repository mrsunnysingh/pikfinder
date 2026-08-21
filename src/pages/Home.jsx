import React from 'react';
import { Link } from 'react-router-dom';
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
} from '@phosphor-icons/react';
import Hero from '../components/Hero';
import { GENERATORS } from './generators/generators';
import { PAYMENTS_ENABLED } from '../config/features';
import { useTranslation } from 'react-i18next';

const HERO_STATS = [
  { icon: ImageIcon, value: '100M+', label: 'Free Media' },
  { icon: Users, value: '2M+', label: 'Creators' },
  { icon: Clock, value: '99.9%', label: 'Uptime' },
  { icon: Star, value: '4.9', label: 'User Rating' },
];

const HOME_FEATURES = [
  { icon: MagnifyingGlass, title: 'AI Search', description: 'Describe what you need in natural language.', link: '/search?q=nature%20landscape' },
  { icon: PaintBrush, title: 'Creator Studio', description: 'Edit, design and export like a pro.', link: '/studio' },
  { icon: Buildings, title: 'Document Generator', description: 'Generate certificates & invoices from Zoho CRM.', link: '/business-automation' },
  { icon: FilePdf, title: 'PDF Editor', description: 'Edit text & images in any PDF, free in your browser.', link: '/pdf-editor' },
  { icon: FolderSimple, title: 'Collections', description: 'Organize, save and access your favorites.', link: '/collections' },
  { icon: ShieldCheck, title: 'Safe & Licensed', description: '100% copyright-safe content for your projects.', link: '/licenses' },
];

// Small curated preview strip — links straight into the search page.
const SHOWCASE = [
  { q: 'minimal workspace', img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop' },
  { q: 'moody nature', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop' },
  { q: 'abstract gradient', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop' },
  { q: 'city architecture', img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=600&auto=format&fit=crop' },
  { q: 'ocean waves', img: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop' },
  { q: 'neon night', img: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=600&auto=format&fit=crop' },
];

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Hero />

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

      {/* Curated preview — each tile deep-links into the search page */}
      <section className="home-showcase" aria-label="Popular searches">
        <span className="section-eyebrow">{t('home.trending_now')}</span>
        <div className="section-header">
          <h2>{t('home.explore_creators_love')}</h2>
          <p>{t('home.explore_creators_love_desc')}</p>
        </div>
        <div className="showcase-grid">
          {SHOWCASE.map(({ q, img }) => (
            <Link key={q} to={`/search?q=${encodeURIComponent(q)}`} className="showcase-tile" aria-label={`Search ${q}`}>
              <img src={img} alt={q} loading="lazy" />
              <span className="showcase-label">{q}</span>
            </Link>
          ))}
        </div>
      </section>

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

      {/* Spotlight — the document automation flagship */}
      <section className="home-docgen" aria-label="Document automation">
        <div className="home-docgen-inner">
          <div className="home-docgen-copy">
            <span className="section-eyebrow"><Lightning weight="fill" /> New · For businesses</span>
            <h2>Turn your data into finished documents</h2>
            <p>
              Design a certificate, invoice, letter or ID card <strong>once</strong> — then generate a
              personalised, on-brand copy for every customer. Auto-fill from Zoho CRM &amp; Creator, or a
              spreadsheet. One document or a thousand, in a single click.
            </p>
            <ul className="home-docgen-points">
              <li><CheckCircle weight="fill" /> Dynamic logo, names &amp; any field</li>
              <li><CheckCircle weight="fill" /> Auto-fill from Zoho — no coding</li>
              <li><CheckCircle weight="fill" /> Bulk generate &amp; export as PDF or PNG</li>
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

      {/* Spotlight — Creator Studio */}
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
              A full design editor with premium templates, pro fonts, photo filters, shadows,
              glassmorphism, AI backgrounds and one-click background removal — then export in crisp HD.
            </p>
            <ul className="home-docgen-points">
              <li><CheckCircle weight="fill" /> 90+ premium templates &amp; 55 pro fonts</li>
              <li><CheckCircle weight="fill" /> Effects: glow, shadow, glass &amp; gradients</li>
              <li><CheckCircle weight="fill" /> Always-HD PNG, SVG &amp; PDF export</li>
            </ul>
            <Link to="/studio" className="btn-primary home-docgen-cta">
              Open Creator Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-generators" aria-label="Free generators">
        <div className="section-header">
          <h2>Free generators &amp; makers</h2>
          <p>Create certificates, invoices, flyers and more in minutes — free, no signup.</p>
        </div>
        <div className="home-gen-grid">
          {GENERATORS.map((g) => (
            <Link key={g.slug} to={`/${g.slug}`} className="home-gen-chip">{g.name}</Link>
          ))}
          <Link to="/templates" className="home-gen-chip home-gen-all">Browse all templates →</Link>
        </div>
      </section>

      <section className="home-pricing" aria-label="Pricing">
        <h2>{t('home.ready_for_more')}</h2>
        <p>
          {t('home.ready_for_more_desc')}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={PAYMENTS_ENABLED ? '/billing' : '/waitlist'} className="btn-primary">
            {PAYMENTS_ENABLED ? 'Upgrade to Creator Pro' : 'Join the Pro Waitlist'}
          </Link>
          <Link to="/products" className="btn-outline">{t('home.see_pricing')}</Link>
        </div>
      </section>
    </>
  );
}
