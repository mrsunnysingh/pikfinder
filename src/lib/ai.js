// src/lib/ai.js
// Thin client for the Gemini-powered /api/gemini endpoint. Returns text or throws
// a friendly error. Used by document text-fill, search suggestions, design tips, etc.

export async function askGemini(task, input = {}) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, ...input }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const msg = data?.error === 'not_configured'
      ? 'AI is not set up yet. Add a Gemini API key in the server settings.'
      : (data?.detail || 'AI is unavailable right now. Please try again.');
    throw new Error(msg);
  }
  return data.text || '';
}
