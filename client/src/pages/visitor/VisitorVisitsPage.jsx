import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getVisitorVisits, cancelVisitorVisit } from '../../api/visitorPortal.api'
import PageHeader from '../../components/common/PageHeader'
import SearchInput from '../../components/common/SearchInput'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import useToast from '../../hooks/useToast'
import useDebounce from '../../hooks/useDebounce'

export default function VisitorVisitsPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const limit = 10

  const fetchVisits = useCallback(async () => {
    setLoading(true)
    try {
      const { data: body } = await getVisitorVisits({ page, limit })
      setVisits(Array.isArray(body?.data) ? body.data : [])
      setTotalPages(Math.max(1, Math.ceil((body?.meta?.total || 0) / limit)))
    } catch (err) {
      toast.error('Could not load visit requests.')
    } finally {
      setLoading(false)
    }
  }, [page, toast])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  const handleCancelVisit = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelVisitorVisit(cancelTarget.visitId)
      toast.success('Visit request cancelled successfully.')
      setCancelTarget(null)
      fetchVisits()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel visit request.')
    } finally {
      setCancelling(false)
    }
  }

  // Filter client side on host name, purpose or status
  const filtered = visits.filter((v) =>
    [
      v.hostEmployee ? `${v.hostEmployee.firstName} ${v.hostEmployee.lastName}` : null,
      v.purpose,
      v.visitStatus,
    ]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase()))
  )

  return (
    <div>
      <PageHeader
        title="My Visit Requests"
        description="All your past, active, and pending visit requests."
        actions={
          <Link to="/visitor/visits/new" className="btn-brass">
            + Request New Visit
          </Link>
        }
      />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by host, purpose, or status…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={filtered}
          rowKey="visitId"
          emptyTitle="No visit requests found"
          columns={[
            {
              key: 'host',
              header: 'Staff Host',
              render: (row) => (
                <span className="font-bold text-white font-display text-sm">
                  {row.hostEmployee ? `${row.hostEmployee.firstName} ${row.hostEmployee.lastName}` : '—'}
                </span>
              ),
            },
            {
              key: 'department',
              header: 'Department',
              render: (row) => <span className="text-slate-300 text-sm">{row.department?.departmentName || '—'}</span>,
            },
            {
              key: 'visitDate',
              header: 'Visit Date',
              render: (row) => (
                <span className="font-mono text-xs text-slate-200">
                  {row.visitDate ? new Date(row.visitDate).toLocaleDateString() : '—'}
                </span>
              ),
            },
            {
              key: 'purpose',
              header: 'Purpose',
              render: (row) => <span className="text-slate-200 text-sm">{row.purpose || '—'}</span>,
            },
            {
              key: 'visitStatus',
              header: 'Status',
              render: (row) => <Badge status={row.visitStatus} />,
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex gap-2 justify-end">
                  {['Approved', 'Checked_In'].includes(row.visitStatus) && row.gatePass && (
                    <Link to={`/visitor/gate-pass/${row.visitId}`} className="btn-brass !px-2.5 !py-1 text-xs">
                      Gate Pass
                    </Link>
                  )}
                  {['Pending', 'Approved'].includes(row.visitStatus) && (
                    <button
                      className="btn-danger !px-2.5 !py-1 text-xs"
                      onClick={() => setCancelTarget(row)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Visit Request"
        message="Are you sure you want to cancel this scheduled visit request? This cannot be undone."
        confirmLabel="Cancel Request"
        danger
        busy={cancelling}
        onConfirm={handleCancelVisit}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
