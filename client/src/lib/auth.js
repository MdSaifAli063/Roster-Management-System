export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  EMPLOYER: 'EMPLOYER',
  HR_USER: 'HR_USER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  ADMIN: 'ADMIN',
};

export const EMPLOYER_ROLES = [ROLES.ADMIN, ROLES.HR_USER, ROLES.TRAINING_MANAGER, ROLES.EMPLOYER];

export const ROLE_OPTIONS = [
  { value: ROLES.EMPLOYEE, label: 'Employee' },
  { value: ROLES.EMPLOYER, label: 'Employer' },
];

export function isEmployer(role) {
  return EMPLOYER_ROLES.includes(role);
}

export function isEmployee(role) {
  return role === ROLES.EMPLOYEE;
}

/** @deprecated use isEmployer */
export function isStaff(role) {
  return isEmployer(role);
}

export function getHomePath(role) {
  return isEmployee(role) ? '/view-roster' : '/dashboard';
}

export function getRoleLabel(role) {
  if (role === ROLES.EMPLOYER) return 'Employer';
  if (role === ROLES.EMPLOYEE) return 'Employee';
  if (role === ROLES.ADMIN) return 'Admin';
  if (role === ROLES.HR_USER) return 'HR User';
  if (role === ROLES.TRAINING_MANAGER) return 'Training Manager';
  return role;
}
