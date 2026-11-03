import React, { useState } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import Table from '../../components/common/Table.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import useToast from '../../hooks/useToast.js'
import { downloadReportFile, getCurrentVisitorsReport, getDailyReport, getMonthlyReport } from '../../api/reports.api.js'
import { formatDateTime, toISODate } from '../../utils/formatters.js'

const TABS = [
  { key: 'daily', label: 'Daily report' },
  { key: 'monthly', label: 'Monthly report' },
  { key: 'current', label: 'Current visitors' },
]

export default function ReportsPage() {
  const toast = useToast()
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(toISODate(new Date()))
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [hasRun, setHasRun] = useState(false)

  const runReport = async () => {
    setLoading(true)
    setHasRun(true)
    try {
      let body
      let list = []
      if (tab === 'daily') {
        ;({ data: body } = await getDailyReport(date, 'json'))
        // GET /reports/daily -> { success, message, data: { date, totalVisits, visits } }
        list = body?.data?.visits
      } else if (tab === 'monthly') {
        ;({ data: body } = await getMonthlyReport(year, month, 'json'))
        // GET /reports/monthly -> { success, message, data: { totalVisits, dailyCounts, visits } }
        list = body?.data?.visits
      } else {
        ;({ data: body } = await getCurrentVisitorsReport('json'))
        // GET /reports/current-visitors -> { success, message, data: [...] }
        list = body?.data
      }
      setRows(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate this report.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      if (tab === 'daily') {
        await downloadReportFile('/reports/daily', { date, format }, `daily-report-${date}.${format}`)
      } else if (tab === 'monthly') {
        await downloadReportFile('/reports/monthly', { year, month, format }, `monthly-report-${year}-${month}.${format}`)
      } else {
        await downloadReportFile('/reports/current-visitors', { format }, `current-visitors.${format}`)
      }
      toast.success(`Export started (${format.toUpperCase()}).`)
    } catch (err) {
      toast.error('Could not export this report.')
    }
  }

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export visitor activity reports." />

      <div className="panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 mb-5 border-b border-ink/8 dark:border-paper/10 pb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setHasRun(false); setRows([]) }}
              className={
                'rounded-lg px-3.5 py-2 text-sm font-medium transition ' +
                (tab === t.key
                  ? 'bg-ink text-paper dark:bg-brass dark:text-ink'
                  : 'text-ink/55 hover:bg-ink/5 dark:text-paper/55 dark:hover:bg-paper/10')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-5">
          {tab === 'daily' && (
            <div>
              <label className="label-text">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          {tab === 'monthly' && (
            <>
              <div>
                <label className="label-text">Year</label>
                <input
                  type="number"
                  className="input-field w-28"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label-text">Month</label>
                <select className="input-field w-36" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button className="btn-primary" onClick={runReport} disabled={loading}>
            {loading ? 'Generating…' : 'Generate report'}
          </button>

          <div className="ml-auto flex gap-2">
            <button className="btn-ghost" onClick={() => handleExport('csv')}>
              Export CSV
            </button>
            <button className="btn-ghost" onClick={() => handleExport('pdf')}>
              Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Generating report…" />
          </div>
        ) : hasRun ? (
          <Table
            rows={rows}
            rowKey="visitId"
            emptyTitle="No records for this report"
            emptyDescription="Try a different date or range."
            columns={[
              { key: 'visitor', header: 'Visitor', render: (row) => row.visitorName || '—' },
              { key: 'company', header: 'Company', render: (row) => row.company || '—' },
              { key: 'checkInTime', header: 'Check-in', render: (row) => formatDateTime(row.checkInTime) },
              { key: 'checkOutTime', header: 'Check-out', render: (row) => formatDateTime(row.checkOutTime) },
              { key: 'status', header: 'Status', render: (row) => row.status || '—' },
            ]}
          />
        ) : (
          <p className="text-sm text-ink/45 dark:text-paper/45 py-8 text-center">
            Choose your parameters and generate a report to see results here.
          </p>
        )}
      </div>
    </div>
  )
}
