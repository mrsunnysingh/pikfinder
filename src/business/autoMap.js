// src/business/autoMap.js
// Auto-match a template's {{placeholders}} to a Zoho module's fields by
// normalized name. E.g. placeholder "recipient_name" ↔ field "Full_Name" /
// label "Recipient Name". Returns { map: {placeholder: fieldKey}, unmatched }.
// The user can override any row in the mapping UI.

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Common synonyms so obvious cases match even when names differ.
const SYNONYMS = {
  name: ['fullname', 'contactname', 'customername', 'firstname', 'displayname'],
  recipientname: ['fullname', 'name', 'contactname', 'studentname'],
  customername: ['accountname', 'contactname', 'fullname', 'name', 'company'],
  company: ['accountname', 'companyname', 'organization'],
  email: ['emailaddress', 'primaryemail'],
  phone: ['phonenumber', 'mobile', 'contactnumber'],
  amount: ['grandtotal', 'total', 'amountdue', 'dealamount'],
  date: ['createdtime', 'createddate', 'closingdate', 'invoicedate'],
  designation: ['title', 'jobtitle', 'role'],
};

export function autoMapFields(placeholders = [], fields = []) {
  // Index fields by normalized key and label.
  const byKey = new Map();
  for (const f of fields) {
    byKey.set(norm(f.key), f.key);
    byKey.set(norm(f.label), f.key);
  }
  const findField = (candidates) => {
    for (const c of candidates) if (byKey.has(c)) return byKey.get(c);
    // loose contains match
    for (const c of candidates) for (const [k, v] of byKey) if (k.includes(c) || c.includes(k)) return v;
    return null;
  };

  const map = {};
  const unmatched = [];
  for (const ph of placeholders) {
    const n = norm(ph);
    const candidates = [n, ...(SYNONYMS[n] || [])];
    const hit = findField(candidates);
    if (hit) map[ph] = hit;
    else unmatched.push(ph);
  }
  return { map, unmatched };
}

// Apply a saved map to a record's flat fields → { placeholder: value }.
export function applyMap(map = {}, recordFields = {}) {
  const out = {};
  for (const [ph, fieldKey] of Object.entries(map)) {
    if (fieldKey && recordFields[fieldKey] != null) out[ph] = recordFields[fieldKey];
  }
  return out;
}
