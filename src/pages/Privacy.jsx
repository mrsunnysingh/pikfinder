import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <>
      <header className="page-header" style={{ paddingBottom: '32px' }}>
        <h1>Privacy Policy</h1>
        <p>How Pik Finder handles your data. In short: we collect the minimum, and we never sell it.</p>
      </header>

      <div className="legal-container">
        <p className="legal-updated">Last updated: July 2026</p>

        <h2>1. Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> your name, email address, and (optionally) an avatar, provided when you sign up or edit your profile.</li>
          <li><strong>Activity you create:</strong> favorites, collections, and your search and download history — stored so we can show them back to you.</li>
          <li><strong>Messages:</strong> anything you send through the contact form (name, email, category, message).</li>
          <li><strong>Preferences:</strong> your theme choice (light/dark) is stored locally in your browser.</li>
        </ul>

        <h2>2. How we use it</h2>
        <p>We use your information to authenticate you, sync your saved content, respond to your messages, measure and improve the product (analytics), and — for non-Premium users — to show ads. Premium (ad-free) users are not shown ads. We do not sell your personal data.</p>

        <h2>3. Where it's stored</h2>
        <p>Account data and activity are stored using Google Firebase (Authentication and Cloud Firestore). Contact-form messages may also be delivered by email and to a private spreadsheet via Google Apps Script.</p>

        <h2>4. Third parties</h2>
        <p>We share data with the providers needed to run the Service: Google Firebase (accounts and data), <strong>Google Analytics</strong> (usage measurement), <strong>Google AdSense</strong> (advertising for non-Premium users), the image provider APIs you search (Unsplash, Pexels, Pixabay, Openverse), Wikimedia and CDNs (media delivery), DiceBear (generated avatars), and Razorpay (payment processing, only if you upgrade to Creator Pro). Each operates under its own privacy policy. We do not sell or rent your personal data.</p>

        <h2>5. Cookies and local storage</h2>
        <p>We use local storage for essentials like keeping you signed in and remembering your theme. We also use <strong>analytics and advertising cookies/identifiers</strong> via Google Analytics and Google AdSense; where required we request consent and honor opt-outs. You can manage ad personalization at adssettings.google.com.</p>

        <h2>6. Your rights</h2>
        <p>You can view and edit your profile at any time. You may request deletion of your account and associated data by contacting us — we will remove it promptly.</p>

        <h2>7. Children</h2>
        <p>Pik Finder is not directed to children under 13, and we do not knowingly collect their data.</p>

        <h2>8. Security</h2>
        <p>We rely on industry-standard security provided by Firebase, and access to your data is restricted to your own account. No system is perfectly secure, so please use a strong, unique password.</p>

        <h2>9. Changes</h2>
        <p>We may update this policy from time to time. Material changes will be reflected by the "last updated" date above.</p>

        <h2>10. Contact</h2>
        <p>Privacy questions? Use the <Link to="/contact">Contact</Link> page.</p>

        <div className="legal-nav">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/license">License Details</Link>
        </div>
      </div>
    </>
  );
}
