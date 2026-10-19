import React from 'react'

// Used on any feature the spec calls for that has no corresponding
// endpoint in the backend API contract. Per the contract's rules, we
// build the UI only and clearly label it as pending backend support
// instead of inventing a REST endpoint.
export default function PendingBackendNotice({ feature }) {
  return (
    <div className="panel border-dashed border-brass/40 p-5 flex items-start gap-3">
      <span className="badge-pill-amber shrink-0">Pending Backend</span>
      <p className="text-sm text-ink/60 dark:text-paper/60">
        {feature ? `${feature} is` : 'This feature is'} shown here as UI-only. It needs a matching endpoint in the
        API contract before it can read or write real data.
      </p>
    </div>
  )
}
