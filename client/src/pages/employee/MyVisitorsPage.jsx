import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getMyVisitors } from '../../api/employees.api.js'
import { formatDateTime } from '../../utils/formatters.js'

export default function MyVisitorsPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

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

  const filtered = visits.filter((v) =>
    [v.visitor ? `${v.visitor.firstName} ${v.visitor.lastName}` : null, v.purpose, v.visitStatus]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )
  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  return (
    <div>
      <PageHeader title="My Visitors" description="Everyone who has visited, or is scheduled to visit, you." />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by visitor, purpose, or status…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="visitId"
          emptyTitle="No visitors found"
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
              key: 'companyName',
              header: 'Company',
              render: (row) => <span className="text-slate-300 text-sm">{row.visitor?.companyName || '—'}</span>,
            },
            {
              key: 'purpose',
              header: 'Purpose',
              render: (row) => <span className="text-slate-200 text-sm">{row.purpose || '—'}</span>,
            },
            {
              key: 'checkInTime',
              header: 'Check-in',
              render: (row) => <span className="font-mono text-xs text-slate-300">{formatDateTime(row.checkInTime)}</span>,
            },
            {
              key: 'checkOutTime',
              header: 'Check-out',
              render: (row) => <span className="font-mono text-xs text-slate-300">{formatDateTime(row.checkOutTime)}</span>,
            },
            { key: 'visitStatus', header: 'Status', render: (row) => <Badge status={row.visitStatus} /> },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} className="mt-4" />
      </div>
    </div>
  )
}
