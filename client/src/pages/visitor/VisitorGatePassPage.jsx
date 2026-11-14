import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { getVisitorVisitById, getVisitorImageUrl } from '../../api/visitorPortal.api'
import companyLogo from '../../Assests/img/Company_logo.png'
import Spinner from '../../components/common/Spinner'
import useToast from '../../hooks/useToast'

/* ─────────────────────────────────────────────────────────────
   Inline SVG Icons — consistent stroke-based professional set
   ───────────────────────────────────────────────────────────── */
const IconDownload = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const IconUser = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const IconBuilding = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const IconBriefcase = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IconCalendar = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconClock = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconPhone = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)
const IconId = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
)
const IconShield = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IconPrint = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
)
const IconArrowLeft = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */
function fmt(dateVal, opts) {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString(undefined, opts)
}
function fmtTime(dateVal) {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d)) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtLongDate(dateVal) {
  return fmt(dateVal, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}
function initials(first = '', last = '') {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

/* ─────────────────────────────────────────────────────────────
   Status config
   ───────────────────────────────────────────────────────────── */
function getStatusConfig(rawStatus) {
  const s = rawStatus?.toUpperCase()
  if (s === 'ACTIVE') return {
    label: 'ACTIVE',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-500 animate-pulse',
    barClass: 'bg-emerald-500',
  }
  if (s === 'USED') return {
    label: 'CHECKED IN',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
    dotClass: 'bg-blue-500',
    barClass: 'bg-blue-500',
  }
  if (s === 'CANCELLED') return {
    label: 'CANCELLED',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    dotClass: 'bg-rose-500',
    barClass: 'bg-rose-500',
  }
  return {
    label: s || 'EXPIRED',
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-50 border-slate-200',
    dotClass: 'bg-slate-400',
    barClass: 'bg-slate-400',
  }
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────── */
function DetailRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="gp-detail-row">
      <div className="gp-detail-icon">{icon}</div>
      <div className="gp-detail-content">
        <span className="gp-detail-label">{label}</span>
        <span className="gp-detail-value">{value}</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */
export default function VisitorGatePassPage() {
  const { id } = useParams()
  const toast = useToast()
  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const { data: body } = await getVisitorVisitById(id)
        setVisit(body?.data)
      } catch {
        toast.error('Could not load gate pass details.')
      } finally {
        setLoading(false)
      }
    }
    fetchVisit()
  }, [id, toast])

  useEffect(() => {
    if (visit?.gatePass) {
      const payload = JSON.stringify({
        type: 'vms-gate-pass',
        version: 1,
        passNumber: visit.gatePass.passNumber,
        token: visit.gatePass.qrToken,
      })
      QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: { dark: '#10192e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err))
    }
  }, [visit])

  const handlePrint = () => window.print()

  const handleDownloadQR = () => {
    if (!qrDataUrl || !visit?.gatePass) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `GatePass_QR_${visit.gatePass.passNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* Loading */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper dark:bg-ink">
        <Spinner label="Generating digital security credential…" />
      </div>
    )
  }

  /* No pass */
  if (!visit || !visit.gatePass) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">No active gate pass found</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Your visit request might still be pending approval, or it has been denied.
          </p>
          <Link to="/visitor/dashboard" className="btn-brass mt-6 inline-flex">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { gatePass } = visit
  const status = getStatusConfig(gatePass.status)
  const visitorName = `${visit.visitor?.firstName ?? ''} ${visit.visitor?.lastName ?? ''}`.trim()
  const hostName = `${visit.hostEmployee?.firstName ?? ''} ${visit.hostEmployee?.lastName ?? ''}`.trim()
  const deptName = visit.department?.departmentName

  return (
    <div className="gp-page-root">

      {/* ── Top Action Bar (hidden on print) ── */}
      <div className="gp-action-bar no-print">
        <Link to="/visitor/dashboard" className="btn-ghost !py-2 !px-4 text-xs font-semibold flex items-center gap-2">
          <IconArrowLeft />
          Back to Dashboard
        </Link>
        <button onClick={handleDownloadQR} disabled={!qrDataUrl} className="btn-ghost !py-2 !px-4 text-xs font-bold flex items-center gap-2">
          <IconDownload />
          Download QR
        </button>
        <button onClick={handlePrint} className="btn-brass !py-2 !px-4 text-xs font-bold flex items-center gap-2">
          <IconPrint />
          Print / Save PDF
        </button>
      </div>

      {/* ════════════════════════════════════════════════════
          GATE PASS CARD
          ════════════════════════════════════════════════════ */}
      <div className="gp-card" id="gate-pass-card">

        {/* ── Status accent bar (top edge colour) ── */}
        <div className={`gp-status-bar ${status.barClass}`} />

        {/* ════ HEADER ════ */}
        <div className="gp-header">
          {/* Left: Logo + company */}
          <div className="gp-header-brand">
            <div className="gp-logo-wrap">
              <img src={companyLogo} alt="DSW Automation" className="gp-logo-img" />
            </div>
            <div className="gp-brand-text">
              <span className="gp-company-name">DSW AUTOMATION</span>
              <span className="gp-company-sub">Visitor Management System</span>
            </div>
          </div>

          {/* Right: Pass type + status */}
          <div className="gp-header-right">
            <span className="gp-pass-type-label">VISITOR GATE PASS</span>
            <div className={`gp-status-pill ${status.bgClass} ${status.textClass}`}>
              <span className={`gp-status-dot ${status.dotClass}`} />
              {status.label}
            </div>
          </div>
        </div>

        {/* ════ DIVIDER ════ */}
        <div className="gp-divider" />

        {/* ════ IDENTITY + VISIT DETAILS ════ */}
        <div className="gp-body">

          {/* Left: Visitor Photo + Identity */}
          <div className="gp-identity-col">

            {/* Photo frame */}
            <div className="gp-photo-frame">
              {visit.visitor?.photoUrl ? (
                <img
                  src={getVisitorImageUrl(visit.visitor.photoUrl)}
                  alt={visitorName}
                  className="gp-photo-img"
                />
              ) : (
                <div className="gp-photo-fallback">
                  <span className="gp-photo-initials">{initials(visit.visitor?.firstName, visit.visitor?.lastName)}</span>
                  <span className="gp-photo-no-photo">NO PHOTO</span>
                </div>
              )}
              <div className="gp-photo-type-badge">VISITOR</div>
            </div>

            {/* Name block */}
            <div className="gp-name-block">
              <h2 className="gp-visitor-name">{visitorName || '—'}</h2>
              {visit.visitor?.companyName && (
                <p className="gp-visitor-company">{visit.visitor.companyName}</p>
              )}
            </div>

            {/* Contact strip */}
            <div className="gp-contact-strip">
              {visit.visitor?.phone && (
                <span className="gp-contact-item">
                  <IconPhone className="w-3 h-3 flex-shrink-0" />
                  {visit.visitor.phone}
                </span>
              )}
              {visit.visitor?.idProofNumber && (
                <span className="gp-contact-item">
                  <IconId className="w-3 h-3 flex-shrink-0" />
                  {visit.visitor?.idProofType?.replace(/_/g, ' ')}: {visit.visitor.idProofNumber}
                </span>
              )}
            </div>
          </div>

          {/* Right: Visit Details */}
          <div className="gp-details-col">
            <div className="gp-section-heading">VISIT INFORMATION</div>

            <div className="gp-details-grid">
              <DetailRow
                icon={<IconUser className="w-4 h-4" />}
                label="HOST EMPLOYEE"
                value={hostName || null}
              />
              <DetailRow
                icon={<IconBuilding className="w-4 h-4" />}
                label="DEPARTMENT"
                value={deptName}
              />
              <DetailRow
                icon={<IconBriefcase className="w-4 h-4" />}
                label="PURPOSE OF VISIT"
                value={visit.purpose}
              />
              <DetailRow
                icon={<IconCalendar className="w-4 h-4" />}
                label="VISIT DATE"
                value={fmtLongDate(gatePass.validFrom)}
              />
              <DetailRow
                icon={<IconClock className="w-4 h-4" />}
                label="VALID HOURS"
                value={`${fmtTime(gatePass.validFrom)} – ${fmtTime(gatePass.validUntil)}`}
              />
            </div>

            {/* Pass Number box */}
            <div className="gp-pass-number-wrap">
              <div className="gp-pass-number-box">
                <span className="gp-pass-number-label">GATE PASS NO.</span>
                <span className="gp-pass-number-value">{gatePass.passNumber}</span>
                <span className="gp-pass-number-sub">
                  VALID UNTIL&nbsp;·&nbsp;{fmt(gatePass.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })}&nbsp;at&nbsp;{fmtTime(gatePass.validUntil)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ════ DIVIDER ════ */}
        <div className="gp-divider" />

        {/* ════ QR VERIFICATION ZONE ════ */}
        <div className="gp-qr-zone">
          <div className="gp-qr-left">
            <p className="gp-qr-heading">SCAN TO VERIFY VISITOR</p>
            <div className="gp-qr-code-wrap">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Gate Pass QR Code — Scan to verify"
                  className="gp-qr-img"
                  width={200}
                  height={200}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-semibold">
                  Generating QR…
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="mt-2 text-xs font-bold text-brass hover:underline inline-flex items-center gap-1 no-print"
            >
              <IconDownload className="w-3.5 h-3.5" /> Download QR Image
            </button>
            <p className="gp-qr-subtext mt-1">Point camera at QR code to verify this credential</p>
          </div>

          <div className="gp-qr-right">
            <div className="gp-qr-verified-badge">
              <IconShield className="w-5 h-5" />
              <span>VERIFIED DIGITAL CREDENTIAL</span>
            </div>

            <div className="gp-qr-info-block">
              <div className="gp-qr-info-row">
                <span className="gp-qr-info-key">PASS ID</span>
                <span className="gp-qr-info-val">{gatePass.passNumber}</span>
              </div>
              <div className="gp-qr-info-row">
                <span className="gp-qr-info-key">ISSUED</span>
                <span className="gp-qr-info-val">{fmt(gatePass.validFrom, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="gp-qr-info-row">
                <span className="gp-qr-info-key">EXPIRES</span>
                <span className="gp-qr-info-val">{fmt(gatePass.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })} · {fmtTime(gatePass.validUntil)}</span>
              </div>
              <div className="gp-qr-info-row">
                <span className="gp-qr-info-key">STATUS</span>
                <span className={`gp-qr-info-val font-bold ${status.textClass}`}>{status.label}</span>
              </div>
            </div>

            <p className="gp-qr-security-note">
              This QR code contains an encrypted verification token. For security officer use only. Do not share.
            </p>
          </div>
        </div>

        {/* ════ FOOTER ════ */}
        <div className="gp-footer">
          {/* Decorative barcode simulation */}
          <div className="gp-barcode" aria-hidden="true">
            {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,1,3,1,2,3,1,1,4,2,1,3,1,2,1].map((w, i) => (
              <div key={i} style={{ width: `${w * 2}px` }} className="gp-bar" />
            ))}
          </div>
          <p className="gp-footer-instruction">
            Please present this digital pass at the facility entrance for verification.
            This pass is valid only on the scheduled date and time.
          </p>
          <p className="gp-footer-copy">Visitor Management System &nbsp;·&nbsp; © 2026 DSW AUTOMATION</p>
        </div>

      </div>{/* end gp-card */}

      {/* ── Print CSS injected inline for full compatibility ── */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .gp-page-root { padding: 0 !important; margin: 0 !important; background: #ffffff !important; }
          .gp-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0.75rem !important;
            max-width: 720px !important;
            margin: 1cm auto !important;
            page-break-inside: avoid !important;
          }
          .gp-action-bar { display: none !important; }
          .gp-qr-img { width: 180px !important; height: 180px !important; }
        }
      `}</style>
    </div>
  )
}
