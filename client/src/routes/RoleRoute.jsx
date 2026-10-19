import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { roleHomePath, normalizeRole } from '../utils/roles.js'

// Guards a route tree that requires one of a specific set of roles.
// Must be nested inside <ProtectedRoute /> so `user` is already available.
export default function RoleRoute({ allowedRoles = [] }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const userRole = normalizeRole(user.role)
  const normalizedAllowedRoles = allowedRoles.map((r) => normalizeRole(r))

  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to={roleHomePath(userRole)} replace />
  }

  return <Outlet />
}
