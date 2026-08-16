// src/pages/Waitlist.jsx
// Founding-member waitlist (/waitlist). Stores signups in Firestore waitlist/{id},
// best-effort posts to an email/Sheets endpoint, and logs an analytics event.

import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Rocket, Check } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';
import { useSeo } from '../hooks/useSeo';
import { submitLeadToCrm } from '../lib/crmLead';
import { trackWaitlist } from '../lib/analytics';
import { FOUNDING } from '../config/features';
import { SUPPORT_EMAIL } from '../config/socialLinks';

const SITE_URL = 'https://pikfinder.com';
const WAITLIST_ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT; // optional Apps Script
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROFESSIONS = ['Social media content', 'Graphic design', 'YouTube', 'Freelancing', 'Business', 'Marketing', 'Other'];
const FEATURES = ['AI search', 'Creator Studio', 'Background remover', 'Batch downloads', 'Premium assets'];

const PERKS = ['Ad-free experience', 'Advanced AI search', 'Creator Studio tools', 'Batch downloads', 'Premium collections', 'Early access features'];

export default function Waitlist() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', profession: '', useCase: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const honeypot = useRef('');
  const mountedAt = useRef(0);
  const submitting = useRef(false);

  useEffect(() => { mountedAt.current = Date.now(); }, []);

  useSeo({
    title: 'Join the PikFinder Creator Pro Waitlist — Founding Members',
    description: 'Be one of the first 100 founding members of PikFinder Creator Pro: ad-free, advanced AI search, Creator Studio, batch downloads, and premium collections. Early access ' + FOUNDING.priceLabel + '.',
    canonical: `${SITE_URL}/waitlist`,
  });

  const update = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.profession) e.profession = 'Pick one.';
    if (!form.useCase) e.useCase = 'Pick one.';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;

    const tooFast = Date.now() - mountedAt.current < 1500;
    if (honeypot.current || tooFast) { setDone(true); return; }

    const v = validate();
    if (Object.keys(v).length) { setErrors(v); toast('Please complete the highlighted fields', 'error'); return; }

    submitting.current = true;
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      profession: form.profession,
      useCase: form.useCase,
      source: 'waitlist_page',
    };

    // Push into the connected Zoho CRM as a lead (fire-and-forget).
    submitLeadToCrm({ name: payload.name, email: payload.email, subject: `Pro Waitlist — ${payload.profession || ''}`, message: payload.useCase || '', source: 'Pro Waitlist' });

    let saved = false;
    if (db) {
      try {
        await addDoc(collection(db, 'waitlist'), { ...payload, createdAt: serverTimestamp() });
        saved = true;
      } catch (err) {
        console.error('[Waitlist] Firestore write failed:', err?.code || '', err?.message || err);
      }
    } else {
      console.error('[Waitlist] Firestore not configured (db is null).');
    }

    // Best-effort: email + Google Sheets via Apps Script (no-cors, can't confirm).
    let endpointAttempted = false;
    if (WAITLIST_ENDPOINT) {
      try {
        await fetch(WAITLIST_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        endpointAttempted = true;
      } catch (err) {
        console.warn('[Waitlist] endpoint failed:', err?.message || err);
      }
    }

    trackWaitlist(form.profession, form.useCase);

    submitting.current = false;
    setLoading(false);
    if (saved || endpointAttempted) {
      setDone(true);
    } else {
      toast('Could not join right now — please email us.', 'error');
    }
  };

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('PikFinder waitlist')}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nI create: ${form.profession}\nMost interested in: ${form.useCase}`)}`;

  if (done) {
    return (
      <div className="legal-container" style={{ paddingTop: 'calc(var(--nav-height) + 48px)', textAlign: 'center' }}>
        <div className="waitlist-done">
          <Check size={40} weight="bold" />
          <h1>You're on the list! 🎉</h1>
          <p>Thanks for joining the PikFinder Creator Pro waitlist. We'll email you the moment founding-member access opens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-container waitlist-page" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
      <header className="page-header" style={{ padding: 0, marginBottom: 20, textAlign: 'center' }}>
        <h1>Creator Pro — Coming Soon 🚀</h1>
        <p>Join the waitlist. Limited to the first {FOUNDING.seats} founding members · Early access {FOUNDING.priceLabel}.</p>
      </header>

      <ul className="waitlist-perks">
        {PERKS.map((p) => <li key={p}><Check size={16} weight="bold" /> {p}</li>)}
      </ul>

      <form className="contact-form waitlist-form" onSubmit={submit} noValidate>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          onChange={(e) => { honeypot.current = e.target.value; }} style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

        <div className="contact-row">
          <div className="input-group">
            <label>Name</label>
            <input type="text" placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} aria-invalid={!!errors.email} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>

        <div className="input-group">
          <label>What do you create?</label>
          <div className="category-select">
            {PROFESSIONS.map((p) => (
              <button type="button" key={p} className={`category-option ${form.profession === p ? 'active' : ''}`} onClick={() => update('profession', p)}>{p}</button>
            ))}
          </div>
          {errors.profession && <span className="field-error">{errors.profession}</span>}
        </div>

        <div className="input-group">
          <label>Which feature interests you most?</label>
          <div className="category-select">
            {FEATURES.map((f) => (
              <button type="button" key={f} className={`category-option ${form.useCase === f ? 'active' : ''}`} onClick={() => update('useCase', f)}>{f}</button>
            ))}
          </div>
          {errors.useCase && <span className="field-error">{errors.useCase}</span>}
        </div>

        <button type="submit" className="btn-primary w-100" disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }} /> : <><Rocket size={18} weight="fill" /> Join the waitlist</>}
        </button>
        <p className="studio-hint" style={{ textAlign: 'center' }}>Trouble submitting? <a href={mailtoHref}>Email us to join</a>.</p>
      </form>
    </div>
  );
}
