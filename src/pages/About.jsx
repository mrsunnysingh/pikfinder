import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkle, Lightning, ShieldCheck, Heart, ArrowRight } from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL, TOOLS } from '../tools/registry';
import { SOCIAL_LINKS } from '../components/Footer';

const VALUES = [
  { Icon: Sparkle, title: 'Creator-first', body: 'Every feature is shaped by the daily reality of designers, marketers, and content creators, not a checklist of corporate buzzwords.' },
  { Icon: ShieldCheck, title: 'Private by design', body: 'Our free tools run entirely in your browser. Your files never leave your device, so there is nothing for us to store or leak.' },
  { Icon: Lightning, title: 'Fast and free', body: 'No sign-up walls, no watermarks, no rate limits. If a tool is useful, it should just work instantly.' },
  { Icon: Heart, title: 'Copyright-safe', body: 'We surface content from trusted providers with clear licensing for reuse, so you can ship projects without second-guessing.' },
];

export default function About() {
  useSeo({
    title: 'About PikFinder: The Story Behind the Toolkit',
    description: 'PikFinder is a designer-focused asset discovery platform with free browser-based image tools. Learn about our mission, values, and why we build for creators.',
    canonical: `${SITE_URL}/about`,
  });

  return (
    <>
      <header className="page-header">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Built for people who make things.
        </motion.h1>
        <p>
          PikFinder started as a project to solve our own everyday friction: having a single place to find free imagery,
          convert stubborn file formats, and generate quick design assets without opening dozens of tabs full of sign-up prompts.
        </p>
      </header>

      <section className="about-section">
        <div className="about-grid">
          <div>
            <h2>Our mission</h2>
            <p>
              We believe design tooling should be accessible to everyone. Creators shouldn't have to
              pay a monthly subscription just to resize an image, convert a HEIC file, or upload personal photos
              to a third-party server. We built {TOOLS.length}+ fast tools
              that run client-side in your browser, paired with a copyright-safe media search.
            </p>
            <p>
              No mandatory accounts. No watermarks. No surprise paywalls. If it helps you finish your project faster, we
              did our job.
            </p>
            <Link to="/tools" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Explore the toolkit <ArrowRight weight="bold" />
            </Link>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <div className="stat-number">{TOOLS.length}+</div>
              <div className="stat-label">Free tools, no sign-up</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">In-browser processing</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0 ₹</div>
              <div className="stat-label">Cost to get started</div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2 style={{ textAlign: 'center', marginBottom: 32 }}>What we care about</h2>
        <div className="values-grid">
          {VALUES.map(({ Icon, title, body }) => (
            <div key={title} className="value-card">
              <div className="value-icon"><Icon size={28} weight="duotone" /></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section about-cta">
        <h2>Say hello</h2>
        <p>
          We read every message. Feedback, tool suggestions, partnership ideas, or just saying hello:
          you are always welcome to reach out.
        </p>
        <div className="about-social">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="about-social-link">
              <Icon weight="fill" size={22} /> <span>{label}</span>
            </a>
          ))}
        </div>
        <Link to="/contact" className="btn-outline" style={{ marginTop: 24 }}>
          Or email the team →
        </Link>
      </section>
    </>
  );
}
