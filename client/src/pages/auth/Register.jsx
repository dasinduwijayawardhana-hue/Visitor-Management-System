import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useToast from '../../hooks/useToast.js'
import FormField from '../../components/common/FormField.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'

export default function Register() {
  const { register: registerUser, authBusy } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const password = watch('password')

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...payload }) => {
    try {
      await registerUser(payload)
      toast.success('Registration successful! Your account has been created successfully. Please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create your account right now. Please try again later.')
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-white">Create your account</h2>
      <p className="mt-1.5 text-sm text-slate-300">
        Self-signup creates an Employee account. Admins can grant additional access later.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <FormField label="Full name" required error={errors.name?.message}>
          <input
            type="text"
            className="input-field"
            placeholder="Jane Perera"
            {...register('name', { required: 'Full name is required' })}
          />
        </FormField>

        <FormField label="Email" required error={errors.email?.message}>
          <input
            type="email"
            className="input-field"
            placeholder="you@company.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <PasswordInput
            placeholder="At least 8 characters, upper, lower & a number"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Use at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Include an uppercase letter, a lowercase letter, and a number',
              },
            })}
          />
        </FormField>

        <FormField label="Confirm password" required error={errors.confirmPassword?.message}>
          <PasswordInput
            placeholder="Re-enter your password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
        </FormField>

        <button type="submit" disabled={authBusy} className="btn-primary w-full">
          {authBusy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-300">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brass hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
