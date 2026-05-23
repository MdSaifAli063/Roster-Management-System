/** SQL filter for active workforce (employees table uses `status`, not `is_active`). */
const ACTIVE_EMPLOYEE_SQL = `COALESCE(status, 'ACTIVE') NOT IN ('INACTIVE', 'TERMINATED')`;

function countActiveEmployeesSql() {
  return `SELECT COUNT(*)::int AS c FROM employees WHERE ${ACTIVE_EMPLOYEE_SQL}`;
}

module.exports = { ACTIVE_EMPLOYEE_SQL, countActiveEmployeesSql };
