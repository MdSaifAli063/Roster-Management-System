import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { isEmployer } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const STORAGE_KEY = 'rosterpro_trial_expired_seen';

export default function TrialExpiredModal() {
  const { user } = useAuth();
  const { trialActive, effectivePlanId, trialDaysLeft, status } = usePlan();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !isEmployer(user.role)) return;
    if (trialActive) return;
    if (effectivePlanId !== 'starter') return;
    if (!status?.trialEndsAt) return;
    if (new Date(status.trialEndsAt) > new Date()) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, [user, trialActive, effectivePlanId, status?.trialEndsAt]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={dismiss} />
      <div className="relative max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Your trial has ended</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You are now on the <strong>Starter</strong> plan (5 employees, basic roster). Upgrade to restore publish,
          reports, PDF extract, and more.
        </p>
        <div className="mt-6 flex gap-2">
          <Button as={Link} to="/pricing" variant="primary" className="flex-1" onClick={dismiss}>
            View plans
          </Button>
          <Button type="button" variant="outline" onClick={dismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
