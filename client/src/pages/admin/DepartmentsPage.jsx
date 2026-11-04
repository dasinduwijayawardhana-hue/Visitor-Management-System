import React, { useEffect, useState } from 'react'
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
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../../api/departments.api.js'

export default function DepartmentsPage() {
  const toast = useToast()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const { data: body } = await getDepartments()
      setDepartments(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load departments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = departments.filter((d) =>
    (d.departmentName || '').toLowerCase().includes(debouncedSearch.toLowerCase()),
  )
  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const handleSave = async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await updateDepartment(editing.departmentId, values)
        toast.success('Department updated.')
      } else {
        await createDepartment(values)
        toast.success('Department created.')
      }
      setModalOpen(false)
      fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save this department.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDepartment(deleteTarget.departmentId)
      toast.success('Department deleted.')
      setDeleteTarget(null)
      fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this department.')
    } finally {
      setDeleting(false)
    }
  }

  // Same fix as EmployeesPage: the backend refuses to delete a department
  // that still has employees/visits and tells the caller to deactivate it
  // instead, but nothing in the UI could actually do that until now.
  const toggleActive = async (row) => {
    try {
      await updateDepartment(row.departmentId, { isActive: !row.isActive })
      toast.success(row.isActive ? 'Department deactivated.' : 'Department activated.')
      fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update department status.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organizational units that employees and visits reference."
        actions={
          <button
            className="btn-brass"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            + Add department
          </button>
        }
      />

      <div className="panel p-4 sm:p-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search departments…" className="mb-4 max-w-sm" />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="departmentId"
          emptyTitle="No departments found"
          columns={[
            { key: 'departmentName', header: 'Name' },
            { key: 'location', header: 'Location', render: (row) => row.location || '—' },
            { key: 'description', header: 'Description', render: (row) => row.description || '—' },
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit department' : 'Add department'}
        footer={<DepartmentFormFooter onClose={() => setModalOpen(false)} saving={saving} formId="department-form" />}
      >
        <DepartmentForm onSubmit={handleSave} initialValues={editing} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete department"
        message={`Delete "${deleteTarget?.departmentName}"? Employees assigned to it may need reassignment.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// Kept as a plain child (not a portal-based footer) — the form and its
// submit button are declared separately below and connected by formId.
function DepartmentFormFooter({ onClose, saving, formId }) {
  return (
    <>
      <button className="btn-ghost" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button type="submit" form={formId} className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save department'}
      </button>
    </>
  )
}

function DepartmentForm({ onSubmit, initialValues }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { departmentName: '', location: '', description: '' } })

  useEffect(() => {
    reset(
      initialValues
        ? {
            departmentName: initialValues.departmentName,
            location: initialValues.location || '',
            description: initialValues.description || '',
          }
        : { departmentName: '', location: '', description: '' },
    )
  }, [initialValues, reset])

  return (
    <form id="department-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Department name" required error={errors.departmentName?.message}>
        <input className="input-field" {...register('departmentName', { required: 'Name is required' })} />
      </FormField>
      <FormField label="Location">
        <input className="input-field" {...register('location')} />
      </FormField>
      <FormField label="Description">
        <textarea rows={3} className="input-field resize-none" {...register('description')} />
      </FormField>
    </form>
  )
}
