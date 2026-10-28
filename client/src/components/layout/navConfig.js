import { ROLES } from '../../utils/roles.js'

// Centralized nav config per role so Sidebar stays a single source of truth.
export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '◧' },
  ],
}
