// src/lib/razorpay.js
// Client helper for Razorpay Standard Checkout. Creates an order on our backend,
// opens the Razorpay modal, then verifies the signature server-side. The secret
// never touches the browser; the publishable keyId comes back from create-order.

let scriptPromise;
function loadCheckout() {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Could not load Razorpay. Check your connection.')); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Start a Razorpay payment.
 * @param {object} o
 * @param {number} o.amount   amount in paise (>= 100)
 * @param {string} [o.currency='INR']
 * @param {string} [o.name='PikFinder']
 * @param {string} [o.description]
 * @param {string} [o.receipt]
 * @param {object} [o.notes]   e.g. { plan: 'creator-pro' }
 * @param {object} [o.prefill] { name, email, contact }
 * @param {string} [o.authToken]  Firebase ID token (optional — links the payment to the user)
 * @returns {Promise<{ok:boolean, dismissed?:boolean, orderId?:string, paymentId?:string, error?:string}>}
 */
export async function payWithRazorpay(o = {}) {
  await loadCheckout();

  const headers = { 'Content-Type': 'application/json' };
  if (o.authToken) headers.Authorization = `Bearer ${o.authToken}`;

  const orderRes = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: o.amount, currency: o.currency || 'INR', receipt: o.receipt, notes: o.notes || {} }),
  });
  const order = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok || !order.ok) {
    throw new Error(order.detail || order.error || 'Could not start the payment.');
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: o.name || 'PikFinder',
      description: o.description || 'PikFinder',
      image: '/pwa-icon-192.png',
      theme: { color: '#8b5cf6' },
      prefill: o.prefill || {},
      notes: o.notes || {},
      handler: async (resp) => {
        try {
          const vr = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const vd = await vr.json().catch(() => ({}));
          resolve(vr.ok && vd.ok ? { ok: true, orderId: vd.orderId, paymentId: vd.paymentId } : { ok: false, error: vd.error || 'verify_failed' });
        } catch {
          resolve({ ok: false, error: 'verify_failed' });
        }
      },
      modal: { ondismiss: () => resolve({ ok: false, dismissed: true }) },
    });
    rzp.on('payment.failed', (r) => resolve({ ok: false, error: (r && r.error && r.error.description) || 'payment_failed' }));
    rzp.open();
  });
}

/**
 * Start a RECURRING (auto-renew) Razorpay subscription. Creates a subscription on
 * the backend, opens Razorpay checkout with the subscription_id, then verifies the
 * signature. Razorpay auto-charges each cycle and a webhook keeps access in sync.
 * @param {object} o
 * @param {string} o.plan   'creator-pro-monthly' | 'creator-pro-yearly'
 * @param {object} [o.prefill]
 * @param {string} [o.authToken]  Firebase ID token (required — subscriptions are per-user)
 */
export async function subscribeWithRazorpay(o = {}) {
  await loadCheckout();
  const headers = { 'Content-Type': 'application/json' };
  if (o.authToken) headers.Authorization = `Bearer ${o.authToken}`;

  const subRes = await fetch('/api/razorpay/create-subscription', {
    method: 'POST', headers, body: JSON.stringify({ plan: o.plan }),
  });
  const sub = await subRes.json().catch(() => ({}));
  if (!subRes.ok || !sub.ok) {
    const e = new Error(sub.detail || sub.error || 'Could not start the subscription.');
    e.code = sub.error; // e.g. 'plan_not_configured' — lets callers fall back to one-time
    throw e;
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: sub.keyId,
      subscription_id: sub.subscriptionId,
      name: o.name || 'PikFinder',
      description: o.description || 'PikFinder Creator Pro (auto-renew)',
      image: '/pwa-icon-192.png',
      theme: { color: '#8b5cf6' },
      prefill: o.prefill || {},
      handler: async (resp) => {
        try {
          const vr = await fetch('/api/razorpay/verify-subscription', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_subscription_id: resp.razorpay_subscription_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const vd = await vr.json().catch(() => ({}));
          resolve(vr.ok && vd.ok ? { ok: true, subscriptionId: vd.subscriptionId } : { ok: false, error: vd.error || 'verify_failed' });
        } catch { resolve({ ok: false, error: 'verify_failed' }); }
      },
      modal: { ondismiss: () => resolve({ ok: false, dismissed: true }) },
    });
    rzp.on('payment.failed', (r) => resolve({ ok: false, error: (r && r.error && r.error.description) || 'payment_failed' }));
    rzp.open();
  });
}
