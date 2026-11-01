import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import FormField from '../../components/common/FormField.jsx'
import StatusPill from '../../components/common/StatusPill.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import {
  createEmployee,
  deleteEmployee,
  getEmployeeImageUrl,
  getEmployees,
  updateEmployee,
} from '../../api/employees.api.js'
import { getDepartments } from '../../api/departments.api.js'

// ---------------------------------------------------------------------------
// Default avatar SVG rendered inline so there's no broken-image flicker
// ---------------------------------------------------------------------------
function DefaultAvatar({ size = 40, className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-ink/10 dark:bg-paper/10 text-ink/40 dark:text-paper/40 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size * 0.55, height: size * 0.55 }}>
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </span>
  )
}

function EmployeeAvatar({ profileImage, size = 40 }) {
  const [broken, setBroken] = useState(false)
  const url = getEmployeeImageUrl(profileImage)

  useEffect(() => {
    setBroken(false)
  }, [profileImage])

  if (!url || broken) return <DefaultAvatar size={size} />
  return (
    <img
      src={url}
      alt="avatar"
      onError={() => setBroken(true)}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EmployeesPage() {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.allSettled([getEmployees(), getDepartments()])
      if (empRes.status === 'fulfilled') {
        const list = empRes.value.data?.data
        setEmployees(Array.isArray(list) ? list : [])
      }
      if (deptRes.status === 'fulfilled') {
        const list = deptRes.value.data?.data
        setDepartments(Array.isArray(list) ? list : [])
      }
    } catch (err) {
      toast.error('Could not load employees.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = employees.filter((e) =>
    [`${e.firstName} ${e.lastName}`, e.email, e.designation, e.department?.departmentName]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )
  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const handleSave = async (values, profileImageFile) => {
    setSaving(true)
    try {
      const payload = { ...values, departmentId: Number(values.departmentId) }
      if (profileImageFile) payload.profileImage = profileImageFile

      if (editing) {
        await updateEmployee(editing.employeeId, payload)
        toast.success('Employee updated.')
      } else {
        await createEmployee(payload)
        toast.success('Employee added.')
      }
      setModalOpen(false)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save this employee.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteEmployee(deleteTarget.employeeId)
      toast.success('Employee deleted.')
      setDeleteTarget(null)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this employee.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (row) => {
    try {
      await updateEmployee(row.employeeId, { isActive: !row.isActive })
      toast.success(row.isActive ? 'Employee deactivated.' : 'Employee activated.')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update employee status.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage staff records used for visitor host assignment."
        actions={
          <button
            className="btn-brass"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            + Add employee
          </button>
        }
      />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, designation, or department…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="employeeId"
          emptyTitle="No employees found"
          columns={[
            {
              key: 'avatar',
              header: '',
              render: (row) => <EmployeeAvatar profileImage={row.profileImage} size={36} />,
            },
            { key: 'employeeCode', header: 'Code' },
            { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
            { key: 'email', header: 'Email' },
            { key: 'designation', header: 'Designation' },
            { key: 'department', header: 'Department', render: (row) => row.department?.departmentName || '—' },
            { key: 'status', header: 'Status', render: (row) => <StatusPill active={row.isActive} /> },
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
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => toggleActive(row)}>
                    {row.isActive ? 'Deactivate' : 'Activate'}
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

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        initialValues={editing}
        departments={departments}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete employee"
        message={`Delete ${deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : 'this employee'}? This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile image uploader sub-component
// ---------------------------------------------------------------------------
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function ProfileImageUploader({ currentImageUrl, onChange }) {
  const [preview, setPreview] = useState(currentImageUrl || null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Reset when the modal opens for a different employee
  useEffect(() => {
    setPreview(currentImageUrl || null)
    setError('')
  }, [currentImageUrl])

  const processFile = useCallback(
    (file) => {
      if (!file) return
      setError('')

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPG, JPEG, and PNG files are allowed.')
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError('Image must be 5 MB or smaller.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)

      onChange(file) // bubble up to parent
    },
    [onChange],
  )

  const handleFileInput = (e) => processFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setPreview(null)
    setError('')
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Drop zone + circular preview */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload profile picture"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative group cursor-pointer rounded-full transition-all duration-200 ring-2 ${
          dragOver
            ? 'ring-brass-400 scale-105'
            : 'ring-border-subtle hover:ring-brass-400'
        }`}
        style={{ width: 120, height: 120 }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Profile preview"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar size={120} />
        )}

        {/* Camera overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-xs font-medium">
            {preview ? 'Change' : 'Upload'}
          </span>
        </div>

        {/* Remove button */}
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-signal-red text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-ghost !px-4 !py-1.5 text-xs"
        >
          {preview ? 'Change image' : 'Choose image'}
        </button>
        <p className="text-xs text-ink/40 dark:text-paper/40 mt-1">JPG, JPEG, PNG · Max 5 MB</p>
      </div>

      {error && (
        <p className="text-xs text-signal-red text-center">{error}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form modal
// ---------------------------------------------------------------------------
function EmployeeFormModal({ open, onClose, onSubmit, saving, initialValues, departments }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { employeeCode: '', firstName: '', lastName: '', email: '', designation: '', departmentId: '', password: '', confirmPassword: '' },
  })

  const [profileImageFile, setProfileImageFile] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Existing image URL (only for edit mode)
  const existingImageUrl = initialValues?.profileImage
    ? getEmployeeImageUrl(initialValues.profileImage)
    : null

  useEffect(() => {
    if (open) {
      setProfileImageFile(null)
      setShowPassword(false)
      reset(
        initialValues
          ? {
              employeeCode: initialValues.employeeCode,
              firstName: initialValues.firstName,
              lastName: initialValues.lastName,
              email: initialValues.email,
              designation: initialValues.designation || '',
              departmentId: initialValues.departmentId || initialValues.department?.departmentId || '',
            }
          : { employeeCode: '', firstName: '', lastName: '', email: '', designation: '', departmentId: '', password: '', confirmPassword: '' },
      )
    }
  }, [open, initialValues, reset])

  const handleFormSubmit = (values) => {
    onSubmit(values, profileImageFile)
  }

  const passwordValue = watch('password', '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Edit employee' : 'Add employee'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit(handleFormSubmit)} disabled={saving}>
            {saving ? 'Saving…' : 'Save employee'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Profile picture uploader */}
        <div className="flex justify-center pb-2">
          <ProfileImageUploader
            currentImageUrl={existingImageUrl}
            onChange={setProfileImageFile}
          />
        </div>

        <FormField label="Employee code" required error={errors.employeeCode?.message}>
          <input
            className="input-field"
            placeholder="EMP-0002"
            {...register('employeeCode', { required: 'Employee code is required' })}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First name" required error={errors.firstName?.message}>
            <input className="input-field" {...register('firstName', { required: 'First name is required' })} />
          </FormField>
          <FormField label="Last name" required error={errors.lastName?.message}>
            <input className="input-field" {...register('lastName', { required: 'Last name is required' })} />
          </FormField>
        </div>
        <FormField label="Email" required error={errors.email?.message}>
          <input
            type="email"
            className="input-field"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </FormField>
        
        {!initialValues && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Password" required error={errors.password?.message}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' }
                  })}
                />
                <button
                  type="button"
                  tabIndex="-1"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm Password" required error={errors.confirmPassword?.message}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-field"
                {...register('confirmPassword', {
                  required: 'Confirm password is required',
                  validate: (val) => val === passwordValue || 'Passwords do not match'
                })}
              />
            </FormField>
          </div>
        )}

        <FormField label="Designation">
          <input className="input-field" {...register('designation')} />
        </FormField>
        <FormField label="Department" required error={errors.departmentId?.message}>
          <select className="input-field" {...register('departmentId', { required: 'Select a department' })}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Modal>
  )
}
