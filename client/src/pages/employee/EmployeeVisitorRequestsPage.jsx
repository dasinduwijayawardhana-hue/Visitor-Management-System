import React, { useEffect, useState, useCallback } from 'react'
import { getPendingRequests, approveRequest, rejectRequest } from '../../api/employeeApproval.api'
import { getVisitorImageUrl } from '../../api/visitorPortal.api'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import FormField from '../../components/common/FormField'
import useToast from '../../hooks/useToast'

export default function EmployeeVisitorRequestsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [approveTarget, setApproveTarget] = useState(null)
  const [approving, setApproving] = useState(false)

  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionReasonError, setRejectionReasonError] = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data: body } = await getPendingRequests()
      setRequests(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load pending visitor requests.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async () => {
    if (!approveTarget) return
    setApproving(true)
    try {
      await approveRequest(approveTarget.visitId)
      toast.success('Visit request approved and digital gate pass issued.')
      setApproveTarget(null)
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve request.')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectionReason.trim()) {
      setRejectionReasonError('Rejection reason is required.')
      return
    }
    setRejecting(true)
    try {
      await rejectRequest(rejectTarget.visitId, rejectionReason.trim())
      toast.success('Visit request rejected.')
      setRejectTarget(null)
      setRejectionReason('')
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reject request.')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Visitor Requests"
        description="Approve or reject pre-registration visit requests submitted by online visitors."
      />

      <div className="panel p-4 sm:p-5">
        <Table
          loading={loading}
          rows={requests}
          rowKey="visitId"
          emptyTitle="No pending requests found"
          emptyDescription="Requests submitted by visitors targeting you will appear here."
          columns={[
            {
              key: 'photo',
              header: 'Photo',
              render: (row) => (
                <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {row.visitor?.photoUrl ? (
                    <img src={getVisitorImageUrl(row.visitor.photoUrl)} alt="Visitor" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold font-mono text-slate-300">
                      {row.visitor?.firstName?.[0]}{row.visitor?.lastName?.[0]}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'visitor',
              header: 'Visitor Details',
              render: (row) => (
                <div>
                  <p className="font-bold text-white font-display text-sm">
                    {row.visitor?.firstName} {row.visitor?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {row.visitor?.companyName || 'Individual'} · {row.visitor?.phone}
                  </p>
                </div>
              ),
            },
            {
              key: 'idProof',
              header: 'ID Proof',
              render: (row) => (
                <span className="font-mono text-xs text-slate-300">
                  {row.visitor?.idProofType?.replace('_', ' ')} [{row.visitor?.idProofNumber}]
                </span>
              ),
            },
            {
              key: 'visitDate',
              header: 'Date & Time',
              render: (row) => (
                <div>
                  <p className="text-sm text-slate-200">
                    {row.visitDate ? new Date(row.visitDate).toLocaleDateString() : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {row.arrivalTime ? new Date(row.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {row.departureTime ? ` to ${new Date(row.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>
              ),
            },
            {
              key: 'purpose',
              header: 'Purpose / Notes',
              render: (row) => (
                <div>
                  <p className="text-slate-200 text-sm max-w-[200px] truncate">{row.purpose}</p>
                  {row.notes && <p className="text-[10px] text-slate-400 italic max-w-[200px] truncate">{row.notes}</p>}
                </div>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex gap-2 justify-end">
                  <button
                    className="btn-brass !px-3 !py-1.5 text-xs"
                    onClick={() => setApproveTarget(row)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-danger !px-3 !py-1.5 text-xs"
                    onClick={() => {
                      setRejectTarget(row)
                      setRejectionReason('')
                      setRejectionReasonError('')
                    }}
                  >
                    Reject
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve Visit Request"
        message={`Approve the visit request for ${approveTarget ? `${approveTarget.visitor?.firstName} ${approveTarget.visitor?.lastName}` : 'this visitor'}? This will issue a digital gate pass.`}
        confirmLabel="Approve Request"
        busy={approving}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Visit Request"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              Cancel
            </button>
            <button className="btn-danger" onClick={handleReject} disabled={rejecting}>
              {rejecting ? 'Rejecting…' : 'Reject Request'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-200">
            Provide a reason for rejecting the visit request from{' '}
            <strong>{rejectTarget?.visitor?.firstName} {rejectTarget?.visitor?.lastName}</strong>.
          </p>
          <FormField label="Rejection Reason" required error={rejectionReasonError}>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="e.g. Schedule conflict, incorrect details, host unavailable…"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value)
                if (e.target.value.trim()) setRejectionReasonError('')
              }}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
