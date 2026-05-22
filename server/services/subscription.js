const { query } = require('../db');
const {
  PLAN_IDS,
  PLAN_LIMITS,
  planHasFeature,
  PLAN_CATALOG,
} = require('../constants/plans');

const TRIAL_DAYS = 14;

async function getBusinessForUser(userId) {
  const { rows } = await query(
    'SELECT * FROM businesses WHERE owner_user_id = $1 ORDER BY id LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function ensureBusinessForOwner(userId, name = 'My Business') {
  let biz = await getBusinessForUser(userId);
  if (biz) return biz;
  const { rows } = await query(
    `INSERT INTO businesses (owner_user_id, business_name, plan_id, subscription_status)
     VALUES ($1, $2, $3, 'active') RETURNING *`,
    [userId, name, PLAN_IDS.STARTER]
  );
  return rows[0];
}

function isTrialActive(business) {
  if (!business?.trial_ends_at) return false;
  return new Date(business.trial_ends_at) > new Date();
}

/** Effective plan id after trial / subscription resolution */
function resolveEffectivePlanId(business) {
  if (!business) return PLAN_IDS.STARTER;

  if (isTrialActive(business)) {
    return PLAN_IDS.PROFESSIONAL;
  }

  const status = business.subscription_status || 'active';
  const planId = business.plan_id || PLAN_IDS.STARTER;

  if (status === 'cancelled' || status === 'expired') {
    return PLAN_IDS.STARTER;
  }

  if (status === 'past_due') {
    return planId;
  }

  if (['active', 'trialing'].includes(status)) {
    return planId;
  }

  return PLAN_IDS.STARTER;
}

function getLimitsForPlan(planId) {
  return PLAN_LIMITS[planId] || PLAN_LIMITS[PLAN_IDS.STARTER];
}

async function getSubscriptionContext(userId) {
  const business = await getBusinessForUser(userId);
  const effectivePlanId = resolveEffectivePlanId(business);
  const limits = getLimitsForPlan(effectivePlanId);
  const trialActive = business ? isTrialActive(business) : false;
  const trialDaysLeft = trialActive
    ? Math.max(
        0,
        Math.ceil((new Date(business.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return {
    business,
    effectivePlanId,
    billingPlanId: business?.plan_id || PLAN_IDS.STARTER,
    subscriptionStatus: business?.subscription_status || 'active',
    trialActive,
    trialEndsAt: business?.trial_ends_at || null,
    trialDaysLeft,
    currentPeriodEnd: business?.current_period_end || null,
    limits,
    stripeCustomerId: business?.stripe_customer_id || null,
    stripeSubscriptionId: business?.stripe_subscription_id || null,
    paypalSubscriptionId: business?.paypal_subscription_id || null,
    razorpaySubscriptionId: business?.razorpay_subscription_id || null,
  };
}

function canUseFeature(ctx, feature) {
  return planHasFeature(ctx.effectivePlanId, feature);
}

async function countEmployees(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS c FROM employees');
  return rows[0]?.c || 0;
}

async function countLocations(businessId) {
  const { rows } = await query('SELECT COUNT(*)::int AS c FROM plants');
  return rows[0]?.c || 0;
}

async function startProfessionalTrial(businessId) {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + TRIAL_DAYS);

  await query(
    `UPDATE businesses SET trial_ends_at = $1, subscription_status = 'trialing', updated_at = NOW()
     WHERE id = $2`,
    [endsAt, businessId]
  );

  const existing = await query('SELECT id FROM trials WHERE business_id = $1 LIMIT 1', [businessId]);
  if (!existing.rows.length) {
    await query(
      `INSERT INTO trials (business_id, plan_id, ends_at) VALUES ($1, $2, $3)`,
      [businessId, PLAN_IDS.PROFESSIONAL, endsAt]
    );
  } else {
    await query(
      `UPDATE trials SET plan_id = $2, ends_at = $3, started_at = COALESCE(started_at, NOW()) WHERE business_id = $1`,
      [businessId, PLAN_IDS.PROFESSIONAL, endsAt]
    );
  }

  return endsAt;
}

async function expireTrialIfNeeded(business) {
  if (!business || !business.trial_ends_at) return business;
  if (new Date(business.trial_ends_at) > new Date()) return business;

  if (
    business.subscription_status === 'trialing' &&
    !business.stripe_subscription_id &&
    !business.paypal_subscription_id &&
    !business.razorpay_subscription_id
  ) {
    await query(
      `UPDATE businesses SET plan_id = $1, subscription_status = 'active', trial_ends_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [PLAN_IDS.STARTER, business.id]
    );
    try {
      const { rows: owners } = await query(
        'SELECT u.email FROM users u WHERE u.id = $1',
        [business.owner_user_id]
      );
      const { emailTrialExpired } = require('./paymentEmails');
      if (owners[0]?.email) await emailTrialExpired({ to: owners[0].email });
    } catch (e) {
      console.warn('trial expired email', e.message);
    }
    const { rows } = await query('SELECT * FROM businesses WHERE id = $1', [business.id]);
    return rows[0];
  }
  return business;
}

function envPaymentIds(planId) {
  const map = {
    starter: { m: 'STRIPE_STARTER_MONTHLY_PRICE_ID', a: 'STRIPE_STARTER_ANNUAL_PRICE_ID' },
    professional: { m: 'STRIPE_PRO_MONTHLY_PRICE_ID', a: 'STRIPE_PRO_ANNUAL_PRICE_ID' },
    business: { m: 'STRIPE_BUSINESS_MONTHLY_PRICE_ID', a: 'STRIPE_BUSINESS_ANNUAL_PRICE_ID' },
  };
  const keys = map[planId] || {};
  const prefix = planId.toUpperCase();
  return {
    monthly: process.env[keys.m] || null,
    annual: process.env[keys.a] || null,
    razorpayMonthly:
      process.env[`RAZORPAY_${prefix}_MONTHLY_PLAN_ID`] ||
      (planId === 'professional' ? process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID : null),
    razorpayAnnual:
      process.env[`RAZORPAY_${prefix}_ANNUAL_PLAN_ID`] ||
      (planId === 'professional' ? process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID : null),
  };
}

async function seedSubscriptionPlans() {
  for (const plan of PLAN_CATALOG) {
    const features = { list: plan.features };
    const prices = envPaymentIds(plan.id);
    await query(
      `INSERT INTO subscription_plans (id, name, monthly_price, annual_price, max_employees, max_locations, features, sort_order,
        stripe_monthly_price_id, stripe_annual_price_id, razorpay_monthly_plan_id, razorpay_annual_plan_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         monthly_price = EXCLUDED.monthly_price,
         annual_price = EXCLUDED.annual_price,
         max_employees = EXCLUDED.max_employees,
         max_locations = EXCLUDED.max_locations,
         features = EXCLUDED.features,
         sort_order = EXCLUDED.sort_order,
         stripe_monthly_price_id = COALESCE(EXCLUDED.stripe_monthly_price_id, subscription_plans.stripe_monthly_price_id),
         stripe_annual_price_id = COALESCE(EXCLUDED.stripe_annual_price_id, subscription_plans.stripe_annual_price_id),
         razorpay_monthly_plan_id = COALESCE(EXCLUDED.razorpay_monthly_plan_id, subscription_plans.razorpay_monthly_plan_id),
         razorpay_annual_plan_id = COALESCE(EXCLUDED.razorpay_annual_plan_id, subscription_plans.razorpay_annual_plan_id)`,
      [
        plan.id,
        plan.name,
        plan.monthly_price,
        plan.annual_price,
        plan.max_employees,
        plan.max_locations,
        JSON.stringify(features),
        plan.sort_order,
        prices.monthly,
        prices.annual,
        prices.razorpayMonthly,
        prices.razorpayAnnual,
      ]
    );
  }
}

async function getPlansFromDb() {
  const { rows } = await query(
    'SELECT * FROM subscription_plans ORDER BY sort_order ASC'
  );
  if (rows.length) return rows;
  return PLAN_CATALOG.map((p) => ({
    id: p.id,
    name: p.name,
    monthly_price: p.monthly_price,
    annual_price: p.annual_price,
    max_employees: p.max_employees,
    max_locations: p.max_locations,
    features: { list: p.features },
  }));
}

module.exports = {
  TRIAL_DAYS,
  getBusinessForUser,
  ensureBusinessForOwner,
  getSubscriptionContext,
  resolveEffectivePlanId,
  canUseFeature,
  countEmployees,
  countLocations,
  startProfessionalTrial,
  expireTrialIfNeeded,
  seedSubscriptionPlans,
  getPlansFromDb,
  isTrialActive,
};
