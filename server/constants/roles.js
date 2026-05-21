const ROLES = {
  ADMIN: 'ADMIN',
  HR_USER: 'HR_USER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  EMPLOYER: 'EMPLOYER',
  EMPLOYEE: 'EMPLOYEE',
};

const SIGNUP_ROLES = [ROLES.EMPLOYEE, ROLES.EMPLOYER];

/** Legacy staff roles + EMPLOYER — full employer sidebar */
const EMPLOYER_ROLES = [ROLES.ADMIN, ROLES.HR_USER, ROLES.TRAINING_MANAGER, ROLES.EMPLOYER];

const STAFF_ROLES = EMPLOYER_ROLES;

const ROLE_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.EMPLOYER]: 'Employer',
  [ROLES.HR_USER]: 'HR User',
  [ROLES.TRAINING_MANAGER]: 'Training Manager',
  [ROLES.ADMIN]: 'Admin',
};

function isEmployerRole(role) {
  return EMPLOYER_ROLES.includes(role);
}

function isEmployeeRole(role) {
  return role === ROLES.EMPLOYEE;
}

module.exports = {
  ROLES,
  SIGNUP_ROLES,
  STAFF_ROLES,
  EMPLOYER_ROLES,
  ROLE_LABELS,
  isEmployerRole,
  isEmployeeRole,
};
