// src/pages/Billing.jsx
// Professional payment / upgrade page (/billing). Shows the current plan, and for
// free users a polished Creator Pro pricing card with a monthly/yearly toggle,
// feature list, trust row, and Razorpay checkout. Requires sign-in.

import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Crown, Check, ShieldCheck, Lightning, Sparkle, Lock } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useSeo } from '../hooks/useSeo';
import RazorpayButton from '../components/RazorpayButton';
import ProWelcome from '../components/ProWelcome';

const SITE_URL = 'https://www.pikfinder.com';

const PRO_FEATURES = [
  'Unlimited HD & 4K exports',
  'All premium templates & fonts',
  'AI background generation',
  'One-click background removal & blur',
  'PDF editor pro tools',
  'Ad-free experience',
  'Priority support',
];

// Amounts are in the currency's smallest unit (paise for INR, cents for USD).
const PRICING = {
  INR: {
    monthly: { amount: 19900, label: '₹199', per: '/month', note: 'Billed monthly' },
    yearly: { amount: 199000, label: '₹1,990', per: '/year', note: '2 months free · ₹166/mo' },
  },
  USD: {
    monthly: { amount: 400, label: '$4', per: '/month', note: 'Billed monthly' },
    yearly: { amount: 3900, label: '$39', per: '/year', note: '2 months free · $3.25/mo' },
  },
};

export default function Billing() {
  const { isLoggedIn, user, toggleAuthModal } = useContext(AppContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState('yearly');
  const [currency, setCurrency] = useState('INR');

  useSeo({ title: 'Pricing — Creator Pro | PikFinder', description: 'Unlock HD exports, premium templates, AI tools and an ad-free experience. Secure checkout with UPI, cards and netbanking via Razorpay.', canonical: `${SITE_URL}/billing` });

  // Pricing is public: logged-out visitors see the full plan + prices, and the
  // CTA prompts sign-up (checkout itself needs an account).
  const isPremium = isLoggedIn && !!user?.isPremium;
  const sub = user?.subscription;
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
  const endDate = sub?.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : null;
  const planLabel = sub?.plan?.includes('yearly') ? 'Yearly' : sub?.plan?.includes('monthly') ? 'Monthly' : (sub?.plan || 'Creator Pro');
  // Lapsed: they had a subscription but it has expired (so isPremium is now false).
  const lapsed = !isPremium && isLoggedIn && sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() < Date.now();
  const justPaid = params.get('checkout') === 'success' || params.get('paid') === '1';
  // Celebrate a fresh upgrade once — shown after the payment redirect.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => { if (justPaid) setShowWelcome(true); }, [justPaid]);
  const plan = PRICING[currency][period];

  const manage = () => {
    toast('To change or cancel your plan, contact support and we’ll sort it out.', 'info');
  };

  return (
    <div className="pay-wrap">
      {showWelcome && <ProWelcome plan={sub?.plan} onClose={() => setShowWelcome(false)} />}
      <header className="pay-head">
        <span className="pay-eyebrow"><Crown size={15} weight="fill" /> Creator Pro</span>
        <h1>{isPremium ? 'You’re on Creator Pro' : 'Do more with Creator Pro'}</h1>
        <p className="pay-sub">
          {isPremium
            ? 'Thanks for supporting PikFinder — all Pro features are unlocked.'
            : 'Unlock HD exports, premium templates, AI tools and an ad-free experience.'}
        </p>
      </header>

      {justPaid && (
        <div className="pay-banner ok"><Check weight="bold" /> Payment received — your Creator Pro access is now active. Thank you!</div>
      )}

      {lapsed && (
        <div className="pay-banner warn">Your Creator Pro plan expired on <strong>{fmtDate(sub.currentPeriodEnd)}</strong>. You’re on the free plan now — renew below to unlock Pro again.</div>
      )}

      {isPremium ? (
        <div className="pay-status-card">
          <div className="pay-status-row">
            <div className="pay-status-badge"><Crown size={22} weight="fill" /></div>
            <div>
              <b>Creator Pro — {planLabel}</b>
              <span>Status: {sub?.status || 'active'}{sub?.cancelAtPeriodEnd ? ' · cancels at period end' : ''}</span>
              {endDate && (
                <span>{sub?.cancelAtPeriodEnd ? 'Access until' : 'Renews on'} <strong>{endDate}</strong></span>
              )}
            </div>
          </div>
          <div className="pay-status-actions">
            <button className="btn-primary" onClick={manage} disabled={busy}>Manage plan</button>
            <button className="btn-outline" onClick={() => navigate('/studio')}>Open Studio</button>
          </div>
        </div>
      ) : (
        <div className="pay-grid">
          {/* Pricing / checkout card */}
          <div className="pay-card featured">
            <div className="pay-offer">🎉 Launch offer — save 20% on the yearly plan</div>
            <div className="pay-card-top">
              <div className="pay-plan-name">Creator Pro</div>
              <div className="pay-currency" role="tablist" aria-label="Currency">
                <button role="tab" aria-selected={currency === 'INR'} className={currency === 'INR' ? 'on' : ''} onClick={() => setCurrency('INR')}>🇮🇳 INR</button>
                <button role="tab" aria-selected={currency === 'USD'} className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>🌍 USD</button>
              </div>
            </div>
            <div className="pay-toggle" role="tablist" aria-label="Billing period">
              <button role="tab" aria-selected={period === 'monthly'} className={period === 'monthly' ? 'on' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
              <button role="tab" aria-selected={period === 'yearly'} className={period === 'yearly' ? 'on' : ''} onClick={() => setPeriod('yearly')}>Yearly <span className="pay-save">Save 20%</span></button>
            </div>

            <div className="pay-price">
              <span className="pay-amount">{plan.label}</span>
              <span className="pay-per">{plan.per}</span>
            </div>
            <div className="pay-price-note">{plan.note}</div>

            {isLoggedIn ? (
              <RazorpayButton
                amount={plan.amount}
                currency={currency}
                recurring
                plan={`creator-pro-${period}`}
                description={`PikFinder Creator Pro — ${period === 'yearly' ? 'Yearly' : 'Monthly'}`}
                label={`Upgrade — ${plan.label}${plan.per}`}
                className="btn-primary pay-cta"
                onPaid={() => {
                  // Entitlement is granted server-side; reload so the app re-fetches
                  // the user doc and unlocks Pro, and show the success banner.
                  setTimeout(() => { window.location.href = '/billing?paid=1'; }, 900);
                }}
              />
            ) : (
              <button className="btn-primary pay-cta" onClick={() => toggleAuthModal('signup')}>
                Sign up to upgrade — {plan.label}{plan.per}
              </button>
            )}

            <div className="pay-trust">
              <span><Lock size={14} weight="fill" /> Secure checkout</span>
              <span><ShieldCheck size={14} weight="fill" /> UPI · Cards · Netbanking</span>
              <span><Check size={14} weight="bold" /> Cancel anytime</span>
            </div>
            <div className="pay-social">
              <span className="pay-stars">★★★★★</span> Loved by designers, marketers &amp; small businesses
            </div>
            <div className="pay-powered">Payments secured by Razorpay · No hidden fees</div>
          </div>

          {/* Features */}
          <div className="pay-card">
            <div className="pay-feat-title"><Sparkle size={17} weight="fill" /> Everything in Pro</div>
            <ul className="pay-features">
              {PRO_FEATURES.map((f) => (
                <li key={f}><span className="pay-check"><Check size={13} weight="bold" /></span>{f}</li>
              ))}
            </ul>
            <div className="pay-guarantee"><Lightning size={15} weight="fill" /> Cancel anytime. Instant access after payment.</div>
          </div>
        </div>
      )}

      <p className="pay-fineprint">
        Prices in {currency}. International cards are accepted at checkout. By upgrading you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        Need help? <Link to="/contact">Contact us</Link>.
      </p>
    </div>
  );
}
