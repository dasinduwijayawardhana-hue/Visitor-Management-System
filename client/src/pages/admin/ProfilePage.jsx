import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/common/PageHeader.jsx'
import FormField from '../../components/common/FormField.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import useAuth from '../../hooks/useAuth.js'
import useToast from '../../hooks/useToast.js'
import { changePassword } from '../../api/users.api.js'
import { initials } from '../../utils/formatters.js'

export default function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const newPassword = watch('newPassword')

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...payload }) => {
    setSaving(true)
    try {
      // PATCH /api/users/:id/change-password expects { currentPassword, newPassword }
      await changePassword(user.id, payload)
      toast.success('Password changed successfully.')
      reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and security settings." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-6 flex flex-col items-center text-center lg:col-span-1">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brass/15 text-brass-dark dark:text-brass font-display font-semibold text-xl">
            {initials(user?.name || user?.username || user?.email || 'U')}
          </span>
          <p className="mt-4 font-display text-base font-semibold text-ink dark:text-paper">{user?.name}</p>
          <p className="text-sm text-ink/50 dark:text-paper/50">@{user?.username}</p>
          <p className="text-sm text-ink/50 dark:text-paper/50">{user?.email}</p>
          <span className="badge-pill-neutral mt-3">{user?.role}</span>
        </div>

        <div className="panel p-6 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-paper mb-4">Change password</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm" noValidate>
            <FormField label="Current password" required error={errors.currentPassword?.message}>
              <PasswordInput
                placeholder="••••••••"
                {...register('currentPassword', { required: 'Enter your current password' })}
              />
            </FormField>
            <FormField label="New password" required error={errors.newPassword?.message}>
              <PasswordInput
                placeholder="At least 8 characters"
                {...register('newPassword', {
                  required: 'Enter a new password',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
              />
            </FormField>
            <FormField label="Confirm new password" required error={errors.confirmPassword?.message}>
              <PasswordInput
                placeholder="Confirm new password"
                {...register('confirmPassword', {
                  required: 'Confirm your new password',
                  validate: (v) => v === newPassword || 'Passwords do not match',
                })}
              />
            </FormField>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
