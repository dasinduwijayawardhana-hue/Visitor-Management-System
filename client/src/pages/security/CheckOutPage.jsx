import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getCurrentlyInside, checkOutVisit } from '../../api/visits.api.js'
import { formatDateTime } from '../../utils/formatters.js'
import { VISIT_STATUS } from '../../utils/constants.js'

export default function CheckOutPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [processingId, setProcessingId] = useState(null)

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const { data: body } = await getCurrentlyInside()
      setVisits(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load visitors currently inside.')
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
    ]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )

  const handleCheckOut = async (visit) => {
    setProcessingId(visit.id)
    try {
      await checkOutVisit(visit.id)
      toast.success(`${visitorName(visit)} checked out.`)
      fetchVisits()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not check out this visitor.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Check-Out" description="Visitors currently on site." />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by visitor, host, or purpose…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={filtered}
          rowKey="id"
          emptyTitle="No one is currently inside"
          emptyDescription="Visitors will appear here once they're checked in at the gate."
          columns={[
            { key: 'visitor', header: 'Visitor', render: (row) => visitorName(row) },
            { key: 'host', header: 'Host', render: (row) => hostName(row) },
            { key: 'checkInTime', header: 'Checked in', render: (row) => formatDateTime(row.checkInTime) },
            {
              key: 'minutesInside',
              header: 'Time inside',
              render: (row) => (typeof row.minutesInside === 'number' ? `${row.minutesInside} min` : '—'),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge status={row.status || VISIT_STATUS.CHECKED_IN} />,
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <button
                  className="btn-danger !px-3 !py-1.5 text-xs"
                  disabled={processingId === row.id}
                  onClick={() => handleCheckOut(row)}
                >
                  {processingId === row.id ? 'Checking out…' : 'Check out'}
                </button>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
