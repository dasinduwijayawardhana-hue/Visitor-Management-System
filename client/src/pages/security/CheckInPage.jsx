import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getVisits, checkInVisit } from '../../api/visits.api.js'
import { formatDateTime } from '../../utils/formatters.js'
import { VISIT_STATUS } from '../../utils/constants.js'

export default function CheckInPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [processingId, setProcessingId] = useState(null)

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const { data: body } = await getVisits({ status: VISIT_STATUS.PRE_REGISTERED })
      setVisits(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load scheduled visits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visitorName = (v) => (v?.visitor ? `${v.visitor.firstName} ${v.visitor.lastName}` : '—')
  const hostName = (v) => (v?.hostEmployee ? `${v.hostEmployee.firstName} ${v.hostEmployee.lastName}` : '—')

  const filtered = visits.filter((v) =>
    [
      v.visitor ? `${v.visitor.firstName} ${v.visitor.lastName}` : null,
      v.hostEmployee ? `${v.hostEmployee.firstName} ${v.hostEmployee.lastName}` : null,
      v.purpose,
    ]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )

  const handleCheckIn = async (visit) => {
    setProcessingId(visit.visitId)
    try {
      await checkInVisit(visit.visitId)
      toast.success(`${visitorName(visit)} checked in.`)
      fetchVisits()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not check in this visitor.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Check-In" description="Pre-registered visits waiting for arrival at the gate." />

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
          rowKey="visitId"
          emptyTitle="No visitors waiting"
          emptyDescription="Newly registered visitors will appear here until they're checked in."
          columns={[
            { key: 'visitor', header: 'Visitor', render: (row) => visitorName(row) },
            { key: 'host', header: 'Host', render: (row) => hostName(row) },
            { key: 'purpose', header: 'Purpose' },
            { key: 'createdAt', header: 'Registered', render: (row) => formatDateTime(row.createdAt) },
            {
              key: 'visitStatus',
              header: 'Status',
              render: (row) => <Badge status={row.visitStatus || VISIT_STATUS.PRE_REGISTERED} />,
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <button
                  className="btn-brass !px-3 !py-1.5 text-xs"
                  disabled={processingId === row.visitId}
                  onClick={() => handleCheckIn(row)}
                >
                  {processingId === row.visitId ? 'Checking in…' : 'Check in'}
                </button>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
