import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { auth } from '../firebase';
import { payWithRazorpay, subscribeWithRazorpay } from '../lib/razorpay';

// Reusable Razorpay checkout button. Handles order creation, the payment modal,
// signature verification, cancel/failure, and user feedback via toasts.
// `amount` is in paise (e.g. 19900 = ₹199).
export default function RazorpayButton({
  amount,
  currency = 'INR',
  plan = 'creator-pro',
  recurring = false,
  label = 'Pay with Razorpay',
  description = 'PikFinder Creator Pro',
  className = 'btn-primary',
  onPaid,
}) {
  const { user } = useContext(AppContext);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let token;
      try { token = auth?.currentUser ? await auth.currentUser.getIdToken() : undefined; } catch { /* anonymous is fine */ }
      const prefill = { email: user?.email || '', name: user?.displayName || user?.name || '' };
      const oneTime = () => payWithRazorpay({ amount, currency, description, notes: { plan }, prefill, authToken: token });
      let r;
      if (recurring) {
        try {
          r = await subscribeWithRazorpay({ plan, description, prefill, authToken: token });
        } catch (e) {
          // Recurring plans aren't set up in Razorpay yet — fall back to a normal
          // one-time payment so checkout still works.
          if (e.code === 'plan_not_configured' || e.code === 'not_configured') r = await oneTime();
          else throw e;
        }
      } else {
        r = await oneTime();
      }
      if (r.ok) {
        toast('Payment successful — thank you! 🎉', 'success');
        onPaid && onPaid(r);
      } else if (r.dismissed) {
        /* user closed the modal — stay quiet */
      } else {
        toast('Payment could not be completed. Please try again.', 'error');
      }
    } catch (e) {
      toast(e.message || 'Could not start the payment.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className={className} onClick={pay} disabled={busy}>
      {busy ? 'Starting…' : label}
    </button>
  );
}
