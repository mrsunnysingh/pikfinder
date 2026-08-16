// src/pages/Licenses.jsx
// License Center (/licenses): plain-language summary of every license the app can
// surface. Content mirrors LICENSE_GUIDE.md. Educational, not legal advice.

import React from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const SITE_URL = 'https://pikfinder.com';

const LICENSES = [
  { name: 'Public Domain', url: 'https://creativecommons.org/publicdomain/mark/1.0/', commercial: 'Yes', attribution: 'No', modify: 'Yes', redistribution: 'Unrestricted', risk: 'PD mark is an assertion, not a guarantee; trademark/personality/property rights may still apply.' },
  { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', commercial: 'Yes', attribution: 'No (appreciated)', modify: 'Yes', redistribution: 'Unrestricted', risk: 'Same trademark/personality caveat as public domain.' },
  { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', commercial: 'Yes', attribution: 'Required', modify: 'Yes', redistribution: 'With attribution', risk: 'Must credit the creator and indicate changes.' },
  { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', commercial: 'Yes', attribution: 'Required', modify: 'Yes', redistribution: 'Same license (ShareAlike)', risk: 'ShareAlike can force your derivative to be openly licensed — often unsuitable for branding.' },
  { name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/', commercial: 'No', attribution: 'Required', modify: 'Yes', redistribution: 'Non-commercial only', risk: '"Non-commercial" is broad; ads and business use generally do not qualify.' },
  { name: 'Unsplash License', url: 'https://unsplash.com/license', commercial: 'Yes', attribution: 'Not required (encouraged)', modify: 'Yes', redistribution: "Don't sell unaltered / don't build a competing service", risk: 'API use adds attribution + download-tracking obligations.' },
  { name: 'Pexels License', url: 'https://www.pexels.com/license/', commercial: 'Yes', attribution: 'Not required (appreciated)', modify: 'Yes', redistribution: "Don't sell unaltered; don't imply endorsement", risk: 'Identifiable people/brands may need separate releases.' },
  { name: 'Pixabay Content License', url: 'https://pixabay.com/service/license-summary/', commercial: 'Yes', attribution: 'Not required', modify: 'Yes', redistribution: "Don't redistribute unaltered on other stock sites", risk: 'Some content carries extra brand/person rights.' },
];

export default function Licenses() {
  useSeo({
    title: 'License Center — Understand Every Image & Video License | PikFinder',
    description: 'Plain-language guide to Public Domain, CC0, CC BY, CC BY-SA, CC BY-NC, and the Unsplash, Pexels, Pixabay, and Openverse licenses: commercial use, attribution, modification, and risks.',
    canonical: `${SITE_URL}/licenses`,
  });

  return (
    <>
      <header className="page-header" style={{ paddingBottom: 24 }}>
        <h1>License Center</h1>
        <p>Understand what you can and can't do with media from each provider. This is an educational summary — always open the license link on each item and read the official terms before use.</p>
      </header>

      <div className="legal-container">
        <p className="legal-updated">Last updated: July 2026</p>

        <div style={{ overflowX: 'auto' }}>
          <table className="license-table">
            <thead>
              <tr>
                <th>License</th><th>Commercial?</th><th>Attribution?</th><th>Modify?</th><th>Redistribution</th><th>Risks &amp; limits</th>
              </tr>
            </thead>
            <tbody>
              {LICENSES.map((l) => (
                <tr key={l.name}>
                  <td><a href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a></td>
                  <td>{l.commercial}</td>
                  <td>{l.attribution}</td>
                  <td>{l.modify}</td>
                  <td>{l.redistribution}</td>
                  <td>{l.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Openverse licenses</h2>
        <p>Openverse aggregates media under a mix of the licenses above (PD, CC0, CC BY, CC BY-SA, CC BY-NC, and more). <strong>There is no single "Openverse license."</strong> Honor the specific license shown on each item, including attribution and non-commercial restrictions.</p>

        <h2>Universal caveats</h2>
        <ul>
          <li>A permissive image license does <strong>not</strong> grant trademark, publicity, or property rights. Faces, logos, brands, artworks, and buildings may need separate clearance.</li>
          <li>No tool can guarantee a specific use is safe. PikFinder surfaces the provider's stated license; you are responsible for verifying suitability for your use.</li>
        </ul>

        <p style={{ marginTop: 24 }}>
          See also our <Link to="/terms">Terms of Service</Link>, <Link to="/privacy">Privacy Policy</Link>, and <Link to="/dmca">DMCA / Copyright policy</Link>.
        </p>
      </div>
    </>
  );
}
