/** Checkout gateway order: Stripe first, Razorpay second */
export const PAYMENT_PROVIDER_PRIORITY = ['stripe', 'razorpay'];

export const PAYMENT_PROVIDER_LABELS = {
  stripe: 'Stripe',
  razorpay: 'Razorpay',
};

export function pickDefaultProvider(gateways) {
  for (const id of PAYMENT_PROVIDER_PRIORITY) {
    if (gateways[id]) return id;
  }
  return 'stripe';
}

/** Always Stripe then Razorpay in UI; `enabled` reflects server config */
export function orderedProviders(gateways) {
  return PAYMENT_PROVIDER_PRIORITY.map((id) => ({
    id,
    label: PAYMENT_PROVIDER_LABELS[id],
    enabled: !!gateways[id],
  }));
}
