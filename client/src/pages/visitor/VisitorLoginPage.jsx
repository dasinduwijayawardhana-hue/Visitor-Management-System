import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useToast from '../../hooks/useToast.js'
import FormField from '../../components/common/FormField.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import companyLogo from '../../Assests/img/Company_logo.png'

export default function VisitorLoginPage() {
  const { login, authBusy } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: { username: '', password: '' } })

  const onSubmit = async (values) => {
    try {
      await login(values)
      toast.success('Signed in successfully.')
      navigate('/visitor/dashboard', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid username/email or password.'
      setError('password', { message })
      toast.error(message)
    }
  }

  return (
    <div className="w-full max-w-md bg-ink/75 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-slideIn">
      <div className="text-center mb-6">
        <img src={companyLogo} alt="DSW Logo" className="mx-auto h-16 w-auto object-contain mb-4" draggable="false" />
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">Visitor Sign In</h2>
        <p className="text-xs text-slate-300 mt-1">Sign in to check request status and download your gate pass.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Username or Email" required error={errors.username?.message}>
          <input
            type="text"
            className="input-field"
            placeholder="Visitor username or email"
            {...register('username', { required: 'Username or email is required' })}
          />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <PasswordInput
            placeholder="••••••••"
            {...register('password', { required: 'Password is required' })}
          />
        </FormField>

        <button type="submit" disabled={authBusy} className="btn-brass w-full mt-2">
          {authBusy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 items-center text-xs text-slate-300">
        <p>
          New visitor?{' '}
          <Link to="/visitor/register" className="font-semibold text-brass hover:underline">
            Register Visitor Account
          </Link>
        </p>
        <p className="opacity-60">
          Staff member?{' '}
          <Link to="/login" className="font-semibold text-white hover:underline">
            Go to Staff Login
          </Link>
        </p>
      </div>
    </div>
  )
}
