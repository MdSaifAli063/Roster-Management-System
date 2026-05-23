const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { isEmployerRole } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');

const router = express.Router();
router.use(authenticate);

const EMPLOYER_PAGES = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', category: 'schedule', keywords: 'home overview' },
  { id: 'staff', label: 'Staff', to: '/staff', category: 'employee', keywords: 'employees people directory' },
  { id: 'leave', label: 'Leave approvals', to: '/leave', category: 'schedule', keywords: 'leave time off pto' },
  { id: 'manage-roster', label: 'Create roster', to: '/manage-roster', category: 'schedule', keywords: 'schedule create roster shift' },
  { id: 'view-roster', label: 'View roster', to: '/view-roster', category: 'schedule', keywords: 'schedule view roster calendar' },
  { id: 'actual-roster', label: 'Attendance', to: '/actual-roster', category: 'attendance', keywords: 'attendance actual punch' },
  { id: 'holidays', label: 'Holidays', to: '/holidays', category: 'schedule', keywords: 'holiday calendar public' },
  { id: 'reports', label: 'Reports', to: '/reports', category: 'analytic', keywords: 'analytics report export' },
  { id: 'finance', label: 'Finance', to: '/finance', category: 'analytic', keywords: 'finance invoice payroll' },
  { id: 'organization', label: 'Organization', to: '/organization', category: 'schedule', keywords: 'company business settings org' },
  { id: 'settings', label: 'Settings', to: '/settings', category: 'schedule', keywords: 'settings preferences' },
];

const EMPLOYEE_PAGES = [
  { id: 'dashboard', label: 'My dashboard', to: '/dashboard', category: 'schedule', keywords: 'home' },
  { id: 'view-roster', label: 'My roster', to: '/view-roster', category: 'schedule', keywords: 'roster schedule shift' },
  { id: 'leave', label: 'Apply leave', to: '/leave', category: 'schedule', keywords: 'leave time off' },
  { id: 'attendance', label: 'My attendance', to: '/attendance', category: 'attendance', keywords: 'attendance punch mark' },
  { id: 'profile', label: 'Profile', to: '/profile', category: 'schedule', keywords: 'profile account' },
  { id: 'settings', label: 'Settings', to: '/settings', category: 'schedule', keywords: 'settings' },
];

function matchQuery(text, q) {
  if (!q) return true;
  return String(text || '').toLowerCase().includes(q.toLowerCase());
}

function filterPages(pages, q, category) {
  return pages.filter((p) => {
    if (category && category !== 'all' && p.category !== category) return false;
    if (!q) return true;
    const hay = `${p.label} ${p.keywords} ${p.to}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
}

router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const category = (req.query.category || 'all').toLowerCase();
    const employer = isEmployerRole(req.user.role);
    const pages = employer ? EMPLOYER_PAGES : EMPLOYEE_PAGES;

    const result = {
      employees: [],
      departments: [],
      pages: filterPages(pages, q, category === 'broadcast' ? 'all' : category).slice(0, 8),
    };

    if (employer && (category === 'all' || category === 'employee')) {
      const params = [];
      let sql = `
        SELECT e.id, e.emp_code, e.emp_name, e.email, e.business_unit,
               p.plant_name, u.avatar_url
        FROM employees e
        LEFT JOIN plants p ON e.plant_id = p.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE COALESCE(e.status, 'ACTIVE') <> 'INACTIVE'
      `;
      if (q) {
        sql += ` AND (e.emp_name ILIKE $1 OR e.emp_code ILIKE $1 OR e.email ILIKE $1 OR e.business_unit ILIKE $1)`;
        params.push(`%${q}%`);
      }
      sql += ' ORDER BY e.emp_name LIMIT 8';
      const { rows } = await query(sql, params);
      result.employees = rows.map((e) => ({
        id: e.id,
        empCode: e.emp_code,
        empName: e.emp_name,
        email: e.email,
        department: e.business_unit || e.plant_name || 'General',
        handle: e.email ? `@${e.email.split('@')[0]}` : `@${(e.emp_code || '').toLowerCase()}`,
        avatarUrl: e.avatar_url,
        to: `/staff/${e.id}`,
      }));
    }

    if (!employer && (category === 'all' || category === 'employee')) {
      const emp = await resolveEmployeeForUser(req.user);
      if (emp && matchQuery(`${emp.emp_name} ${emp.emp_code} ${emp.email}`, q)) {
        result.employees = [
          {
            id: emp.id,
            empCode: emp.emp_code,
            empName: emp.emp_name,
            email: emp.email,
            department: emp.business_unit || emp.plant_name || 'General',
            handle: emp.email ? `@${emp.email.split('@')[0]}` : `@${(emp.emp_code || '').toLowerCase()}`,
            avatarUrl: null,
            to: '/profile',
          },
        ];
      }
    }

    if (employer && (category === 'all' || category === 'department')) {
      let deptSql = `
        SELECT DISTINCT business_unit AS name, COUNT(*)::int AS headcount
        FROM employees
        WHERE business_unit IS NOT NULL AND business_unit <> ''
          AND COALESCE(status, 'ACTIVE') <> 'INACTIVE'
      `;
      const deptParams = [];
      if (q) {
        deptSql += ' AND business_unit ILIKE $1';
        deptParams.push(`%${q}%`);
      }
      deptSql += ' GROUP BY business_unit ORDER BY business_unit LIMIT 12';
      const { rows: depts } = await query(deptSql, deptParams);
      result.departments = depts.map((d) => ({
        name: d.name,
        headcount: d.headcount,
        to: `/staff?business_unit=${encodeURIComponent(d.name)}`,
      }));
    }

    if (category === 'schedule') {
      result.pages = filterPages(pages, q, 'schedule').slice(0, 8);
    } else if (category === 'attendance') {
      result.pages = filterPages(pages, q, 'attendance').slice(0, 8);
    } else if (category === 'analytic') {
      result.pages = filterPages(pages, q, 'analytic').slice(0, 8);
    } else if (category === 'broadcast') {
      result.pages = filterPages(pages, q, 'all').slice(0, 6);
    }

    res.json(result);
  } catch (err) {
    console.error('search', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
