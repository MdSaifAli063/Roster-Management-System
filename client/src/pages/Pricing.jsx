import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import LandingHeader from '../components/LandingHeader';
import { FAQ_ITEMS, PLAN_IDS } from '../constants/plans';
import {
  CATALOG_PLANS,
  pickDefaultProvider,
  orderedProviders,
  normalizePlan,
  displayPrice,
} from '../constants/payments';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

export default function Pricing() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [interval, setInterval] = useState('monthly');
  const [plans, setPlans] = useState(CATALOG_PLANS);
  const [gateways, setGateways] = useState({ stripe: false, razorpay: false });
  const [provider, setProvider] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    document.title = 'Pricing — RosterPro';
  }, []);

  useEffect(() => {
    if (searchParams.get('cancelled')) {
      toast?.info?.('Checkout cancelled — choose a plan when you are ready.');
    }
    if (searchParams.get('session') === 'success' || searchParams.get('razorpay') === 'success') {
      toast?.success?.('Subscription updated successfully.');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/payments/plans')
      .then((r) => {
        if (cancelled) return;
        const fromApi = (r.data.plans || []).map(normalizePlan);
        setPlans(fromApi.length ? fromApi : CATALOG_PLANS.map(normalizePlan));
        const g = {
          stripe: !!r.data.stripeEnabled,
          razorpay: !!r.data.razorpayEnabled,
        };
        setGateways(g);
        setProvider(r.data.defaultProvider || pickDefaultProvider(g));
      })
      .catch(() => {
        if (cancelled) return;
        setPlans(CATALOG_PLANS.map(normalizePlan));
        toast?.error?.('Could not load plans — showing default pricing.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const paymentOptions = orderedProviders(gateways);

  const displayPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [plans]
  );

  const selectProvider = (id, configured) => {
    if (!configured) {
      toast?.error?.(
        `${id === 'razorpay' ? 'Razorpay' : 'Stripe'} is not configured yet. Add API keys in server/.env.`
      );
      return;
    }
    setProvider(id);
  };

  const startCheckout = async (planId) => {
    if (planId === PLAN_IDS.STARTER) {
      if (user) {
        setCheckoutLoading(planId);
        try {
          await api.post('/payments/create-checkout-session', {
            plan_id: planId,
            interval,
            provider: pickDefaultProvider(gateways) || 'stripe',
          });
          toast?.success?.('Starter plan activated');
          navigate('/dashboard');
        } catch (err) {
          toast?.error?.(err.response?.data?.error || 'Could not activate Starter plan');
        } finally {
          setCheckoutLoading(null);
        }
      } else {
        navigate('/login?mode=signup');
      }
      return;
    }

    if (!gateways[provider]) {
      toast?.error?.('Select Stripe or Razorpay — configure payment keys on the server first.');
      return;
    }

    setCheckoutLoading(planId);
    try {
      const endpoint = user ? '/payments/create-checkout-session' : '/payments/guest-checkout';
      const { data } = await api.post(endpoint, {
        plan_id: planId,
        interval,
        provider,
      });
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast?.success?.(data.message || 'Plan updated');
      navigate(user ? '/settings/billing' : '/login?mode=signup');
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <LandingHeader active="pricing" />

      <main className="landing-container flex-1 py-10 md:py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
            Start free. Upgrade when you need publish, reports, PDF extract, and finance tools.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-1 shadow-sm">
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                interval === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              onClick={() => setInterval('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                interval === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              onClick={() => setInterval('annual')}
            >
              Annual
              <span
                className={cn(
                  'ml-1 rounded px-1.5 py-0.5 text-xs font-semibold',
                  interval === 'annual'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                )}
              >
                Save 17%
              </span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-[var(--text-secondary)]">Pay with:</span>
            {paymentOptions.map(({ id, label, configured }) => (
              <button
                key={id}
                type="button"
                className={cn(
                  'min-w-[5.5rem] rounded-lg border bg-white px-4 py-1.5 font-medium transition dark:bg-[var(--bg-secondary)]',
                  provider === id
                    ? 'border-blue-600 text-blue-700 ring-1 ring-blue-600/30 dark:text-blue-300'
                    : 'border-[var(--border)] text-[var(--text-primary)] hover:border-slate-400',
                  !configured && provider !== id && 'opacity-80'
                )}
                onClick={() => selectProvider(id, configured)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {displayPlans.map((plan) => {
            const isPopular = plan.id === PLAN_IDS.PROFESSIONAL;
            const price = displayPrice(plan, interval);
            const features = plan.features?.list || [];

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] dark:bg-[var(--bg-secondary)]',
                  isPopular
                    ? 'border-blue-500 ring-2 ring-blue-500/25 lg:scale-[1.02]'
                    : 'border-[var(--border)]'
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                    Most popular
                  </span>
                )}

                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{plan.name}</h2>

                <div className="mt-4 min-h-[4.5rem]">
                  {price.main === 'Free' ? (
                    <span className="text-4xl font-bold tracking-tight">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight">{price.main}</span>
                      <span className="text-lg text-[var(--text-secondary)]">{price.suffix}</span>
                      {price.sub && (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{price.sub}</p>
                      )}
                    </>
                  )}
                </div>

                <ul className="mt-4 flex-1 space-y-2.5 text-sm text-[var(--text-primary)]">
                  {features.map((item) => (
                    <li key={item} className="flex gap-2.5 text-left">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  variant={isPopular ? 'primary' : 'outline'}
                  className={cn('mt-6 w-full min-h-11', isPopular && 'btn-glow')}
                  disabled={loading || checkoutLoading === plan.id}
                  onClick={() => startCheckout(plan.id)}
                >
                  {checkoutLoading === plan.id
                    ? 'Please wait…'
                    : plan.id === PLAN_IDS.STARTER
                      ? 'Get started'
                      : 'Subscribe'}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-[var(--text-secondary)]">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
          New employers: 14-day Professional trial — no card required
        </p>

        <section className="mx-auto mt-14 max-w-2xl">
          <h2 className="mb-6 text-center text-xl font-semibold">FAQ</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 dark:bg-[var(--bg-secondary)]"
              >
                <summary className="cursor-pointer font-medium">{item.q}</summary>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
