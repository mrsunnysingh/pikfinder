import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';

// Line-item builder for invoice templates. The user adds products with a qty and
// rate; we auto-compute each amount, the subtotal, tax and total, and write the
// results back into the template's {{item_N_*}}, {{subtotal}}, {{tax}} and
// {{amount}} placeholders via setValues. Empty rows clear their placeholders so
// short invoices simply render fewer lines.

const CURRENCIES = ['₹', '$', '€', '£', '¥'];
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export default function InvoiceItems({ values, setValues, maxRows = 6 }) {
  // Seed rows from any existing values (template samples or a Zoho/CSV fill).
  const initial = useMemo(() => {
    const rows = [];
    for (let i = 1; i <= maxRows; i++) {
      const name = values?.[`item_${i}_name`];
      const qty = values?.[`item_${i}_qty`];
      const rate = values?.[`item_${i}_rate`];
      if (name || qty || rate) rows.push({ name: name || '', qty: qty || '1', rate: String(rate ?? '') });
    }
    return rows.length ? rows : [{ name: '', qty: '1', rate: '' }];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [items, setItems] = useState(initial);
  const [taxPct, setTaxPct] = useState('0');
  const [cur, setCur] = useState('₹');
  const setValuesRef = useRef(setValues);
  setValuesRef.current = setValues;

  const fmt = (n) => cur + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const subtotal = items.reduce((s, it) => s + num(it.qty) * num(it.rate), 0);
  const taxAmt = subtotal * (num(taxPct) / 100);
  const total = subtotal + taxAmt;

  // Push computed values into the template placeholders whenever anything changes.
  useEffect(() => {
    const patch = {};
    for (let i = 1; i <= maxRows; i++) {
      const it = items[i - 1];
      if (it && (it.name || it.rate)) {
        const amt = num(it.qty) * num(it.rate);
        patch[`item_${i}_name`] = it.name;
        patch[`item_${i}_qty`] = it.qty || '1';
        patch[`item_${i}_rate`] = fmt(num(it.rate));
        patch[`item_${i}_amount`] = fmt(amt);
      } else {
        patch[`item_${i}_name`] = '';
        patch[`item_${i}_qty`] = '';
        patch[`item_${i}_rate`] = '';
        patch[`item_${i}_amount`] = '';
      }
    }
    patch.subtotal = fmt(subtotal);
    patch.tax = num(taxPct) > 0 ? `${fmt(taxAmt)} (${num(taxPct)}%)` : fmt(0);
    patch.amount = fmt(total);
    setValuesRef.current((v) => ({ ...v, ...patch }));
  }, [items, taxPct, cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (idx, key, val) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  const addRow = () => setItems((arr) => (arr.length >= maxRows ? arr : [...arr, { name: '', qty: '1', rate: '' }]));
  const removeRow = (idx) => setItems((arr) => (arr.length <= 1 ? arr : arr.filter((_, i) => i !== idx)));

  return (
    <div className="inv-items">
      <div className="inv-items-head">
        <span>Line items</span>
        <select className="inv-cur" value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="inv-row inv-row-labels">
        <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span />
      </div>

      {items.map((it, i) => (
        <div className="inv-row" key={i}>
          <input placeholder="Item or service" value={it.name} onChange={(e) => update(i, 'name', e.target.value)} />
          <input className="inv-num" inputMode="decimal" placeholder="1" value={it.qty} onChange={(e) => update(i, 'qty', e.target.value)} />
          <input className="inv-num" inputMode="decimal" placeholder="0" value={it.rate} onChange={(e) => update(i, 'rate', e.target.value)} />
          <span className="inv-amt">{fmt(num(it.qty) * num(it.rate))}</span>
          <button type="button" className="inv-del" onClick={() => removeRow(i)} disabled={items.length <= 1} aria-label="Remove item"><Trash size={15} /></button>
        </div>
      ))}

      <button type="button" className="inv-add" onClick={addRow} disabled={items.length >= maxRows}>
        <Plus size={14} weight="bold" /> Add item
      </button>

      <div className="inv-totals">
        <div className="inv-trow"><span>Subtotal</span><b>{fmt(subtotal)}</b></div>
        <div className="inv-trow inv-tax">
          <span>Tax
            <input className="inv-num inv-taxin" inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />%
          </span>
          <b>{fmt(taxAmt)}</b>
        </div>
        <div className="inv-trow inv-grand"><span>Total</span><b>{fmt(total)}</b></div>
      </div>
    </div>
  );
}
