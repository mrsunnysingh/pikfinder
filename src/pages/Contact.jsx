import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Bug, Star, Lightbulb, Sparkle, ChatCircle } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';
import { SOCIAL_LINKS } from '../components/Footer';
import { SUPPORT_EMAIL } from '../config/socialLinks';
import { submitLeadToCrm } from '../lib/crmLead';

const CATEGORIES = [
  { value: 'Bug', label: 'Bug report', icon: Bug },
  { value: 'Review', label: 'Review', icon: Star },
  { value: 'Suggestion', label: 'Suggestion', icon: Lightbulb },
  { value: 'Feature Request', label: 'Feature request', icon: Sparkle },
  { value: 'General', label: 'General', icon: ChatCircle },
];

// Optional Google Apps Script endpoint (emails you + appends to a Google Sheet).
const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const toast = useToast();
  const [status, setStatus] = useState(null); // null | 'ok' | 'error'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', category: 'Bug', message: '' });
  const [errors, setErrors] = useState({});
  const honeypot = useRef('');    // bots fill hidden fields; humans don't
  const mountedAt = useRef(0);    // near-instant submits are usually bots
  const submitting = useRef(false); // guard against duplicate submissions

  useEffect(() => { mountedAt.current = Date.now(); }, []);

  const update = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (name.length < 2) e.name = 'Please enter your name.';
    if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address.';
    if (message.length < 10) e.message = 'Message must be at least 10 characters.';
    if (message.length > 5000) e.message = 'Message is too long (5000 characters max).';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return; // prevent duplicate submissions

    // Spam guards (silent — don't tell bots why they failed).
    const tooFast = Date.now() - mountedAt.current < 2500;
    if (honeypot.current || tooFast) {
      setStatus('ok');
      setForm({ name: '', email: '', category: 'Bug', message: '' });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus(null);
      toast('Please fix the highlighted fields', 'error');
      return;
    }

    setErrors({});
    submitting.current = true;
    setLoading(true);
    setStatus(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      category: form.category,
      message: form.message.trim(),
    };

    // Also push this submission into the connected Zoho CRM (fire-and-forget).
    submitLeadToCrm({ name: payload.name, email: payload.email, subject: `Contact: ${payload.category}`, message: payload.message, source: 'Contact Form' });

    // Firebase must be configured for the primary store. If not, try the
    // secondary endpoint below instead of dead-ending.
    let saved = false;
    let failureReason = '';

    if (db) {
      try {
        await addDoc(collection(db, 'contact_messages'), { ...payload, timestamp: serverTimestamp() });
        saved = true;
      } catch (err) {
        failureReason = err?.code || err?.message || 'firestore_error';
        console.error('[Contact] Firestore write failed:', failureReason, err);
      }
    } else {
      failureReason = 'firebase_not_configured';
      console.error('[Contact] Firestore is not configured (db is null).');
    }

    // Fallback / secondary delivery via Google Apps Script (best-effort). If the
    // primary store failed but an endpoint is configured, this becomes the delivery
    // path. no-cors can't confirm, so we treat "did not throw" as accepted.
    let endpointAttempted = false;
    if (CONTACT_ENDPOINT) {
      try {
        await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        endpointAttempted = true;
      } catch (err) {
        console.warn('[Contact] secondary endpoint failed:', err?.message || err);
      }
    }

    const delivered = saved || endpointAttempted;

    submitting.current = false;
    setLoading(false);
    if (delivered) {
      setStatus('ok');
      toast("Message sent — we'll reply soon");
      setForm({ name: '', email: '', category: 'Bug', message: '' });
      mountedAt.current = Date.now();
    } else {
      setStatus('error');
      console.error('[Contact] All delivery paths failed. Reason:', failureReason);
      toast('Could not send message. Please email us directly.', 'error');
    }
  };

  // Prefilled mailto fallback so users are never stuck if delivery fails.
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${form.category}] PikFinder contact`)}&body=${encodeURIComponent(`${form.message}\n\nFrom: ${form.name} <${form.email}>`)}`;

  return (
    <>
      <header className="page-header">
        <h1>Contact Us</h1>
        <p>Report a bug, leave a review, or suggest a feature — we read everything.</p>
      </header>

      <div className="contact-wrapper">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {/* Honeypot: hidden from users, visible to bots. Must stay empty. */}
          <input
            type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
            onChange={(e) => { honeypot.current = e.target.value; }}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />

          <div className="contact-row">
            <div className="input-group">
              <label>Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="you@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} aria-invalid={!!errors.email} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>

          <div className="input-group">
            <label>Category</label>
            <div className="category-select">
              {CATEGORIES.map((c) => (
                <button type="button" key={c.value} className={`category-option ${form.category === c.value ? 'active' : ''}`} onClick={() => update('category', c.value)}>
                  <c.icon weight={form.category === c.value ? 'fill' : 'regular'} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Message</label>
            <textarea placeholder="How can we help you today?" value={form.message} onChange={(e) => update('message', e.target.value)} rows={5} aria-invalid={!!errors.message}></textarea>
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>

          <button type="submit" className="btn-primary w-100" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }}></div> : 'Send Message'}
          </button>

          {status === 'ok' && <p className="form-status ok">Thanks! Your message was sent. We'll get back to you within 24 hours.</p>}
          {status === 'error' && (
            <p className="form-status error">
              Couldn't reach our servers right now. Please <a href={mailtoHref}>email us directly</a> and we'll get back to you.
            </p>
          )}
        </form>

        <div className="contact-social">
          <span>Or reach us on</span>
          <div className="contact-social-links">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}><Icon size={22} /></a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
