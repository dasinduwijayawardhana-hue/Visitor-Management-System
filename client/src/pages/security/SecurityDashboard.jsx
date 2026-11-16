import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/common/Card.jsx'
import DailyVisitorsChart from '../../components/charts/DailyVisitorsChart.jsx'
import MonthlyVisitorsChart from '../../components/charts/MonthlyVisitorsChart.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { getDailyReport, getMonthlyReport } from '../../api/reports.api.js'
import { getCurrentlyInside } from '../../api/visits.api.js'
import { getEmployees } from '../../api/employees.api.js'
import { toISODate } from '../../utils/formatters.js'
import useToast from '../../hooks/useToast.js'
import securityVideo from '../../Assests/Video/Security_video.mp4'

export default function SecurityDashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [insideCount, setInsideCount] = useState(0)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [monthlyTotal, setMonthlyTotal] = useState(0)

  useEffect(() => {
    const now = new Date()
    const load = async () => {
      setLoading(true)
      try {
        const [dailyRes, monthlyRes, insideRes, employeesRes] = await Promise.allSettled([
          getDailyReport(toISODate(now)),
          getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
          getCurrentlyInside(),
          getEmployees({ limit: 1 }),
        ])

        // GET /reports/daily -> { success, message, data: { date, totalVisits, visits } }
        if (dailyRes.status === 'fulfilled') {
          const report = dailyRes.value.data?.data
          setDaily(Array.isArray(report?.visits) ? report.visits : [])
          setTodayCount(report?.totalVisits ?? 0)
        }
        // GET /reports/monthly -> { success, message, data: { totalVisits, dailyCounts, visits } }
        if (monthlyRes.status === 'fulfilled') {
          const report = monthlyRes.value.data?.data
          setMonthly(Array.isArray(report?.dailyCounts) ? report.dailyCounts : [])
          setMonthlyTotal(report?.totalVisits ?? 0)
        }
        // GET /visits/currently-inside -> { success, message, data: [...] }
        if (insideRes.status === 'fulfilled') {
          const list = insideRes.value.data?.data
          setInsideCount(Array.isArray(list) ? list.length : 0)
        }
        // GET /employees -> { success, message, data: [...], meta: { total } }
        if (employeesRes.status === 'fulfilled') {
          setEmployeeCount(employeesRes.value.data?.meta?.total ?? 0)
        }
      } catch (err) {
        toast.error('Could not load some dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {/* ── Security Hero Video Banner ── */}
      <div className="security-hero-banner">
        <video
          className="security-hero-video"
          src={securityVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Gradient overlay */}
        <div className="security-hero-overlay" aria-hidden="true" />
        {/* Hero content */}
        <div className="security-hero-content">
          <div>
            <h1 className="security-hero-title">Security Dashboard</h1>
            <p className="security-hero-sub">Today&apos;s gate activity at a glance.</p>
          </div>
          <div className="security-hero-actions">
            <Link to="/security/register-visitor" className="btn-brass">
              + Register visitor
            </Link>
            <Link to="/security/check-in" className="btn-ghost security-hero-ghost-btn">
              Check-in
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading dashboard…" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Today's Visitors" value={todayCount} icon="◔" accent="brass" />
            <StatCard label="Visitors Inside" value={insideCount} icon="◐" accent="green" />
            <StatCard label="Monthly Visitors" value={monthlyTotal} icon="◈" accent="amber" />
            <StatCard label="Total Employees" value={employeeCount} icon="◒" accent="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <div className="panel p-5">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-paper mb-4">
                Today&apos;s visitor traffic
              </h3>
              <DailyVisitorsChart data={daily} />
            </div>
            <div className="panel p-5">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-paper mb-4">
                Visitors this month
              </h3>
              <MonthlyVisitorsChart data={monthly} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
