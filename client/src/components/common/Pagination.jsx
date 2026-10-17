import React from 'react'

export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  const items = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) items.push('ellipsis-' + p)
    items.push(p)
    prev = p
  }

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-ghost !px-3 !py-1.5 text-xs"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {items.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className="h-8 w-8 rounded-lg text-xs font-semibold transition"
              style={
                item === page
                  ? { backgroundColor: 'var(--accent)', color: '#10192E' }
                  : { color: 'var(--text-secondary)', background: 'transparent' }
              }
            >
              {item}
            </button>
          ) : (
            <span
              key={item}
              className="px-1 text-xs select-none"
              style={{ color: 'var(--text-disabled)' }}
              aria-hidden="true"
            >
              …
            </span>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost !px-3 !py-1.5 text-xs"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
