import React, { useId } from 'react';

// PikFinder Studio mark — the blue→violet gloss tile with the white "P." glyph.
// Used only for the Studio (editor) sub-brand; the main PikFinder brand uses the
// aperture Logo. Subtle periodic light sweep; styles live in index.css (.studio-mark).
export default function StudioMark({ size = 28 }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = `sm-g-${raw}`;
  const gl = `sm-gl-${raw}`;
  const cl = `sm-cl-${raw}`;
  return (
    <span className="studio-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={g} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6E9BFF" />
            <stop offset="0.5" stopColor="#4F7CFF" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={gl} x1="16" y1="1" x2="16" y2="19" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={cl}><rect x="1" y="1" width="30" height="30" rx="9" /></clipPath>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${g})`} />
        <rect x="1" y="1" width="30" height="15" rx="9" fill={`url(#${gl})`} />
        <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" stroke="#ffffff" strokeOpacity="0.18" />
        <path fillRule="evenodd" clipRule="evenodd" d="M11 8.4h5.9a5.1 5.1 0 0 1 0 10.2H14v5H11V8.4zm3 3v4.2h2.9a2.1 2.1 0 0 0 0-4.2H14z" fill="#ffffff" />
        <circle cx="21.4" cy="21.6" r="2.15" fill="#ffffff" />
        <g clipPath={`url(#${cl})`}>
          <rect className="sm-shine" x="-6" y="-6" width="9" height="44" fill="#ffffff" opacity="0" style={{ mixBlendMode: 'overlay' }} />
        </g>
      </svg>
    </span>
  );
}
