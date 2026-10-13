export const ROLES = {
  ADMIN: 'Admin',
  SECURITY: 'Security Officer',
  EMPLOYEE: 'Employee',
  VISITOR: 'Visitor',
}

// Normalizes whatever casing/shape the backend sends a role in (e.g. "admin",
// "ADMIN", "security_officer") into the canonical labels above.
export const normalizeRole = (rawRole) => {
  if (!rawRole) return null
  const value = String(rawRole).toLowerCase().replace(/[\s_-]/g, '')
  if (value === 'admin') return ROLES.ADMIN
  if (value === 'securityofficer' || value === 'security') return ROLES.SECURITY
  if (value === 'employee' || value === 'user') return ROLES.EMPLOYEE
  if (value === 'visitor') return ROLES.VISITOR
  return rawRole
}

export const roleHomePath = (role) => {
  switch (normalizeRole(role)) {
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.SECURITY:
      return '/security/dashboard'
    case ROLES.EMPLOYEE:
      return '/employee/dashboard'
    case ROLES.VISITOR:
      return '/visitor/dashboard'
    default:
      return '/login'
  }
}
