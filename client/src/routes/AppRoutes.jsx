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
import BlacklistPage from '../pages/admin/BlacklistPage.jsx'
import EmployeesPage from '../pages/admin/EmployeesPage.jsx'
import DepartmentsPage from '../pages/admin/DepartmentsPage.jsx'
import VisitsPage from '../pages/admin/VisitsPage.jsx'
import ReportsPage from '../pages/admin/ReportsPage.jsx'
import LogsPage from '../pages/admin/LogsPage.jsx'
import ProfilePage from '../pages/admin/ProfilePage.jsx'

import SecurityDashboard from '../pages/security/SecurityDashboard.jsx'
import VisitorRegistrationPage from '../pages/security/VisitorRegistrationPage.jsx'
import CheckInPage from '../pages/security/CheckInPage.jsx'
import CheckOutPage from '../pages/security/CheckOutPage.jsx'
import VisitorSearchPage from '../pages/security/VisitorSearchPage.jsx'

import EmployeeDashboard from '../pages/employee/EmployeeDashboard.jsx'
import MyVisitorsPage from '../pages/employee/MyVisitorsPage.jsx'

// Visitor Portal pages
import VisitorLoginPage from '../pages/visitor/VisitorLoginPage.jsx'
import VisitorRegisterPage from '../pages/visitor/VisitorRegisterPage.jsx'
import VisitorDashboardPage from '../pages/visitor/VisitorDashboardPage.jsx'

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
        <Route path="/visitor/login" element={<VisitorLoginPage />} />
        <Route path="/visitor/register" element={<VisitorRegisterPage />} />
      </Route>

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        {/* Admin */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/visitors" element={<VisitorsPage />} />
            <Route path="/admin/blacklist" element={<BlacklistPage />} />
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/visits" element={<VisitsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/logs" element={<LogsPage />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Security Officer & Admin */}
        <Route element={<RoleRoute allowedRoles={[ROLES.SECURITY, ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/security/dashboard" element={<SecurityDashboard />} />
            <Route path="/security/register-visitor" element={<VisitorRegistrationPage />} />
            <Route path="/security/check-in" element={<CheckInPage />} />
            <Route path="/security/check-out" element={<CheckOutPage />} />
            <Route path="/security/search" element={<VisitorSearchPage />} />
          </Route>
        </Route>

        {/* Employee */}
        <Route element={<RoleRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/my-visitors" element={<MyVisitorsPage />} />
          </Route>
        </Route>

        {/* Visitor */}
        <Route element={<RoleRoute allowedRoles={[ROLES.VISITOR]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/visitor/dashboard" element={<VisitorDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
