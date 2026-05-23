/** Checkout gateway order: Stripe first, Razorpay second */
export const PAYMENT_PROVIDER_PRIORITY = ['stripe', 'razorpay'];

export const PAYMENT_PROVIDER_LABELS = {
  stripe: 'Stripe',
  razorpay: 'Razorpay',
};

export const CATALOG_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly_price: 0,
    annual_price: 0,
    sort_order: 1,
    features: {
      list: [
        'Up to 5 employees',
        '1 location',
        'Basic roster (create + view)',
        'Email support',
      ],
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly_price: 29,
    annual_price: 290,
    sort_order: 2,
    features: {
      list: [
        'Up to 25 employees',
        '3 locations',
        'Full roster (create, publish, send, download)',
        'All reports (hours, wages, comparison)',
        'Holiday import',
        'Leave management',
        'PDF Extractor',
        'Priority email support',
      ],
    },
  },
  {
    id: 'business',
    name: 'Business',
    monthly_price: 79,
    annual_price: 790,
    sort_order: 3,
    features: {
      list: [
        'Unlimited employees & locations',
        'Everything in Professional',
        'Finance Organiser',
        'Email-to-extract',
        'Roster → Finance data feed',
        'Custom holiday setup',
        'Phone + priority support',
        'Early access to new features',
      ],
    },
  },
];

export function pickDefaultProvider(gateways) {
  for (const id of PAYMENT_PROVIDER_PRIORITY) {
    if (gateways[id]) return id;
  }
  return 'stripe';
}

/** Always show Stripe then Razorpay in Pay with (like reference UI) */
export function orderedProviders(gateways) {
  return PAYMENT_PROVIDER_PRIORITY.map((id) => ({
    id,
    label: PAYMENT_PROVIDER_LABELS[id],
    configured: !!gateways[id],
  }));
}

export function normalizePlan(plan) {
  const features = plan.features;
  const list = Array.isArray(features?.list)
    ? features.list
    : Array.isArray(features)
      ? features
      : CATALOG_PLANS.find((p) => p.id === plan.id)?.features?.list || [];

  return {
    id: plan.id,
    name: plan.name,
    monthly_price: Number(plan.monthly_price ?? 0),
    annual_price: Number(plan.annual_price ?? 0),
    sort_order: plan.sort_order ?? 99,
    features: { list },
  };
}

export function displayPrice(plan, interval) {
  const annual = interval === 'annual';
  const raw = annual ? plan.annual_price : plan.monthly_price;
  if (raw === 0) return { main: 'Free', suffix: null, sub: null };
  const total = Number(raw);
  const perMonth = annual ? Math.round(total / 12) : total;
  return {
    main: `$${perMonth}`,
    suffix: '/mo',
    sub: annual ? `$${total} billed annually` : null,
  };
}
