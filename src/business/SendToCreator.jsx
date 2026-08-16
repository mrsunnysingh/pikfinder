// src/business/SendToCreator.jsx
// Modal that pushes a generated document into Zoho Creator: pick an app/report,
// a file-upload field, then either attach to an existing record or create a new
// one — the file uploads to that record's field. Self-contained; the parent just
// passes the file as { base64, filename, contentType }.

import React, { useEffect, useState } from 'react';
import { X, CircleNotch, CheckCircle, UploadSimple, ArrowSquareOut } from '@phosphor-icons/react';
import { getStatus, getModules, getFields, getForms, getRecords, attachToCreator } from './zohoClient';

const OWNER_KEY = 'pikfinder-creator-owner';

export default function SendToCreator({ file, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | notconnected | form | sending | done | error
  const [err, setErr] = useState('');
  const [owner, setOwner] = useState(() => localStorage.getItem(OWNER_KEY) || '');
  const [modules, setModules] = useState([]);
  const [module, setModule] = useState('');
  const [fields, setFields] = useState([]);
  const [field, setField] = useState('');
  const [mode, setMode] = useState('existing');
  const [records, setRecords] = useState([]);
  const [recordId, setRecordId] = useState('');
  const [forms, setForms] = useState([]);
  const [form, setForm] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [result, setResult] = useState(null);

  // Check the connection + load Creator app/report list on open.
  useEffect(() => {
    (async () => {
      try {
        const s = await getStatus('creator');
        if (!s.ok || !s.data?.services?.creator?.connected) { setPhase('notconnected'); return; }
        const m = await getModules('creator');
        setModules(m.data?.modules || []);
        setPhase('form');
      } catch (e) { setErr(String(e.message || e)); setPhase('error'); }
    })();
  }, []);

  // When app/report changes, load its fields (for the file field) and forms.
  useEffect(() => {
    if (!module) { setFields([]); setForms([]); return; }
    setField(''); setRecordId(''); setForm('');
    (async () => {
      const [f, r, fm] = await Promise.all([
        getFields('creator', module),
        getRecords('creator', module),
        getForms(module.split('/')[0]),
      ]);
      setFields(f.data?.fields || []);
      setRecords(r.data?.records || []);
      setForms(fm.data?.forms || []);
    })();
  }, [module]);

  const canSend = owner.trim() && module && field && (mode === 'existing' ? recordId : form);

  const send = async () => {
    setPhase('sending'); setErr('');
    localStorage.setItem(OWNER_KEY, owner.trim());
    try {
      const payload = {
        owner: owner.trim(), module, field, mode,
        filename: file.filename, base64: file.base64, contentType: file.contentType,
      };
      if (mode === 'existing') payload.recordId = recordId;
      else { payload.form = form; if (newTitle.trim()) payload.createData = { Name: newTitle.trim() }; }
      const res = await attachToCreator(payload);
      if (!res.ok || !res.data?.ok) {
        const d = res.data || {};
        setErr(d.error === 'upload_failed' ? 'Upload failed — check the field is a file-upload field and the report allows it.'
          : d.error === 'create_failed' ? 'Could not create the record — the form may have required fields.'
          : d.error === 'not_connected' ? 'Zoho Creator is not connected.'
          : (d.error || `Failed (${res.status}).`));
        setPhase('form'); return;
      }
      setResult(res.data);
      setPhase('done');
    } catch (e) { setErr(String(e.message || e)); setPhase('form'); }
  };

  return (
    <div className="stc-overlay" onClick={onClose}>
      <div className="stc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stc-head">
          <h3><UploadSimple size={18} weight="bold" /> Send to Zoho Creator</h3>
          <button className="stc-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {phase === 'loading' && <div className="stc-center"><CircleNotch className="admin-spin" size={22} /> Checking Zoho connection…</div>}

        {phase === 'notconnected' && (
          <div className="stc-center">
            <p>Zoho Creator isn’t connected yet.</p>
            <p className="stc-hint">Open the Document Generator → Connections and connect Zoho Creator, then come back.</p>
            <button className="btn-primary" onClick={onClose}>OK</button>
          </div>
        )}

        {phase === 'error' && <div className="stc-center"><p className="stc-err">{err}</p><button className="btn-outline" onClick={onClose}>Close</button></div>}

        {(phase === 'form' || phase === 'sending') && (
          <div className="stc-body">
            {err && <div className="stc-err">{err}</div>}

            <label className="stc-field">
              <span>Account owner <em>(from your Creator URL: creator.zoho.com/appbuilder/<b>owner</b>/…)</em></span>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. yourname" />
            </label>

            <label className="stc-field">
              <span>App › Report</span>
              <select value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">Select a report…</option>
                {modules.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>

            <label className="stc-field">
              <span>File-upload field <em>(where the document attaches)</em></span>
              <select value={field} onChange={(e) => setField(e.target.value)} disabled={!module}>
                <option value="">Select a field…</option>
                {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </label>

            <div className="stc-modes">
              <button className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Attach to existing record</button>
              <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Create new record</button>
            </div>

            {mode === 'existing' ? (
              <label className="stc-field">
                <span>Record</span>
                <select value={recordId} onChange={(e) => setRecordId(e.target.value)} disabled={!module}>
                  <option value="">Select a record…</option>
                  {records.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
            ) : (
              <>
                <label className="stc-field">
                  <span>Form <em>(new record is created here)</em></span>
                  <select value={form} onChange={(e) => setForm(e.target.value)} disabled={!module}>
                    <option value="">Select a form…</option>
                    {forms.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </label>
                <label className="stc-field">
                  <span>Record name <em>(optional)</em></span>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Invoice — Acme Corp" />
                </label>
              </>
            )}

            <div className="stc-file">Attaching: <strong>{file.filename}</strong></div>

            <div className="stc-actions">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={!canSend || phase === 'sending'} onClick={send}>
                {phase === 'sending' ? <><CircleNotch className="admin-spin" size={16} /> Sending…</> : <>Send to Creator</>}
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="stc-center">
            <CheckCircle size={44} weight="fill" color="#10b981" />
            <p><strong>Attached!</strong> Your document was uploaded to the Creator record.</p>
            {result?.recordId && <p className="stc-hint">Record ID: {result.recordId}</p>}
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
