import React from 'react'

// Lightweight field wrapper for use with react-hook-form's register().
export default function FormField({ label, error, children, hint, required }) {
  return (
    <div>
      {label && (
        <label className="label-text">
          {label} {required && <span className="text-signal-red">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-signal-red">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">{hint}</p>}
    </div>
  )
}
