// src/config/features.js
// Central feature flags. Payments are POSTPONED while validating product-market
// fit: the Stripe code stays in the repo but every live flow is gated off here.
// Flip PAYMENTS_ENABLED back to true (and set the Stripe env vars) to re-enable.

export const PAYMENTS_ENABLED = true;

// Waitlist replaces checkout while payments are off.
export const WAITLIST_ENABLED = false;

// Gate the exclusive Studio templates behind Creator Pro. Kept OFF while we grow
// traffic — everything is free so the Studio stays a strong acquisition hook.
// Flip to true once there's enough traffic/users to monetise.
export const STUDIO_PREMIUM_GATING = false;

// Founding-member offer shown on the pricing/waitlist UI.
export const FOUNDING = {
  priceLabel: '₹499/year',
  seats: 100,
};
