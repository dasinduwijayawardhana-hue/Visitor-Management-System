import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getVisitorProfile, getVisitorVisits, cancelVisitorVisit, getVisitorImageUrl } from '../../api/visitorPortal.api'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/Card'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import useToast from '../../hooks/useToast'
import { VISIT_STATUS } from '../../utils/constants'

export default function VisitorDashboardPage() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, visitsRes] = await Promise.all([
        getVisitorProfile(),
        getVisitorVisits({ page: 1, limit: 10 }),
      ])
      setProfile(profileRes.data?.data)
      setVisits(Array.isArray(visitsRes.data?.data) ? visitsRes.data.data : [])
    } catch (err) {
      toast.error('Could not load visitor dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleCancelVisit = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelVisitorVisit(cancelTarget.visitId)
      toast.success('Visit request cancelled successfully.')
      setCancelTarget(null)
      loadDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel visit request.')
    } finally {
      setCancelling(false)
    }
  }

  // Count stats
  const pendingCount = visits.filter((v) => v.visitStatus === 'Pending').length
  const approvedCount = visits.filter((v) => v.visitStatus === 'Approved').length
  const checkedInCount = visits.filter((v) => v.visitStatus === VISIT_STATUS.CHECKED_IN).length
  const completedCount = visits.filter((v) => v.visitStatus === VISIT_STATUS.CHECKED_OUT).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Portal"
        description="Submit visit requests, check approval status, and retrieve your gate passes."
        actions={
          <Link to="/visitor/visits/new" className="btn-brass">
            + New Visit Request
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="panel p-6 flex flex-col items-center text-center lg:col-span-1">
          <div className="h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {profile?.photoUrl ? (
              <img src={getVisitorImageUrl(profile.photoUrl)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl" role="img" aria-label="avatar">👤</span>
            )}
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-white tracking-wide">
            {profile?.firstName} {profile?.lastName}
          </h2>
          <p className="text-xs text-slate-300">NIC/ID: {profile?.idProofNumber}</p>
          <div className="mt-4 w-full h-px bg-white/10" />
          <div className="mt-4 space-y-2 text-left w-full text-xs text-slate-200">
            <p>
              <strong className="text-brass/90 font-semibold">Email:</strong> {profile?.user?.email}
            </p>
            <p>
              <strong className="text-brass/90 font-semibold">Phone:</strong> {profile?.phone}
            </p>
            <p>
              <strong className="text-brass/90 font-semibold">Company:</strong> {profile?.companyName || 'N/A'}
            </p>
            <p>
              <strong className="text-brass/90 font-semibold">Address:</strong> {profile?.address || 'N/A'}
            </p>
          </div>
          <Link to="/visitor/profile" className="btn-ghost text-xs mt-5 w-full">
            Edit Profile
          </Link>
        </div>

        {/* Stats and Recent Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Pending" value={pendingCount} accent="brass" />
            <StatCard label="Approved" value={approvedCount} accent="info" />
            <StatCard label="Active" value={checkedInCount} accent="green" />
            <StatCard label="Completed" value={completedCount} accent="brass" />
          </div>

          <div className="panel p-5">
            <h3 className="font-display text-base font-bold text-white tracking-wide mb-4">
              My Recent Visit Requests
            </h3>
            <Table
              loading={loading}
              rows={visits}
              rowKey="visitId"
              emptyTitle="No visit requests submitted yet"
              columns={[
                {
                  key: 'host',
                  header: 'Host Employee',
                  render: (row) => (
                    <span className="font-bold text-white font-display text-sm">
                      {row.hostEmployee ? `${row.hostEmployee.firstName} ${row.hostEmployee.lastName}` : '—'}
                    </span>
                  ),
                },
                {
                  key: 'visitDate',
                  header: 'Scheduled Date',
                  render: (row) => (
                    <span className="font-mono text-xs text-slate-200">
                      {row.visitDate ? new Date(row.visitDate).toLocaleDateString() : '—'}
                    </span>
                  ),
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
          </div>
        </div>
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
