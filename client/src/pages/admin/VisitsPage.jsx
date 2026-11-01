import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getVisits, updateVisitStatus } from '../../api/visits.api.js'
import { formatDateTime } from '../../utils/formatters.js'
import { VISIT_STATUS, VISIT_STATUS_LABEL } from '../../utils/constants.js'

const allowedStatusTransitions = {
  [VISIT_STATUS.PRE_REGISTERED]: [VISIT_STATUS.CANCELLED, VISIT_STATUS.DENIED],
  [VISIT_STATUS.PENDING]: [VISIT_STATUS.CANCELLED, VISIT_STATUS.DENIED],
}

export default function VisitsPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const { data: body } = await getVisits()
      setVisits(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load visits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visitorName = (v) => (v?.visitor ? v.visitor.name : '—')
  const hostName = (v) => (v?.hostEmployee ? v.hostEmployee.name : '—')

  const filtered = visits.filter((v) =>
    [
      v.visitor ? v.visitor.name : null,
      v.hostEmployee ? v.hostEmployee.name : null,
      v.purpose,
      v.status,
    ]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )
  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const handleStatusChange = async (visit, visitStatus) => {
    setUpdatingId(visit.id)
    try {
      await updateVisitStatus(visit.id, { status: visitStatus })
      toast.success(`Visit marked as ${VISIT_STATUS_LABEL[visitStatus] || visitStatus}.`)
      fetchVisits()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update visit status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Visits" description="Every scheduled, active, and completed visit." />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by visitor, host, purpose, or status…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="id"
          emptyTitle="No visits found"
          columns={[
            { key: 'visitor', header: 'Visitor', render: (row) => visitorName(row) },
            { key: 'host', header: 'Host', render: (row) => hostName(row) },
            { key: 'purpose', header: 'Purpose' },
            { key: 'checkInTime', header: 'Check-in', render: (row) => formatDateTime(row.checkInTime) },
            { key: 'checkOutTime', header: 'Check-out', render: (row) => formatDateTime(row.checkOutTime) },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
            {
              key: 'actions',
              header: '',
              render: (row) => {
                const transitions = allowedStatusTransitions[row.status] || []
                return (
                <select
                  className="input-field !py-1.5 text-xs w-auto"
                  value={row.status}
                  disabled={updatingId === row.id || transitions.length === 0}
                  onChange={(e) => handleStatusChange(row, e.target.value)}
                >
                  <option value={row.status}>{VISIT_STATUS_LABEL[row.status] || row.status}</option>
                  {transitions.map((s) => (
                    <option key={s} value={s}>
                      {VISIT_STATUS_LABEL[s] || s}
                    </option>
                  ))}
                </select>
                )
              },
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} className="mt-4" />
      </div>
    </div>
  )
}
