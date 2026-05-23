import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageShell from '../components/layout/PageShell';
import api from '../api/client';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

function statusBadge(status) {
  const map = {
    active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    trialing: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    past_due: 'bg-red-500/15 text-red-700 dark:text-red-300',
    cancelled: 'bg-gray-500/15 text-gray-700 dark:text-gray-300',
  };
  return map[status] || map.active;
}

export default function BillingSettings() {
  const { refresh, effectivePlanId, status, trialActive, trialDaysLeft } = usePlan();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get('session') === 'success' || searchParams.get('razorpay') === 'success') {
      toast?.success?.('Subscription updated successfully');
    }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments/subscription-status');
      setHistory(data.paymentHistory || []);
      await refresh();
    } catch {
      toast?.error?.('Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/payments/create-portal-session');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Portal unavailable');
    } finally {
      setBusy(false);
    }
  };

  const cancelSub = async () => {
    if (!window.confirm('Cancel subscription at period end?')) return;
    setBusy(true);
    try {
      await api.post('/payments/cancel-subscription');
      toast?.success?.('Subscription cancellation scheduled');
      await load();
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const subStatus = status?.subscriptionStatus || 'active';
  const periodEnd = status?.currentPeriodEnd
    ? new Date(status.currentPeriodEnd).toLocaleDateString()
    : '—';

  return (
    <PageShell maxWidth="md" subtitle="Manage your plan, payment method, and invoices.">

      <Card title="Current plan">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold capitalize">{effectivePlanId}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusBadge(subStatus))}>
                {trialActive ? 'Trial' : subStatus.replace('_', ' ')}
              </span>
            </div>
            {trialActive && (
              <p className="text-sm text-[var(--text-muted)]">
                Professional trial — {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining
              </p>
            )}
            {!trialActive && status?.billingPlanId !== 'starter' && (
              <p className="text-sm text-[var(--text-muted)]">
                Next billing: {periodEnd}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" disabled={busy} onClick={openPortal}>
                Manage in Stripe
              </Button>
              <Button as={Link} to="/pricing" variant="outline">
                Change plan
              </Button>
              {status?.stripeSubscriptionId && (
                <Button type="button" variant="ghost" disabled={busy} onClick={cancelSub}>
                  Cancel subscription
                </Button>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Upgrades are prorated in Stripe Customer Portal. Switch monthly ↔ annual there.
            </p>
          </div>
        )}
      </Card>

      <Card title="Payment history">
        {history.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No payments yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]/60">
                    <td className="py-2 pr-4">
                      {row.paid_at
                        ? new Date(row.paid_at).toLocaleDateString()
                        : new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">
                      {row.currency?.toUpperCase()} {Number(row.amount).toFixed(2)}
                    </td>
                    <td className="py-2 pr-4 capitalize">{row.plan_id}</td>
                    <td className="py-2 pr-4 capitalize">{row.status}</td>
                    <td className="py-2">
                      {row.invoice_url ? (
                        <a
                          href={row.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Download
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
