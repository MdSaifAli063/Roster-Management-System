const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { SIGNUP_ROLES, ROLES } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');
const { ensureBusinessForOwner, startProfessionalTrial } = require('../services/subscription');
const { emailTrialStarted } = require('../services/paymentEmails');
const { verifyGoogleCredential, isGoogleAuthConfigured } = require('../services/googleAuth');

const router = express.Router();
router.use(authLimiter);

const SIGNUP_ROLE_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.EMPLOYER]: 'Employer / HR',
};

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar_url: row.avatar_url || null,
    created_at: row.created_at,
  };
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

async function onboardEmployer(user, businessLabel) {
  const biz = await ensureBusinessForOwner(user.id, businessLabel);
  try {
    const endsAt = await startProfessionalTrial(biz.id);
    await emailTrialStarted({
      to: user.email,
      businessName: biz.business_name,
      endsAt,
    });
  } catch (err) {
    console.warn('Employer onboarding (trial/email):', err.message);
  }
  return biz;
}

router.get('/config', (_req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || null;
  res.json({
    googleAuth: isGoogleAuthConfigured(),
    googleClientId,
  });
});

router.post('/google', async (req, res) => {
  try {
    const { credential, role, mode = 'signin' } = req.body;
    const googleUser = await verifyGoogleCredential(credential);

    const { rows: byGoogle } = await query('SELECT * FROM users WHERE google_id = $1', [googleUser.googleId]);
    let user = byGoogle[0];

    if (!user) {
      const { rows: byEmail } = await query('SELECT * FROM users WHERE email = $1', [googleUser.email]);
      user = byEmail[0];
      if (user && !user.google_id) {
        await query(
          `UPDATE users SET google_id = $1,
             avatar_url = COALESCE(avatar_url, $2),
             name = CASE WHEN TRIM(COALESCE(name, '')) = '' THEN $3 ELSE name END
           WHERE id = $4`,
          [googleUser.googleId, googleUser.picture, googleUser.name, user.id]
        );
        user.google_id = googleUser.googleId;
      }
    }

    if (!user) {
      if (mode !== 'signup') {
        return res.status(404).json({
          error: 'No account found for this Google email. Switch to Sign up or create an account with email.',
        });
      }
      if (!role || !SIGNUP_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Choose Employer or Employee before signing up with Google' });
      }

      const { rows } = await query(
        `INSERT INTO users (name, email, password_hash, role, google_id, avatar_url)
         VALUES ($1, $2, NULL, $3, $4, $5)
         RETURNING id, name, email, role, avatar_url, created_at`,
        [googleUser.name, googleUser.email, role, googleUser.googleId, googleUser.picture]
      );
      user = rows[0];
      if (role === ROLES.EMPLOYEE) {
        await resolveEmployeeForUser(user);
      }
      if (role === ROLES.EMPLOYER) {
        await onboardEmployer(user, `${googleUser.name}'s Business`);
      }
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Google sign-in failed',
    });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!SIGNUP_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, password_hash, role]
    );

    const user = rows[0];
    if (role === ROLES.EMPLOYEE) {
      await resolveEmployeeForUser(user);
    }
    if (role === ROLES.EMPLOYER) {
      await onboardEmployer(user, `${name.trim()}'s Business`);
    }
    const token = signToken(user);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: user && !user.password_hash
          ? 'This account uses Google sign-in. Continue with Google below.'
          : 'Invalid email or password',
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Login failed',
    });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
              b.business_name
       FROM users u
       LEFT JOIN businesses b ON b.owner_user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      businessName: row.business_name || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, avatar_url } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ error: 'Name cannot be empty' });
      updates.push(`name = $${idx++}`);
      values.push(trimmed);
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      const { rows: existing } = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [normalized, req.user.id]
      );
      if (existing.length) {
        return res.status(409).json({ error: 'Email is already in use' });
      }
      updates.push(`email = $${idx++}`);
      values.push(normalized);
    }

    if (avatar_url !== undefined) {
      if (avatar_url === null || avatar_url === '') {
        updates.push(`avatar_url = $${idx++}`);
        values.push(null);
      } else if (typeof avatar_url === 'string') {
        if (!avatar_url.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Invalid avatar format' });
        }
        if (avatar_url.length > 700000) {
          return res.status(400).json({ error: 'Avatar image too large (max ~512 KB)' });
        }
        updates.push(`avatar_url = $${idx++}`);
        values.push(avatar_url);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, role, avatar_url, created_at`,
      values
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/roles', (_req, res) => {
  res.json(
    SIGNUP_ROLES.map((value) => ({
      value,
      label: SIGNUP_ROLE_LABELS[value] || value,
    }))
  );
});

module.exports = router;
