import React from 'react'
import { STATUS_BADGE_MAP, VISIT_STATUS_LABEL } from '../../utils/constants.js'

export default function Badge({ status, children }) {
  const badgeClass = STATUS_BADGE_MAP[status] || 'badge-pill-neutral'
  return <span className={`badge-pill ${badgeClass}`}>{children || VISIT_STATUS_LABEL[status] || status}</span>
}
