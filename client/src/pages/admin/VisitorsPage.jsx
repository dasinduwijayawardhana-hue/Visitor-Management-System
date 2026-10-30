import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import FormField from '../../components/common/FormField.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import {
  createVisitor,
  deleteVisitor,
  getVisitors,
  setVisitorBlacklist,
  updateVisitor,
} from '../../api/visitors.api.js'

const ID_PROOF_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVER_LICENSE', label: "Driver's License" },
  { value: 'EMPLOYEE_ID', label: 'Employee ID' },
  { value: 'OTHER', label: 'Other' },
]

export default function VisitorsPage() {
  const toast = useToast()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Blacklist: now needs a reason modal instead of a simple confirm
  const [blacklistTarget, setBlacklistTarget] = useState(null)  // visitor row
  const [blacklisting, setBlacklisting] = useState(false)
  const [blacklistReason, setBlacklistReason] = useState('')
  const [blacklistReasonError, setBlacklistReasonError] = useState('')

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const { data: body } = await getVisitors({ limit: 500 })
      setVisitors(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load visitors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisitors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = visitors.filter((v) =>
    [`${v.firstName} ${v.lastName}`, v.email, v.phone, v.companyName]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )
  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const handleSave = async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await updateVisitor(editing.visitorId, values)
        toast.success('Visitor updated.')
      } else {
        await createVisitor(values)
        toast.success('Visitor added.')
      }
      setModalOpen(false)
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save this visitor.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteVisitor(deleteTarget.visitorId)
      toast.success('Visitor deleted.')
      setDeleteTarget(null)
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this visitor. They may have visit history — consider blacklisting instead.')
    } finally {
      setDeleting(false)
    }
  }

  // Open the blacklist/unblacklist flow
  const openBlacklistModal = (row) => {
    setBlacklistTarget(row)
    setBlacklistReason('')
    setBlacklistReasonError('')
  }

  const handleToggleBlacklist = async () => {
    const nextValue = !blacklistTarget.isBlacklisted

    // Validate reason when blacklisting
    if (nextValue && !blacklistReason.trim()) {
      setBlacklistReasonError('A reason is required.')
      return
    }

    setBlacklisting(true)
    try {
      await setVisitorBlacklist(blacklistTarget.visitorId, {
        isBlacklisted: nextValue,
        reason: nextValue ? blacklistReason.trim() : undefined,
      })
      toast.success(nextValue ? 'Visitor blacklisted.' : 'Visitor removed from blacklist.')
      setBlacklistTarget(null)
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update blacklist status.')
    } finally {
      setBlacklisting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Visitors"
        description="All visitors on record, including blacklist status."
        actions={
          <button
            className="btn-brass"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            + Add visitor
          </button>
        }
      />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, phone, or company…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="visitorId"
          emptyTitle="No visitors found"
          columns={[
            { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
            { key: 'phone', header: 'Phone' },
            { key: 'companyName', header: 'Company', render: (row) => row.companyName || '—' },
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
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => {
                      setEditing(row)
                      setModalOpen(true)
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openBlacklistModal(row)}>
                    {row.isBlacklisted ? 'Unblacklist' : 'Blacklist'}
                  </button>
                  <button className="btn-danger !px-3 !py-1.5 text-xs" onClick={() => setDeleteTarget(row)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} className="mt-4" />
      </div>

      <VisitorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        initialValues={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete visitor"
        message={`Delete ${deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : 'this visitor'}'s record? This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Blacklist Modal (with reason field) ──────────────────────────── */}
      <Modal
        open={!!blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        title={blacklistTarget?.isBlacklisted ? 'Remove from blacklist' : 'Blacklist visitor'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setBlacklistTarget(null)} disabled={blacklisting}>
              Cancel
            </button>
            <button
              className={blacklistTarget?.isBlacklisted ? 'btn-primary' : 'btn-danger'}
              onClick={handleToggleBlacklist}
              disabled={blacklisting}
            >
              {blacklisting
                ? 'Updating…'
                : blacklistTarget?.isBlacklisted
                ? 'Remove from Blacklist'
                : 'Confirm Blacklist'}
            </button>
          </>
        }
      >
        {blacklistTarget?.isBlacklisted ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Allow <strong>{blacklistTarget?.firstName} {blacklistTarget?.lastName}</strong> to be
            registered for visits again? This will remove their blacklist restriction.
          </p>
        ) : (
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 10%, var(--bg-elevated))', color: 'var(--danger)' }}
            >
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <p className="font-semibold">
                  You are about to blacklist{' '}
                  <span className="font-bold">{blacklistTarget?.firstName} {blacklistTarget?.lastName}</span>.
                </p>
                <p className="mt-0.5 text-xs opacity-80">
                  This person will be blocked from all future registrations based on their NIC / ID proof
                  and phone number, even if they try to create a new visitor record.
                </p>
              </div>
            </div>

            <FormField
              label="Blacklist reason"
              required
              error={blacklistReasonError}
              hint="This reason will be shown to security officers if this person attempts to register."
            >
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="e.g. Trespassing on 2024-11-15, Security threat, Court order…"
                value={blacklistReason}
                onChange={(e) => {
                  setBlacklistReason(e.target.value)
                  if (e.target.value.trim()) setBlacklistReasonError('')
                }}
              />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  )
}

function VisitorFormModal({ open, onClose, onSubmit, saving, initialValues }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      idProofType: '',
      idProofNumber: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        initialValues
          ? {
              firstName: initialValues.firstName,
              lastName: initialValues.lastName,
              email: initialValues.email || '',
              phone: initialValues.phone,
              companyName: initialValues.companyName || '',
              idProofType: initialValues.idProofType,
              idProofNumber: initialValues.idProofNumber,
            }
          : { firstName: '', lastName: '', email: '', phone: '', companyName: '', idProofType: '', idProofNumber: '' },
      )
    }
  }, [open, initialValues, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Edit visitor' : 'Add visitor'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? 'Saving…' : 'Save visitor'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First name" required error={errors.firstName?.message}>
            <input className="input-field" {...register('firstName', { required: 'First name is required' })} />
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            <input className="input-field" {...register('lastName', { required: 'Last name is required' })} />
          </FormField>
        </div>
        <FormField label="Email" error={errors.email?.message}>
          <input type="email" className="input-field" {...register('email')} />
        </FormField>
        <FormField label="Phone" required error={errors.phone?.message}>
          <input className="input-field" {...register('phone', { required: 'Phone is required' })} />
        </FormField>
        <FormField label="Company">
          <input className="input-field" {...register('companyName')} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="ID proof type" required error={errors.idProofType?.message}>
            <select className="input-field" {...register('idProofType', { required: 'Select an ID proof type' })}>
              <option value="">Select type…</option>
              {ID_PROOF_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="ID / proof number" required error={errors.idProofNumber?.message} hint="Used to verify identity at the gate.">
            <input className="input-field" {...register('idProofNumber', { required: 'ID proof number is required' })} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
