import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { usePlanFeature } from '../context/PlanContext';
import { FEATURE_LABELS } from '../constants/plans';
import Button from './ui/Button';
import UpgradeModal from './UpgradeModal';

export default function PlanGate({ feature, children, fallback }) {
  const { allowed, upgradeRequired, plan } = usePlanFeature(feature);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (allowed) return children;

  if (fallback) return fallback;

  const label = FEATURE_LABELS[feature] || feature;

  return (
    <>
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
        <Lock className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{label}</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Not included on your <span className="font-medium capitalize">{plan}</span> plan.
          Upgrade to unlock this feature.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="primary" onClick={() => setShowUpgrade(true)}>
            Upgrade plan
          </Button>
          <Button as={Link} to="/pricing" variant="outline">
            View pricing
          </Button>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={feature} />
    </>
  );
}
