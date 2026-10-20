import React from 'react'

export default function StatusPill({ active }) {
  return (
    <span className={active ? 'badge-pill-green' : 'badge-pill-neutral'}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[var(--success)]' : 'bg-[var(--text-disabled)]'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
