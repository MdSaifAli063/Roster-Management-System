/** Subscription plan definitions and feature flags */

const PLAN_IDS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
};

const FEATURES = {
  ROSTER_BASIC: 'roster_basic',
  ROSTER_PUBLISH: 'roster_publish',
  REPORTS: 'reports',
  REPORT_EXPORT: 'report_export',
  HOLIDAY_IMPORT: 'holiday_import',
  LEAVE_MANAGEMENT: 'leave_management',
  PDF_EXTRACTOR: 'pdf_extractor',
  FINANCE: 'finance',
  FINANCE_EMAIL_EXTRACT: 'finance_email_extract',
  FINANCE_ROSTER_FEED: 'finance_roster_feed',
  COMPARISON_REPORTS: 'comparison_reports',
  CUSTOM_HOLIDAYS: 'custom_holidays',
};

const PLAN_FEATURES = {
  [PLAN_IDS.STARTER]: new Set([
    FEATURES.ROSTER_BASIC,
  ]),
  [PLAN_IDS.PROFESSIONAL]: new Set([
    FEATURES.ROSTER_BASIC,
    FEATURES.ROSTER_PUBLISH,
    FEATURES.REPORTS,
    FEATURES.REPORT_EXPORT,
    FEATURES.HOLIDAY_IMPORT,
    FEATURES.LEAVE_MANAGEMENT,
    FEATURES.PDF_EXTRACTOR,
  ]),
  [PLAN_IDS.BUSINESS]: new Set([
    FEATURES.ROSTER_BASIC,
    FEATURES.ROSTER_PUBLISH,
    FEATURES.REPORTS,
    FEATURES.REPORT_EXPORT,
    FEATURES.HOLIDAY_IMPORT,
    FEATURES.LEAVE_MANAGEMENT,
    FEATURES.PDF_EXTRACTOR,
    FEATURES.FINANCE,
    FEATURES.FINANCE_EMAIL_EXTRACT,
    FEATURES.FINANCE_ROSTER_FEED,
    FEATURES.COMPARISON_REPORTS,
    FEATURES.CUSTOM_HOLIDAYS,
  ]),
};

const PLAN_LIMITS = {
  [PLAN_IDS.STARTER]: { maxEmployees: 5, maxLocations: 1 },
  [PLAN_IDS.PROFESSIONAL]: { maxEmployees: 25, maxLocations: 3 },
  [PLAN_IDS.BUSINESS]: { maxEmployees: null, maxLocations: null },
};

const PLAN_CATALOG = [
  {
    id: PLAN_IDS.STARTER,
    name: 'Starter',
    monthly_price: 0,
    annual_price: 0,
    max_employees: 5,
    max_locations: 1,
    sort_order: 1,
    features: [
      'Up to 5 employees',
      '1 location',
      'Basic roster (create + view)',
      'Email support',
    ],
  },
  {
    id: PLAN_IDS.PROFESSIONAL,
    name: 'Professional',
    monthly_price: 29,
    annual_price: 290,
    max_employees: 25,
    max_locations: 3,
    sort_order: 2,
    popular: true,
    features: [
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
  {
    id: PLAN_IDS.BUSINESS,
    name: 'Business',
    monthly_price: 79,
    annual_price: 790,
    max_employees: null,
    max_locations: null,
    sort_order: 3,
    features: [
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
];

function planHasFeature(planId, feature) {
  const set = PLAN_FEATURES[planId] || PLAN_FEATURES[PLAN_IDS.STARTER];
  return set.has(feature);
}

module.exports = {
  PLAN_IDS,
  FEATURES,
  PLAN_FEATURES,
  PLAN_LIMITS,
  PLAN_CATALOG,
  planHasFeature,
};
