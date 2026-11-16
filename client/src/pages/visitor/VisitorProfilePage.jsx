import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getVisitorProfile, updateVisitorProfile, getVisitorImageUrl } from '../../api/visitorPortal.api'
import FormField from '../../components/common/FormField'
import useToast from '../../hooks/useToast'
import Spinner from '../../components/common/Spinner'

export default function VisitorProfilePage() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      companyName: '',
      address: '',
    },
  })

  const loadProfile = async () => {
    try {
      const { data: body } = await getVisitorProfile()
      const p = body?.data
      setProfile(p)
      reset({
        fullName: p.user?.fullName || '',
        phone: p.phone || '',
        companyName: p.companyName || '',
        address: p.address || '',
      })
      if (p.photoUrl) {
        setPhotoPreview(getVisitorImageUrl(p.photoUrl))
      }
    } catch (err) {
      toast.error('Could not load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = { ...values }
      if (photoFile) {
        payload.photo = photoFile
      }
      await updateVisitorProfile(payload)
      toast.success('Profile updated successfully.')
      loadProfile()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner label="Loading profile…" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold leading-tight text-white mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo panel */}
        <div className="panel p-6 flex flex-col items-center text-center lg:col-span-1">
          <div className="relative h-28 w-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl" role="img" aria-label="avatar">👤</span>
            )}
          </div>
          
          <label className="btn-ghost text-xs mt-5 cursor-pointer">
            Change Photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </label>
          {photoFile && (
            <p className="text-[10px] text-brass mt-1">Pending save</p>
          )}
        </div>

        {/* Details Form */}
        <div className="panel p-6 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-white mb-4">Edit Profile Information</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md" noValidate>
            <FormField label="Username" hint="Username cannot be changed.">
              <input type="text" className="input-field opacity-60 cursor-not-allowed" value={profile?.user?.username} disabled />
            </FormField>
            <FormField label="Email Address" hint="Email address cannot be changed.">
              <input type="text" className="input-field opacity-60 cursor-not-allowed" value={profile?.user?.email} disabled />
            </FormField>
            
            <FormField label="Full Name" required error={errors.fullName?.message}>
              <input className="input-field" {...register('fullName', { required: 'Name is required' })} />
            </FormField>
            
            <FormField label="Phone" required error={errors.phone?.message}>
              <input className="input-field" {...register('phone', { required: 'Phone is required' })} />
            </FormField>

            <FormField label="Company Name">
              <input className="input-field" {...register('companyName')} />
            </FormField>

            <FormField label="Home Address">
              <input className="input-field" {...register('address')} />
            </FormField>

            <button type="submit" className="btn-brass" disabled={saving}>
              {saving ? 'Saving changes…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
