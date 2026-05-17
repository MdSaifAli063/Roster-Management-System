const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { formatNotification } = require('../services/inAppNotifications');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const { rows } = await query(
      `SELECT * FROM user_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(rows.map(formatNotification));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count FROM user_notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ count: rows[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await query(
      `UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE user_notifications SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(formatNotification(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
