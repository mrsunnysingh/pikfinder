import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Lightning,
  Rocket,
  CheckCircle,
  Image,
  CloudArrowDown,
  Palette,
  ShieldCheck,
  ArrowRight,
  Star,
  Users,
  Sparkle,
Buildings} from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { PAYMENTS_ENABLED, FOUNDING } from '../config/features';

const plans = [
  {
    id: 'free',
    name: 'Explorer',
    price: '$0',
    period: 'forever',
    description: 'Perfect for hobbyists and personal projects.',
    icon: Lightning,
    gradient: 'linear-gradient(135deg, #334155, #1e293b)',
    accentColor: '#94a3b8',
    features: [
      'Browse unlimited images',
      'Standard resolution downloads',
      'Basic search filters',
      'Wikimedia Commons access',
      'Personal use license',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaAction: 'signup',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Creator Pro',
    price: '₹499',
    period: '/year',
    description: 'Ad-free, advanced AI search, premium Creator Studio tools, and batch downloads.',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    accentColor: '#a78bfa',
    features: [
      'Everything in Explorer',
      'Remove all ads across the site',
      'Full resolution downloads',
      'Advanced AI search',
      'Curated collections access',
      'Premium Creator Studio tools',
      'Commercial use license',
      'No watermarks',
      'Batch downloads',
    ],
    cta: 'Join Waitlist',
    ctaAction: 'waitlist',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'Contact us for agencies and teams.',
    icon: Rocket,
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    accentColor: '#fb923c',
    features: [
      'Everything in Creator Pro',
      'API access (10k req/day)',
      'Team collaboration tools',
      'Custom brand collections',
      'Extended commercial license',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'Unlimited batch downloads',
      'White-label integration',
    ],
    cta: 'Contact Sales',
    ctaAction: 'contact',
    popular: false,
  },
];

const features = [
  {
    icon: Image,
    title: 'Millions of Visuals',
    description:
      'Access an ever-growing library of free-to-use, high-resolution media from trusted providers, each with clear licensing.',
    link: '/',
  },
  {
    icon: CloudArrowDown,
    title: 'Instant Downloads',
    description:
      'Download any image in full resolution with a single click. No sign-up walls, no friction.',
    link: '/',
  },
  {
    icon: Palette,
    title: 'AI-Powered Curation',
    description:
      'Our intelligent search understands aesthetics—not just keywords. Find the vibe, not just the subject.',
    link: '/collections',
  },
  {
    icon: ShieldCheck,
    title: 'Clear Licensing',
    description:
      'Every item shows its license, creator, and source. Review the terms before use — no guesswork, no false "copyright-free" claims.',
    link: '/licenses',
  },
  {
    icon: Users,
    title: 'Creator Community',
    description:
      'Join thousands of designers, marketers, and creators who trust PikFinder for their visual needs.',
    link: '/contact',
  },
  {
    icon: Sparkle,
    title: 'Premium Collections',
    description:
      'Hand-curated themed collections updated weekly by our creative team for instant inspiration.',
    link: '/collections',
  },
];

const stats = [
  { value: '2M+', label: 'Free Images' },
  { value: '150K+', label: 'Active Creators' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'User Rating' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Products() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();

  const handlePlanClick = async (plan) => {
    // Support both the new (plan object) and legacy (action string) callers.
    const id = typeof plan === 'string' ? (plan === 'contact' ? 'enterprise' : (plan === 'waitlist' ? 'pro' : 'free')) : plan.id;

    if (id === 'enterprise') { navigate('/contact'); return; }
    if (id === 'free') { isLoggedIn ? navigate('/') : toggleAuthModal('signup'); return; }

    // Creator Pro → live checkout. Payments off falls back to the waitlist.
    if (!PAYMENTS_ENABLED) { navigate('/waitlist'); return; }
    if (!isLoggedIn) { toggleAuthModal('login'); return; }
    navigate('/billing');
  };

  return (
    <div className="products-page">
      {/* Hero Section */}
      <header className="products-hero">
        <div className="products-hero-glow" />
        <motion.div
          className="products-hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="badge-dot pulse-dot" />
            <span>Our Products & Plans</span>
          </motion.div>
          <h1>
            Unlock the full power of{' '}
            <span className="text-gradient">visual discovery.</span>
          </h1>
          <p>
            From free exploration to enterprise-grade APIs—choose the plan that
            fits your creative ambition.
          </p>

          {/* Stats Bar */}
          <motion.div
            className="products-stats"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((s) => (
              <motion.div key={s.label} className="stat-pill" variants={itemVariants}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </header>

      {/* Billing Toggle */}
      <section className="billing-toggle-section">
        <div className="billing-toggle">
          <button
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingCycle === 'yearly' ? 'active' : ''}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly <span className="save-badge">Save 20%</span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <motion.section
        className="pricing-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}
      >
        
        {/* Creator Pro Waitlist Card */}
        <motion.div
          className="pricing-card popular"
          variants={itemVariants}
          whileHover={{ y: -8, transition: { duration: 0.3 } }}
        >
          <div className="popular-ribbon">
            <Star weight="fill" /> Most Popular
          </div>

          <div className="pricing-card-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
            <Sparkle size={28} weight="fill" />
          </div>

          <h3>Creator Pro</h3>
          <p className="plan-description">Everything you need to create without limits — HD exports, AI tools, and premium Studio features.</p>

          <div className="price-display">
            <span className="price-amount">₹199</span>
            <span className="price-period">/month — or ₹1,990/year</span>
          </div>

          <div style={{ marginBottom: '24px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
            Cancel anytime. Instant access after payment.
          </div>

          <ul className="feature-list">
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Ad-free experience</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Advanced AI search</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Unlimited collections</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Batch downloads</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Premium Creator Studio tools</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#ec4899' }} /> <span>Early access to new features</span></li>
          </ul>

          <button
            className="pricing-cta cta-primary"
            onClick={() => handlePlanClick({ id: 'pro', name: 'Creator Pro' })}
          >
            {PAYMENTS_ENABLED ? 'Upgrade to Pro' : 'Join Waitlist'} <ArrowRight />
          </button>
        </motion.div>

        {/* Enterprise Card */}
        <motion.div
          className="pricing-card"
          variants={itemVariants}
          whileHover={{ y: -8, transition: { duration: 0.3 } }}
        >
          <div className="pricing-card-icon" style={{ background: 'linear-gradient(135deg, #475569, #0f172a)' }}>
            <Buildings size={28} weight="fill" />
          </div>

          <h3>Enterprise</h3>
          <p className="plan-description">Custom solutions for large teams and organizations.</p>

          <div className="price-display">
            <span className="price-amount" style={{ fontSize: '1.8rem' }}>Custom</span>
          </div>

          <ul className="feature-list" style={{ marginTop: '38px' }}>
            <li><CheckCircle weight="fill" style={{ color: '#475569' }} /> <span>Everything in Creator Pro</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#475569' }} /> <span>Dedicated account manager</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#475569' }} /> <span>Custom API limits</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#475569' }} /> <span>Single Sign-On (SSO)</span></li>
            <li><CheckCircle weight="fill" style={{ color: '#475569' }} /> <span>Custom SLAs</span></li>
          </ul>

          <button
            className="pricing-cta cta-outline"
            onClick={() => window.location.href = 'mailto:enterprise@pikfinder.com'}
          >
            Contact Sales <ArrowRight />
          </button>
        </motion.div>

      </motion.section>

      {/* Features Grid */}
      <section className="products-features-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2>
            Everything you need to{' '}
            <span className="text-gradient">create without limits.</span>
          </h2>
          <p>
            PikFinder is more than a search engine—it's a creative platform built
            for modern visual storytelling.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="feature-card"
                variants={itemVariants}
                whileHover={{
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                  transition: { duration: 0.3 },
                }}
                onClick={() => navigate(feat.link)}
                style={{ cursor: 'pointer' }}
              >
                <div className="feature-icon-wrap">
                  <Icon size={28} weight="duotone" />
                </div>
                <h4>{feat.title}</h4>
                <p>{feat.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA Banner */}
      <motion.section
        className="products-cta-banner"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="cta-banner-glow" />
        <div className="cta-banner-content">
          <h2>Ready to elevate your creative workflow?</h2>
          <p>
            Join creators who trust PikFinder for stunning,
            free-to-use visuals with clear licensing.
          </p>
          <div className="cta-banner-actions">
            <button className="btn-primary" onClick={() => handlePlanClick('signup')}>
              <Rocket weight="fill" /> Get Started Free
            </button>
            <button className="btn-outline" onClick={() => navigate('/contact')}>
              Contact Sales
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
