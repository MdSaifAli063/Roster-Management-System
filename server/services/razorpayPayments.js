const { PLAN_IDS } = require('../constants/plans');

function razorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

function getRazorpay() {
  if (!razorpayConfigured()) return null;
  // eslint-disable-next-line global-require
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
}

function resolveRazorpayPlanId(planId, interval) {
  const key =
    interval === 'annual'
      ? `RAZORPAY_${planId.toUpperCase()}_ANNUAL_PLAN_ID`
      : `RAZORPAY_${planId.toUpperCase()}_MONTHLY_PLAN_ID`;
  return (
    process.env[key] ||
    (planId === 'professional' && interval === 'monthly' ? process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID : null) ||
    (planId === 'professional' && interval === 'annual' ? process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID : null) ||
    null
  );
}

async function createRazorpaySubscription({ business, user, planId, interval }) {
  const rzp = getRazorpay();
  if (!rzp) {
    throw Object.assign(new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'), {
      status: 503,
    });
  }
  if (planId === PLAN_IDS.STARTER) {
    throw Object.assign(new Error('Starter plan is free'), { status: 400 });
  }

  const razorpayPlanId = resolveRazorpayPlanId(planId, interval);
  if (!razorpayPlanId) {
    throw Object.assign(
      new Error(`Razorpay plan ID not configured for ${planId} (${interval}). Add RAZORPAY_*_PLAN_ID to .env.`),
      { status: 503 }
    );
  }

  const subscription = await rzp.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: interval === 'annual' ? 12 : 60,
    quantity: 1,
    customer_notify: 1,
    notes: {
      business_id: String(business.id),
      plan_id: planId,
      interval,
      user_email: user.email || '',
    },
  });

  const url = subscription.short_url;
  if (!url) {
    throw new Error('Razorpay did not return a checkout URL');
  }

  return { url, subscriptionId: subscription.id };
}

async function createGuestRazorpaySubscription({ planId, interval }) {
  const rzp = getRazorpay();
  if (!rzp) {
    throw Object.assign(new Error('Razorpay is not configured'), { status: 503 });
  }
  if (planId === PLAN_IDS.STARTER) {
    throw Object.assign(new Error('Starter plan is free'), { status: 400 });
  }

  const razorpayPlanId = resolveRazorpayPlanId(planId, interval);
  if (!razorpayPlanId) {
    throw Object.assign(new Error(`Razorpay plan not configured for ${planId}`), { status: 503 });
  }

  const subscription = await rzp.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: interval === 'annual' ? 12 : 60,
    quantity: 1,
    customer_notify: 1,
    notes: {
      plan_id: planId,
      interval,
      guest: 'true',
    },
  });

  return { url: subscription.short_url, subscriptionId: subscription.id };
}

async function cancelRazorpaySubscription(subscriptionId) {
  const rzp = getRazorpay();
  if (!rzp) throw Object.assign(new Error('Razorpay not configured'), { status: 503 });
  return rzp.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
}

function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

module.exports = {
  razorpayConfigured,
  getRazorpay,
  createRazorpaySubscription,
  createGuestRazorpaySubscription,
  cancelRazorpaySubscription,
  verifyWebhookSignature,
  resolveRazorpayPlanId,
};
