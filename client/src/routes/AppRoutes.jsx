import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'
import { ROLES } from '../utils/roles.js'

import AuthLayout from '../components/layout/AuthLayout.jsx'

import Login from '../pages/auth/Login.jsx'

import NotFound from '../pages/NotFound.jsx'
import useAuth from '../hooks/useAuth.js'
import { roleHomePath } from '../utils/roles.js'

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={roleHomePath(user?.role)} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
