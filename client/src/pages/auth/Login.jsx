import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useToast from '../../hooks/useToast.js'
import FormField from '../../components/common/FormField.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { roleHomePath } from '../../utils/roles.js'

export default function Login() {
  const { login, authBusy } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: { username: '', password: '' } })

  // NOTE: the field is named `username` to match POST /api/auth/login's
  // request contract exactly. The backend accepts either a username or an
  // email address in this field (auth.service.js#login matches against
  // both columns), so we keep the input itself flexible for the user.
  const onSubmit = async (values) => {
    try {
      const user = await login(values)
      toast.success('Signed in successfully.')
      const redirectTo = location.state?.from?.pathname || roleHomePath(user?.role)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid username/email or password.'
      setError('password', { message })
      toast.error(message)
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-white">Sign in</h2>
      <p className="mt-1.5 text-sm text-slate-300">
        Enter your credentials to access your gatehouse dashboard.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <FormField label="Username or email" required error={errors.username?.message}>
          <input
            type="text"
            className="input-field"
            placeholder="jdoe or you@company.com"
            {...register('username', { required: 'Username or email is required' })}
          />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <PasswordInput
            placeholder="••••••••"
            {...register('password', { required: 'Password is required' })}
          />
        </FormField>

        <button type="submit" disabled={authBusy} className="btn-primary w-full">
          {authBusy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 items-center text-sm text-slate-300">
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brass hover:underline">
            Register as an employee
          </Link>
        </p>
        <p className="text-xs">
          Are you a visitor?{' '}
          <Link to="/visitor/login" className="font-semibold text-brass hover:underline">
            Pre-register or sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}

