import React, { useEffect, useRef, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, X } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';

/**
 * AdSense publisher client ID matches the script loaded in index.html.
 * If you rotate the client, update this constant + the script tag in index.html.
 */
export const ADSENSE_CLIENT = 'ca-pub-7308342607638280';

/**
 * A single AdSense unit. Slots are configured in your AdSense dashboard;
 * pass the numeric slot ID via the `slot` prop for each placement.
 * When no slot is configured, we render a graceful "Go Premium" placeholder
 * instead of an empty box, so the layout still looks intentional.
 */
export default function AdBanner({
  slot,
  format = 'auto',
  layout = 'in-article',
  responsive = true,
  className = '',
  style,
  premiumFallback = true,
}) {
  const insRef = useRef(null);
  const { user } = useContext(AppContext);
  const [dismissed, setDismissed] = useState(false);

  // Premium users don't see ads.
  const isPremium = user?.isPremium === true;

  useEffect(() => {
    if (isPremium || dismissed || !slot) return;
    try {
      // AdSense stores its command queue on window.adsbygoogle. Pushing an
      // empty config asks it to activate whichever <ins> elements haven't
      // been hydrated yet — including the one this component just rendered.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('AdSense push failed:', err?.message || err);
    }
  }, [slot, isPremium, dismissed]);

  if (isPremium || dismissed) return null;

  // No slot yet: show the upgrade prompt instead of a broken ad slot.
  if (!slot) {
    if (!premiumFallback) return null;
    return (
      <div className={`ad-slot ad-premium-card ${className}`} style={style}>
        <button className="ad-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={16} weight="bold" />
        </button>
        <Crown size={28} weight="fill" className="ad-premium-icon" />
        <h4>Go ad-free with PikFinder Premium</h4>
        <p>Support the tools you love — remove ads, unlock priority tool queues, and get exclusive wallpaper packs.</p>
        <Link to="/products" className="btn-primary">See premium plans</Link>
      </div>
    );
  }

  return (
    <div className={`ad-slot ${className}`} style={style} aria-label="Advertisement">
      <span className="ad-label">Ad</span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      ></ins>
    </div>
  );
}
