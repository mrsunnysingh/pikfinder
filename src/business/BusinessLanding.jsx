import React from 'react';
import { Link } from 'react-router-dom';
import {
  Buildings, Certificate, Receipt, IdentificationCard, Megaphone, Lightning,
  ShieldCheck, Stack, ArrowRight, Plugs, CheckCircle,
} from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';

const FAQS = [
  ['How do I generate documents from Zoho CRM?', 'Connect Zoho CRM in the PikFinder Document Generator, pick a template (certificate, invoice, ID card or banner), and PikFinder auto-fills it from your CRM records. Export one document or bulk-generate hundreds as a zip — no coding required.'],
  ['Can I create certificates in bulk from a Zoho Creator report?', 'Yes. Connect Zoho Creator, choose a report, select the records you want, and PikFinder renders one certificate per record and downloads them together as a zip.'],
  ['Do I need any coding or Deluge scripts?', 'No. The Document Generator is a no-code tool. You connect your Zoho app, map fields once (it auto-matches for you), and generate. Optional Deluge/webhook triggers are available for advanced users.'],
  ['Which document types can I generate?', 'Certificates of achievement, invoices, business cards, ID cards, sale and event banners, and any custom design you build in the PikFinder Studio with fillable fields.'],
  ['Is my Zoho data secure?', 'PikFinder never sees your Zoho password. Authorization happens on Zoho’s site, your access token is encrypted and stored server-side only, and only read permissions are requested. You can disconnect anytime.'],
  ['How much does it cost?', 'The Document Generator templates and manual generation are free to use. Zoho auto-fill connects to your existing Zoho account.'],
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PikFinder Document Generator — Zoho Document Automation',
      description: 'Generate certificates, invoices, ID cards and marketing banners automatically from Zoho CRM and Zoho Creator records. No-code document generation and bulk export.',
      url: `${SITE_URL}/business-automation`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
};

const USE_CASES = [
  { icon: Certificate, title: 'Certificates from CRM', text: 'Issue course, training and award certificates automatically from Zoho CRM contacts or Creator form submissions.' },
  { icon: Receipt, title: 'Invoices & receipts', text: 'Turn deals and records into branded invoices and receipts in seconds, ready to download as PDF.' },
  { icon: IdentificationCard, title: 'ID & business cards', text: 'Generate employee ID cards and business cards for your whole team from a single Zoho module.' },
  { icon: Megaphone, title: 'Marketing banners', text: 'Produce sale, event and social banners for every product or campaign record without a designer.' },
];

const STEPS = [
  ['Connect Zoho', 'Securely connect Zoho CRM or Zoho Creator — read-only, revoke anytime.'],
  ['Pick a template', 'Choose a certificate, invoice, card or banner — or design your own in the Studio.'],
  ['Auto-fill & map', 'PikFinder matches your Zoho fields to the template automatically. Adjust once, it remembers.'],
  ['Generate & export', 'Download one document, or bulk-generate hundreds as a single zip — PNG, PDF or SVG.'],
];

export default function BusinessLanding() {
  useSeo({
    title: 'Zoho CRM Document Generator — Certificates, Invoices & Cards | PikFinder',
    description: 'Automatically generate certificates, invoices, ID cards and banners from Zoho CRM and Zoho Creator. No-code document automation with bulk export. Free to start.',
    canonical: `${SITE_URL}/business-automation`,
    jsonLd,
  });

  return (
    <div className="biz-land">
      <section className="biz-land-hero">
        <span className="biz-land-kicker"><Buildings weight="duotone" /> PikFinder Document Generator</span>
        <h1>Generate documents from Zoho CRM &amp; Creator — automatically</h1>
        <p>Turn your Zoho records into certificates, invoices, ID cards and marketing banners in seconds. No-code, no designer, bulk-ready. PikFinder auto-fills professional templates from your CRM data and exports PNG, PDF or SVG.</p>
        <div className="biz-land-cta">
          <Link to="/business" className="btn-primary"><ArrowRight size={16} /> Open the Document Generator</Link>
          <Link to="/business/help" className="btn-outline">See how it works</Link>
        </div>
        <div className="biz-land-trust">
          <span><CheckCircle size={15} weight="fill" /> No coding required</span>
          <span><CheckCircle size={15} weight="fill" /> Read-only &amp; secure</span>
          <span><CheckCircle size={15} weight="fill" /> Free to start</span>
        </div>
      </section>

      <section className="biz-land-sec">
        <h2>Automate the documents your business sends every day</h2>
        <div className="biz-land-grid">
          {USE_CASES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="biz-land-card">
              <span className="biz-land-ic"><Icon weight="duotone" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="biz-land-sec biz-land-steps-sec">
        <h2>From Zoho record to finished document in four steps</h2>
        <ol className="biz-land-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span className="biz-land-step-n">{i + 1}</span>
              <div><strong>{t}</strong><p>{d}</p></div>
            </li>
          ))}
        </ol>
        <div className="biz-land-cta center">
          <Link to="/business" className="btn-primary"><Lightning size={16} weight="fill" /> Try it now — it’s free</Link>
        </div>
      </section>

      <section className="biz-land-sec">
        <h2>Built for Zoho teams</h2>
        <div className="biz-land-feats">
          <div className="biz-land-feat"><Plugs weight="duotone" /><div><strong>Zoho CRM &amp; Creator</strong><p>Connect Contacts, Deals and Creator reports. Books, Forms, Desk and Analytics are on the roadmap.</p></div></div>
          <div className="biz-land-feat"><Stack weight="duotone" /><div><strong>Bulk generation</strong><p>Select many records and get one document each, zipped and named — perfect for cohorts, invoices and teams.</p></div></div>
          <div className="biz-land-feat"><ShieldCheck weight="duotone" /><div><strong>Secure by design</strong><p>Tokens are encrypted server-side; your browser never sees them. Read-only access you can revoke anytime.</p></div></div>
          <div className="biz-land-feat"><Lightning weight="duotone" /><div><strong>No-code &amp; fast</strong><p>Auto field-matching, saved mappings and live preview. Design custom templates in the built-in Studio.</p></div></div>
        </div>
      </section>

      <section className="biz-land-sec">
        <h2>Frequently asked questions</h2>
        <div className="biz-land-faqs">
          {FAQS.map(([q, a]) => (
            <div key={q} className="biz-land-faq">
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="biz-land-final">
        <h2>Start generating documents from your Zoho data</h2>
        <p>Free to start. Connect Zoho when you’re ready, or use the templates by hand today.</p>
        <div className="biz-land-cta center">
          <Link to="/business" className="btn-primary"><ArrowRight size={16} /> Open the Document Generator</Link>
          <Link to="/business/help" className="btn-outline">Read the guide</Link>
        </div>
      </section>
    </div>
  );
}
