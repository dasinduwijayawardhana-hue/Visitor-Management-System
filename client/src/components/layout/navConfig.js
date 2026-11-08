import { ROLES } from '../../utils/roles.js'

// Centralized nav config per role so Sidebar stays a single source of truth.
export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/admin/users', label: 'Users', icon: '◍' },
    { to: '/admin/visitors', label: 'Visitors', icon: '◔' },
    { to: '/admin/blacklist', label: 'Blacklist', icon: '🚫' },
    { to: '/admin/employees', label: 'Employees', icon: '◒' },
    { to: '/admin/departments', label: 'Departments', icon: '◫' },
    { to: '/admin/visits', label: 'Visits', icon: '◈' },
    { to: '/admin/reports', label: 'Reports', icon: '◲' },
    { to: '/admin/logs', label: 'Logs', icon: '◱' },
    { to: '/admin/profile', label: 'Profile', icon: '◉' },
  ],
  [ROLES.SECURITY]: [
    { to: '/security/dashboard', label: 'Dashboard', icon: '◧' },
    { to: '/security/register-visitor', label: 'Register Visitor', icon: '✎' },
    { to: '/security/check-in', label: 'Check In', icon: '✓' },
    { to: '/security/check-out', label: 'Check Out', icon: '✗' },
    { to: '/security/search', label: 'Search Visitors', icon: '⌕' },
  ],
  [ROLES.EMPLOYEE]: [
    { to: '/employee/dashboard', label: 'Dashboard', icon: '◧' },
  ],
}
