import React, { useState, useEffect, useCallback } from 'react';
import { X, MagnifyingGlass, ArrowClockwise } from '@phosphor-icons/react';
import { SERVICE_META } from './serviceMeta';
import { getModules, getFields, getRecords } from './zohoClient';
import { autoMapFields, applyMap } from './autoMap';
import { loadMapping, saveMapping } from './mappingStore';

// Modal: pick a Zoho module → records → review field mapping → fill one or bulk.
export default function RecordPicker({ template, connectedServices, onFill, onBulk, onClose }) {
  const placeholders = template.fields.map((f) => f.key);
  const labelFor = Object.fromEntries(template.fields.map((f) => [f.key, f.label]));

  const [service, setService] = useState(connectedServices[0] || 'crm');
  const [modules, setModules] = useState([]);
  const [module, setModule] = useState('');
  const [fields, setFields] = useState([]);
  const [records, setRecords] = useState([]);
  const [map, setMap] = useState({});
  const [savedUsed, setSavedUsed] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkFormat, setBulkFormat] = useState('png');
  const [loading, setLoading] = useState('');   // 'modules' | 'records' | ''
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  // Load modules when service changes.
  useEffect(() => {
    let alive = true;
    setLoading('modules'); setError(''); setModules([]); setModule(''); setRecords([]); setSelected(new Set());
    getModules(service).then(({ ok, data }) => {
      if (!alive) return;
      if (ok && data?.modules?.length) setModules(data.modules);
      else setError(data?.error ? String(data.error).replace(/_/g, ' ') : 'No modules available.');
    }).catch(() => alive && setError('Could not load modules.')).finally(() => alive && setLoading(''));
    return () => { alive = false; };
  }, [service]);

  const loadModule = useCallback(async (mod) => {
    setModule(mod); setError(''); setSelected(new Set());
    if (!mod) return;
    setLoading('records');
    try {
      const f = await getFields(service, mod);
      const fieldList = f.ok ? (f.data.fields || []) : [];
      setFields(fieldList);
      // Prefer a previously saved mapping; otherwise auto-match by name.
      const saved = loadMapping(service, mod, template.id);
      const { map: autoMap } = autoMapFields(placeholders, fieldList);
      const active = saved || autoMap;
      setMap(active);
      setSavedUsed(Boolean(saved));
      // Fetch a page of records, requesting only mapped CRM fields when possible.
      const fieldsParam = service === 'crm' ? Object.values(active).filter(Boolean).join(',') : undefined;
      const r = await getRecords(service, mod, { page: 1, fields: fieldsParam });
      if (r.ok) setRecords(r.data.records || []);
      else setError(String(r.data?.error || 'Could not load records').replace(/_/g, ' '));
    } catch { setError('Could not load records.'); }
    finally { setLoading(''); }
  }, [service, placeholders]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (recId) => setSelected((s) => {
    const n = new Set(s);
    n.has(recId) ? n.delete(recId) : n.add(recId);
    return n;
  });

  const shownRecords = filter
    ? records.filter((r) => String(r.label).toLowerCase().includes(filter.toLowerCase()))
    : records;

  const chosen = records.filter((r) => selected.has(r.id));

  const changeMap = (ph, fieldKey) => {
    setMap((m) => ({ ...m, [ph]: fieldKey }));
    setSavedUsed(false);
  };

  const doUse = () => {
    if (chosen.length === 0) return;
    if (module) saveMapping(service, module, template.id, map); // remember for next time
    if (chosen.length === 1) {
      onFill(applyMap(map, chosen[0].fields));
    } else {
      onBulk(chosen, map, bulkFormat);
    }
    onClose();
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose}>
      <div className="biz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="biz-modal-head">
          <h3>Fill from Zoho</h3>
          <button className="biz-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="biz-modal-body">
          <div className="biz-pick-row">
            <label>
              <span>Source</span>
              <select value={service} onChange={(e) => setService(e.target.value)}>
                {connectedServices.map((s) => <option key={s} value={s}>{SERVICE_META[s]?.label || s}</option>)}
              </select>
            </label>
            <label>
              <span>Module</span>
              <select value={module} onChange={(e) => loadModule(e.target.value)} disabled={loading === 'modules' || !modules.length}>
                <option value="">{loading === 'modules' ? 'Loading…' : 'Select…'}</option>
                {modules.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>
          </div>

          {error && <div className="biz-flash err" style={{ margin: '4px 0 10px' }}>{error}</div>}

          {module && !error && (
            <>
              {/* Field mapping review */}
              <div className="biz-mapbox">
                <div className="biz-mapbox-title">Field mapping <span>{savedUsed ? 'using your saved mapping' : 'auto-matched — adjust if needed'}</span></div>
                <div className="biz-maprows">
                  {placeholders.map((ph) => (
                    <div key={ph} className="biz-maprow">
                      <code>{labelFor[ph] || ph}</code>
                      <span className="biz-maparrow">←</span>
                      <select value={map[ph] || ''} onChange={(e) => changeMap(ph, e.target.value)}>
                        <option value="">— none —</option>
                        {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Records */}
              <div className="biz-reclist-head">
                <div className="biz-search">
                  <MagnifyingGlass size={15} />
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter records…" />
                </div>
                <button className="btn-outline" onClick={() => loadModule(module)} disabled={loading === 'records'}>
                  <ArrowClockwise size={14} /> {loading === 'records' ? 'Loading…' : 'Reload'}
                </button>
              </div>

              <div className="biz-reclist">
                {loading === 'records' && <p className="biz-conn-loading">Loading records…</p>}
                {loading !== 'records' && shownRecords.length === 0 && <p className="biz-conn-loading">No records found.</p>}
                {shownRecords.map((r) => (
                  <label key={r.id} className={`biz-rec ${selected.has(r.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    <span className="biz-rec-label">{r.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="biz-modal-foot">
          <span className="biz-modal-count">{chosen.length} selected</span>
          {chosen.length > 1 && (
            <label className="biz-bulk-fmt">
              Format
              <select value={bulkFormat} onChange={(e) => setBulkFormat(e.target.value)}>
                <option value="png">PNG</option>
                <option value="pdf">PDF</option>
                <option value="svg">SVG</option>
              </select>
            </label>
          )}
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={chosen.length === 0} onClick={doUse}>
            {chosen.length > 1 ? `Generate ${chosen.length} (zip)` : 'Fill form'}
          </button>
        </div>
      </div>
    </div>
  );
}
