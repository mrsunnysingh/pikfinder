// src/business/ZohoLogos.jsx
// Shows the OFFICIAL Zoho product logos from local asset files, with a drawn
// brand-coloured fallback if the file isn't present yet.
//
// To use the real logos: download the official SVG (or PNG) from Zoho's brand /
// press kit and save them here in the project's `public/logos/` folder as:
//     public/logos/zoho-crm.svg
//     public/logos/zoho-creator.svg
// (If you only have PNGs, save them as .png and change the extensions in LOGO_SRC.)

import React, { useState } from 'react';

const LOGO_SRC = {
  crm: '/logos/zoho-crm.svg',
  creator: '/logos/zoho-creator.svg',
};

// Drawn fallback marks (used only until the official files are added).
function CrmMark() {
  return (
    <g fill="none" stroke="#2b7fd4" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13.5c-4 -4 -9.5 -3.6 -12.3 -0.8c-2.9 2.9 -3 7.6 -0.2 10.4c2.8 2.8 7.3 2.8 10.2 0l7 -7c2.9 -2.9 7.4 -2.9 10.2 0c2.8 2.8 2.7 7.5 -0.2 10.4c-2.8 2.8 -8.3 3.2 -12.3 -0.8" />
    </g>
  );
}
function CreatorMark() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8 L10.5 20 L22 32" fill="none" stroke="#3f7fc4" strokeWidth="3.8" />
      <path d="M21.5 20 L29.5 28" fill="none" stroke="#3f7fc4" strokeWidth="3.8" />
      <path d="M21.5 20 L27 14.5" fill="none" stroke="#3f7fc4" strokeWidth="3.8" />
      <rect x="23.6" y="10.6" width="7.8" height="7.8" rx="2.4" transform="rotate(45 27.5 14.5)" fill="#e0392f" />
    </g>
  );
}

export default function ZohoLogo({ service = 'crm', size = 40 }) {
  const [failed, setFailed] = useState(false);
  const isCreator = service === 'creator';
  const label = isCreator ? 'Zoho Creator' : 'Zoho CRM';

  if (!failed && LOGO_SRC[service]) {
    return (
      <img
        src={LOGO_SRC[service]}
        alt={label}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', borderRadius: 10, background: '#fff', padding: 4, boxSizing: 'border-box' }}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      <rect x="0.5" y="0.5" width="39" height="39" rx="9" fill="#ffffff" stroke="rgba(0,0,0,0.08)" />
      {isCreator ? <CreatorMark /> : <CrmMark />}
    </svg>
  );
}
