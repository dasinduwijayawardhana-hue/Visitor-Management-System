import React from 'react'

// Signature "badge card" — enterprise dashboard stat tile across all roles.
export default function StatCard({ label, value, icon, accent = 'brass', hint }) {
  const accentStyles = {
    brass: { color: '#E4C877', background: 'rgba(201, 162, 75, 0.20)', border: '1px solid rgba(228, 200, 119, 0.35)' },
    green: { color: '#34D399', background: 'rgba(16, 185, 129, 0.20)', border: '1px solid rgba(52, 211, 153, 0.35)' },
    red:   { color: '#FB7185', background: 'rgba(244, 63, 94, 0.20)',  border: '1px solid rgba(251, 113, 133, 0.35)' },
    amber: { color: '#FBBF24', background: 'rgba(245, 158, 11, 0.20)', border: '1px solid rgba(251, 191, 36, 0.35)' },
    info:  { color: '#38BDF8', background: 'rgba(56, 189, 248, 0.20)', border: '1px solid rgba(56, 189, 248, 0.35)' },
  }
  const accentStyle = accentStyles[accent] ?? accentStyles.brass

  return (
    <div className="badge-card flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
        </p>
        <p className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-slate-400">
            {hint}
          </p>
        )}
      </div>
      {icon && (
        <div
          className="shrink-0 rounded-xl p-3 text-xl font-bold shadow-sm"
          style={accentStyle}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
    </div>
  )
}
