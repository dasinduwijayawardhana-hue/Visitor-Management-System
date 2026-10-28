import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/common/PageHeader.jsx'
import SearchInput from '../../components/common/SearchInput.jsx'
import Table from '../../components/common/Table.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import FormField from '../../components/common/FormField.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import Badge from '../../components/common/Badge.jsx'
import useToast from '../../hooks/useToast.js'
import usePagination from '../../hooks/usePagination.js'
import useDebounce from '../../hooks/useDebounce.js'
import { createUser, deleteUser, getUsers, updateUser } from '../../api/users.api.js'

const SEEDED_ROLES = [
  { roleId: 1, roleName: 'Admin' },
  { roleId: 2, roleName: 'Security Officer' },
  { roleId: 3, roleName: 'Employee' },
]

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data: body } = await getUsers({ limit: 200 })
      setUsers(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      toast.error('Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    setRolesLoading(true)
    setRolesError(null)
    // No GET /roles endpoint yet - IDs follow the seed order in prisma/seed.js.
    setRoles(SEEDED_ROLES)
    setRolesLoading(false)
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = users.filter((u) =>
    [u.fullName, u.username, u.email, u.role]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(debouncedSearch.toLowerCase())),
  )

  const { page, totalPages, pageItems, goTo } = usePagination(filtered)

  const openCreate = () => {
    setEditingUser(null)
    setModalOpen(true)
  }
  const openEdit = (user) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const handleSave = async (values) => {
    setSaving(true)
    try {
      if (editingUser) {
        // PUT /api/users/:id accepts a partial update - no username/password here.
        const updatePayload = { ...values }
        delete updatePayload.username
        delete updatePayload.password
        await updateUser(editingUser.userId, updatePayload)
        toast.success('User updated.')
      } else {
        await createUser(values)
        toast.success('User created.')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save this user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.userId)
      toast.success('User deleted.')
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this user.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage system accounts and their roles."
        actions={
          <button className="btn-brass" onClick={openCreate}>
            + Add user
          </button>
        }
      />

      <div className="panel p-4 sm:p-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, username, email, or role…"
          className="mb-4 max-w-sm"
        />

        <Table
          loading={loading}
          rows={pageItems}
          rowKey="userId"
          emptyTitle="No users found"
          emptyDescription="Try a different search, or add a new user account."
          columns={[
            { key: 'fullName', header: 'Name' },
            { key: 'username', header: 'Username' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (row) => <Badge status={row.role}>{row.role}</Badge> },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openEdit(row)}>
                    Edit
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

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        initialValues={editingUser}
        roles={roles}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        message={`Delete ${deleteTarget?.fullName || 'this user'}? This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function UserFormModal({ open, onClose, onSubmit, saving, initialValues, roles, rolesLoading, rolesError }) {
  const defaultRoleId = roles.length > 0 ? roles[0].roleId : ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { username: '', fullName: '', email: '', password: '', roleId: defaultRoleId },
  })

  useEffect(() => {
    if (open) {
      const selectedRoleId = initialValues
        ? roles.find((r) => r.roleName === initialValues.role)?.roleId || defaultRoleId
        : defaultRoleId

      reset(
        initialValues
          ? {
              username: initialValues.username,
              fullName: initialValues.fullName,
              email: initialValues.email,
              roleId: selectedRoleId,
              password: '',
            }
          : { username: '', fullName: '', email: '', password: '', roleId: defaultRoleId },
      )
    }
  }, [open, initialValues, roles, defaultRoleId, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Edit user' : 'Add user'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={saving || rolesLoading || !!rolesError}
          >
            {saving ? 'Saving…' : 'Save user'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {!initialValues && (
          <FormField label="Username" required error={errors.username?.message}>
            <input
              className="input-field"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'At least 3 characters' },
                pattern: { value: /^[a-zA-Z0-9]+$/, message: 'Letters and numbers only' },
              })}
            />
          </FormField>
        )}
        <FormField label="Full name" required error={errors.fullName?.message}>
          <input className="input-field" {...register('fullName', { required: 'Full name is required' })} />
        </FormField>
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
          <FormField
            label="Password"
            hint="At least 8 characters."
            required
            error={errors.password?.message}
          >
            <PasswordInput
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
          </FormField>
        )}
        <FormField label="Role" required error={errors.roleId?.message || rolesError}>
          {rolesLoading ? (
            <div className="input-field text-slate-400 italic">Loading roles…</div>
          ) : rolesError ? (
            <div className="text-sm text-red-500">{rolesError}</div>
          ) : roles.length === 0 ? (
            <div className="text-sm text-slate-400 italic">No roles available</div>
          ) : (
            <select className="input-field" {...register('roleId', { required: true, valueAsNumber: true })}>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleName}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </form>
    </Modal>
  )
}
