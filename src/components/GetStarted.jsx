import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, PaintBrush, Wrench, Check, X } from '@phosphor-icons/react';

// Activation checklist for new users. Getting a user to do 2–3 core actions in
// their first session is the single biggest driver of retention, so we surface a
// simple, dismissible "Get started" card and track progress in localStorage.
const KEY = 'pf-getstarted';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ } };

export default function GetStarted() {
  const navigate = useNavigate();
  const [state, setState] = useState(load);

  if (state.dismissed) return null;

  const steps = [
    { id: 'search', icon: MagnifyingGlass, title: 'Search free assets', body: 'Find photos, videos & icons from 5 libraries at once.', to: '/search' },
    { id: 'studio', icon: PaintBrush, title: 'Open Creator Studio', body: 'Design something in the browser — no signup walls.', to: '/studio' },
    { id: 'tool', icon: Wrench, title: 'Try a free tool', body: 'Compress, convert, remove a background or edit a PDF.', to: '/tools' },
  ];
  const done = steps.filter((s) => state[s.id]).length;
  if (done === steps.length) return null; // all done — retire the card

  const go = (s) => { const next = { ...state, [s.id]: true }; setState(next); save(next); navigate(s.to); };
  const dismiss = () => { const next = { ...state, dismissed: true }; setState(next); save(next); };

  return (
    <section className="gs-card">
      <button className="gs-x" onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
      <div className="gs-head">
        <div>
          <h2>Get started with PikFinder</h2>
          <p>{done} of {steps.length} done — finish these to get the most out of it.</p>
        </div>
      </div>
      <div className="gs-bar"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <div className="gs-steps">
        {steps.map((s) => {
          const Icon = s.icon; const complete = !!state[s.id];
          return (
            <button key={s.id} className={`gs-step ${complete ? 'done' : ''}`} onClick={() => go(s)}>
              <span className="gs-step-icon">{complete ? <Check weight="bold" /> : <Icon weight="duotone" />}</span>
              <span className="gs-step-text"><strong>{s.title}</strong><span>{s.body}</span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
