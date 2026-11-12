import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { registerVisitor } from '../../api/visitorPortal.api'
import FormField from '../../components/common/FormField'
import PasswordInput from '../../components/common/PasswordInput'
import useToast from '../../hooks/useToast'
import { ID_PROOF_TYPES } from '../../utils/constants'
import companyLogo from '../../Assests/img/Company_logo.png'

export default function VisitorRegisterPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      companyName: '',
      idProofType: '',
      idProofNumber: '',
      address: '',
    },
  })

  const password = watch('password')

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG or WebP images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.')
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...data }) => {
    setBusy(true)
    try {
      const payload = { ...data }
      if (photoFile) {
        payload.photo = photoFile
      }
      await registerVisitor(payload)
      toast.success('Registration successful! Your visitor account has been created successfully. Please sign in.')
      navigate('/visitor/login', { replace: true })
    } catch (err) {
      const serverMessage = err.response?.data?.message
      const serverErrors = err.response?.data?.errors
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        serverErrors.forEach((e) => {
          if (e.field) {
            setError(e.field, { message: e.message })
          }
        })
        toast.error('Please correct the highlighted fields and try again.')
      } else if (serverMessage) {
        if (serverMessage.toLowerCase().includes('username')) {
          setError('username', { message: serverMessage })
        } else if (serverMessage.toLowerCase().includes('email')) {
          setError('email', { message: serverMessage })
        } else if (serverMessage.toLowerCase().includes('phone')) {
          setError('phone', { message: serverMessage })
        } else if (serverMessage.toLowerCase().includes('id proof')) {
          setError('idProofNumber', { message: serverMessage })
        }
        toast.error(serverMessage)
      } else {
        toast.error('Could not complete visitor registration right now. Please try again later.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="w-full bg-[#10192E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-slideIn flex flex-col"
      style={{ width: 'min(90vw, 850px)', maxHeight: '90vh' }}
    >
      {/* ── Stable Header Section ── */}
      <div className="text-center mb-4 shrink-0">
        <img
          src={companyLogo}
          alt="DSW Logo"
          className="mx-auto h-10 w-auto object-contain mb-2"
          draggable="false"
        />
        <h2 className="font-display text-xl font-bold text-white tracking-wide">
          Visitor Pre-Registration
        </h2>
        <p className="text-xs text-slate-300 mt-0.5">
          Create an account to submit and manage your visit requests online.
        </p>
      </div>

      {/* ── Stable Profile Photo Section ── */}
      <div className="flex items-center justify-center gap-4 pb-4 mb-4 border-b border-white/10 shrink-0">
        <div className="relative h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl" role="img" aria-label="avatar">📷</span>
          )}
        </div>
        <div className="text-left">
          <label className="btn-ghost !py-1.5 !px-3 text-xs cursor-pointer border border-white/20 text-white hover:bg-white/10 inline-block rounded-md transition-colors">
            Choose Profile Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
          <p className="text-[10px] text-slate-400 mt-1">
            Recommended: Square image, max 5MB (JPG, PNG, WebP)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0" noValidate>
        {/* ── Scrollable Fields Container ── */}
        <div className="flex-1 overflow-y-auto pr-1.5 space-y-6 visitor-register-scroll min-h-0 text-left">
          
          {/* Group 1: Account Setup */}
          <div>
            <h3 className="text-[10px] font-bold text-brass tracking-wider uppercase mb-3 pb-1 border-b border-white/5">
              Account Security
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <FormField label="Username" required error={errors.username?.message}>
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. johndoe"
                  {...register('username', {
                    required: 'Please choose a username.',
                    minLength: { value: 3, message: 'Username must be at least 3 characters long.' },
                    maxLength: { value: 50, message: 'Username must not exceed 50 characters.' },
                    pattern: { value: /^[a-zA-Z0-9]+$/, message: 'Username can only contain letters and numbers.' },
                  })}
                />
              </FormField>

              <FormField label="Email Address" required error={errors.email?.message}>
                <input
                  type="email"
                  className="input-field-custom"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Please enter your email address.',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email address, for example: name@example.com.' },
                  })}
                />
              </FormField>

              <FormField label="Password" required error={errors.password?.message}>
                <PasswordInput
                  placeholder="At least 8 characters"
                  className="!input-field-custom"
                  {...register('password', {
                    required: 'Please create a password.',
                    minLength: { value: 8, message: 'Password must contain at least 8 characters.' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
                    },
                  })}
                />
              </FormField>

              <FormField label="Confirm Password" required error={errors.confirmPassword?.message}>
                <PasswordInput
                  placeholder="Re-enter password"
                  className="!input-field-custom"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password.',
                    validate: (value) => value === password || 'Passwords do not match. Please enter the same password in both fields.',
                  })}
                />
              </FormField>
            </div>
          </div>

          {/* Group 2: Personal Details */}
          <div>
            <h3 className="text-[10px] font-bold text-brass tracking-wider uppercase mb-3 pb-1 border-b border-white/5">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <FormField label="Full Name" required error={errors.fullName?.message}>
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. John Doe"
                  {...register('fullName', {
                    required: 'Please enter your full name.',
                    minLength: { value: 2, message: 'Please enter your full name using at least 2 characters.' },
                  })}
                />
              </FormField>

              <FormField label="Phone Number" required error={errors.phone?.message}>
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. +94771234567"
                  {...register('phone', {
                    required: 'Please enter your phone number.',
                    minLength: { value: 7, message: 'Please enter a valid phone number.' },
                  })}
                />
              </FormField>

              <FormField label="ID Proof Type" required error={errors.idProofType?.message}>
                <select
                  className="input-field-custom"
                  {...register('idProofType', { required: 'Please select an ID proof type.' })}
                >
                  <option value="">Select ID proof type…</option>
                  {ID_PROOF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="ID Proof Number" required error={errors.idProofNumber?.message}>
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. NIC, Driving License or Passport No."
                  {...register('idProofNumber', { required: 'Please enter your ID proof number.' })}
                />
              </FormField>
            </div>
          </div>

          {/* Group 3: Affiliation Details */}
          <div>
            <h3 className="text-[10px] font-bold text-brass tracking-wider uppercase mb-3 pb-1 border-b border-white/5">
              Affiliation & Contact Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <FormField label="Company Name">
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. Acme Corporation (optional)"
                  {...register('companyName')}
                />
              </FormField>

              <FormField label="Home Address">
                <input
                  type="text"
                  className="input-field-custom"
                  placeholder="e.g. Colombo, Sri Lanka (optional)"
                  {...register('address')}
                />
              </FormField>
            </div>
          </div>

        </div>

        {/* ── Stable Submit Action Area ── */}
        <div className="mt-6 pt-4 border-t border-white/10 shrink-0">
          <button
            type="submit"
            className="btn-brass w-full py-3 text-sm font-bold tracking-wide transition-all"
            disabled={busy}
          >
            {busy ? 'Registering account…' : 'Register Account'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-300">
            Already have a visitor account?{' '}
            <Link to="/visitor/login" className="font-semibold text-brass hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
