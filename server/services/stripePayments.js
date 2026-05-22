const { PLAN_IDS } = require('../constants/plans');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return null;
  }
  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  return new Stripe(process.env.STRIPE_SECRET_KEY.trim());
}

function clientBaseUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5000').split(',')[0].trim();
}

async function getOrCreateStripeCustomer(stripe, business, userEmail) {
  if (business.stripe_customer_id) {
    try {
      return await stripe.customers.retrieve(business.stripe_customer_id);
    } catch {
      /* recreate */
    }
  }
  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { business_id: String(business.id) },
    name: business.business_name || undefined,
  });
  return customer;
}

async function resolveStripePriceId(planId, interval) {
  const { query } = require('../db');
  const col = interval === 'annual' ? 'stripe_annual_price_id' : 'stripe_monthly_price_id';
  const { rows } = await query(
    `SELECT ${col} AS price_id FROM subscription_plans WHERE id = $1`,
    [planId]
  );
  let priceId = rows[0]?.price_id;

  if (!priceId) {
    const envKey =
      interval === 'annual'
        ? {
            professional: 'STRIPE_PRO_ANNUAL_PRICE_ID',
            business: 'STRIPE_BUSINESS_ANNUAL_PRICE_ID',
            starter: 'STRIPE_STARTER_ANNUAL_PRICE_ID',
          }[planId]
        : {
            professional: 'STRIPE_PRO_MONTHLY_PRICE_ID',
            business: 'STRIPE_BUSINESS_MONTHLY_PRICE_ID',
            starter: 'STRIPE_STARTER_MONTHLY_PRICE_ID',
          }[planId];
    priceId = envKey ? process.env[envKey] : null;
  }

  return priceId;
}

async function createCheckoutSession({ business, user, planId, interval }) {
  const stripe = getStripe();
  if (!stripe) {
    throw Object.assign(new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs.'), { status: 503 });
  }

  if (planId === PLAN_IDS.STARTER) {
    throw Object.assign(new Error('Starter plan is free — no checkout required'), { status: 400 });
  }

  const priceId = await resolveStripePriceId(planId, interval);
  if (!priceId) {
    throw Object.assign(
      new Error(`Stripe price not configured for ${planId} (${interval}). Add price IDs to .env or subscription_plans.`),
      { status: 503 }
    );
  }

  const customer = await getOrCreateStripeCustomer(stripe, business, user.email);
  const base = clientBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/settings/billing?session=success`,
    cancel_url: `${base}/pricing?cancelled=1`,
    metadata: {
      business_id: String(business.id),
      plan_id: planId,
      interval,
    },
    subscription_data: {
      metadata: {
        business_id: String(business.id),
        plan_id: planId,
      },
    },
  });

  return { sessionId: session.id, url: session.url, customerId: customer.id };
}

async function createPortalSession(business) {
  const stripe = getStripe();
  if (!stripe) {
    throw Object.assign(new Error('Stripe is not configured'), { status: 503 });
  }
  if (!business.stripe_customer_id) {
    throw Object.assign(new Error('No Stripe customer on file. Subscribe to a paid plan first.'), { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${clientBaseUrl()}/settings/billing`,
  });
  return { url: session.url };
}

async function cancelStripeSubscription(business) {
  const stripe = getStripe();
  if (!stripe || !business.stripe_subscription_id) {
    throw Object.assign(new Error('No active Stripe subscription'), { status: 400 });
  }
  const sub = await stripe.subscriptions.update(business.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  return sub;
}

module.exports = {
  getStripe,
  createCheckoutSession,
  createPortalSession,
  cancelStripeSubscription,
  resolveStripePriceId,
  clientBaseUrl,
};
