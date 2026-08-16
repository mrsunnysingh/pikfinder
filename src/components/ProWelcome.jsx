import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkle, X } from '@phosphor-icons/react';

// Celebration overlay shown once right after a successful Pro upgrade. Confetti is
// drawn on a canvas (no dependency), and the card lists what the user just
// unlocked with a clear next action — turning the payment into a delightful
// "peak" moment that boosts activation and reduces buyer's remorse / refunds.
export default function ProWelcome({ onClose, plan }) {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#38bdf8', '#ffffff'];
    const parts = [];
    for (let i = 0; i < 170; i++) {
      parts.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.6,
        r: 5 + Math.random() * 7, c: colors[i % colors.length],
        vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4,
        rot: Math.random() * 6, vr: -0.2 + Math.random() * 0.4,
      });
    }
    let raf; const start = Date.now();
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx + Math.sin(p.y * 0.02); p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
      }
      if (Date.now() - start < 5000) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    tick();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  const perks = ['HD & watermark-free exports', 'All premium templates & fonts', 'AI tools & background removal', 'Ad-free, priority experience'];

  return (
    <div className="pro-welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Creator Pro">
      <canvas ref={canvasRef} className="pro-welcome-confetti" aria-hidden="true" />
      <div className="pro-welcome-card">
        <button className="pro-welcome-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="pro-welcome-crown"><Crown size={34} weight="fill" /></div>
        <span className="pro-welcome-eyebrow"><Sparkle size={13} weight="fill" /> {plan?.includes('yearly') ? 'Yearly' : 'Monthly'} · Creator Pro</span>
        <h2>Welcome to Creator&nbsp;Pro! 🎉</h2>
        <p>Your upgrade is live. Here's everything you just unlocked:</p>
        <ul className="pro-welcome-perks">
          {perks.map((t) => <li key={t}><Sparkle size={14} weight="fill" /> {t}</li>)}
        </ul>
        <div className="pro-welcome-actions">
          <button className="btn-primary" onClick={() => { onClose(); navigate('/studio'); }}>Start creating →</button>
          <button className="btn-outline" onClick={onClose}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
