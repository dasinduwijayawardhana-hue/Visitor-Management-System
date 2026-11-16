import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/common/PageHeader.jsx'
import FormField from '../../components/common/FormField.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import useToast from '../../hooks/useToast.js'
import useDebounce from '../../hooks/useDebounce.js'
import { createVisitor, getVisitors } from '../../api/visitors.api.js'
import { createVisit } from '../../api/visits.api.js'
import { getEmployees } from '../../api/employees.api.js'
import { checkBlacklist } from '../../api/blacklist.api.js'
import { ID_PROOF_TYPES } from '../../utils/constants.js'

// Every list endpoint wraps its payload as { success, message, data: [...], meta }.
const unwrapList = (res) => (Array.isArray(res?.data?.data) ? res.data.data : [])

// ─────────────────────────────────────────────────────────────────────────────
// Blacklist Alert Banner  (shown instead of the submit button when blocked)
// ─────────────────────────────────────────────────────────────────────────────
function BlacklistAlertBanner({ entry }) {
  return (
    <div
      className="rounded-xl border-2 overflow-hidden animate-slideIn"
      style={{ borderColor: 'var(--danger)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
      >
        <span className="text-2xl" role="img" aria-label="alert">🚨</span>
        <div>
          <p className="font-bold text-base tracking-wide uppercase">Blacklist Alert</p>
          <p className="text-xs opacity-90 font-medium">Registration Denied — Security Restriction Active</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3" style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 8%, var(--bg-elevated))' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Visitor Name</p>
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{entry.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</p>
            <span
              className="inline-block px-3 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
            >
              BLACKLISTED
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Reason</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{entry.blacklistReason}</p>
        </div>

        <div
          className="rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}
        >
          <span>⚠️</span>
          <span>This person is restricted from entering the facility. Please contact the Administrator.</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function VisitorRegistrationPage() {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [existingVisitors, setExistingVisitors] = useState([])
  const [mode, setMode] = useState('new') // 'new' | 'existing'
  const [submitting, setSubmitting] = useState(false)

  const [visitorsLoading, setVisitorsLoading] = useState(true)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // ── Blacklist check state ────────────────────────────────────────────────
  const [blacklistEntry, setBlacklistEntry] = useState(null)   // populated when hit
  const [checkingBlacklist, setCheckingBlacklist] = useState(false)
  const abortRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      companyName: '',
      idProofType: '',
      idProofNumber: '',
      hostEmployeeId: '',
      purpose: '',
      visitorId: '',
    },
  })

  const selectedVisitorId = watch('visitorId')
  const selectedVisitor = existingVisitors.find((v) => String(v.visitorId) === String(selectedVisitorId))

  // ── Live blacklist check (debounced) ─────────────────────────────────────
  const rawIdProofNumber = watch('idProofNumber')
  const rawPhone = watch('phone')
  const debouncedIdProof = useDebounce(rawIdProofNumber, 600)
  const debouncedPhone = useDebounce(rawPhone, 600)

  useEffect(() => {
    // Only probe in 'new' mode
    if (mode !== 'new') {
      setBlacklistEntry(null)
      return
    }
    if (!debouncedIdProof && !debouncedPhone) {
      setBlacklistEntry(null)
      return
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const params = {}
    if (debouncedIdProof) params.idProofNumber = debouncedIdProof
    if (debouncedPhone) params.phone = debouncedPhone

    setCheckingBlacklist(true)
    checkBlacklist(params)
      .then((res) => {
        if (controller.signal.aborted) return
        const payload = res?.data?.data
        if (payload?.blacklisted) {
          setBlacklistEntry(payload.entry)
        } else {
          setBlacklistEntry(null)
        }
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return
        // Don't block the form on network errors for probe — just clear
        setBlacklistEntry(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingBlacklist(false)
      })

    return () => controller.abort()
  }, [debouncedIdProof, debouncedPhone, mode])

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = async () => {
    setVisitorsLoading(true)
    setEmployeesLoading(true)
    setFetchError(null)

    try {
      const [empRes, visitorsRes] = await Promise.allSettled([
        getEmployees({ isActive: true, limit: 200 }),
        getVisitors({ limit: 500 }),
      ])

      if (empRes.status === 'fulfilled') {
        setEmployees(unwrapList(empRes.value).filter((e) => e.isActive !== false))
      } else {
        toast.error('Could not load host employees list.')
      }

      if (visitorsRes.status === 'fulfilled') {
        setExistingVisitors(unwrapList(visitorsRes.value))
      } else {
        const errorMsg = visitorsRes.reason?.response?.data?.message || 'Could not load existing visitors list.'
        setFetchError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      setFetchError('Failed to communicate with the server.')
      toast.error('Failed to load form data.')
    } finally {
      setVisitorsLoading(false)
      setEmployeesLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values) => {
    // Frontend guard: if the live check already detected a blacklisted person,
    // prevent submission immediately. The backend will also enforce this.
    if (blacklistEntry) {
      toast.error('Registration blocked: this person is blacklisted.')
      return
    }

    setSubmitting(true)
    try {
      let visitorId = values.visitorId ? Number(values.visitorId) : null

      if (mode === 'new') {
        const { data: body } = await createVisitor({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone: values.phone.trim(),
          email: values.email?.trim() || undefined,
          companyName: values.companyName?.trim() || undefined,
          idProofType: values.idProofType,
          idProofNumber: values.idProofNumber.trim(),
        })
        visitorId = body?.data?.visitorId
      }

      if (!visitorId) {
        toast.error('Select an existing visitor or fill in the new visitor registration form.')
        return
      }

      const hostEmployee = employees.find((e) => e.employeeId === Number(values.hostEmployeeId))
      if (!hostEmployee) {
        toast.error('Select the employee being visited.')
        return
      }

      await createVisit({
        visitorId,
        hostEmployeeId: hostEmployee.employeeId,
        departmentId: hostEmployee.department?.departmentId ?? hostEmployee.departmentId,
        purpose: values.purpose.trim(),
      })

      toast.success('Visitor registered and visit scheduled successfully.')
      reset()
      setBlacklistEntry(null)
      loadData()
    } catch (err) {
      // ── Backend blacklist 403 ─────────────────────────────────────────────
      // If the backend rejects with 403 and details.blacklisted, populate the
      // alert banner so it shows even if the live probe somehow missed it.
      const details = err?.response?.data?.details
      if (err?.response?.status === 403 && details?.blacklisted) {
        setBlacklistEntry({
          fullName: details.fullName || 'Unknown',
          blacklistReason: details.blacklistReason || 'No reason provided.',
        })
        toast.error('Registration blocked: this visitor is blacklisted.')
      } else {
        toast.error(err.response?.data?.message || 'Could not register this visitor.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Register Visitor" description="Log a new visitor or schedule a returning visitor visit." />

      <div className="panel p-5 sm:p-6 max-w-2xl">
        {/* Registration Mode Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            className={mode === 'new' ? 'btn-primary flex-1' : 'btn-ghost flex-1'}
            onClick={() => {
              setMode('new')
              setBlacklistEntry(null)
              reset({ ...watch(), visitorId: '' })
            }}
            type="button"
          >
            New visitor
          </button>
          <button
            className={mode === 'existing' ? 'btn-primary flex-1' : 'btn-ghost flex-1'}
            onClick={() => {
              setMode('existing')
              setBlacklistEntry(null)
            }}
            type="button"
          >
            Returning visitor
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {mode === 'existing' ? (
            <>
              <FormField label="Select existing visitor" required error={errors.visitorId?.message}>
                {visitorsLoading ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border-default bg-bg-surface text-text-muted text-sm">
                    <Spinner size="sm" /> Loading existing visitors list...
                  </div>
                ) : fetchError ? (
                  <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex justify-between items-center">
                    <span>{fetchError}</span>
                    <button type="button" onClick={loadData} className="underline text-xs font-semibold hover:opacity-80">
                      Retry
                    </button>
                  </div>
                ) : (
                  <select className="input-field" {...register('visitorId', { required: 'Select an existing visitor from the list' })}>
                    <option value="">
                      {existingVisitors.length === 0
                        ? 'No existing visitors found in database'
                        : 'Select an existing visitor…'}
                    </option>
                    {existingVisitors
                      .filter((v) => !v.isBlacklisted)
                      .map((v) => (
                        <option key={v.visitorId} value={v.visitorId}>
                          {v.firstName} {v.lastName} — ID: {v.idProofType?.replace('_', ' ')} [{v.idProofNumber}] — Tel: {v.phone}
                          {v.companyName ? ` (${v.companyName})` : ''}
                        </option>
                      ))}
                  </select>
                )}
              </FormField>

              {/* Selected Visitor Preview Card */}
              {selectedVisitor && (
                <div className="p-4 rounded-xl border border-brass/30 bg-brass/5 space-y-2 text-sm text-text-primary">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brass dark:text-brass-light text-base font-display">
                      {selectedVisitor.firstName} {selectedVisitor.lastName}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brass/20 text-brass-dark dark:text-brass-light font-mono">
                      {selectedVisitor.idProofType?.replace('_', ' ')}: {selectedVisitor.idProofNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                    <p>
                      <strong className="text-text-muted">Phone:</strong> {selectedVisitor.phone}
                    </p>
                    <p>
                      <strong className="text-text-muted">Email:</strong> {selectedVisitor.email || 'N/A'}
                    </p>
                    <p>
                      <strong className="text-text-muted">Company:</strong> {selectedVisitor.companyName || 'N/A'}
                    </p>
                    <p>
                      <strong className="text-text-muted">Address:</strong> {selectedVisitor.address || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First name" required error={errors.firstName?.message}>
                  <input className="input-field" placeholder="e.g. John" {...register('firstName', { required: mode === 'new' ? 'First name is required' : false })} />
                </FormField>
                <FormField label="Last name" required error={errors.lastName?.message}>
                  <input className="input-field" placeholder="e.g. Doe" {...register('lastName', { required: mode === 'new' ? 'Last name is required' : false })} />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Phone number" required error={errors.phone?.message}>
                  <input
                    className="input-field"
                    placeholder="+1-555-0199"
                    {...register('phone', { required: mode === 'new' ? 'Phone is required' : false })}
                  />
                </FormField>
                <FormField label="Email address">
                  <input type="email" className="input-field" placeholder="john.doe@company.com" {...register('email')} />
                </FormField>
              </div>
              <FormField label="Company name">
                <input className="input-field" placeholder="e.g. Acme Innovations" {...register('companyName')} />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ID proof type" required error={errors.idProofType?.message}>
                  <select className="input-field" {...register('idProofType', { required: mode === 'new' ? 'Select an ID proof type' : false })}>
                    <option value="">Select type…</option>
                    {ID_PROOF_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="ID / proof number"
                  required
                  error={errors.idProofNumber?.message}
                  hint={checkingBlacklist ? '🔍 Checking blacklist…' : undefined}
                >
                  <input
                    className="input-field"
                    placeholder="e.g. NIC / Passport No."
                    {...register('idProofNumber', { required: mode === 'new' ? 'ID proof number is required' : false })}
                  />
                </FormField>
              </div>

              {/* ── Live Blacklist Alert ────────────────────────────────────── */}
              {blacklistEntry && <BlacklistAlertBanner entry={blacklistEntry} />}
            </>
          )}

          <FormField label="Person to visit" required error={errors.hostEmployeeId?.message}>
            {employeesLoading ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border-default bg-bg-surface text-text-muted text-sm">
                <Spinner size="sm" /> Loading employees...
              </div>
            ) : (
              <select
                className="input-field"
                {...register('hostEmployeeId', { required: 'Select the employee being visited' })}
              >
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.firstName} {e.lastName}
                    {e.department?.departmentName ? ` — ${e.department.departmentName}` : ''}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Purpose of visit" required error={errors.purpose?.message}>
            <input
              className="input-field"
              placeholder="e.g. Executive meeting, equipment delivery, job interview"
              {...register('purpose', { required: 'Purpose of visit is required' })}
            />
          </FormField>

          {/* Hide submit button entirely when blacklist is hit */}
          {!blacklistEntry && (
            <button type="submit" className="btn-brass w-full" disabled={submitting || checkingBlacklist}>
              {submitting ? 'Registering visit…' : checkingBlacklist ? 'Checking security…' : 'Register visitor & schedule visit'}
            </button>
          )}

          {/* When blacklisted in 'existing' mode (visit create blocked) */}
          {mode === 'existing' && blacklistEntry && <BlacklistAlertBanner entry={blacklistEntry} />}
        </form>
      </div>
    </div>
  )
}
