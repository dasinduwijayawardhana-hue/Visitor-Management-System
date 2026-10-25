import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useTheme from '../../hooks/useTheme.js'
import { initials } from '../../utils/formatters.js'
import companyLogo from '../../Assests/img/Company_logo.png'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 backdrop-blur"
      style={{
        backgroundColor: isDark ? 'rgba(11,19,43,0.90)' : 'rgba(246,244,239,0.90)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left – hamburger + logo + greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          aria-label="Open navigation"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Company logo visible on lg+ (sidebar hidden equivalent space on mobile) */}
        <img
          src={companyLogo}
          alt="Company Logo"
          className="topbar-logo-img lg:hidden"
          draggable="false"
        />
        <h1
          className="font-display text-base sm:text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome,&nbsp;
          <span style={{ color: 'var(--accent)' }}>
            {(user?.fullName || user?.email || '').split(' ')[0] || user?.role}
          </span>
        </h1>
      </div>

      {/* Right — theme toggle + user menu */}
      <div className="flex items-center gap-2.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
          style={{
            color: 'var(--text-muted)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            /* Sun icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
          ) : (
            /* Moon icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
              />
            </svg>
          )}
        </button>

        {/* Avatar / user menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            {/* Avatar circle */}
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold font-mono"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              {initials(user?.fullName || user?.email || 'U')}
            </span>
            <span
              className="hidden sm:block text-sm max-w-[10rem] truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              {user?.fullName || user?.email}
            </span>
            <svg
              className="h-3.5 w-3.5 hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl border p-1.5 shadow-xl z-20 animate-fadeIn"
                role="menu"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {/* User info */}
                <div
                  className="px-3 py-2.5 mb-1"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {user?.role}
                  </p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  style={{ color: 'var(--danger)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--danger-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                    </svg>
                    Log out
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
