import React from 'react'

export default function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
      {icon && (
        <div
          className="mb-2 text-3xl"
          style={{ color: 'var(--text-disabled)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className="font-display text-base font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-brass mt-3">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
