const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getCalendarForUser } = require('../services/calendarData');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || now.getMonth() + 1;

    const data = await getCalendarForUser(req, { year, month });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load calendar' });
  }
});

module.exports = router;
