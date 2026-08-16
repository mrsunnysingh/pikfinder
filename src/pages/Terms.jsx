import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <>
      <header className="page-header" style={{ paddingBottom: '32px' }}>
        <h1>Terms of Service</h1>
        <p>The rules for using Pik Finder. Please read them carefully.</p>
      </header>

      <div className="legal-container">
        <p className="legal-updated">Last updated: July 2026</p>

        <h2>1. Acceptance of terms</h2>
        <p>By accessing or using Pik Finder ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

        <h2>2. What Pik Finder is</h2>
        <p>Pik Finder is a platform that helps you discover media aggregated from third-party providers (Unsplash, Pexels, Pixabay, Openverse, and others) and provides browser-based design tools and a Creator Studio. We do not own, host, or license most of this media; each item carries its own license and attribution, supplied by the original provider and shown on the item. Not all media is copyright-free, and some requires attribution or restricts commercial use — review the applicable license (see the <Link to="/licenses">License Center</Link>) before use.</p>

        <h2>3. Accounts</h2>
        <ul>
          <li>You may create an account to save favorites, collections, and history. You must provide a valid email address and verify it before signing in.</li>
          <li>You are responsible for keeping your login credentials secure and for all activity under your account.</li>
          <li>You must be at least 13 years old to create an account.</li>
        </ul>

        <h2>4. Acceptable use</h2>
        <p>You agree not to misuse the Service, including by attempting to disrupt it, scrape it at scale, reverse-engineer it, or use it for any unlawful purpose. You may not use the design tools to create content that is illegal, hateful, or infringing.</p>

        <h2>5. Intellectual property</h2>
        <p>The images surfaced through Pik Finder are provided under their respective public-domain or open licenses (see our <Link to="/license">License Details</Link>). The Pik Finder name, logo, interface, and original tools are the property of Pik Finder and may not be copied without permission.</p>

        <h2>6. Disclaimer of warranties</h2>
        <p>The Service is provided "as is" and "as available", without warranties of any kind. While we aim to surface only freely usable images, we cannot guarantee the licensing status of every image. You are responsible for verifying that an image is cleared for your intended use before relying on it — especially for commercial projects.</p>

        <h2>7. Limitation of liability</h2>
        <p>To the maximum extent permitted by law, Pik Finder shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service or from your use of any image obtained through it.</p>

        <h2>8. Third-party services</h2>
        <p>The Service relies on third parties including Google Firebase (authentication and storage), Wikimedia Commons (images), and Razorpay (payment processing for Creator Pro subscriptions). Your use of those services is subject to their own terms.</p>

        <h2>9. Changes and termination</h2>
        <p>We may update these Terms or modify or discontinue the Service at any time. Continued use after changes constitutes acceptance. We may suspend accounts that violate these Terms.</p>

        <h2>10. Contact</h2>
        <p>Questions about these Terms? Reach us via the <Link to="/contact">Contact</Link> page.</p>

        <div className="legal-nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/license">License Details</Link>
        </div>
      </div>
    </>
  );
}
