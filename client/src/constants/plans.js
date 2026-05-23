export const PLAN_IDS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
};

export const FEATURE_LABELS = {
  roster_publish: 'Publish & email rosters',
  reports: 'HR reports',
  pdf_extractor: 'PDF Extractor',
  finance: 'Finance Organiser',
  holiday_import: 'Holiday import',
};

export const FAQ_ITEMS = [
  {
    q: 'What happens if I exceed the employee limit?',
    a: 'You will need to upgrade to add more employees. Existing employees remain; new hires are blocked until you upgrade.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Billing settings. You keep access until the end of your billing period, then move to Starter.',
  },
  {
    q: 'Is there a free trial?',
    a: 'New employer accounts get 14 days of Professional features with no credit card required.',
  },
  {
    q: 'Can I switch between monthly and annual?',
    a: 'Yes, via Stripe Customer Portal or Razorpay dashboard after subscribing. Annual billing saves about 17%.',
  },
];
