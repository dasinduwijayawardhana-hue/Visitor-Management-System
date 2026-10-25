import React from 'react'
import { NavLink } from 'react-router-dom'
import { ROLES } from '../../utils/roles.js'
import useAuth from '../../hooks/useAuth.js'
import companyLogo from '../../Assests/img/Company_logo.png'

const NAV_ITEMS = {
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const items = NAV_ITEMS[user?.role] || []

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navigation sidebar"
        className={
          'fixed z-40 inset-y-0 left-0 w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
        style={{
          backgroundColor: '#10192E',
          color: '#F6F4EF',
        }}
      >
        {/* Brass lanyard strip */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden="true"
        />

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <img
            src={companyLogo}
            alt="Company Logo"
            className="sidebar-logo-img"
            draggable="false"
          />
          <div>
            <p className="font-display text-sm font-semibold leading-none" style={{ color: '#F6F4EF' }}>
              Gatehouse
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(246,244,239,0.45)' }}>
              Visitor Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ' +
                (isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/85')
              }
            >
              <span
                className="text-base leading-none"
                style={{ color: 'var(--accent)' }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(246,244,239,0.10)' }}
        >
          <p className="text-[11px]" style={{ color: 'rgba(246,244,239,0.35)' }}>
            Signed in as
          </p>
          <p className="text-sm font-medium truncate" style={{ color: 'rgba(246,244,239,0.85)' }}>
            {user?.fullName || user?.email || user?.role}
          </p>
        </div>
      </aside>
    </>
  )
}
