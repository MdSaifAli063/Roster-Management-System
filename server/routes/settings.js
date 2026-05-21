const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { parseJsonbBool } = require('../utils/settings');

const router = express.Router();
router.use(authenticate);

async function getBusinessId(userId) {
  const { rows } = await query(
    'SELECT id FROM businesses WHERE owner_user_id = $1 LIMIT 1',
    [userId]
  );
  return rows[0]?.id;
}

router.get('/', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.user.id);
    if (!businessId) {
      return res.json({ auto_approve_leave: false });
    }
    const { rows } = await query(
      `SELECT value FROM app_settings WHERE business_id = $1 AND key = 'auto_approve_leave'`,
      [businessId]
    );
    res.json({ auto_approve_leave: parseJsonbBool(rows[0]?.value) });
  } catch (err) {
    console.error('settings GET', err);
    res.json({ auto_approve_leave: false });
  }
});

router.patch('/', requireEmployer, async (req, res) => {
  try {
    const { auto_approve_leave } = req.body;
    let businessId = await getBusinessId(req.user.id);
    if (!businessId) {
      const { rows } = await query(
        'INSERT INTO businesses (owner_user_id, business_name, is_onboarded) VALUES ($1, $2, true) RETURNING id',
        [req.user.id, 'My Business']
      );
      businessId = rows[0].id;
    }
    await query(
      `INSERT INTO app_settings (business_id, key, value)
       VALUES ($1, 'auto_approve_leave', $2::jsonb)
       ON CONFLICT (business_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [businessId, JSON.stringify(!!auto_approve_leave)]
    );
    res.json({ auto_approve_leave: !!auto_approve_leave });
  } catch (err) {
    console.error('settings PATCH', err);
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

module.exports = router;
