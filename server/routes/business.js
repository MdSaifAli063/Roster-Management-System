const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { provisionEmployeeLogins } = require('../services/employeeCredentials');
const { getSubscriptionContext, startProfessionalTrial, ensureBusinessForOwner } = require('../services/subscription');
const { parseJsonbBool } = require('../utils/settings');
const { countActiveEmployeesSql } = require('../utils/employees');

const router = express.Router();
router.use(authenticate);

async function getBusinessForUser(userId) {
  const { rows } = await query(
    'SELECT * FROM businesses WHERE owner_user_id = $1 ORDER BY id LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

function serializeBusiness(biz) {
  if (!biz) return null;
  return {
    id: biz.id,
    business_name: biz.business_name,
    tax_id: biz.tax_id,
    country_code: biz.country_code,
    state_code: biz.state_code,
    location_name: biz.location_name,
    timezone: biz.timezone,
    operating_days: biz.operating_days || {},
    min_employee_age: biz.min_employee_age ?? 18,
    employment_types: biz.employment_types || [],
    pay_rules: biz.pay_rules || {},
    is_onboarded: biz.is_onboarded,
    plan_id: biz.plan_id,
    subscription_status: biz.subscription_status,
    trial_ends_at: biz.trial_ends_at,
    current_period_end: biz.current_period_end,
    created_at: biz.created_at,
    updated_at: biz.updated_at,
  };
}

router.get('/organization', requireEmployer, async (req, res) => {
  try {
    let biz = await getBusinessForUser(req.user.id);
    if (!biz) {
      biz = await ensureBusinessForOwner(req.user.id, 'My organization');
    }

    const [
      empRes,
      plantRes,
      leaveRes,
      shiftRes,
      settingsRes,
      plantsRes,
      ownerRes,
    ] = await Promise.all([
      query(countActiveEmployeesSql()),
      query('SELECT COUNT(*)::int AS c FROM plants'),
      query(`SELECT COUNT(*)::int AS c FROM leave_requests WHERE status = 'PENDING'`),
      query('SELECT COUNT(*)::int AS c FROM shifts'),
      query(
        `SELECT value FROM app_settings WHERE business_id = $1 AND key = 'auto_approve_leave'`,
        [biz.id]
      ),
      query(
        'SELECT id, plant_code, plant_name, location, description FROM plants ORDER BY plant_name LIMIT 50'
      ),
      query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]),
    ]);

    const subscription = await getSubscriptionContext(req.user.id);

    res.json({
      business: serializeBusiness(biz),
      owner: ownerRes.rows[0] || null,
      stats: {
        employees: empRes.rows[0]?.c || 0,
        plants: plantRes.rows[0]?.c || 0,
        pendingLeave: leaveRes.rows[0]?.c || 0,
        shifts: shiftRes.rows[0]?.c || 0,
      },
      plants: plantsRes.rows,
      settings: {
        auto_approve_leave: parseJsonbBool(settingsRes.rows[0]?.value),
      },
      subscription: {
        effectivePlanId: subscription.effectivePlanId,
        subscriptionStatus: subscription.subscriptionStatus,
        trialActive: subscription.trialActive,
        trialDaysLeft: subscription.trialDaysLeft,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        limits: subscription.limits,
      },
    });
  } catch (err) {
    console.error('business/organization GET', err);
    res.status(500).json({
      error: 'Failed to load organization',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
});

router.patch('/organization', requireEmployer, async (req, res) => {
  try {
    let biz = await getBusinessForUser(req.user.id);
    if (!biz) {
      biz = await ensureBusinessForOwner(req.user.id, req.body.business_name || 'My organization');
    }

    const {
      business_name,
      tax_id,
      country_code,
      state_code,
      location_name,
      timezone,
      operating_days,
      min_employee_age,
      employment_types,
      pay_rules,
      auto_approve_leave,
    } = req.body;

    const updates = [];
    const params = [];
    let i = 1;

    if (business_name !== undefined) {
      const trimmed = String(business_name).trim();
      if (!trimmed) return res.status(400).json({ error: 'Business name is required' });
      updates.push(`business_name = $${i++}`);
      params.push(trimmed);
    }
    if (tax_id !== undefined) { updates.push(`tax_id = $${i++}`); params.push(tax_id || null); }
    if (country_code !== undefined) { updates.push(`country_code = $${i++}`); params.push(country_code); }
    if (state_code !== undefined) { updates.push(`state_code = $${i++}`); params.push(state_code || null); }
    if (location_name !== undefined) { updates.push(`location_name = $${i++}`); params.push(location_name || null); }
    if (timezone !== undefined) { updates.push(`timezone = $${i++}`); params.push(timezone); }
    if (operating_days !== undefined) {
      updates.push(`operating_days = $${i++}::jsonb`);
      params.push(JSON.stringify(operating_days));
    }
    if (min_employee_age !== undefined) { updates.push(`min_employee_age = $${i++}`); params.push(min_employee_age); }
    if (employment_types !== undefined) {
      updates.push(`employment_types = $${i++}::jsonb`);
      params.push(JSON.stringify(employment_types));
    }
    if (pay_rules !== undefined) {
      updates.push(`pay_rules = $${i++}::jsonb`);
      params.push(JSON.stringify(pay_rules));
    }
    updates.push('updated_at = NOW()');

    if (updates.length) {
      params.push(biz.id);
      const { rows } = await query(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
        params
      );
      biz = rows[0];
    }

    if (auto_approve_leave !== undefined) {
      await query(
        `INSERT INTO app_settings (business_id, key, value)
         VALUES ($1, 'auto_approve_leave', $2::jsonb)
         ON CONFLICT (business_id, key) DO UPDATE SET value = EXCLUDED.value`,
        [biz.id, JSON.stringify(!!auto_approve_leave)]
      );
    }

    const { rows: settingsRows } = await query(
      `SELECT value FROM app_settings WHERE business_id = $1 AND key = 'auto_approve_leave'`,
      [biz.id]
    );

    res.json({
      business: serializeBusiness(biz),
      settings: { auto_approve_leave: parseJsonbBool(settingsRows[0]?.value) },
    });
  } catch (err) {
    console.error('business/organization PATCH', err);
    res.status(500).json({ error: err.message || 'Failed to save organization' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const biz = await getBusinessForUser(req.user.id);
    const subscription = await getSubscriptionContext(req.user.id);
    res.json({
      hasBusiness: !!biz,
      is_onboarded: biz?.is_onboarded ?? true,
      business: biz,
      subscription: {
        effectivePlanId: subscription.effectivePlanId,
        billingPlanId: subscription.billingPlanId,
        subscriptionStatus: subscription.subscriptionStatus,
        trialActive: subscription.trialActive,
        trialDaysLeft: subscription.trialDaysLeft,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        limits: subscription.limits,
      },
    });
  } catch (err) {
    console.error('business/status', err);
    res.json({ hasBusiness: false, is_onboarded: true, business: null, subscription: null });
  }
});

router.post('/onboarding', requireEmployer, async (req, res) => {
  try {
    const {
      step,
      business_name,
      tax_id,
      country_code,
      state_code,
      location_name,
      timezone,
      operating_days,
      min_employee_age,
      employment_types,
      pay_rules,
      employees,
      holidays,
      finalize,
    } = req.body;

    let biz = await getBusinessForUser(req.user.id);

    if (!biz) {
      biz = await ensureBusinessForOwner(req.user.id, business_name || 'My Business');
      if (!biz.trial_ends_at) {
        await startProfessionalTrial(biz.id);
        biz = await getBusinessForUser(req.user.id);
      }
      await query(
        `UPDATE businesses SET tax_id = COALESCE($2, tax_id), country_code = COALESCE($3, country_code),
         state_code = COALESCE($4, state_code), location_name = COALESCE($5, location_name) WHERE id = $1`,
        [biz.id, tax_id || null, country_code || 'AU', state_code || null, location_name || null]
      );
      biz = await getBusinessForUser(req.user.id);
    }

    const updates = [];
    const params = [];
    let i = 1;

    if (business_name !== undefined) { updates.push(`business_name = $${i++}`); params.push(business_name); }
    if (tax_id !== undefined) { updates.push(`tax_id = $${i++}`); params.push(tax_id); }
    if (country_code !== undefined) { updates.push(`country_code = $${i++}`); params.push(country_code); }
    if (state_code !== undefined) { updates.push(`state_code = $${i++}`); params.push(state_code); }
    if (location_name !== undefined) { updates.push(`location_name = $${i++}`); params.push(location_name); }
    if (timezone !== undefined) { updates.push(`timezone = $${i++}`); params.push(timezone); }
    if (operating_days !== undefined) {
      updates.push(`operating_days = $${i++}::jsonb`);
      params.push(JSON.stringify(operating_days));
    }
    if (min_employee_age !== undefined) { updates.push(`min_employee_age = $${i++}`); params.push(min_employee_age); }
    if (employment_types !== undefined) {
      updates.push(`employment_types = $${i++}::jsonb`);
      params.push(JSON.stringify(employment_types));
    }
    if (pay_rules !== undefined) {
      updates.push(`pay_rules = $${i++}::jsonb`);
      params.push(JSON.stringify(pay_rules));
    }
    if (finalize) {
      updates.push(`is_onboarded = $${i++}`);
      params.push(true);
    }
    updates.push('updated_at = NOW()');

    if (updates.length) {
      params.push(biz.id);
      const { rows } = await query(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
        params
      );
      biz = rows[0];
    }

    if (Array.isArray(employees) && employees.length) {
      for (const emp of employees) {
        if (!emp.emp_name) continue;
        await query(
          `INSERT INTO employees (emp_code, emp_name, email, employment_type, hourly_rate, plant_id)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (emp_code) DO UPDATE SET emp_name = EXCLUDED.emp_name, email = EXCLUDED.email`,
          [
            emp.emp_code || `EMP${Date.now()}`,
            emp.emp_name,
            emp.email || null,
            emp.employment_type || 'FULL_TIME',
            emp.hourly_rate || null,
            emp.plant_id || null,
          ]
        );
      }
    }

    if (Array.isArray(holidays) && holidays.length) {
      for (const h of holidays) {
        try {
          await query(
            `INSERT INTO holidays (holiday_date, holiday_name, is_national, is_paid, country_code, state_code, source, plant_id)
             VALUES ($1,$2,$3,$4,$5,$6,'onboarding', NULL)
             ON CONFLICT DO NOTHING`,
            [
              h.holiday_date,
              h.holiday_name,
              h.is_national ?? true,
              h.is_paid ?? true,
              biz.country_code,
              biz.state_code,
            ]
          );
        } catch {
          /* duplicate holiday */
        }
      }
    }

    let credentialsSent = 0;
    if (finalize && Array.isArray(employees)) {
      credentialsSent = await provisionEmployeeLogins(employees);
    }

    res.json({ business: biz, step, credentialsSent });
  } catch (err) {
    console.error('business/onboarding', err);
    res.status(500).json({ error: err.message || 'Onboarding save failed' });
  }
});

module.exports = router;
