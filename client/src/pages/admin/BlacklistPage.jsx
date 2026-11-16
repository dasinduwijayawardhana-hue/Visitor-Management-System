import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getBlacklist, removeBlacklist } from '../../api/blacklist.api.js'
import { formatDateTime } from '../../utils/formatters.js'

export default function BlacklistPage() {
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const { data: body } = await getBlacklist({ limit: 1000, status: filterStatus || undefined })
      setRecords(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      toast.error(`Could not load blacklist records: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  const filtered = records.filter((r) => {
    const q = debouncedSearch.toLowerCase()
    return (
      r.fullName?.toLowerCase().includes(q) ||
      r.idProofNumber?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.blacklistReason?.toLowerCase().includes(q)
    )
  })

  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await removeBlacklist(removeTarget.id)
      toast.success(`${removeTarget.fullName} removed from blacklist.`)
      setRemoveTarget(null)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove this blacklist entry.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Blacklist Management"
        description="Identity-based blacklist records. Persons listed here are blocked from all visitor registrations."
      />

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard
          label="Active Restrictions"
          value={records.filter((r) => r.status === 'ACTIVE').length}
          color="var(--danger)"
          icon="🚫"
        />
        <StatCard
          label="Total Entries"
          value={records.length}
          color="var(--text-secondary)"
          icon="📋"
        />
        <StatCard
          label="Removed Entries"
          value={records.filter((r) => r.status === 'REMOVED').length}
          color="var(--success, #22c55e)"
          icon="✅"
        />
      </div>

      <div className="panel p-4 sm:p-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID, phone, reason…"
            className="max-w-xs flex-1"
          />
          <select
            className="input-field w-auto text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ACTIVE">Active only</option>
            <option value="REMOVED">Removed only</option>
            <option value="">All</option>
          </select>
        </div>

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="id"
          emptyTitle="No blacklist records"
          emptyDescription="When a visitor is blacklisted via the Visitors page, their identity will appear here."
          columns={[
            {
              key: 'fullName',
              header: 'Person',
              render: (row) => (
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{row.fullName}</p>
                  {row.visitor && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Visitor #{row.visitor.visitorId}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: 'identity',
              header: 'Identity',
              render: (row) => (
                <div className="text-xs space-y-0.5">
                  {row.idProofNumber && (
                    <p>
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                        {row.idProofType?.replace('_', ' ') || 'ID'}:{' '}
                      </span>
                      <span className="font-mono">{row.idProofNumber}</span>
                    </p>
                  )}
                  {row.phone && (
                    <p>
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Phone: </span>
                      <span className="font-mono">{row.phone}</span>
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: 'blacklistReason',
              header: 'Reason',
              render: (row) => (
                <p className="text-sm max-w-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {row.blacklistReason}
                </p>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) =>
                row.status === 'ACTIVE' ? (
                  <span className="badge-pill-red">Active</span>
                ) : (
                  <span className="badge-pill-neutral">Removed</span>
                ),
            },
            {
              key: 'meta',
              header: 'Added',
              render: (row) => (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <p>{formatDateTime(row.createdAt)}</p>
                  {row.createdByUser && (
                    <p className="mt-0.5">by {row.createdByUser.fullName}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                row.status === 'ACTIVE' ? (
                  <button
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => setRemoveTarget(row)}
                  >
                    Remove
                  </button>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Removed by {row.removedByUser?.fullName || 'Admin'}
                  </span>
                ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} className="mt-4" />
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove blacklist restriction"
        message={`Allow ${removeTarget?.fullName} to register as a visitor again? This will lift all blacklist restrictions tied to their ID and phone number.`}
        confirmLabel="Remove Restriction"
        busy={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="panel p-4 flex items-center gap-4"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}
