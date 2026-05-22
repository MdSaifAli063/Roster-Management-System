const { sendEmail } = require('./email');
const { PLAN_CATALOG } = require('../constants/plans');

function planName(planId) {
  return PLAN_CATALOG.find((p) => p.id === planId)?.name || planId;
}

function billingUrl() {
  const base = (process.env.CLIENT_URL || 'http://localhost:5000').split(',')[0].trim();
  return `${base}/settings/billing`;
}

function pricingUrl() {
  const base = (process.env.CLIENT_URL || 'http://localhost:5000').split(',')[0].trim();
  return `${base}/pricing`;
}

async function emailTrialStarted({ to, businessName, endsAt }) {
  const end = endsAt ? new Date(endsAt).toLocaleDateString() : 'soon';
  return sendEmail({
    to,
    type: 'TRIAL_STARTED',
    subject: 'Your 14-day Professional trial has started — RosterPro',
    html: `<p>Hi,</p><p>Welcome to RosterPro${businessName ? ` (${businessName})` : ''}! Your <strong>14-day Professional trial</strong> is active until <strong>${end}</strong>. No credit card required.</p><p><a href="${billingUrl()}">View billing</a> · <a href="${pricingUrl()}">See plans</a></p>`,
    text: `Your Professional trial runs until ${end}. Billing: ${billingUrl()}`,
  });
}

async function emailTrialEndingSoon({ to, daysLeft }) {
  return sendEmail({
    to,
    type: 'TRIAL_ENDING',
    subject: `Trial ending in ${daysLeft} days — upgrade to keep Professional features`,
    html: `<p>Your free trial ends in <strong>${daysLeft} days</strong>. Upgrade to keep publish, reports, PDF extractor, and more.</p><p><a href="${pricingUrl()}">Upgrade now</a></p>`,
  });
}

async function emailTrialExpired({ to }) {
  return sendEmail({
    to,
    type: 'TRIAL_EXPIRED',
    subject: 'Trial ended — you are on the Starter plan',
    html: `<p>Your trial has ended. Your account is now on the <strong>Starter</strong> plan (up to 5 employees, basic roster).</p><p><a href="${pricingUrl()}">Upgrade anytime</a></p>`,
  });
}

async function emailPaymentSuccess({ to, amount, planId, invoiceUrl }) {
  return sendEmail({
    to,
    type: 'PAYMENT_SUCCESS',
    subject: `Payment received — ${planName(planId)} plan`,
    html: `<p>Thank you! We received your payment of <strong>${amount}</strong> for the <strong>${planName(planId)}</strong> plan.</p>${invoiceUrl ? `<p><a href="${invoiceUrl}">View invoice</a></p>` : ''}`,
  });
}

async function emailPaymentFailed({ to }) {
  return sendEmail({
    to,
    type: 'PAYMENT_FAILED',
    subject: 'Payment failed — update your card',
    html: `<p>We could not process your subscription payment. Please update your payment method to avoid interruption.</p><p><a href="${billingUrl()}">Manage billing</a></p>`,
  });
}

async function emailSubscriptionCancelled({ to, planId }) {
  return sendEmail({
    to,
    type: 'SUBSCRIPTION_CANCELLED',
    subject: 'Subscription cancelled',
    html: `<p>Your <strong>${planName(planId)}</strong> subscription has been cancelled. You can reactivate anytime.</p><p><a href="${pricingUrl()}">Reactivate</a></p>`,
  });
}

async function emailPlanUpgraded({ to, planId }) {
  return sendEmail({
    to,
    type: 'PLAN_UPGRADED',
    subject: `Plan upgraded to ${planName(planId)}`,
    html: `<p>Your plan is now <strong>${planName(planId)}</strong>. Enjoy your new features!</p>`,
  });
}

module.exports = {
  emailTrialStarted,
  emailTrialEndingSoon,
  emailTrialExpired,
  emailPaymentSuccess,
  emailPaymentFailed,
  emailSubscriptionCancelled,
  emailPlanUpgraded,
};
