const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { SIGNUP_ROLES, ROLES } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');

const router = express.Router();

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
    const token = signToken(user);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
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
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
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
      label: value === ROLES.EMPLOYEE ? 'Employee' : value === ROLES.HR_USER ? 'HR User' : 'Training Manager',
    }))
  );
});

module.exports = router;
