require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

(async () => {
  const email = 'admin@roster.com';
  const password = 'admin123';
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  console.log('user:', rows[0] ? rows[0].email : 'NOT FOUND');
  if (!rows[0]) {
    console.log('Run: npm run db:seed');
    process.exit(1);
  }
  const match = await bcrypt.compare(password, rows[0].password_hash);
  console.log('password match:', match);
  const token = jwt.sign(
    { id: rows[0].id, email: rows[0].email, role: rows[0].role, name: rows[0].name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('token created:', token.slice(0, 20) + '...');
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
