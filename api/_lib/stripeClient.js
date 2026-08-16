// api/_lib/stripeClient.js
// Lazy Stripe client from STRIPE_SECRET_KEY. Throws a clear error if unset so the
// endpoints can return a helpful 503 rather than a cryptic crash.

import Stripe from 'stripe';

let stripe = null;

export function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return stripe;
}

// Price IDs for the Creator Pro plan (create these in the Stripe dashboard).
export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  yearly: process.env.STRIPE_PRICE_YEARLY || '',
};

export const APP_URL = process.env.APP_URL || 'https://pikfinder.com';
export const TRIAL_DAYS = parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);
