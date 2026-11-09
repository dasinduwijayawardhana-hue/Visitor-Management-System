import React, { useState, useEffect, useCallback, useRef } from 'react'
import companyLogo from '../../Assests/img/Company_logo.png'

/* ─────────────────────────────────────────────────────────────
   DSW Automation – Premium Logo Branding Component
   Only used on the Login page. Auth / routing / business logic
   are completely untouched.
───────────────────────────────────────────────────────────── */

const COMPANY_NAME = 'DSW Automation'
const TAGLINES = [
  'Industrial Automation',
  'Robotics & AI',
  'Smart Manufacturing',
  'Industry 4.0',
]

export default function DswLogoBranding() {
  const [modalOpen, setModalOpen] = useState(false)
  const [taglineIdx, setTaglineIdx] = useState(0)
  const [taglineFading, setTaglineFading] = useState(false)
  const closeButtonRef = useRef(null)
  const logoButtonRef = useRef(null)

  /* ── Rotating taglines ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFading(true)
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % TAGLINES.length)
        setTaglineFading(false)
      }, 400)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  /* ── ESC key closes modal ── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && modalOpen) setModalOpen(false)
    },
    [modalOpen]
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /* ── Focus management: move focus into modal when it opens ── */
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 80)
    } else {
      logoButtonRef.current?.focus()
    }
  }, [modalOpen])

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  return (
    <>
      {/* ── Branding block ── */}
      <div className="dsw-branding-root" aria-label="DSW Automation company branding">

        {/* Decorative top accent line */}
        <div className="dsw-accent-line" aria-hidden="true" />

        {/* Logo – interactive button */}
        <button
          ref={logoButtonRef}
          className="dsw-logo-btn"
          onClick={openModal}
          aria-label="Click to enlarge DSW Automation logo"
          title="Click to view full logo"
          type="button"
        >
          <span className="dsw-logo-glow-ring" aria-hidden="true" />
          <img
            src={companyLogo}
            alt="DSW Automation – Industrial Automation & Robotics"
            className="dsw-logo-img"
            draggable="false"
          />
        </button>

        {/* Company name – letter-by-letter reveal */}
        <h1 className="dsw-company-name" aria-label="DSW Automation">
          {COMPANY_NAME.split('').map((char, i) => (
            <span
              key={i}
              className="dsw-letter"
              style={{ animationDelay: `${0.3 + i * 0.055}s` }}
              aria-hidden="true"
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>

        {/* Rotating tagline */}
        <p
          className={`dsw-tagline${taglineFading ? ' dsw-tagline--fading' : ''}`}
          aria-live="polite"
          aria-label={`Specialisation: ${TAGLINES[taglineIdx]}`}
        >
          {TAGLINES[taglineIdx]}
        </p>

        {/* Specialisation pills */}
        <div className="dsw-pills" aria-label="Company specialisations">
          <span className="dsw-pill">Robotics</span>
          <span className="dsw-pill">PLC / SCADA</span>
          <span className="dsw-pill">AI Technology</span>
        </div>

        {/* Divider */}
        <div className="dsw-divider" aria-hidden="true" />
      </div>

      {/* ── Logo Lightbox Modal ── */}
      {modalOpen && (
        <div
          className="dsw-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="DSW Automation logo preview"
          onClick={closeModal}
        >
          <div
            className="dsw-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              className="dsw-modal-close"
              onClick={closeModal}
              aria-label="Close logo preview"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Full-size logo */}
            <div className="dsw-modal-logo-wrap">
              <img
                src={companyLogo}
                alt="DSW Automation – Full Resolution Logo"
                className="dsw-modal-logo-img"
                draggable="false"
              />
            </div>

            {/* Modal branding text */}
            <p className="dsw-modal-name">DSW Automation</p>
            <p className="dsw-modal-desc">
              Industrial Automation&nbsp;·&nbsp;Robotics&nbsp;·&nbsp;Robotic Arm Design
              <br />
              Smart Manufacturing&nbsp;·&nbsp;PLC &amp; SCADA&nbsp;·&nbsp;AI Technology&nbsp;·&nbsp;Industry 4.0
            </p>

            {/* Engineering Innovation label */}
            <div className="dsw-modal-badge" aria-label="Engineering Innovation">
              ⚙&nbsp; Engineering Innovation
            </div>
          </div>
        </div>
      )}
    </>
  )
}
