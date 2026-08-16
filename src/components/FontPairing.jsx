import React, { useState } from 'react';
import { TextAa, Copy, Check } from '@phosphor-icons/react';
import { useToast } from './Toast';

// Curated pairings from the product spec, extended with a couple extras.
const PAIRINGS = [
  { style: 'Corporate', heading: 'Inter', body: 'Open Sans' },
  { style: 'Luxury', heading: 'Playfair Display', body: 'Inter' },
  { style: 'Creative', heading: 'Poppins', body: 'Nunito' },
  { style: 'Modern', heading: 'Space Grotesk', body: 'Inter' },
  { style: 'Minimal', heading: 'Manrope', body: 'Work Sans' },
];

export default function FontPairing() {
  const toast = useToast();
  const [active, setActive] = useState('Corporate');
  const [copied, setCopied] = useState(false);
  const pair = PAIRINGS.find(p => p.style === active) || PAIRINGS[0];

  const copyCss = async () => {
    const css = `--font-heading: '${pair.heading}', sans-serif;\n--font-body: '${pair.body}', sans-serif;`;
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      toast('Font CSS copied');
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="font-section">
      <div className="section-title">
        <TextAa weight="fill" /> Font pairing
      </div>

      <div className="font-style-tabs">
        {PAIRINGS.map(p => (
          <button
            key={p.style}
            className={`font-tab ${active === p.style ? 'active' : ''}`}
            onClick={() => setActive(p.style)}
          >
            {p.style}
          </button>
        ))}
      </div>

      <div className="font-preview">
        <div className="font-line">
          <span className="font-role">Heading</span>
          <span className="font-name">{pair.heading}</span>
        </div>
        <div className="font-line">
          <span className="font-role">Body</span>
          <span className="font-name">{pair.body}</span>
        </div>
        <button className="copy-css-btn" onClick={copyCss}>
          {copied ? <><Check weight="bold" /> Copied</> : <><Copy /> Copy CSS variables</>}
        </button>
      </div>
    </div>
  );
}
