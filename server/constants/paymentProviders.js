/** Stripe = primary (1), Razorpay = first fallback (2) */
const PAYMENT_PROVIDER_PRIORITY = ['stripe', 'razorpay'];

function gatewaysEnabled() {
  return {
    stripe: !!process.env.STRIPE_SECRET_KEY?.trim(),
    razorpay: !!(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()),
  };
}

function pickDefaultProvider(requested) {
  const g = gatewaysEnabled();
  if (requested === 'stripe' && g.stripe) return 'stripe';
  if (requested === 'razorpay' && g.razorpay) return 'razorpay';
  for (const id of PAYMENT_PROVIDER_PRIORITY) {
    if (g[id]) return id;
  }
  return null;
}

function listProvidersForApi() {
  const g = gatewaysEnabled();
  return PAYMENT_PROVIDER_PRIORITY.filter((id) => g[id]).map((id, i) => ({
    id,
    label: id === 'stripe' ? 'Stripe' : 'Razorpay',
    priority: i + 1,
    isPrimary: id === 'stripe',
  }));
}

module.exports = {
  PAYMENT_PROVIDER_PRIORITY,
  gatewaysEnabled,
  pickDefaultProvider,
  listProvidersForApi,
};
