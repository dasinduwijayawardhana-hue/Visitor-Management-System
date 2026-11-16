import React, { createContext, useCallback, useMemo, useState } from 'react'

export const ToastContext = createContext(null)

let idCounter = 0

const TOAST_CONFIG = {
  success: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'var(--success-border)',
  },
  error: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    border: 'var(--danger-border)',
  },
  info: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
      </svg>
    ),
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    border: 'var(--info-border)',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (msg, duration) => notify(msg, 'success', duration),
      error:   (msg, duration) => notify(msg, 'error',   duration),
      info:    (msg, duration) => notify(msg, 'info',     duration),
    }),
    [notify],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — fixed bottom-right, above everything */}
      <div
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 w-80 max-w-[90vw]"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type] ?? TOAST_CONFIG.info
          return (
            <div
              key={t.id}
              role="alert"
              className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl animate-fadeIn"
              style={{
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                color: 'var(--text-primary)',
              }}
            >
              {/* Icon */}
              <span
                className="mt-0.5 shrink-0"
                style={{ color: cfg.color }}
                aria-hidden="true"
              >
                {cfg.icon}
              </span>

              {/* Message */}
              <p className="flex-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
                {t.message}
              </p>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                aria-label="Dismiss notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
