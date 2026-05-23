const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { PLAN_IDS } = require('../constants/plans');
const {
  getBusinessForUser,
  ensureBusinessForOwner,
  getSubscriptionContext,
  startProfessionalTrial,
  expireTrialIfNeeded,
  seedSubscriptionPlans,
  getPlansFromDb,
} = require('../services/subscription');
const {
  createCheckoutSession,
  createGuestCheckoutSession,
  createPortalSession,
  cancelStripeSubscription,
  getStripe,
} = require('../services/stripePayments');
const {
  createRazorpaySubscription,
  createGuestRazorpaySubscription,
  cancelRazorpaySubscription,
  verifyWebhookSignature,
} = require('../services/razorpayPayments');
const {
  gatewaysEnabled,
  pickDefaultProvider,
  listProvidersForApi,
} = require('../constants/paymentProviders');
const {
  emailTrialStarted,
  emailTrialEndingSoon,
  emailTrialExpired,
  emailPaymentSuccess,
  emailPaymentFailed,
  emailSubscriptionCancelled,
  emailPlanUpgraded,
} = require('../services/paymentEmails');

const router = express.Router();

router.get('/plans', async (_req, res) => {
  try {
    await seedSubscriptionPlans();
    const plans = await getPlansFromDb();
    const g = gatewaysEnabled();
    res.json({
      plans,
      stripeEnabled: g.stripe,
      razorpayEnabled: g.razorpay,
      defaultProvider: pickDefaultProvider(),
      paymentProviders: listProvidersForApi(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
    });
  } catch (err) {
    console.error('GET /payments/plans', err);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.get('/subscription-status', authenticate, requireEmployer, async (req, res) => {
  try {
    let business = await getBusinessForUser(req.user.id);
    if (business) business = await expireTrialIfNeeded(business);
    const ctx = await getSubscriptionContext(req.user.id);
    if (business && ctx.trialActive && ctx.trialDaysLeft === 3) {
      const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
      const { rows: sent } = await query(
        `SELECT 1 FROM app_settings WHERE business_id = $1 AND key = 'trial_reminder_3d' LIMIT 1`,
        [business.id]
      );
      if (users[0]?.email && !sent.length) {
        await emailTrialEndingSoon({ to: users[0].email, daysLeft: 3 });
        await query(
          `INSERT INTO app_settings (business_id, key, value) VALUES ($1, 'trial_reminder_3d', '{}')
           ON CONFLICT (business_id, key) DO NOTHING`,
          [business.id]
        );
      }
    }
    const { rows: history } = business
      ? await query(
          `SELECT id, amount, currency, status, plan_id, invoice_url, paid_at, created_at
           FROM payment_history WHERE business_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [business.id]
        )
      : { rows: [] };

    res.json({
      ...ctx,
      paymentHistory: history,
    });
  } catch (err) {
    console.error('subscription-status', err);
    res.status(500).json({ error: 'Failed to load subscription' });
  }
});

async function runCheckout({ planId, interval, requestedProvider, user, business }) {
  const provider = pickDefaultProvider(requestedProvider);
  if (!provider) {
    throw Object.assign(new Error('No payment gateway configured (Stripe or Razorpay)'), { status: 503 });
  }

  if (planId === PLAN_IDS.STARTER) {
    throw Object.assign(new Error('Starter plan is free — use Get started free'), { status: 400 });
  }

  if (provider === 'razorpay') {
    const createFn = business ? createRazorpaySubscription : createGuestRazorpaySubscription;
    const args = business
      ? { business, user, planId, interval }
      : { planId, interval };
    const result = await createFn(args);
    if (business) {
      await query('UPDATE businesses SET razorpay_subscription_id = $1 WHERE id = $2', [
        result.subscriptionId,
        business.id,
      ]);
    }
    return { url: result.url, provider: 'razorpay', subscriptionId: result.subscriptionId };
  }

  const createFn = business ? createCheckoutSession : createGuestCheckoutSession;
  const args = business ? { business, user, planId, interval } : { planId, interval };
  const result = await createFn(args);

  if (business && result.customerId) {
    await query('UPDATE businesses SET stripe_customer_id = $1 WHERE id = $2', [
      result.customerId,
      business.id,
    ]);
  }

  return { url: result.url, sessionId: result.sessionId, provider: 'stripe' };
}

/** Public — Subscribe without logging in first */
router.post('/guest-checkout', async (req, res) => {
  try {
    const { plan_id: planId, interval = 'monthly', provider: requestedProvider } = req.body;
    if (!planId) return res.status(400).json({ error: 'plan_id required' });
    if (planId === PLAN_IDS.STARTER) {
      return res.status(400).json({ error: 'Use Get started free to create a free account' });
    }

    const result = await runCheckout({
      planId,
      interval,
      requestedProvider,
      user: null,
      business: null,
    });
    res.json(result);
  } catch (err) {
    console.error('guest-checkout', err);
    res.status(err.status || 500).json({ error: err.message || 'Checkout failed' });
  }
});

router.post('/create-checkout-session', authenticate, requireEmployer, async (req, res) => {
  try {
    const { plan_id: planId, interval = 'monthly', provider: requestedProvider } = req.body;
    if (!planId) return res.status(400).json({ error: 'plan_id required' });

    let business = await ensureBusinessForOwner(req.user.id);

    if (planId === PLAN_IDS.STARTER) {
      await query(
        `UPDATE businesses SET plan_id = $1, subscription_status = 'active', updated_at = NOW() WHERE id = $2`,
        [PLAN_IDS.STARTER, business.id]
      );
      return res.json({ url: null, message: 'Starter plan activated' });
    }

    const result = await runCheckout({
      planId,
      interval,
      requestedProvider,
      user: req.user,
      business,
    });
    res.json(result);
  } catch (err) {
    console.error('create-checkout-session', err);
    res.status(err.status || 500).json({ error: err.message || 'Checkout failed' });
  }
});

router.post('/create-portal-session', authenticate, requireEmployer, async (req, res) => {
  try {
    const business = await getBusinessForUser(req.user.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    const result = await createPortalSession(business);
    res.json(result);
  } catch (err) {
    console.error('create-portal-session', err);
    res.status(err.status || 500).json({ error: err.message || 'Portal failed' });
  }
});

router.post('/cancel-subscription', authenticate, requireEmployer, async (req, res) => {
  try {
    const business = await getBusinessForUser(req.user.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    if (business.stripe_subscription_id) {
      await cancelStripeSubscription(business);
      await query(
        `UPDATE businesses SET subscription_status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [business.id]
      );
      const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [business.owner_user_id]);
      if (users[0]?.email) {
        await emailSubscriptionCancelled({ to: users[0].email, planId: business.plan_id });
      }
      return res.json({ message: 'Subscription will cancel at period end' });
    }

    if (business.razorpay_subscription_id) {
      try {
        await cancelRazorpaySubscription(business.razorpay_subscription_id);
      } catch (err) {
        console.warn('Razorpay cancel', err.message);
      }
      await query(
        `UPDATE businesses SET subscription_status = 'cancelled', razorpay_subscription_id = NULL, plan_id = $2, updated_at = NOW() WHERE id = $1`,
        [business.id, PLAN_IDS.STARTER]
      );
      return res.json({ message: 'Razorpay subscription will cancel at cycle end' });
    }

    res.status(400).json({ error: 'No active paid subscription' });
  } catch (err) {
    console.error('cancel-subscription', err);
    res.status(err.status || 500).json({ error: err.message || 'Cancel failed' });
  }
});

router.post('/upgrade-plan', authenticate, requireEmployer, async (req, res) => {
  try {
    const { plan_id: planId, interval = 'monthly', provider: requestedProvider } = req.body;
    if (!planId || planId === PLAN_IDS.STARTER) {
      return res.status(400).json({ error: 'Use checkout for paid plans' });
    }

    let business = await getBusinessForUser(req.user.id);
    if (!business) business = await ensureBusinessForOwner(req.user.id);

    const result = await runCheckout({
      planId,
      interval,
      requestedProvider,
      user: req.user,
      business,
    });
    res.json(result);
  } catch (err) {
    console.error('upgrade-plan', err);
    res.status(err.status || 500).json({ error: err.message || 'Upgrade failed' });
  }
});

async function activateSubscription({
  businessId,
  planId,
  stripeCustomerId,
  stripeSubscriptionId,
  razorpaySubscriptionId,
  status,
  periodEnd,
  interval,
}) {
  await query(
    `UPDATE businesses SET
      plan_id = $2,
      subscription_status = $3,
      stripe_customer_id = COALESCE($4, stripe_customer_id),
      stripe_subscription_id = COALESCE($5, stripe_subscription_id),
      razorpay_subscription_id = COALESCE($6, razorpay_subscription_id),
      current_period_end = $7,
      billing_interval = COALESCE($8, billing_interval),
      trial_ends_at = NULL,
      updated_at = NOW()
     WHERE id = $1`,
    [
      businessId,
      planId || PLAN_IDS.PROFESSIONAL,
      status || 'active',
      stripeCustomerId || null,
      stripeSubscriptionId || null,
      razorpaySubscriptionId || null,
      periodEnd || null,
      interval || null,
    ]
  );

  await query(
    `UPDATE trials SET converted = TRUE WHERE business_id = $1`,
    [businessId]
  );
}

async function recordPayment({
  businessId,
  stripeInvoiceId,
  razorpayPaymentId,
  amount,
  currency,
  status,
  planId,
  periodStart,
  periodEnd,
  invoiceUrl,
}) {
  await query(
    `INSERT INTO payment_history (business_id, stripe_invoice_id, razorpay_payment_id, amount, currency, status, plan_id, billing_period_start, billing_period_end, invoice_url, paid_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $6 = 'paid' THEN NOW() ELSE NULL END)`,
    [
      businessId,
      stripeInvoiceId || null,
      razorpayPaymentId || null,
      amount,
      currency || 'usd',
      status,
      planId,
      periodStart,
      periodEnd,
      invoiceUrl,
    ]
  );
}

async function handleStripeWebhookEvent(event) {
  const stripe = getStripe();
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const planId = session.metadata?.plan_id || PLAN_IDS.PROFESSIONAL;
      let businessId = Number(session.metadata?.business_id) || null;

      if (!businessId && session.metadata?.guest === 'true') {
        const email = session.customer_details?.email?.trim().toLowerCase();
        if (email) {
          const { rows: users } = await query('SELECT id FROM users WHERE email = $1', [email]);
          if (users[0]) {
            const biz = await getBusinessForUser(users[0].id);
            businessId = biz?.id || null;
            if (!businessId) {
              const created = await ensureBusinessForOwner(users[0].id);
              businessId = created.id;
            }
          }
        }
      }

      if (!businessId) break;
      await activateSubscription({
        businessId,
        planId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        status: 'active',
        interval: session.metadata?.interval,
      });
      const { rows } = await query(
        'SELECT u.email, b.business_name FROM businesses b JOIN users u ON u.id = b.owner_user_id WHERE b.id = $1',
        [businessId]
      );
      if (rows[0]?.email) {
        await emailPlanUpgraded({ to: rows[0].email, planId });
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const inv = event.data.object;
      const subId = inv.subscription;
      const { rows } = await query(
        'SELECT * FROM businesses WHERE stripe_subscription_id = $1 OR stripe_customer_id = $2 LIMIT 1',
        [subId, inv.customer]
      );
      const biz = rows[0];
      if (!biz) break;
      const planId = inv.lines?.data?.[0]?.metadata?.plan_id || biz.plan_id;
      await query(
        `UPDATE businesses SET subscription_status = 'active', current_period_end = to_timestamp($2), updated_at = NOW() WHERE id = $1`,
        [biz.id, inv.lines?.data?.[0]?.period?.end || inv.period_end]
      );
      await recordPayment({
        businessId: biz.id,
        stripeInvoiceId: inv.id,
        amount: (inv.amount_paid || 0) / 100,
        currency: inv.currency,
        status: 'paid',
        planId,
        periodStart: inv.period_start ? new Date(inv.period_start * 1000) : null,
        periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
        invoiceUrl: inv.hosted_invoice_url,
      });
      const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [biz.owner_user_id]);
      if (users[0]?.email) {
        await emailPaymentSuccess({
          to: users[0].email,
          amount: `${inv.currency?.toUpperCase()} ${((inv.amount_paid || 0) / 100).toFixed(2)}`,
          planId,
          invoiceUrl: inv.hosted_invoice_url,
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      const { rows } = await query(
        'SELECT * FROM businesses WHERE stripe_customer_id = $1 LIMIT 1',
        [inv.customer]
      );
      if (rows[0]) {
        await query(
          `UPDATE businesses SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1`,
          [rows[0].id]
        );
        const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [rows[0].owner_user_id]);
        if (users[0]?.email) await emailPaymentFailed({ to: users[0].email });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const planId = sub.metadata?.plan_id;
      const { rows } = await query(
        'SELECT * FROM businesses WHERE stripe_subscription_id = $1 LIMIT 1',
        [sub.id]
      );
      if (rows[0]) {
        await query(
          `UPDATE businesses SET plan_id = COALESCE($2, plan_id), subscription_status = $3, current_period_end = to_timestamp($4), updated_at = NOW() WHERE id = $1`,
          [rows[0].id, planId, sub.status, sub.current_period_end]
        );
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const { rows } = await query(
        'SELECT * FROM businesses WHERE stripe_subscription_id = $1 LIMIT 1',
        [sub.id]
      );
      if (rows[0]) {
        await query(
          `UPDATE businesses SET plan_id = $2, subscription_status = 'cancelled', stripe_subscription_id = NULL, updated_at = NOW() WHERE id = $1`,
          [rows[0].id, PLAN_IDS.STARTER]
        );
        const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [rows[0].owner_user_id]);
        if (users[0]?.email) {
          await emailSubscriptionCancelled({ to: users[0].email, planId: rows[0].plan_id });
        }
      }
      break;
    }
    default:
      break;
  }
}

function createWebhookRouter() {
  const webhookRouter = express.Router();
  webhookRouter.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const stripe = getStripe();
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripe || !secret) {
        return res.status(503).send('Stripe webhooks not configured');
      }
      const sig = req.headers['stripe-signature'];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
      } catch (err) {
        console.error('Webhook signature error', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      try {
        await handleStripeWebhookEvent(event);
        res.json({ received: true });
      } catch (err) {
        console.error('Webhook handler', err);
        res.status(500).json({ error: 'Webhook handler failed' });
      }
    }
  );

  webhookRouter.post('/razorpay-webhook', express.json(), async (req, res) => {
    try {
      const raw = JSON.stringify(req.body);
      const signature = req.headers['x-razorpay-signature'];
      if (!verifyWebhookSignature(raw, signature)) {
        return res.status(400).json({ error: 'Invalid Razorpay signature' });
      }

      const event = req.body?.event || req.body?.event_type;
      const payload = req.body?.payload || {};
      const sub = payload.subscription?.entity || payload.subscription;
      const payment = payload.payment?.entity || payload.payment;

      if (event === 'subscription.activated' && sub?.id) {
        const notes = sub.notes || {};
        const businessId = Number(notes.business_id);
        if (businessId) {
          await activateSubscription({
            businessId,
            planId: notes.plan_id || PLAN_IDS.PROFESSIONAL,
            razorpaySubscriptionId: sub.id,
            status: 'active',
            interval: notes.interval,
            periodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
          });
        }
      }

      if (event === 'subscription.charged' && sub?.id) {
        const { rows } = await query(
          'SELECT * FROM businesses WHERE razorpay_subscription_id = $1',
          [sub.id]
        );
        if (rows[0]) {
          const notes = sub.notes || {};
          await recordPayment({
            businessId: rows[0].id,
            razorpayPaymentId: payment?.id || null,
            amount: payment ? Number(payment.amount) / 100 : 0,
            currency: payment?.currency || 'inr',
            status: 'paid',
            planId: notes.plan_id || rows[0].plan_id,
          });
        }
      }

      if (event === 'subscription.cancelled' && sub?.id) {
        const { rows } = await query(
          'SELECT * FROM businesses WHERE razorpay_subscription_id = $1',
          [sub.id]
        );
        if (rows[0]) {
          await query(
            `UPDATE businesses SET plan_id = $2, subscription_status = 'cancelled', razorpay_subscription_id = NULL, updated_at = NOW() WHERE id = $1`,
            [rows[0].id, PLAN_IDS.STARTER]
          );
        }
      }

      if (event === 'payment.failed') {
        const { rows } = await query(
          'SELECT * FROM businesses WHERE razorpay_subscription_id = $1',
          [sub?.id]
        );
        if (rows[0]) {
          await query(
            `UPDATE businesses SET subscription_status = 'past_due', updated_at = NOW() WHERE id = $1`,
            [rows[0].id]
          );
          const { rows: users } = await query('SELECT email FROM users WHERE id = $1', [
            rows[0].owner_user_id,
          ]);
          if (users[0]?.email) await emailPaymentFailed({ to: users[0].email });
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Razorpay webhook', err);
      res.status(500).json({ error: 'Razorpay webhook failed' });
    }
  });

  return webhookRouter;
}

router.post('/start-trial', authenticate, requireEmployer, async (req, res) => {
  try {
    const business = await ensureBusinessForOwner(req.user.id);
    const endsAt = await startProfessionalTrial(business.id);
    const { rows } = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (rows[0]?.email) {
      await emailTrialStarted({ to: rows[0].email, businessName: business.business_name, endsAt });
    }
    res.json({ trialEndsAt: endsAt, message: '14-day Professional trial started' });
  } catch (err) {
    console.error('start-trial', err);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

module.exports = router;
module.exports.createWebhookRouter = createWebhookRouter;
module.exports.handleStripeWebhookEvent = handleStripeWebhookEvent;
module.exports.activateSubscription = activateSubscription;
