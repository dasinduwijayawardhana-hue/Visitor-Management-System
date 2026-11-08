import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/Card.jsx'
import Table from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import { getMyVisitors } from '../../api/employees.api.js'
import { formatDateTime, toISODate } from '../../utils/formatters.js'
import { VISIT_STATUS } from '../../utils/constants.js'

export default function EmployeeDashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: body } = await getMyVisitors()
        setVisits(Array.isArray(body?.data) ? body.data : [])
      } catch (err) {
        toast.error('Could not load your visitors.')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = toISODate(new Date())
  const todayCount = visits.filter((v) => (v.checkInTime || v.createdAt || '').startsWith(today)).length
  const insideCount = visits.filter((v) => v.visitStatus === VISIT_STATUS.CHECKED_IN).length
  const upcomingCount = visits.filter((v) => v.visitStatus === VISIT_STATUS.PRE_REGISTERED).length

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of visitors coming to see you."
        actions={
          <Link to="/employee/my-visitors" className="btn-brass">
            View all my visitors
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Visitors" value={todayCount} icon="◔" accent="brass" />
        <StatCard label="Currently Inside" value={insideCount} icon="◐" accent="green" />
        <StatCard label="Upcoming Visits" value={upcomingCount} icon="◈" accent="amber" />
      </div>

      <div className="panel p-4 sm:p-5 mt-6">
        <h3 className="font-display text-base font-bold text-white tracking-wide mb-4">
          Recent visitors
        </h3>
        <Table
          loading={loading}
          rows={visits.slice(0, 8)}
          rowKey="visitId"
          emptyTitle="No visitors yet"
          emptyDescription="Visitors scheduled to see you will show up here."
          columns={[
            {
              key: 'visitor',
              header: 'Visitor',
              render: (row) => (
                <span className="font-bold text-white font-display text-sm">
                  {row.visitor ? `${row.visitor.firstName} ${row.visitor.lastName}` : '—'}
                </span>
              ),
            },
            {
              key: 'purpose',
              header: 'Purpose',
              render: (row) => <span className="text-slate-200 text-sm">{row.purpose || '—'}</span>,
            },
            {
              key: 'checkInTime',
              header: 'Check-in',
              render: (row) => (
                <span className="font-mono text-xs text-slate-300">
                  {formatDateTime(row.checkInTime)}
                </span>
              ),
            },
            { key: 'visitStatus', header: 'Status', render: (row) => <Badge status={row.visitStatus} /> },
          ]}
        />
      </div>
    </div>
  )
}
