import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import { getVisitors } from '../../api/visitors.api.js'

const STATUS_FILTERS = ['All', 'Active', 'Blacklisted']

export default function VisitorSearchPage() {
  const toast = useToast()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: body } = await getVisitors()
        setVisitors(Array.isArray(body?.data) ? body.data : [])
      } catch (err) {
        toast.error('Could not load visitors.')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = visitors
    .filter((v) => {
      if (statusFilter === 'Active') return !v.isBlacklisted
      if (statusFilter === 'Blacklisted') return v.isBlacklisted
      return true
    })
    .filter((v) =>
      [`${v.firstName} ${v.lastName}`, v.email, v.phone, v.companyName, v.idProofNumber]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
    )

  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  return (
    <div>
      <PageHeader title="Visitor Search" description="Look up any visitor by name, phone, company, or ID." />

      <div className="panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search visitors…" className="max-w-sm flex-1" />
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={
                  'rounded-lg px-3 py-2 text-xs font-semibold transition ' +
                  (statusFilter === s
                    ? 'bg-ink text-paper dark:bg-brass dark:text-ink'
                    : 'text-ink/55 hover:bg-ink/5 dark:text-paper/55 dark:hover:bg-paper/10 border border-ink/10 dark:border-paper/15')
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="visitorId"
          emptyTitle="No visitors match your search"
          columns={[
            { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
            { key: 'phone', header: 'Phone' },
            { key: 'companyName', header: 'Company', render: (row) => row.companyName || '—' },
            { key: 'idProofNumber', header: 'ID number' },
            {
              key: 'isBlacklisted',
              header: 'Status',
              render: (row) =>
                row.isBlacklisted ? (
                  <span className="badge-pill-red">Blacklisted</span>
                ) : (
                  <span className="badge-pill-green">Active</span>
                ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} className="mt-4" />
      </div>
    </div>
  )
}
