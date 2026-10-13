import React from 'react'

export default function Spinner({ label, size = 'md' }) {
  const dims =
    size === 'sm' ? 'h-4 w-4 border-2'
    : size === 'lg' ? 'h-10 w-10 border-4'
    : 'h-6 w-6 border-[3px]'

  return (
    <div className="flex items-center gap-3" role="status" aria-label={label || 'Loading'}>
      <span
        className={`inline-block shrink-0 ${dims} rounded-full animate-spin`}
        style={{
          borderColor: 'var(--accent-subtle)',
          borderTopColor: 'var(--accent)',
        }}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
    </div>
  )
}
