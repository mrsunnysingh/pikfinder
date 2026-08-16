import React, { useState, useMemo, useEffect, useContext } from 'react';
import { Buildings, DownloadSimple, FileSvg, FilePng, FilePdf, PaintBrush, SquaresFour, Plugs, Question, Sparkle, ClockCounterClockwise, Trash, MagnifyingGlass, ShieldCheck, UploadSimple, Plus } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { SITE_URL } from '../tools/registry';
import { AppContext } from '../context/AppContext';
import { BUSINESS_TEMPLATES, BUSINESS_CATEGORIES } from './templates';
import { PREMIUM_TEMPLATES } from './premiumTemplates';

// Premium designs are featured first in the Document Generator and flagged so the
// card shows a "PRO" badge. These are the same exclusive set used in the Studio.
const PREMIUM = PREMIUM_TEMPLATES.map((t) => ({ ...t, premium: true }));
// Full catalogue = premium set + the base templates (de-duped by id).
const CATALOGUE = [...PREMIUM, ...BUSINESS_TEMPLATES.filter((b) => !PREMIUM.some((p) => p.id === b.id))];
import InvoiceItems from './InvoiceItems';
import { renderTemplate } from '../lib/render/renderTemplate';
import { sceneToSvg } from '../lib/render/sceneToSvg.node';
import { svgUrl, toBlob, downloadBlob, safeName, rasterize } from './exportUtils';
import { addExport, loadExports, clearExports, removeExport } from './exportHistory';
import { SERVICE_META } from './serviceMeta';
import { getStatus } from './zohoClient';
import { loadCustom, removeCustom } from './customTemplates';
import { askGemini } from '../lib/ai';
import Connections from './Connections';
import RecordPicker from './RecordPicker';
import TemplateBuilder from './TemplateBuilder';
import SendToCreator from './SendToCreator';

// Blob → base64 (no data: prefix) for uploading to Zoho Creator.
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = reject;
  r.readAsDataURL(blob);
});

const seedValues = (t) => Object.fromEntries(t.fields.map((f) => [f.key, f.sample]));
const renderSvg = (t, values) => sceneToSvg({ dims: t.dims, bg: t.bg, layers: renderTemplate(t.layers, values) });

// Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, and newlines
// inside quotes). Returns { headers: string[], rows: Array<Record<string,string>> }.
function parseCsv(text) {
  const src = String(text).replace(/^﻿/, ''); // strip BOM
  const table = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) table.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v !== '')) table.push(row); }
  if (!table.length) return { headers: [], rows: [] };
  const headers = table[0].map((h) => h.trim());
  const rows = table.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { headers, rows };
}

export default function BusinessHub() {
  const { user } = useContext(AppContext);
  const [view, setView] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.has('connected') || p.has('zoho_error') ? 'connections' : 'templates';
  });
  const [cat, setCat] = useState('All');
  const [tplSearch, setTplSearch] = useState('');
  const [id, setId] = useState(CATALOGUE[0].id);
  const [values, setValues] = useState(() => seedValues(CATALOGUE[0]));
  const [busy, setBusy] = useState('');       // '' | 'single' | 'bulk'
  const [picker, setPicker] = useState(false);
  const [builder, setBuilder] = useState(false);
  const [custom, setCustom] = useState(() => loadCustom());
  const [connected, setConnected] = useState([]); // connected service ids
  const [history, setHistory] = useState(() => loadExports());

  // Built-in templates + the user's own uploaded designs.
  const ALL_TEMPLATES = useMemo(() => [...custom, ...CATALOGUE], [custom]);
  const categories = useMemo(() => custom.length ? [...BUSINESS_CATEGORIES, 'Custom'] : BUSINESS_CATEGORIES, [custom]);

  useSeo({
    title: 'Document Generator — Generate documents from your data | PikFinder',
    description: 'Turn business data into certificates, invoices, cards, and banners in seconds. Auto-fill from Zoho CRM and Creator.',
    canonical: `${SITE_URL}/business`,
  });

  const template = useMemo(() => ALL_TEMPLATES.find((t) => t.id === id) || ALL_TEMPLATES[0], [id, ALL_TEMPLATES]);
  const shown = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return ALL_TEMPLATES.filter((t) =>
      (cat === 'All' || t.category === cat) &&
      (!q || t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)));
  }, [cat, tplSearch, ALL_TEMPLATES]);

  useEffect(() => { setValues(seedValues(template)); }, [template]);

  // Which Zoho services are connected (to show the "Fill from Zoho" button).
  useEffect(() => {
    let alive = true;
    if (!user) { setConnected([]); return; }
    getStatus().then(({ ok, data }) => {
      if (!alive || !ok || !data?.services) return;
      setConnected(Object.entries(data.services).filter(([, s]) => s.connected).map(([k]) => k));
    }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const previewSvg = useMemo(() => renderSvg(template, values), [template, values]);
  const fileBase = `${template.id}-${safeName(values[template.fields[0]?.key])}`;

  // A small preview data URL of a rendered document (for the Documents dashboard).
  const makeThumb = async (svg, dims) => {
    try {
      const scale = Math.min(1, 300 / dims.w);
      const cv = await rasterize(svg, dims, scale);
      return cv.toDataURL('image/jpeg', 0.7);
    } catch { return null; }
  };

  // ── AI: write a field's value with Gemini ──
  const [aiField, setAiField] = useState(null);
  const aiFill = async (f) => {
    setAiField(f.key);
    try {
      const text = await askGemini('doc-text', { field: f.label, context: template.name, hint: values[f.key] || '' });
      if (text) setValues((v) => ({ ...v, [f.key]: text }));
    } catch (err) {
      alert(err.message || 'AI is unavailable right now.');
    } finally { setAiField(null); }
  };

  const generate = async (format) => {
    setBusy('single');
    try {
      const blob = await toBlob(format, previewSvg, template.dims);
      downloadBlob(blob, `${fileBase}.${format}`);
      const thumb = await makeThumb(previewSvg, template.dims);
      setHistory((h) => [addExport({ template: template.id, templateId: template.id, templateName: template.name, format, count: 1, values, thumb }), ...h]);
    } catch (e) {
      console.error(e);
      alert('Generation failed. If your design uses an online image, it may block export.');
    } finally { setBusy(''); }
  };

  // Render the current document and hand it to the "Send to Zoho Creator" modal.
  const [creatorFile, setCreatorFile] = useState(null);
  const sendToCreator = async (format = 'pdf') => {
    setBusy('creator');
    try {
      const blob = await toBlob(format, previewSvg, template.dims);
      const base64 = await blobToBase64(blob);
      const type = blob.type || (format === 'pdf' ? 'application/pdf' : format === 'svg' ? 'image/svg+xml' : 'image/png');
      setCreatorFile({ base64, filename: `${fileBase}.${format}`, contentType: type });
    } catch (e) {
      console.error(e);
      alert('Could not prepare the document for Zoho Creator.');
    } finally { setBusy(''); }
  };

  // Re-download a saved document by re-rendering its stored field data.
  const reDownload = async (entry) => {
    const t = ALL_TEMPLATES.find((x) => x.id === (entry.templateId || entry.template));
    if (!t) { alert('That template is no longer available.'); return; }
    try {
      const svg = renderSvg(t, entry.values || {});
      const fmt = entry.format || 'pdf';
      const blob = await toBlob(fmt, svg, t.dims);
      downloadBlob(blob, `${t.id}-${safeName(Object.values(entry.values || {})[0] || 'document')}.${fmt}`);
    } catch (e) { console.error(e); alert('Could not re-download this document.'); }
  };

  // Reopen a saved document back in the generator form for editing.
  const reopenDoc = (entry) => {
    const t = ALL_TEMPLATES.find((x) => x.id === (entry.templateId || entry.template));
    if (!t) { alert('That template is no longer available.'); return; }
    setId(t.id);
    if (entry.values) setValues({ ...seedValues(t), ...entry.values });
    setView('templates');
  };

  // Fill the form from a single Zoho record (values keyed by placeholder).
  const onFill = (mapped) => {
    setValues((v) => ({ ...v, ...seedValues(template), ...Object.fromEntries(Object.entries(mapped).filter(([, val]) => val != null && val !== '')) }));
  };

  // Bulk: render one asset per record, zip, download.
  // Core batch pipeline: render one document per record, zip, download.
  // `map` is { placeholderKey: recordFieldKey }. Used by Zoho bulk AND CSV bulk.
  const runBatch = async (records, map, format, source = 'zoho') => {
    setBusy('bulk');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const used = new Set();
      for (const rec of records) {
        const vals = { ...seedValues(template) };
        for (const [ph, fieldKey] of Object.entries(map)) {
          if (fieldKey && rec.fields[fieldKey] != null && rec.fields[fieldKey] !== '') vals[ph] = rec.fields[fieldKey];
        }
        const svg = renderSvg(template, vals);
        const blob = await toBlob(format, svg, template.dims);
        let name = safeName(rec.label || rec.id);
        while (used.has(name)) name = `${name}-1`;
        used.add(name);
        zip.file(`${name}.${format}`, blob);
      }
      const out = await zip.generateAsync({ type: 'blob' });
      downloadBlob(out, `${template.id}-batch-${records.length}.zip`);
      const thumb = await makeThumb(previewSvg, template.dims);
      setHistory((h) => [addExport({ template: template.id, templateId: template.id, templateName: template.name, format, count: records.length, source, thumb }), ...h]);
    } catch (e) {
      console.error(e);
      alert('Bulk generation failed. Try fewer records or a different format.');
    } finally { setBusy(''); }
  };
  const onBulk = (records, map, format) => runBatch(records, map, format, 'zoho');

  // ── CSV bulk: upload a spreadsheet, auto-map columns to fields, generate. ──
  const csvRef = React.useRef(null);
  const onCsvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (!headers.length || !rows.length) { alert('That CSV looks empty. Add a header row and at least one data row.'); return; }
      // Auto-map: match each template field to a CSV column by key or label (case-insensitive).
      const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const headerByNorm = {}; headers.forEach((h) => { headerByNorm[norm(h)] = h; });
      const map = {};
      let matched = 0;
      for (const f of template.fields) {
        const hit = headerByNorm[norm(f.key)] || headerByNorm[norm(f.label)];
        if (hit) { map[f.key] = hit; matched++; }
      }
      if (!matched) { alert(`None of the CSV columns matched this template's fields.\n\nTemplate fields: ${template.fields.map((f) => f.label).join(', ')}\nCSV columns: ${headers.join(', ')}\n\nRename your CSV headers to match the field names.`); return; }
      const records = rows.map((row, i) => ({ id: `row-${i + 1}`, label: row[headers[0]] || `row-${i + 1}`, fields: row }));
      if (records.length > 500 && !window.confirm(`Generate ${records.length} documents? Large batches can take a while.`)) return;
      await runBatch(records, map, 'pdf', 'csv');
    } catch (err) {
      console.error(err);
      alert('Could not read that CSV file. Make sure it is a plain .csv with a header row.');
    }
  };

  return (
    <div className="subpage-wrap biz-hub">
      <header className="biz-hub-head">
        <div>
          <span className="biz-hub-eyebrow"><Buildings weight="fill" /> Document Generator</span>
          <h1>Documents that fill themselves in</h1>
          <p>Pick a template, add your details, and export a finished certificate, invoice or card in seconds — or connect Zoho to auto-fill from your records.</p>
          <div className="biz-hub-badges">
            <span><ShieldCheck size={14} weight="fill" /> No design skills needed</span>
            <span><Sparkle size={14} weight="fill" /> {CATALOGUE.length} premium templates</span>
            <span><FilePdf size={14} weight="fill" /> SVG · PNG · PDF</span>
          </div>
        </div>
        <Link to="/business/help" className="biz-hub-help"><Question size={16} /> Help &amp; guide</Link>
      </header>

      <div className="biz-tabs" role="tablist">
        <button role="tab" className={`biz-tab ${view === 'templates' ? 'active' : ''}`} onClick={() => setView('templates')}>
          <SquaresFour size={16} /> Templates
        </button>
        <button role="tab" className={`biz-tab ${view === 'connections' ? 'active' : ''}`} onClick={() => setView('connections')}>
          <Plugs size={16} /> Connections
        </button>
        <button role="tab" className={`biz-tab ${view === 'exports' ? 'active' : ''}`} onClick={() => { setHistory(loadExports()); setView('exports'); }}>
          <ClockCounterClockwise size={16} /> Documents{history.length ? ` (${history.length})` : ''}
        </button>
      </div>

      {view === 'connections' && <Connections />}
      {view === 'exports' && <ExportsView history={history} onClear={() => { clearExports(); setHistory([]); }} onRemove={(id) => setHistory(removeExport(id))} onReopen={reopenDoc} onDownload={reDownload} onNew={() => setView('templates')} />}

      {view === 'templates' && (
      <>
      <div className="biz-toolbar">
        <div className="biz-cats">
          {categories.map((c) => (
            <button key={c} className={`biz-cat ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="biz-toolbar-right">
          <div className="biz-tpl-search">
            <MagnifyingGlass size={16} />
            <input value={tplSearch} onChange={(e) => setTplSearch(e.target.value)} placeholder="Search templates…" aria-label="Search templates" />
          </div>
          <button className="biz-upload-btn" onClick={() => setBuilder(true)}><UploadSimple size={15} /> Upload your design</button>
        </div>
      </div>

      <div className="biz-layout">
        <aside className="biz-templates">
          <div className="biz-templates-head">{shown.length} template{shown.length !== 1 ? 's' : ''}</div>
          <div className="biz-templates-grid">
            <button className="biz-tpl biz-tpl-new" onClick={() => setBuilder(true)} title="Upload your own design">
              <span className="biz-tpl-new-ic"><Plus size={22} /></span>
              <span className="biz-tpl-name">Upload your design</span>
            </button>
            {shown.map((t) => (
              <button key={t.id} className={`biz-tpl ${t.id === id ? 'active' : ''}`} onClick={() => setId(t.id)} title={t.name}>
                <span className="biz-tpl-preview" style={{ aspectRatio: `${t.dims.w} / ${t.dims.h}` }}>
                  <img src={svgUrl(renderSvg(t, seedValues(t)))} alt="" loading="lazy" />
                </span>
                {t.premium && <span className="biz-tpl-pro">PRO</span>}
                <span className="biz-tpl-name">{t.name}</span>
                {t.custom && (
                  <span className="biz-tpl-del" title="Delete this template"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this template?')) { const next = removeCustom(t.id); setCustom(next); if (id === t.id) setId((next[0] || CATALOGUE[0]).id); } }}>
                    <Trash size={13} />
                  </span>
                )}
              </button>
            ))}
            {shown.length === 0 && <p className="biz-tpl-empty">No templates match “{tplSearch}”.</p>}
          </div>
        </aside>

        <section className="biz-editor">
          <div className="biz-preview">
            <img src={svgUrl(previewSvg)} alt={`${template.name} preview`} />
          </div>

          <div className="biz-form">
            <div className="biz-form-top">
              <h3>{template.name}</h3>
              {connected.length > 0 && (
                <button className="biz-zoho-fill" onClick={() => setPicker(true)}>
                  <Sparkle size={14} weight="fill" /> Fill from Zoho
                </button>
              )}
            </div>

            {template.fields.filter((f) => f.group !== 'items').map((f) => (f.kind === 'image' ? (
              <label key={f.key} className="biz-field">
                <span>{f.label} <em className="biz-field-hint">(image)</em></span>
                <div className="biz-imgfield">
                  {values[f.key]
                    ? <img className="biz-imgfield-thumb" src={values[f.key]} alt={f.label} />
                    : <span className="biz-imgfield-empty">No image yet</span>}
                  <div className="biz-imgfield-actions">
                    <label className="btn-outline biz-imgfield-btn">
                      Upload
                      <input type="file" accept="image/*" hidden onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
                        setValues((v) => ({ ...v, [f.key]: url })); e.target.value = '';
                      }} />
                    </label>
                    {values[f.key] && <button type="button" className="btn-outline" onClick={() => setValues((v) => ({ ...v, [f.key]: '' }))}>Remove</button>}
                  </div>
                  <input className="biz-imgfield-url" type="text" placeholder="…or paste an image URL" value={/^https?:/i.test(values[f.key] || '') ? values[f.key] : ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              </label>
            ) : (
              <label key={f.key} className="biz-field">
                <span>{f.label}</span>
                <div className="biz-field-ai">
                  <input
                    type="text"
                    value={values[f.key] ?? ''}
                    placeholder={f.sample}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                  <button type="button" className="biz-ai-btn" disabled={aiField === f.key} title="Write with AI" onClick={() => aiFill(f)}>
                    {aiField === f.key ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, margin: 0 }} /> : <Sparkle size={15} weight="fill" />}
                  </button>
                </div>
              </label>
            )))}

            {template.itemized && (
              <InvoiceItems
                values={values}
                setValues={setValues}
                maxRows={template.fields.filter((f) => /^item_\d+_name$/.test(f.key)).length || 6}
              />
            )}

            <div className="biz-actions">
              <button className="btn-outline" disabled={!!busy} onClick={() => generate('svg')}><FileSvg size={16} /> SVG</button>
              <button className="btn-outline" disabled={!!busy} onClick={() => generate('png')}><FilePng size={16} /> PNG</button>
              <button className="btn-primary" disabled={!!busy} onClick={() => generate('pdf')}><FilePdf size={16} /> {busy === 'single' ? 'Generating…' : 'PDF'}</button>
            </div>

            {/* Push the generated document straight into a Zoho Creator report */}
            <button className="biz-creator-cta" disabled={!!busy} onClick={() => sendToCreator('pdf')}>
              <Plugs size={15} /> {busy === 'creator' ? 'Preparing…' : 'Send to Zoho Creator'}
            </button>

            {/* Bulk from a spreadsheet — works for everyone, no Zoho needed */}
            <button className="biz-csv-cta" disabled={!!busy} onClick={() => csvRef.current?.click()}>
              <UploadSimple size={15} /> {busy === 'bulk' ? 'Generating batch…' : 'Bulk generate from CSV / spreadsheet'}
            </button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={onCsvFile} />
            <p className="biz-hint" style={{ marginTop: -2 }}>
              Column headers should match the field names: <strong>{template.fields.map((f) => f.label).join(', ')}</strong>. One PDF per row, downloaded as a zip.
            </p>

            {connected.length === 0 && (
              <button className="biz-zoho-cta" onClick={() => setView('connections')}>
                <Plugs size={15} /> Connect Zoho to bulk-generate from records
              </button>
            )}

            <Link to={`/studio?template=${encodeURIComponent(template.id)}`} className="biz-open-studio"><PaintBrush size={15} /> Open the full Studio to customize</Link>
            <p className="biz-hint"><DownloadSimple size={14} /> Tip: fill the fields, or pull real data from Zoho, then export. Select multiple records for a bulk zip.</p>
          </div>
        </section>
      </div>
      </>
      )}

      {busy === 'bulk' && (
        <div className="biz-busy-overlay"><div className="biz-busy-card"><DownloadSimple size={22} /> Generating batch… please keep this tab open.</div></div>
      )}

      {picker && (
        <RecordPicker
          template={template}
          connectedServices={connected}
          onFill={onFill}
          onBulk={onBulk}
          onClose={() => setPicker(false)}
        />
      )}

      {builder && (
        <TemplateBuilder
          onClose={() => setBuilder(false)}
          onSaved={(tpl) => { setCustom(loadCustom()); setId(tpl.id); setCat('Custom'); setView('templates'); setBuilder(false); }}
        />
      )}

      {creatorFile && <SendToCreator file={creatorFile} onClose={() => setCreatorFile(null)} />}
    </div>
  );
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function ExportsView({ history, onClear, onRemove, onReopen, onDownload, onNew }) {
  if (!history.length) {
    return (
      <div className="biz-empty">
        <ClockCounterClockwise size={40} />
        <h3>No documents yet</h3>
        <p>Every document you generate is saved here — reopen, edit or re-download it anytime.</p>
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={onNew}>Create your first document</button>
      </div>
    );
  }
  return (
    <div className="biz-docs">
      <div className="biz-docs-head">
        <div>
          <h3>Your documents</h3>
          <p>{history.length} saved on this device — reopen, edit or re-download anytime.</p>
        </div>
        <button className="btn-ghost-danger" onClick={onClear}><Trash size={14} /> Clear all</button>
      </div>
      <div className="biz-docs-grid">
        {history.map((h) => (
          <div key={h.id} className="biz-doc-card">
            <button className="biz-doc-thumb" onClick={() => onReopen(h)} title="Reopen this document">
              {h.thumb
                ? <img src={h.thumb} alt={h.templateName || 'document'} loading="lazy" />
                : <span className="biz-doc-thumb-empty"><ClockCounterClockwise size={26} /></span>}
              <span className={`biz-doc-badge ${h.source === 'zoho' ? 'zoho' : ''}`}>{h.source === 'zoho' ? `Zoho · ${h.count}` : h.count > 1 ? `Batch · ${h.count}` : String(h.format).toUpperCase()}</span>
            </button>
            <div className="biz-doc-meta">
              <strong title={h.templateName || h.template}>{h.templateName || h.template}</strong>
              <span>{timeAgo(h.at)} · {String(h.format).toUpperCase()}</span>
            </div>
            <div className="biz-doc-actions">
              <button className="btn-outline" onClick={() => onDownload(h)} title="Download again"><DownloadSimple size={14} /> Download</button>
              <button className="btn-outline" onClick={() => onReopen(h)} title="Open in the generator">Open</button>
              <button className="biz-doc-del" onClick={() => onRemove(h.id)} title="Remove"><Trash size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
