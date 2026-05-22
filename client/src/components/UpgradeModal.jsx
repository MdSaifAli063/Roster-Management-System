import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { FEATURE_LABELS } from '../constants/plans';

export default function UpgradeModal({ open, onClose, feature }) {
  if (!open) return null;
  const label = FEATURE_LABELS[feature] || 'This feature';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-[var(--text)]">Upgrade required</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          <strong>{label}</strong> needs Professional or Business. Compare plans and subscribe in minutes.
        </p>
        <div className="mt-6 flex gap-2">
          <Button as={Link} to="/pricing" variant="primary" className="flex-1" onClick={onClose}>
            View plans
          </Button>
          <Button as={Link} to="/settings/billing" variant="outline" className="flex-1" onClick={onClose}>
            Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
