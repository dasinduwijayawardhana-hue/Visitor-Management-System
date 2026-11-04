import React from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import PendingBackendNotice from '../../components/common/PendingBackendNotice.jsx'

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="System Logs" description="Audit trail of sign-ins and record changes." />
      <PendingBackendNotice feature="System logs" />
    </div>
  )
}
