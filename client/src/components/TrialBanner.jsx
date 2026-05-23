import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { isEmployer } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function TrialBanner() {
  const { user } = useAuth();
  const { trialActive, trialDaysLeft, effectivePlanId, status } = usePlan();

  if (!user || !isEmployer(user.role)) return null;
  if (status?.isDemoAccount) return null;
  if (!trialActive && effectivePlanId !== 'starter') return null;

  if (trialActive) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 dark:border-violet-800/50 dark:from-violet-950/40 dark:to-indigo-950/30">
        <div className="flex items-center gap-2 text-sm text-[var(--text)]">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span>
            Your free <strong>Professional</strong> trial ends in{' '}
            <strong>{trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}</strong>
            {status?.trialEndsAt
              ? ` (${new Date(status.trialEndsAt).toLocaleDateString()})`
              : ''}
            .
          </span>
        </div>
        <Link
          to="/pricing"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Upgrade now
        </Link>
      </div>
    );
  }

  if (isEmployer(user?.role) && status?.subscriptionStatus === 'past_due') {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/40">
        Payment failed —{' '}
        <Link to="/settings/billing" className="font-medium underline">
          update your card
        </Link>
      </div>
    );
  }

  return null;
}
