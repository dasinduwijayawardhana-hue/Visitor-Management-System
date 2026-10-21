import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import companyLogo from '../../Assests/img/Company_logo.png'
import loginVideo from '../../Assests/Video/Login_video.mp4'
import './AuthLayoutAnimations.css'

export default function AuthLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const isVisitorRegister = location.pathname === '/visitor/register';

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  return (
    <div className="auth-layout-root auth-page-fade-in">
      {/* ── Full-screen video background ── */}
      <video
        className="auth-bg-video"
        src={loginVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ opacity: 0.86 }}
      />

      {/* Light overlay (20%) for high video visibility */}
      <div className="absolute inset-0 bg-ink/20 z-[1]" aria-hidden="true" />
      
      {/* Cinematic left-to-right gradient overlay behind text */}
      <div className="auth-left-gradient" aria-hidden="true" />

      {/* ── Content grid ── */}
      <div className={`auth-content-grid z-[2] ${isVisitorRegister ? '!grid-cols-1' : ''}`}>

        {/* LEFT – Brand / hero panel (desktop only) */}
        {!isVisitorRegister && (
          <div className="hidden lg:flex flex-col items-center justify-center p-12 text-center text-paper relative w-full h-full">
            <div className="flex flex-col items-center max-w-lg w-full">
              {/* Logo in Glassmorphism container */}
              <div 
                className="auth-logo-container cursor-pointer"
                onClick={() => setIsModalOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
                aria-label="View Version Info"
              >
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="w-28 h-auto max-w-[130px] object-contain drop-shadow-xl"
                  draggable="false"
                />
              </div>

              {/* Branding Text */}
              <div className="mt-10 flex flex-col items-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-display auth-typewriter-text auth-brand-headline">
                  DSW AUTOMATION
                </h1>
                <h2 className="text-xl md:text-2xl font-body auth-fade-up delay-1 auth-brand-sub">
                  Visitor Management System
                </h2>
                <div className="h-px w-16 bg-brass-light/50 my-2 auth-fade-up delay-2"></div>
                <p className="text-sm font-semibold tracking-widest uppercase text-brass-light auth-fade-up delay-2 drop-shadow-md">
                  Secure • Smart • Reliable
                </p>
              </div>
              
              {/* Hero copy */}
              <div className="mt-12 flex flex-col items-center text-center">
                <h3 className="text-2xl font-semibold mb-4 text-white leading-tight tracking-wide auth-slide-from-left delay-3 drop-shadow-lg">
                  Enterprise-Grade Access Control
                </h3>
                <p className="auth-desc-glass leading-relaxed max-w-md auth-fade-up delay-4">
                  Streamline visitor registration, ensure facility security, and maintain an accurate digital log of everyone on site. Built for modern workplaces.
                </p>
              </div>
              
              {/* Footer tags */}
              <div className="mt-8 flex gap-3 justify-center">
                <span className="auth-brand-tag bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/80 backdrop-blur-md auth-fade-up delay-4">Facilities</span>
                <span className="auth-brand-tag bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/80 backdrop-blur-md auth-fade-up delay-5">Access Control</span>
                <span className="auth-brand-tag bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/80 backdrop-blur-md auth-fade-up delay-6">Visitor Records</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT – Form panel */}
        <div className={`auth-form-panel relative z-10 w-full h-full flex items-center justify-center ${isVisitorRegister ? 'lg:!p-6 sm:!p-4 !p-2' : ''}`}>
          <div className={`w-full auth-slide-from-right delay-form ${isVisitorRegister ? 'max-w-4xl' : 'max-w-md'}`}>
            
            {/* Mobile branding */}
            {!isVisitorRegister && (
              <div className="lg:hidden flex flex-col items-center mb-8 auth-fade-up">
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="w-24 h-auto object-contain mb-4 drop-shadow-lg"
                  draggable="false"
                />
                <h1 className="text-2xl font-bold tracking-wider font-display text-white mb-1">
                  DSW AUTOMATION
                </h1>
                <p className="text-brass-light text-sm tracking-wide">
                  Visitor Management System
                </p>
              </div>
            )}

            {/* Form Card */}
            {isVisitorRegister ? (
              <Outlet />
            ) : (
              <div className="auth-form-card mx-auto">
                <Outlet />
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-ink/80 backdrop-blur-md auth-modal-overlay" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative z-10 bg-slate-850/90 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col items-center text-center max-w-sm w-full mx-4 auth-modal-content">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6 shadow-inner">
              <img src={companyLogo} alt="DSW Automation" className="w-24 h-auto drop-shadow-xl" draggable="false" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-wide">DSW AUTOMATION</h2>
            <p className="text-brass-light font-medium mb-6 tracking-wider text-sm">VISITOR MANAGEMENT SYSTEM</p>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
            
            <p className="text-white/70 text-sm mb-2">Version 2.1.0 (Enterprise)</p>
            <p className="text-white/50 text-xs">&copy; {new Date().getFullYear()} DSW Automation Inc.</p>
            <p className="text-white/50 text-xs mt-1">All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  )
}
