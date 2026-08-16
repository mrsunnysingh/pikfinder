// src/business/serviceMeta.js
// Browser-side presentation metadata for Zoho services. Kept separate from the
// server SERVICES map (api/_lib/zoho.js) so the client bundle never imports
// server code. Service ids must match.

export const SERVICE_META = {
  crm: {
    label: 'Zoho CRM',
    emoji: '👥',
    tint: 'rgba(59,130,246,0.16)',
    desc: 'Turn Contacts and Deals into certificates, cards, and marketing assets.',
  },
  creator: {
    label: 'Zoho Creator',
    emoji: '🧩',
    tint: 'rgba(139,92,246,0.16)',
    desc: 'Generate documents from form records — IDs, passes, certificates.',
  },
};
