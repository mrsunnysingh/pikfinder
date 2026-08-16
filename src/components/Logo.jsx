import React, { useId } from 'react';

/**
 * Animated Pik Finder logo.
 * Props:
 *   size      – icon height in px (default 30)
 *   showText  – render the "PikFinder" wordmark (default true)
 *   animated  – enable motion (default true; set false for static contexts)
 */
export default function Logo({ size = 30, showText = true, animated = true }) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '');
  const grad = `pf-grad-${uid}`;

  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Pik Finder"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="0.5" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#ec4899" />
            {animated && (
              <animateTransform attributeName="gradientTransform" type="rotate"
                from="0 32 32" to="360 32 32" dur="12s" repeatCount="indefinite" />
            )}
          </linearGradient>
        </defs>

        {/* outer ring */}
        <circle cx="32" cy="32" r="26" fill="none" stroke={`url(#${grad})`} strokeWidth="3.4" />

        {/* rotating scan highlight */}
        <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff" strokeOpacity="0.85"
          strokeWidth="3.4" strokeLinecap="round" strokeDasharray="22.7 140.7">
          {animated && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 32 32" to="360 32 32" dur="5s" repeatCount="indefinite" />
          )}
        </circle>

        {/* iris */}
        <g fill="none" stroke={`url(#${grad})`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {animated && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 32 32" to="360 32 32" dur="26s" repeatCount="indefinite" />
          )}
          <path d="M36.27 22.41 L42.44 30.9 L38.17 40.49 L27.73 41.59 L21.56 33.1 L25.83 23.51 Z" />
          <line x1="32.0" y1="7.0" x2="36.27" y2="22.41" />
          <line x1="53.65" y1="19.5" x2="42.44" y2="30.9" />
          <line x1="53.65" y1="44.5" x2="38.17" y2="40.49" />
          <line x1="32.0" y1="57.0" x2="27.73" y2="41.59" />
          <line x1="10.35" y1="44.5" x2="21.56" y2="33.1" />
          <line x1="10.35" y1="19.5" x2="25.83" y2="23.51" />
        </g>

        {/* center pulse */}
        <circle cx="32" cy="32" r="4" fill={`url(#${grad})`}>
          {animated && (
            <>
              <animate attributeName="r" values="3.4;5;3.4" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;1;0.85" dur="2.6s" repeatCount="indefinite" />
            </>
          )}
        </circle>
      </svg>

      {showText && (
        <span className="logo-word">Pik<span className="logo-word-accent">Finder</span></span>
      )}
    </>
  );
}
