import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import LandingHeader from '../components/LandingHeader';
import { FAQ_ITEMS, PLAN_IDS } from '../constants/plans';
import { pickDefaultProvider, orderedProviders } from '../constants/payments';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

function featureList(plan) {
  const f = plan.features;
  if (Array.isArray(f?.list)) return f.list;
  if (typeof f === 'object' && f.list) return f.list;
  return [];
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [interval, setInterval] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [gateways, setGateways] = useState({ stripe: false, razorpay: false });
  const [provider, setProvider] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    document.title = 'Pricing — RosterPro';
  }, []);

  useEffect(() => {
    api
      .get('/payments/plans')
      .then((r) => {
        setPlans(r.data.plans || []);
        const g = {
          stripe: !!r.data.stripeEnabled,
          razorpay: !!r.data.razorpayEnabled,
        };
        setGateways(g);
        setProvider(r.data.defaultProvider || pickDefaultProvider(g));
      })
      .finally(() => setLoading(false));
  }, []);

  const startCheckout = async (planId) => {
    if (planId === PLAN_IDS.STARTER) {
      if (!user) {
        navigate('/login');
        return;
      }
      setCheckoutLoading(planId);
      try {
        await api.post('/payments/create-checkout-session', {
          plan_id: planId,
          interval,
          provider,
        });
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed');
      } finally {
        setCheckoutLoading(null);
      }
      return;
    }

    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (!gateways[provider]) {
      alert(`Please select an available payment method (${gateways.stripe ? 'Stripe' : 'Razorpay'}).`);
      return;
    }

    setCheckoutLoading(planId);
    try {
      const { data } = await api.post('/payments/create-checkout-session', {
        plan_id: planId,
        interval,
        provider,
      });
      if (data.url) window.location.href = data.url;
      else alert(data.message || 'Plan updated');
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed. Configure Stripe or Razorpay keys on the server.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const ordered = [...plans].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const defaultPlans = [
    { id: 'starter', name: 'Starter', monthly_price: 0, annual_price: 0, features: { list: ['Up to 5 employees', '1 location', 'Basic roster'] } },
    { id: 'professional', name: 'Professional', monthly_price: 29, annual_price: 290, features: { list: ['Up to 25 employees', 'Full roster + reports', 'PDF Extractor'] } },
    { id: 'business', name: 'Business', monthly_price: 79, annual_price: 790, features: { list: ['Unlimited employees', 'Finance Organiser', 'Priority support'] } },
  ];
  const displayPlans = ordered.length ? ordered : defaultPlans;
  const paymentOptions = orderedProviders(gateways);

  return (
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <LandingHeader active="pricing" />

      <main className="landing-container flex-1 py-12 md:py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Simple, transparent pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--text-muted)]">
            Start free. Upgrade when you need publish, reports, PDF extract, and finance tools.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                interval === 'monthly' && 'bg-blue-600 text-white'
              )}
              onClick={() => setInterval('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition',
                interval === 'annual' && 'bg-blue-600 text-white'
              )}
              onClick={() => setInterval('annual')}
            >
              Annual
              <span className="ml-1 rounded bg-emerald-500/20 px-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                Save 17%
              </span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-[var(--text-muted)]">Pay with:</span>
            {paymentOptions.map(({ id, label, enabled }) => (
              <button
                key={id}
                type="button"
                disabled={!enabled}
                title={enabled ? undefined : `${label} is not configured on the server yet`}
                className={cn(
                  'rounded-lg border px-4 py-2 font-medium transition',
                  !enabled && 'cursor-not-allowed opacity-45',
                  enabled && provider === id
                    ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-400/50'
                )}
                onClick={() => enabled && setProvider(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {searchParams.get('cancelled') && (
          <p className="mt-6 text-center text-sm text-amber-600">Checkout cancelled — pick a plan when ready.</p>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {displayPlans.map((plan) => {
            const isPopular = plan.id === PLAN_IDS.PROFESSIONAL;
            const price =
              interval === 'annual'
                ? Number(plan.annual_price)
                : Number(plan.monthly_price);
            const perMonth = interval === 'annual' && price > 0 ? (price / 12).toFixed(0) : price;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-[var(--surface)] p-6 shadow-sm',
                  isPopular ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[var(--border)]'
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <div className="mt-4">
                  {price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${perMonth}</span>
                      <span className="text-[var(--text-muted)]">/mo</span>
                      {interval === 'annual' && (
                        <p className="text-sm text-[var(--text-muted)]">${price} billed annually</p>
                      )}
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {featureList(plan).map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant={isPopular ? 'primary' : 'outline'}
                  className="mt-6 w-full"
                  disabled={loading || checkoutLoading === plan.id}
                  onClick={() => startCheckout(plan.id)}
                >
                  {checkoutLoading === plan.id
                    ? 'Loading…'
                    : plan.id === PLAN_IDS.STARTER
                      ? 'Get started free'
                      : 'Subscribe'}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-[var(--text-muted)]">
          <Sparkles className="h-4 w-4 text-violet-500" />
          New employers: 14-day Professional trial — no card required
        </p>

        <section className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-6">FAQ</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <summary className="cursor-pointer font-medium">{item.q}</summary>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
