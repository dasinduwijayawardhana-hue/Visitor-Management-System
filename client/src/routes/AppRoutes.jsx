import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'
import { ROLES } from '../utils/roles.js'

import AuthLayout from '../components/layout/AuthLayout.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'

import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'

import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import UsersPage from '../pages/admin/UsersPage.jsx'
import VisitorsPage from '../pages/admin/VisitorsPage.jsx'

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
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        {/* Admin */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/visitors" element={<VisitorsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
