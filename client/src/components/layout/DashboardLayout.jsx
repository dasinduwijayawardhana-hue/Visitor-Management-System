import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { ROLES, normalizeRole } from '../../utils/roles.js'
import adminVideo from '../../Assests/Video/admin_video.mp4'
import employeeVideo from '../../Assests/Video/employee.mp4'
import securityVideo from '../../Assests/Video/Security_video.mp4'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  // Admin side check: user is Admin role OR currently navigating any /admin route
  const isAdmin = normalizeRole(user?.role) === ROLES.ADMIN || location.pathname.startsWith('/admin')

  // Security side check: user is Security Officer role OR currently navigating any /security route
  const isSecurity = normalizeRole(user?.role) === ROLES.SECURITY || location.pathname.startsWith('/security')

  // Employee side check: user is Employee role OR currently navigating any /employee route
  const isEmployee = normalizeRole(user?.role) === ROLES.EMPLOYEE || location.pathname.startsWith('/employee')

  // Visitor check
  const isVisitor = normalizeRole(user?.role) === ROLES.VISITOR || location.pathname.startsWith('/visitor')

  return (
    <div className={`relative flex min-h-screen bg-paper dark:bg-ink overflow-x-hidden ${isAdmin ? 'admin-glass-theme' : ''} ${isSecurity ? 'security-glass-theme' : ''} ${isEmployee || isVisitor ? 'employee-glass-theme' : ''}`}>
      {/* ── Admin Full-Screen Background Video & Glass Overlay ── */}
      {isAdmin && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            src={adminVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          {/* Strong dark overlay (78%) for data readability */}
          <div className="absolute inset-0 bg-black/78 backdrop-blur-[2px]" />
        </div>
      )}

      {/* ── Security Officer Full-Screen Background Video & Glass Overlay ── */}
      {isSecurity && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            src={securityVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          {/* Strong dark overlay (78%) for data readability */}
          <div className="absolute inset-0 bg-black/78 backdrop-blur-[2px]" />
        </div>
      )}

      {/* ── Employee/Visitor Full-Screen Background Video & Glass Overlay ── */}
      {(isEmployee || isVisitor) && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            src={employeeVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          {/* Strong dark overlay (78%) for Employee dashboard data readability */}
          <div className="absolute inset-0 bg-black/78 backdrop-blur-[2px]" />
        </div>
      )}

      {/* ── Dashboard Layout Elements ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

