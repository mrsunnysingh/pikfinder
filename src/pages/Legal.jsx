import React from 'react';
import { Link } from 'react-router-dom';

export default function Legal() {
  return (
    <>
      <header className="page-header" style={{ paddingBottom: '40px' }}>
        <h1>Legal & Licensing</h1>
        <p>Transparency and freedom are at the core of PikFinder.</p>
      </header>
      
      <div className="legal-container">
        <h2>License Summary</h2>
        <p>PikFinder aggregates media from third-party providers including <strong>Unsplash, Pexels, Pixabay, and Openverse</strong>. Each item carries its <strong>own license</strong>, supplied by the original source and shown on the item. Licenses range from Public Domain and CC0 (no attribution) to CC BY and CC BY-SA (attribution required) and CC BY-NC (non-commercial only). <strong>Not all media is copyright-free, and some requires attribution or restricts commercial use.</strong></p>

        <ul>
          <li><strong>What you should do:</strong> Open the license shown on each item and follow its terms — provide attribution where required, and use commercially only where the license allows.</li>
          <li><strong>What you cannot do:</strong> Assume every item is free of copyright, imply endorsement by people or brands depicted, or sell unaltered media as standalone products.</li>
        </ul>
        <p>See the full <Link to="/licenses">License Center</Link> for a breakdown of every license type, and note that image licenses do not grant trademark, publicity, or property rights.</p>

        <h2>Terms of Service</h2>
        <p>By accessing PikFinder you agree to our <Link to="/terms">Terms of Service</Link>. PikFinder is an aggregator: we do not own or host most media, and we surface each provider's license and attribution. You are responsible for reviewing the applicable license before use. See also our <Link to="/dmca">DMCA / Copyright policy</Link>.</p>

        <h2>Privacy Policy</h2>
        <p>See our <Link to="/privacy">Privacy Policy</Link> for how we handle data, analytics, advertising, and third-party services. We do not sell your personal data.</p>
      </div>
    </>
  );
}
