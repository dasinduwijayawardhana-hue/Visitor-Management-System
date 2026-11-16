import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { verifyGatePass, checkInVisitor, checkOutVisitor } from '../../api/securityGatePass.api'
import { getVisitorImageUrl } from '../../api/visitorPortal.api'
import PageHeader from '../../components/common/PageHeader'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'
import useToast from '../../hooks/useToast'
import companyLogo from '../../Assests/img/Company_logo.png'

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */
function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function initials(first = '', last = '') {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

/* ── Inline icons ── */
const IconUser = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const IconBuilding = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const IconBriefcase = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconClock = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconShield = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IconQr = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
)

/* ── Status config (matching visitor page) ── */
function getStatusConfig(visitStatus) {
  if (visitStatus === 'Approved') return {
    label: 'APPROVED · READY FOR CHECK-IN',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-500 animate-pulse',
    barClass: 'bg-emerald-500',
  }
  if (visitStatus === 'Checked_In') return {
    label: 'CHECKED IN',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
    dotClass: 'bg-blue-500',
    barClass: 'bg-blue-500',
  }
  if (visitStatus === 'Checked_Out') return {
    label: 'CHECKED OUT',
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-50 border-slate-200',
    dotClass: 'bg-slate-400',
    barClass: 'bg-slate-400',
  }
  if (visitStatus === 'Cancelled') return {
    label: 'CANCELLED',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    dotClass: 'bg-rose-500',
    barClass: 'bg-rose-500',
  }
  return {
    label: visitStatus?.replace('_', ' ') || 'UNKNOWN',
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-50 border-slate-200',
    dotClass: 'bg-slate-400',
    barClass: 'bg-slate-400',
  }
}

/* ─────────────────────────────────────────────────────────────
   Mini Detail Row for security view
   ───────────────────────────────────────────────────────────── */
function SecDetailRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[0.55rem] font-700 text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
        <span className="text-xs font-semibold text-slate-800 leading-snug">{value}</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────────────────────── */
export default function SecurityGatePassVerificationPage() {
  const toast = useToast()
  const [tokenInput, setTokenInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [passData, setPassData] = useState(null)

  const [showScanner, setShowScanner] = useState(false)
  const [scanStatus, setScanStatus] = useState('Align QR code in viewfinder…')

  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [badgeNumber, setBadgeNumber] = useState('')
  const [checkInBusy, setCheckInBusy] = useState(false)

  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [checkoutRemarks, setCheckoutRemarks] = useState('')
  const [checkOutBusy, setCheckOutBusy] = useState(false)

  const handleVerify = async (token = tokenInput) => {
    const t = token.trim()
    if (!t) {
      toast.error('Please enter a gate pass token.')
      return
    }
    setVerifying(true)
    try {
      const { data: body } = await verifyGatePass(t)
      setPassData(body?.data)
      setTokenInput(t)
      toast.success('Gate pass verified successfully.')
    } catch (err) {
      setPassData(null)
      toast.error(err.response?.data?.message || 'Verification failed: invalid or expired pass.')
    } finally {
      setVerifying(false)
    }
  }

  const startScannerSimulation = () => {
    setShowScanner(true)
    setScanStatus('Initializing camera stream…')
    setTimeout(() => setScanStatus('Searching for QR code marker…'), 800)
    setTimeout(() => setScanStatus('QR code detected! Reading payload…'), 1500)
    setTimeout(() => {
      setShowScanner(false)
      toast.info('QR Code simulated. Enter a token manually to verify.')
    }, 2200)
  }

  const handleCheckInSubmit = async () => {
    if (!passData) return
    setCheckInBusy(true)
    try {
      await checkInVisitor(passData.visitId, passData.qrToken, badgeNumber.trim())
      toast.success('Visitor checked in successfully.')
      setShowCheckInModal(false)
      setPassData((current) => current ? {
        ...current,
        status: 'USED',
        visit: { ...current.visit, visitStatus: 'Checked_In' },
      } : current)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.')
    } finally {
      setCheckInBusy(false)
    }
  }

  const handleCheckOutSubmit = async () => {
    if (!passData) return
    setCheckOutBusy(true)
    try {
      await checkOutVisitor(passData.visitId, checkoutRemarks.trim())
      toast.success('Visitor checked out successfully.')
      setShowCheckOutModal(false)
      handleVerify(passData.qrToken)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed.')
    } finally {
      setCheckOutBusy(false)
    }
  }

  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (passData) {
      const payload = JSON.stringify({
        type: 'vms-gate-pass',
        version: 1,
        passNumber: passData.passNumber,
        token: passData.qrToken,
      })
      QRCode.toDataURL(payload, {
        width: 160,
        margin: 2,
        color: { dark: '#10192e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err))
    } else {
      setQrDataUrl('')
    }
  }, [passData])

  /* ── Derived from passData ── */
  const status = passData ? getStatusConfig(passData.visit?.visitStatus) : null
  const visitorName = passData
    ? `${passData.visit?.visitor?.firstName ?? ''} ${passData.visit?.visitor?.lastName ?? ''}`.trim()
    : ''
  const hostName = passData
    ? `${passData.visit?.hostEmployee?.firstName ?? ''} ${passData.visit?.hostEmployee?.lastName ?? ''}`.trim()
    : ''

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Gate Pass QR Verification"
        description="Verify visitor digital gate passes and process security check-in / check-out."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Token Input Panel ── */}
        <div className="panel p-5 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
              <IconQr />
            </div>
            <h3 className="font-display text-sm font-bold">Verify Gate Pass</h3>
          </div>

          <div className="space-y-3">
            <FormField label="Gate Pass Token">
              <input
                type="text"
                className="input-field font-mono text-xs"
                placeholder="e.g. GP-20260811-2939"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </FormField>
            <div className="flex gap-2">
              <button
                className="btn-brass flex-1 text-xs"
                onClick={() => handleVerify()}
                disabled={verifying}
              >
                {verifying ? 'Verifying…' : 'Verify Token'}
              </button>
              <button
                className="btn-ghost text-xs font-bold flex items-center gap-1.5"
                onClick={startScannerSimulation}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan
              </button>
            </div>
          </div>

          {/* How-to note */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 p-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide">How to verify</p>
            <p>1. Ask the visitor to show their gate pass QR code.</p>
            <p>2. Paste the pass token printed below the QR, or scan with the camera.</p>
            <p>3. Click <strong>Verify Token</strong> to load the visitor credential.</p>
          </div>
        </div>

        {/* ── Verification Result ── */}
        <div className="lg:col-span-2">
          {passData ? (
            <div className="animate-fadeIn space-y-4">

              {/* Premium Gate Pass Mini-Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">

                {/* Status bar */}
                <div className={`h-1 w-full ${status?.barClass}`} />

                {/* Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg border border-slate-100 bg-white p-1 shadow-sm flex items-center justify-center flex-shrink-0">
                      <img src={companyLogo} alt="DSW" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wider text-slate-900 font-display">DSW AUTOMATION</p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Visitor Gate Pass</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${status?.bgClass} ${status?.textClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status?.dotClass}`} />
                    {status?.label}
                  </div>
                </div>

                {/* Card Body */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

                  {/* Left: Photo + Identity */}
                  <div className="flex flex-col items-center gap-3 p-4 bg-slate-50">
                    {/* Photo */}
                    <div className="relative w-24 h-32 rounded-lg border-2 border-amber-400 bg-slate-100 overflow-hidden shadow-md flex-shrink-0">
                      {passData.visit?.visitor?.photoUrl ? (
                        <img
                          src={getVisitorImageUrl(passData.visit.visitor.photoUrl)}
                          alt={visitorName}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 gap-1">
                          <span className="text-2xl font-bold text-slate-400 font-display">{initials(passData.visit?.visitor?.firstName, passData.visit?.visitor?.lastName)}</span>
                          <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase">No Photo</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-ink/85 text-amber-400 text-[8px] font-bold tracking-widest text-center py-1 font-display">
                        VISITOR
                      </div>
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900 font-display leading-tight">{visitorName || '—'}</p>
                      {passData.visit?.visitor?.companyName && (
                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mt-0.5">
                          {passData.visit.visitor.companyName}
                        </p>
                      )}
                      {passData.visit?.visitor?.phone && (
                        <p className="text-[10px] text-slate-500 mt-1">{passData.visit.visitor.phone}</p>
                      )}
                      {passData.visit?.visitor?.idProofNumber && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {passData.visit.visitor.idProofType?.replace(/_/g, ' ')}: {passData.visit.visitor.idProofNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Visit details */}
                  <div className="p-4 space-y-3">
                    <p className="text-[9px] font-extrabold tracking-[0.15em] text-amber-600 uppercase border-b border-slate-100 pb-2">Visit Information</p>

                    <div className="space-y-2.5">
                      <SecDetailRow icon={<IconUser />} label="Host Employee" value={hostName || null} />
                      <SecDetailRow icon={<IconBuilding />} label="Department" value={passData.visit?.department?.departmentName} />
                      <SecDetailRow icon={<IconBriefcase />} label="Purpose" value={passData.visit?.purpose} />
                      <SecDetailRow icon={<IconCalendar />} label="Visit Date" value={fmtDate(passData.validFrom)} />
                      <SecDetailRow icon={<IconClock />} label="Valid Hours" value={`${fmtTime(passData.validFrom)} – ${fmtTime(passData.validUntil)}`} />
                    </div>

                    {/* Pass Number */}
                    <div className="mt-auto pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-amber-400 rounded-r-lg px-3 py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gate Pass No.</p>
                        <p className="font-mono text-sm font-bold text-slate-900 tracking-wide">{passData.passNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Row */}
                <div className="bg-ink flex items-center justify-between flex-wrap gap-4 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg shadow-md">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 font-semibold">QR</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">QR Token</p>
                      <p className="font-mono text-[10px] text-slate-200 font-semibold break-all max-w-[200px]">{passData.passNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold tracking-wide">
                    <IconShield />
                    VERIFIED CREDENTIAL
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {passData.visit?.visitStatus === 'Approved' && (
                  <button
                    className="btn-brass flex-1 text-sm font-bold py-2.5"
                    onClick={() => {
                      setBadgeNumber(`V-${Date.now().toString().slice(-4)}`)
                      setShowCheckInModal(true)
                    }}
                  >
                    ✓ Proceed with Check-In
                  </button>
                )}
                {passData.visit?.visitStatus === 'Checked_In' && (
                  <button
                    className="btn-danger flex-1 text-sm font-bold py-2.5"
                    onClick={() => {
                      setCheckoutRemarks('')
                      setShowCheckOutModal(true)
                    }}
                  >
                    Check-Out Visitor
                  </button>
                )}
                {!['Approved', 'Checked_In'].includes(passData.visit?.visitStatus) && (
                  <div className="panel p-3 text-center w-full text-xs text-slate-400">
                    No further actions can be performed. Status: <strong>{passData.visit?.visitStatus?.replace('_', ' ')}</strong>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="panel p-10 text-center flex flex-col items-center justify-center min-h-[320px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brass/10 border border-brass/20 flex items-center justify-center">
                <IconQr />
              </div>
              <div>
                <h4 className="font-display text-base font-bold tracking-wide">Awaiting Verification</h4>
                <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Enter a gate pass token in the panel on the left, then click <strong>Verify Token</strong> to retrieve visitor details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Simulated Scanner Modal ── */}
      <Modal open={showScanner} onClose={() => setShowScanner(false)} title="Simulated QR Scanner">
        <div className="space-y-4 text-center">
          <div className="relative h-56 bg-slate-950 rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
            <div className="absolute inset-x-0 h-0.5 bg-brass shadow-[0_0_10px_#ccb88a]" style={{ animation: 'scan 2s linear infinite' }} />
            <div className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-brass" />
            <div className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-brass" />
            <div className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2 border-brass" />
            <div className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2 border-brass" />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center animate-pulse">
              <IconQr />
            </div>
            <p className="text-xs text-slate-400 mt-4 px-6">{scanStatus}</p>
          </div>
        </div>
      </Modal>

      {/* ── Check In Modal ── */}
      <Modal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        title="Confirm Visitor Check-In"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setShowCheckInModal(false)} disabled={checkInBusy}>Cancel</button>
            <button className="btn-brass" onClick={handleCheckInSubmit} disabled={checkInBusy}>
              {checkInBusy ? 'Checking in…' : 'Check In'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-sm">
            Confirm check-in for <strong>{passData?.visit?.visitor?.firstName} {passData?.visit?.visitor?.lastName}</strong>.
          </p>
          <FormField label="Physical Badge Number" required>
            <input
              type="text"
              className="input-field"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="e.g. V-102"
            />
          </FormField>
        </div>
      </Modal>

      {/* ── Check Out Modal ── */}
      <Modal
        open={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        title="Confirm Visitor Check-Out"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setShowCheckOutModal(false)} disabled={checkOutBusy}>Cancel</button>
            <button className="btn-danger" onClick={handleCheckOutSubmit} disabled={checkOutBusy}>
              {checkOutBusy ? 'Checking out…' : 'Check Out'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <p className="text-sm">
            Confirm check-out for <strong>{passData?.visit?.visitor?.firstName} {passData?.visit?.visitor?.lastName}</strong>.
          </p>
          <FormField label="Remarks (optional)">
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="e.g. Returned badge, completed meeting…"
              value={checkoutRemarks}
              onChange={(e) => setCheckoutRemarks(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  )
}
