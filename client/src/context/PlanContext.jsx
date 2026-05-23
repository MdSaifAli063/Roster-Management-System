import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { isEmployer } from '../lib/auth';

const PlanContext = createContext(null);

const FEATURE_MAP = {
  roster_publish: ['roster_publish'],
  reports: ['reports'],
  report_export: ['reports'],
  pdf_extractor: ['pdf_extractor'],
  finance: ['finance'],
  holiday_import: ['holiday_import'],
  leave_management: ['leave_management'],
  comparison_reports: ['comparison_reports'],
};

const PLAN_FEATURES = {
  starter: new Set(['roster_basic']),
  professional: new Set([
    'roster_basic', 'roster_publish', 'reports', 'report_export', 'holiday_import',
    'leave_management', 'pdf_extractor',
  ]),
  business: new Set([
    'roster_basic', 'roster_publish', 'reports', 'report_export', 'holiday_import',
    'leave_management', 'pdf_extractor', 'finance', 'finance_email_extract',
    'finance_roster_feed', 'comparison_reports', 'custom_holidays',
  ]),
};

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !isEmployer(user.role)) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/payments/subscription-status'),
        api.get('/payments/plans'),
      ]);
      setStatus(subRes.data);
      setPlans(plansRes.data?.plans || []);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const effectivePlanId = status?.isDemoAccount ? 'business' : (status?.effectivePlanId || 'starter');

  const value = useMemo(() => {
    const featureSet = status?.isDemoAccount
      ? PLAN_FEATURES.business
      : (PLAN_FEATURES[effectivePlanId] || PLAN_FEATURES.starter);

    function allowed(feature) {
      if (status?.isDemoAccount) return true;
      const keys = FEATURE_MAP[feature] || [feature];
      return keys.some((k) => featureSet.has(k));
    }

    return {
      status,
      plans,
      loading,
      refresh,
      effectivePlanId,
      isDemoAccount: !!status?.isDemoAccount,
      trialActive: status?.isDemoAccount ? false : status?.trialActive,
      trialDaysLeft: status?.trialDaysLeft ?? 0,
      limits: status?.isDemoAccount
        ? { maxEmployees: null, maxLocations: null }
        : (status?.limits || { maxEmployees: 5, maxLocations: 1 }),
      allowed,
      stripeEnabled: !!status?.stripeCustomerId || plans.length > 0,
    };
  }, [status, plans, loading, refresh, effectivePlanId, status?.isDemoAccount]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

export function usePlanFeature(feature) {
  const { allowed, effectivePlanId, trialActive } = usePlan();
  const ok = allowed(feature);
  return {
    allowed: ok,
    plan: effectivePlanId,
    upgradeRequired: !ok,
    trialActive,
  };
}
