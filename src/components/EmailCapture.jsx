import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { submitLeadToCrm } from '../lib/crmLead';

/**
 * Email capture block — writes to the Firestore `subscribers` collection
 * (create-only per rules). Drop it on landing/blog pages with a `source` tag.
 */
export default function EmailCapture({
  source = 'site',
  title = 'Get new free templates in your inbox',
  subtitle = 'Fresh certificates, invoices and designs — plus creator tips. No spam, unsubscribe anytime.',
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | saving | done | error

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setState('error'); return; }
    setState('saving');
    submitLeadToCrm({ email: v, subject: 'Newsletter signup', source: `Email Capture — ${source}` });
    try {
      await addDoc(collection(db, 'subscribers'), { email: v, source, createdAt: serverTimestamp() });
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="email-capture done">
        <p>🎉 You're in! Watch your inbox for new free templates.</p>
      </div>
    );
  }

  return (
    <div className="email-capture">
      <div className="email-capture-copy">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <form onSubmit={submit} className="email-capture-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          autoComplete="email"
        />
        <button type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Joining…' : 'Get free templates'}
        </button>
      </form>
      {state === 'error' && <p className="email-capture-err">Please enter a valid email and try again.</p>}
    </div>
  );
}
