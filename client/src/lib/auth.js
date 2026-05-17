export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR_USER: 'HR_USER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  ADMIN: 'ADMIN',
};

export const ROLE_OPTIONS = [
  { value: ROLES.EMPLOYEE, label: 'Employee' },
  { value: ROLES.HR_USER, label: 'HR User' },
  { value: ROLES.TRAINING_MANAGER, label: 'Training Manager' },
];

export function isStaff(role) {
  return [ROLES.ADMIN, ROLES.HR_USER, ROLES.TRAINING_MANAGER].includes(role);
}

export function getHomePath(role) {
  if (role === ROLES.EMPLOYEE) return '/view-roster';
  return '/';
}

export function getRoleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
}
