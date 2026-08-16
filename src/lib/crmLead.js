// src/lib/crmLead.js
// Fire-and-forget: push any website form submission into the owner's Zoho CRM.
// Non-blocking — never delays or breaks the form's own behaviour. Server writes
// to the connected CRM only if ZOHO_OWNER_UID is configured; otherwise it no-ops.

export function submitLeadToCrm(data = {}) {
  try {
    fetch('/api/zoho/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        subject: data.subject || '',
        message: data.message || '',
        source: data.source || 'PikFinder Website',
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* never block the form */ }
}
