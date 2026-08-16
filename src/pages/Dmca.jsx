// src/pages/Dmca.jsx
// DMCA / copyright policy (/dmca). Draft copy with placeholders; review with counsel.

import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const SITE_URL = 'https://pikfinder.com';

export default function Dmca() {
  useSeo({
    title: 'DMCA & Copyright Policy | PikFinder',
    description: 'How to file a copyright complaint or counter-notice for content on PikFinder, and how we handle takedown requests.',
    canonical: `${SITE_URL}/dmca`,
  });

  return (
    <>
      <header className="page-header" style={{ paddingBottom: 24 }}>
        <h1>DMCA &amp; Copyright Policy</h1>
        <p>How to report copyright concerns and how we respond.</p>
      </header>

      <div className="legal-container">
        <p className="legal-updated">Last updated: July 2026</p>

        <h2>Our role</h2>
        <p>PikFinder surfaces media from third-party providers (Unsplash, Pexels, Pixabay, Openverse, and others) and links to the original sources. For media hosted by a provider, please also contact that provider directly, as they host and license the content. For content within PikFinder's control, the process below applies.</p>

        <h2>Filing a copyright complaint</h2>
        <p>Send a written notice to our designated agent at <strong><a href="mailto:support@pikfinder.com">support@pikfinder.com</a></strong> including:</p>
        <ul>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the copyrighted work you claim is infringed.</li>
          <li>The URL or location of the material on PikFinder.</li>
          <li>Your contact information (address, phone, email).</li>
          <li>A statement of good-faith belief that the use is not authorized.</li>
          <li>A statement, under penalty of perjury, that your notice is accurate and you are the owner or authorized to act for the owner.</li>
        </ul>

        <h2>Our response</h2>
        <p>Upon a valid notice we will act expeditiously to remove or disable access to the identified material within PikFinder's control and, where possible, notify the affected user.</p>

        <h2>Counter-notice</h2>
        <p>If you believe your content was removed in error, send a counter-notice to <strong><a href="mailto:support@pikfinder.com">support@pikfinder.com</a></strong> with your signature, identification of the removed material and its prior location, a statement under penalty of perjury of good-faith belief the removal was a mistake, your contact information, and consent to the jurisdiction of a court of competent jurisdiction. We may restore the material within 10–14 business days unless the complainant files a court action.</p>

        <h2>Repeat infringers</h2>
        <p>We may suspend or terminate accounts of repeat infringers.</p>

        <h2>Contact</h2>
        <p>DMCA Email: <strong><a href="mailto:support@pikfinder.com">support@pikfinder.com</a></strong>. Mailing address coming soon.</p>

        <p style={{ marginTop: 24 }}>
          See also our <Link to="/terms">Terms</Link>, <Link to="/licenses">License Center</Link>, and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </>
  );
}
