import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, X } from '@phosphor-icons/react';

// A single, app-wide "upgrade to Pro" modal. Any Pro gate can trigger it without
// prop-drilling by calling showUpgradeNudge('reason text'). Catching users at the
// exact moment they hit a paywall is one of the highest-converting nudges.
export function showUpgradeNudge(reason) {
  window.dispatchEvent(new CustomEvent('pf:upgrade-nudge', { detail: { reason } }));
}

export default function UpgradeNudge() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => { setReason(e.detail?.reason || ''); setOpen(true); };
    window.addEventListener('pf:upgrade-nudge', h);
    return () => window.removeEventListener('pf:upgrade-nudge', h);
  }, []);

  if (!open) return null;
  return (
    <div className="unudge-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
      <div className="unudge-card" onClick={(e) => e.stopPropagation()}>
        <button className="unudge-x" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        <div className="unudge-crown"><Crown size={30} weight="fill" /></div>
        <h3>Unlock this with Creator Pro</h3>
        <p>{reason || 'This is a Pro feature. Upgrade for HD exports, premium templates, AI tools and an ad-free experience.'}</p>
        <button className="btn-primary unudge-cta" onClick={() => { setOpen(false); navigate('/billing'); }}>See Pro plans →</button>
        <button className="unudge-later" onClick={() => setOpen(false)}>Not now</button>
      </div>
    </div>
  );
}
