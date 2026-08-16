import React from 'react';
import { Link } from 'react-router-dom';

export default function License() {
  return (
    <>
      <header className="page-header" style={{ paddingBottom: '32px' }}>
        <h1>License Details</h1>
        <p>What you can and can't do with images from Pik Finder.</p>
      </header>

      <div className="legal-container">
        <p className="legal-updated">Last updated: July 2026</p>

        <h2>Where media comes from</h2>
        <p>Media surfaced by Pik Finder is aggregated from third-party providers including <strong>Unsplash, Pexels, Pixabay, and Openverse</strong>. Each item carries its own license — supplied by the provider and shown on the item — ranging from Public Domain and CC0 to CC BY, CC BY-SA, and (via Openverse) CC BY-NC. <strong>Not all media is copyright-free, and some requires attribution or restricts commercial use.</strong> For a full breakdown of every license type, see the <Link to="/licenses">License Center</Link>.</p>

        <h2>What you can do</h2>
        <ul>
          <li>Use media consistent with the specific license shown on each item.</li>
          <li>Use Public Domain and CC0 items without attribution — crediting the creator is always appreciated.</li>
          <li>Use CC BY / CC BY-SA and provider-licensed items commercially where the license permits, following its attribution terms.</li>
        </ul>

        <h2>Attribution requirements</h2>
        <p>Items under <strong>CC BY</strong> or <strong>CC BY-SA</strong> licenses <strong>require attribution</strong>, and <strong>CC BY-NC</strong> items (via Openverse) are <strong>non-commercial only</strong>. Every item shows its license name, license link, creator, and a link to the original — use these to build your credit line and to verify terms on the source page. CC BY-SA additionally requires that derivative works be shared under the same license.</p>

        <h2>Our free tools</h2>
        <p>All Pik Finder tools (compression, resizing, conversion, background removal, and others) process your files entirely in your browser. Your files are never uploaded to our servers, and everything you create with your own images belongs entirely to you.</p>

        <h2>What you cannot do</h2>
        <ul>
          <li>Imply endorsement by any person, brand, or organization depicted in an image.</li>
          <li>Resell unaltered images as standalone stock products.</li>
          <li>Use images in a way that is unlawful, defamatory, or infringing.</li>
        </ul>

        <h2>Recognizable people and trademarks</h2>
        <p>An open license covers copyright, not other rights. Images containing recognizable people, logos, or trademarks may require additional permissions (such as a model or property release) depending on how you use them.</p>

        <h2>No warranty</h2>
        <p>Images are provided "as is". Pik Finder makes no warranty regarding their licensing, fitness, or suitability for any purpose. You are responsible for your own use.</p>

        <div className="legal-nav">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </>
  );
}
