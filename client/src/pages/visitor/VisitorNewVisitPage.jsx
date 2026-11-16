import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { getHostEmployees, createVisitorVisit } from '../../api/visitorPortal.api'
import FormField from '../../components/common/FormField'
import useToast from '../../hooks/useToast'

export default function VisitorNewVisitPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      hostEmployeeId: '',
      purpose: '',
      visitDate: '',
      arrivalTime: '',
      departureTime: '',
      notes: '',
    },
  })

  // Watch the selected employee ID to auto-populate department in UI
  const selectedHostId = watch('hostEmployeeId')
  const selectedHost = employees.find((e) => String(e.employeeId) === String(selectedHostId))

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data: body } = await getHostEmployees()
        setEmployees(Array.isArray(body?.data) ? body.data : [])
      } catch (err) {
        toast.error('Could not load staff members.')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [toast])

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        hostEmployeeId: parseInt(values.hostEmployeeId, 10),
        purpose: values.purpose.trim(),
        visitDate: values.visitDate,
        notes: values.notes?.trim() || undefined,
      }

      if (values.arrivalTime) {
        // Construct ISO string for arrival time using visitDate and arrivalTime string
        payload.arrivalTime = new Date(`${values.visitDate}T${values.arrivalTime}`).toISOString()
      }
      if (values.departureTime) {
        payload.departureTime = new Date(`${values.visitDate}T${values.departureTime}`).toISOString()
      }

      await createVisitorVisit(payload)
      toast.success('Visit request submitted successfully. Waiting for employee approval.')
      navigate('/visitor/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit visit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader title="New Visit Request" description="Fill out the form below to request access to the facility." />

      <div className="panel p-5 sm:p-6 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {loading ? (
            <p className="text-center py-6 text-slate-300">Loading hosts list…</p>
          ) : (
            <FormField label="Staff Host to Visit" required error={errors.hostEmployeeId?.message}>
              <select
                className="input-field"
                {...register('hostEmployeeId', { required: 'Select a staff member' })}
              >
                <option value="">Select a host employee…</option>
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.firstName} {e.lastName} ({e.designation || 'Staff'})
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Auto-populated Department Field */}
          {selectedHost && (
            <div className="p-3.5 rounded-xl border border-brass/20 bg-brass/5 space-y-1 animate-fadeIn">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Assigned Department</p>
              <p className="text-sm text-white font-medium">
                {selectedHost.department?.departmentName || 'General Administration'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <FormField label="Visit Date" required error={errors.visitDate?.message}>
                <input
                  type="date"
                  min={todayStr}
                  className="input-field"
                  {...register('visitDate', { required: 'Date is required' })}
                />
              </FormField>
            </div>
            
            <div className="sm:col-span-1">
              <FormField label="Arrival Time" error={errors.arrivalTime?.message}>
                <input
                  type="time"
                  className="input-field"
                  {...register('arrivalTime')}
                />
              </FormField>
            </div>

            <div className="sm:col-span-1">
              <FormField label="Departure Time" error={errors.departureTime?.message}>
                <input
                  type="time"
                  className="input-field"
                  {...register('departureTime')}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Purpose of Visit" required error={errors.purpose?.message}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Project presentation, equipment delivery"
              {...register('purpose', { required: 'Purpose is required' })}
            />
          </FormField>

          <FormField label="Additional Notes / Remarks">
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Any other details (optional)"
              {...register('notes')}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Link to="/visitor/dashboard" className="btn-ghost flex-1">
              Cancel
            </Link>
            <button type="submit" className="btn-brass flex-1" disabled={submitting || loading}>
              {submitting ? 'Submitting request…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-xl font-semibold leading-tight text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-300">{description}</p>
    </div>
  )
}
