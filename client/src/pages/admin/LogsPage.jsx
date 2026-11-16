import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getLogs } from '../../api/logs.api.js'
import { formatDateTime } from '../../utils/formatters.js'

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'CHECK_IN', label: 'CHECK_IN' },
  { value: 'CHECK_OUT', label: 'CHECK_OUT' },
  { value: 'BLACKLIST', label: 'BLACKLIST' },
  { value: 'UNBLACKLIST', label: 'UNBLACKLIST' },
  { value: 'CHANGE_PASSWORD', label: 'CHANGE_PASSWORD' },
]

export default function LogsPage() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selectedAction, setSelectedAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit,
        q: debouncedSearch || undefined,
        action: selectedAction || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      const { data: body } = await getLogs(params)
      setLogs(Array.isArray(body?.data) ? body.data : [])
      if (body?.meta) {
        setTotalPages(Math.ceil((body.meta.total || 0) / limit) || 1)
        setTotalCount(body.meta.total || 0)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not load audit logs.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, selectedAction, startDate, endDate, toast])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleActionChange = (e) => {
    setSelectedAction(e.target.value)
    setPage(1)
  }

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value)
    setPage(1)
  }

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedAction('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="System Audit Logs"
        description="Complete audit trail of user logins, visitor check-ins, data updates, and administrative actions."
        actions={
          (search || selectedAction || startDate || endDate) && (
            <button className="btn-ghost text-xs" onClick={clearFilters}>
              Clear filters
            </button>
          )
        }
      />

      <div className="panel p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search action, description, user, module…"
            className="max-w-sm flex-1"
          />

          <select className="input-field w-auto" value={selectedAction} onChange={handleActionChange}>
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>From:</span>
            <input
              type="date"
              className="input-field w-auto !py-1.5 text-xs"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>To:</span>
            <input
              type="date"
              className="input-field w-auto !py-1.5 text-xs"
              value={endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>

        {error ? (
          <div className="panel my-4 border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            <p>{error}</p>
            <button className="btn-ghost mt-2 text-xs" onClick={fetchLogs}>
              Retry loading logs
            </button>
          </div>
        ) : (
          <>
            <Table
              loading={loading}
              rows={logs}
              rowKey="logId"
              emptyTitle="No audit log entries"
              emptyDescription="No activity records match your filter criteria."
              columns={[
                {
                  key: 'createdAt',
                  header: 'Date & Time',
                  render: (row) => <span className="whitespace-nowrap font-mono text-xs">{formatDateTime(row.createdAt)}</span>,
                },
                {
                  key: 'user',
                  header: 'User',
                  render: (row) => (
                    <div>
                      <div className="font-medium text-slate-200">{row.userFullName}</div>
                      <div className="text-xs text-slate-400">@{row.username}</div>
                    </div>
                  ),
                },
                {
                  key: 'userRole',
                  header: 'Role',
                  render: (row) => <Badge status={row.userRole}>{row.userRole}</Badge>,
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (row) => <Badge status={row.action}>{row.action}</Badge>,
                },
                {
                  key: 'entityType',
                  header: 'Module',
                  render: (row) => <span className="text-xs font-semibold text-slate-300">{row.entityType}</span>,
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row) => <span className="text-xs text-slate-300">{row.description || '—'}</span>,
                },
                {
                  key: 'ipAddress',
                  header: 'IP Address',
                  render: (row) => <span className="font-mono text-xs text-slate-400">{row.ipAddress}</span>,
                },
              ]}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div>Total entries: {totalCount}</div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
