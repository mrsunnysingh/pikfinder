import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Buildings, CaretDown, SquaresFour, Plugs, ClockCounterClockwise, ShieldCheck,
  Sparkle, ArrowRight, Lightning, WarningCircle, EnvelopeSimple,
} from '@phosphor-icons/react';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';

const NAV = [
  ['quickstart', 'Quick start'],
  ['templates', 'Templates & fields'],
  ['connect', 'Connecting Zoho'],
  ['records', 'Generating from records'],
  ['bulk', 'Bulk generation'],
  ['exports', 'Exports'],
  ['security', 'Security'],
  ['trouble', 'Troubleshooting'],
  ['faq', 'FAQ'],
];

const TROUBLE = [
  ['“Zoho isn’t configured on the server yet”', 'The connector isn’t enabled on this deployment yet. Please contact support and we’ll get it turned on.'],
  ['“Sign in to connect your Zoho account”', 'You’re logged out. Sign in to PikFinder first, then open the Connections tab.'],
  ['Badge shows “Needs re-auth”', 'Your Zoho token expired or was revoked. Click Connect again to re-authorize — it takes a few seconds.'],
  ['“no refresh token”', 'Zoho only returns a refresh token on first consent. Disconnect, then reconnect and approve the consent screen again.'],
  ['No modules or records appear', 'The connected scope may not cover that module. Reconnect and ensure the CRM/Creator read permissions are granted.'],
  ['A field didn’t fill in', 'Open Fill from Zoho and check the mapping row for that field — pick the correct Zoho field from the dropdown.'],
  ['Export looks blank / image missing', 'Templates using an external image URL can be blocked by the browser during export. Use uploaded or generated assets instead.'],
];

const FAQS = [
  ['Do I need a Zoho account to use the Document Generator?', 'No. Every template works fully by hand — fill the fields and export. Zoho only adds automatic fill and bulk generation from your real records.'],
  ['Which Zoho apps are supported?', 'Zoho CRM (Contacts, Deals, and other modules) and Zoho Creator (form reports) today. Books, Forms, Desk and Analytics are on the roadmap.'],
  ['Where are my documents generated?', 'Entirely in your browser. The template render engine runs client-side, so your field data never leaves your device during manual generation.'],
  ['Is my Zoho login stored?', 'PikFinder never sees your Zoho password. After you consent, Zoho gives the server an encrypted refresh token, stored server-side only. Your browser never receives Zoho tokens.'],
  ['Can I edit a template’s design?', 'Yes — click “Open the full Studio to customize”. Any Studio design with {{placeholders}} in text becomes a fillable template.'],
  ['How many records can I bulk-generate at once?', 'A page of records at a time (up to 50). Select the ones you want and PikFinder builds a single downloadable zip.'],
  ['Can I get PNG, PDF and SVG?', 'Yes. Single exports offer SVG, PNG and PDF; bulk zips let you pick PNG, PDF or SVG for the whole batch.'],
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen((o) => !o)}>{q} <CaretDown className="faq-caret" /></button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

export default function BusinessHelp() {
  useSeo({
    title: 'Document Generator Help & Guide | PikFinder',
    description: 'How to generate certificates, invoices, cards and banners in PikFinder — fill templates by hand or auto-fill and bulk-generate from Zoho CRM and Creator.',
    canonical: `${SITE_URL}/business/help`,
  });

  return (
    <div className="subpage-wrap biz-help">
      <header className="biz-help-hero">
        <span className="biz-help-kicker"><Buildings weight="duotone" /> Document Generator</span>
        <h1>Help &amp; guide</h1>
        <p>Turn your business data into finished documents — certificates, invoices, business cards and banners — in seconds. This guide covers everything from a first export to bulk-generating from Zoho.</p>
        <div className="biz-help-cta">
          <Link to="/business" className="btn-primary"><ArrowRight size={16} /> Open Document Generator</Link>
          <Link to="/contact" className="btn-outline"><EnvelopeSimple size={16} /> Contact support</Link>
        </div>
      </header>

      <nav className="biz-help-toc">
        {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <section id="quickstart" className="biz-help-sec">
        <h2><Lightning weight="duotone" /> Quick start</h2>
        <ol className="biz-steps">
          <li><strong>Pick a template.</strong> Open the Document Generator and choose a certificate, invoice, business card or banner from the Templates tab.</li>
          <li><strong>Fill the fields.</strong> Type into the form on the right. The preview updates live as you type.</li>
          <li><strong>Export.</strong> Download as SVG, PNG or PDF. That’s it — no design skills, no software to install.</li>
        </ol>
        <p className="biz-help-note">Want it to look different? Click <em>Open the full Studio to customize</em> to edit fonts, colors and layout, then come back and generate.</p>
      </section>

      <section id="templates" className="biz-help-sec">
        <h2><SquaresFour weight="duotone" /> Templates &amp; fields</h2>
        <p>Each template is a ready-made design with labelled fields. Filter templates by category (Education, Documents, Branding, Marketing) at the top of the Templates tab. Every field maps to a spot on the design — change the text and the document updates instantly.</p>
        <p>Behind the scenes, fields are <code>{'{{placeholders}}'}</code> inside the design. Any design you build in the Studio with placeholder text becomes a fillable template, so you can create your own.</p>
      </section>

      <section id="connect" className="biz-help-sec">
        <h2><Plugs weight="duotone" /> Connecting Zoho</h2>
        <p>Connecting Zoho lets PikFinder pull real records so you don’t retype anything. It’s optional — templates work fully by hand.</p>
        <ol className="biz-steps">
          <li>Sign in to PikFinder, open the Document Generator, and go to the <strong>Connections</strong> tab.</li>
          <li>Click <strong>Connect</strong> on Zoho CRM or Zoho Creator.</li>
          <li>You’ll be taken to Zoho’s consent screen. Review the read permissions and approve.</li>
          <li>You’re redirected back with a “Connected” badge. Use <strong>Test</strong> to confirm it’s live.</li>
        </ol>
        <p className="biz-help-note">Only read permissions are requested. You can <strong>Disconnect</strong> at any time — that revokes the token and deletes it from the server.</p>
      </section>

      <section id="records" className="biz-help-sec">
        <h2><Sparkle weight="duotone" /> Generating from records</h2>
        <p>Once a Zoho app is connected, a <strong>Fill from Zoho</strong> button appears above the template form.</p>
        <ol className="biz-steps">
          <li>Click <strong>Fill from Zoho</strong> and choose a source (e.g. CRM) and a module (e.g. Contacts).</li>
          <li>PikFinder auto-matches the template’s fields to your Zoho fields. Review the mapping and adjust any row from its dropdown.</li>
          <li>Pick a record and click <strong>Fill form</strong> — the fields populate instantly. Tweak anything, then export.</li>
        </ol>
      </section>

      <section id="bulk" className="biz-help-sec">
        <h2><ClockCounterClockwise weight="duotone" /> Bulk generation</h2>
        <p>Need a document for many people at once — a certificate per student, a card per employee? In the <strong>Fill from Zoho</strong> dialog, tick several records instead of one, choose a format (PNG, PDF or SVG), and click <strong>Generate</strong>. PikFinder renders one file per record and downloads them together as a single zip, named by record.</p>
        <p className="biz-help-note">Keep the tab open while a batch runs. Large batches take a little longer since each document is rendered at full quality in your browser.</p>
      </section>

      <section id="exports" className="biz-help-sec">
        <h2><ClockCounterClockwise weight="duotone" /> Exports</h2>
        <p>The <strong>Exports</strong> tab lists what you’ve generated in this browser — template, whether it came from Zoho, the format and count, and when. It’s a quick log so you can see your recent work; clear it anytime.</p>
      </section>

      <section id="security" className="biz-help-sec">
        <h2><ShieldCheck weight="duotone" /> Security &amp; privacy</h2>
        <ul className="biz-help-list">
          <li>PikFinder never sees your Zoho password — authorization happens on Zoho’s own site.</li>
          <li>Your Zoho refresh token is encrypted (AES-256-GCM) and stored server-side only. The browser never receives Zoho tokens.</li>
          <li>Only minimal <em>read</em> permissions are requested; you can revoke access instantly by disconnecting.</li>
          <li>Manual document generation runs entirely in your browser — field data isn’t uploaded.</li>
        </ul>
      </section>

      <section id="trouble" className="biz-help-sec">
        <h2><WarningCircle weight="duotone" /> Troubleshooting</h2>
        <div className="biz-help-table">
          {TROUBLE.map(([sym, fix]) => (
            <div key={sym} className="biz-help-trow">
              <div className="biz-help-sym">{sym}</div>
              <div className="biz-help-fix">{fix}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="biz-help-sec">
        <h2><Buildings weight="duotone" /> FAQ</h2>
        <div className="biz-help-faqs">
          {FAQS.map(([q, a]) => <Faq key={q} q={q} a={a} />)}
        </div>
      </section>

      <footer className="biz-help-foot">
        <Link to="/business" className="btn-primary"><ArrowRight size={16} /> Back to Document Generator</Link>
      </footer>
    </div>
  );
}
