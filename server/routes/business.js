const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { provisionEmployeeLogins } = require('../services/employeeCredentials');

const router = express.Router();
router.use(authenticate);

async function getBusinessForUser(userId) {
  const { rows } = await query(
    'SELECT * FROM businesses WHERE owner_user_id = $1 ORDER BY id LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

router.get('/status', async (req, res) => {
  try {
    const biz = await getBusinessForUser(req.user.id);
    res.json({
      hasBusiness: !!biz,
      is_onboarded: biz?.is_onboarded ?? true,
      business: biz,
    });
  } catch (err) {
    console.error('business/status', err);
    res.json({ hasBusiness: false, is_onboarded: true, business: null });
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
      const { rows } = await query(
        `INSERT INTO businesses (owner_user_id, business_name, tax_id, country_code, state_code, location_name)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          req.user.id,
          business_name || 'My Business',
          tax_id || null,
          country_code || 'AU',
          state_code || null,
          location_name || null,
        ]
      );
      biz = rows[0];
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
