const { FEATURES } = require('../constants/plans');
const {
  getSubscriptionContext,
  canUseFeature,
  countEmployees,
  countLocations,
  expireTrialIfNeeded,
  getBusinessForUser,
} = require('../services/subscription');

const FEATURE_ROUTE_MAP = {
  roster_publish: FEATURES.ROSTER_PUBLISH,
  reports: FEATURES.REPORTS,
  report_export: FEATURES.REPORT_EXPORT,
  holiday_import: FEATURES.HOLIDAY_IMPORT,
  pdf_extractor: FEATURES.PDF_EXTRACTOR,
  finance: FEATURES.FINANCE,
  comparison_reports: FEATURES.COMPARISON_REPORTS,
  leave_management: FEATURES.LEAVE_MANAGEMENT,
};

function planError(message, extra = {}) {
  const err = new Error(message);
  err.status = 403;
  err.code = 'PLAN_LIMIT';
  Object.assign(err, extra);
  return err;
}

function checkPlanLimit(featureKey) {
  const feature = FEATURE_ROUTE_MAP[featureKey] || featureKey;

  return async (req, res, next) => {
    try {
      let business = await getBusinessForUser(req.user.id);
      if (business) business = await expireTrialIfNeeded(business);

      const ctx = await getSubscriptionContext(req.user.id);
      if (!canUseFeature(ctx, feature)) {
        return res.status(403).json({
          error: 'This feature requires a higher plan',
          code: 'PLAN_LIMIT',
          feature,
          plan: ctx.effectivePlanId,
          upgradeRequired: true,
        });
      }
      req.subscription = ctx;
      next();
    } catch (err) {
      console.error('checkPlanLimit', err);
      res.status(500).json({ error: 'Could not verify subscription' });
    }
  };
}

function checkEmployeeLimit() {
  return async (req, res, next) => {
    try {
      const ctx = await getSubscriptionContext(req.user.id);
      const max = ctx.limits.maxEmployees;
      if (max == null) {
        req.subscription = ctx;
        return next();
      }
      const count = await countEmployees();
      if (count >= max) {
        return res.status(403).json({
          error: `Employee limit reached (${max} on ${ctx.effectivePlanId} plan)`,
          code: 'PLAN_LIMIT',
          limit: 'employees',
          max,
          current: count,
          upgradeRequired: true,
        });
      }
      req.subscription = ctx;
      next();
    } catch (err) {
      console.error('checkEmployeeLimit', err);
      res.status(500).json({ error: 'Could not verify employee limit' });
    }
  };
}

function checkLocationLimit() {
  return async (req, res, next) => {
    try {
      const ctx = await getSubscriptionContext(req.user.id);
      const max = ctx.limits.maxLocations;
      if (max == null) {
        req.subscription = ctx;
        return next();
      }
      const count = await countLocations();
      if (count >= max) {
        return res.status(403).json({
          error: `Location limit reached (${max} on ${ctx.effectivePlanId} plan)`,
          code: 'PLAN_LIMIT',
          limit: 'locations',
          max,
          current: count,
          upgradeRequired: true,
        });
      }
      req.subscription = ctx;
      next();
    } catch (err) {
      console.error('checkLocationLimit', err);
      res.status(500).json({ error: 'Could not verify location limit' });
    }
  };
}

module.exports = { checkPlanLimit, checkEmployeeLimit, checkLocationLimit };
