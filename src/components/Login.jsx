import React, { useState, useContext } from 'react';
import { HRMSContext } from '../context/HRMSContext';

/* ============================================================
   ATCL HRMS Sign-In — EL ERP V5 Style
   Split-screen dark design with social auth + feature panel
   ============================================================ */

const FEATURES = [
  { label: 'Employee Directory', icon: '👥' },
  { label: 'Leave & Absence', icon: '📅' },
  { label: 'Payroll Processing', icon: '💰' },
  { label: 'Attendance Logs', icon: '🕐' },
  { label: 'Income Tax', icon: '📋' },
  { label: 'ESS Portal', icon: '🌐' },
];

const SLIDES = [
  {
    title: 'Your Enterprise',
    highlight: 'HR Platform',
    subtitle: 'Manage employees, payroll, attendance, and compliance — all from one beautifully designed HRMS.',
  },
  {
    title: 'Bangladesh Labor',
    highlight: 'Compliant System',
    subtitle: 'Built to handle BD Labor Act requirements: biometric logs, TDS certificates, and leave policies.',
  },
  {
    title: 'Real-Time',
    highlight: 'HR Insights',
    subtitle: 'Executive dashboard with live attendance rates, payroll trends, and upcoming HR event alerts.',
  },
];

export default function Login() {
  const { login, loginGoogle, resetPassword } = useContext(HRMSContext);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [isResetMode, setIsResetMode]   = useState(false);
  const [shake, setShake]               = useState(false);
  const [slideIdx, setSlideIdx]         = useState(0);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleEmailFocus = (e) => {
    if (e.target.value === '@atcbd.net') {
      const input = e.target;
      setTimeout(() => {
        input.setSelectionRange(0, 0);
      }, 0);
    }
  };

  const handleGoogleLogin = () => {
    triggerShake();
    setErrorMsg('Google SSO is disabled for this enterprise demo. Please login using email and password.');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Please fill in all fields.'); triggerShake(); return; }
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      triggerShake();
      if (error.code === 'auth/wrong-password' || error.message?.includes('wrong-password')) {
        setErrorMsg('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found' || error.message?.includes('user-not-found')) {
        setErrorMsg('Account not found. Contact your HR Administrator.');
      } else if (error.code === 'auth/ambiguous-username' || error.message?.includes('ambiguous-username')) {
        setErrorMsg('Duplicate username found! Please use your Employee Code (e.g. ATCL-0503) or official Email to log in.');
      } else if (error.code === 'auth/invalid-email' || error.message?.includes('invalid-email')) {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg(error.message || 'Login failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || email === '@atcbd.net') { setErrorMsg('Please enter your email to receive a reset link.'); triggerShake(); return; }
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Success! A password reset link has been sent to your email.');
      setLoading(false);
      setTimeout(() => setIsResetMode(false), 4000);
    } catch (error) {
      triggerShake();
      setErrorMsg(error.message || 'Failed to send reset email.');
      setLoading(false);
    }
  };

  const slide = SLIDES[slideIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .elv5-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          background: #0d1117;
        }

        /* ── LEFT PANEL ── */
        .elv5-left {
          width: 480px;
          min-width: 420px;
          background: #0d1117;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 52px;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
        }

        .elv5-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 44px;
        }

        .elv5-brand-logo {
          width: 44px;
          height: 44px;
          background: rgba(99,102,241,0.12);
          border: 1.5px solid rgba(99,102,241,0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 900;
          color: #818cf8;
          letter-spacing: -1px;
        }

        .elv5-brand-text { display: flex; flex-direction: column; line-height: 1.2; }
        .elv5-brand-name { font-size: 1rem; font-weight: 700; color: #f1f5f9; }
        .elv5-brand-sub  { font-size: 0.6rem; color: #64748b; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; }

        .elv5-greeting {
          font-size: 1.85rem;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 8px;
          line-height: 1.15;
        }

        .elv5-greeting-sub {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* Social buttons */
        .elv5-social-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .elv5-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .elv5-social-btn:hover {
          border-color: #6366f1;
          background: rgba(99,102,241,0.06);
          color: #fff;
        }

        .elv5-social-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Divider */
        .elv5-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .elv5-divider-line { flex: 1; height: 1px; background: #21262d; }
        .elv5-divider-text { font-size: 0.7rem; color: #4b5563; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }

        /* Form fields */
        .elv5-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
        }

        .elv5-field-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .elv5-field-input-wrap {
          position: relative;
        }

        .elv5-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #4b5563;
        }

        .elv5-field-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #e2e8f0;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .elv5-field-input::placeholder { color: #3d4856; }

        .elv5-field-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .elv5-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #4b5563;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .elv5-pw-toggle:hover { color: #94a3b8; }

        /* Remember + Forgot row */
        .elv5-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .elv5-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #64748b;
          cursor: pointer;
          user-select: none;
        }

        .elv5-remember input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #6366f1;
          cursor: pointer;
        }

        .elv5-forgot {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6366f1;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          transition: color 0.15s;
        }
        .elv5-forgot:hover { color: #818cf8; text-decoration: underline; }

        /* Submit button */
        .elv5-submit-btn {
          width: 100%;
          padding: 13px;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }

        .elv5-submit-btn:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.35);
        }

        .elv5-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Error / Success */
        .elv5-alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 16px;
          animation: elv5FadeIn 0.25s ease both;
        }
        .elv5-alert.error   { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
        .elv5-alert.success { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); color: #34d399; }

        /* Footer */
        .elv5-footer-note {
          text-align: center;
          font-size: 0.78rem;
          color: #4b5563;
        }
        .elv5-footer-note a, .elv5-footer-note button {
          color: #6366f1;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.78rem;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.15s;
        }
        .elv5-footer-note a:hover, .elv5-footer-note button:hover { color: #818cf8; }

        /* Spinner */
        .elv5-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: elv5Spin 0.7s linear infinite;
        }

        /* Shake */
        .elv5-shake { animation: elv5Shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        /* ── RIGHT PANEL ── */
        .elv5-right {
          flex: 1;
          background: linear-gradient(135deg, #0d1b3e 0%, #111827 40%, #1a0a3d 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 52px;
        }

        /* Stars */
        .elv5-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .elv5-star {
          position: absolute;
          background: rgba(255,255,255,0.55);
          border-radius: 50%;
          animation: elv5Twinkle var(--dur) ease-in-out infinite alternate;
        }

        .elv5-right-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 480px;
        }

        /* Logo box */
        .elv5-logo-frame {
          width: 120px;
          height: 120px;
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(8px);
          gap: 4px;
          animation: elv5FloatIn 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }

        .elv5-logo-letters {
          font-size: 2rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -2px;
          line-height: 1;
        }

        .elv5-logo-sub {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.5);
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* Slide title */
        .elv5-slide-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 6px;
          animation: elv5FadeIn 0.5s both;
        }
        .elv5-slide-highlight {
          color: #818cf8;
          display: block;
        }
        .elv5-slide-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 380px;
          animation: elv5FadeIn 0.5s 0.1s both;
        }

        /* Feature pills */
        .elv5-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 40px;
          animation: elv5FadeIn 0.5s 0.2s both;
        }

        .elv5-pill {
          padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          font-size: 0.775rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.04);
          cursor: default;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .elv5-pill:hover {
          border-color: rgba(129,140,248,0.4);
          background: rgba(99,102,241,0.1);
          color: #c7d2fe;
        }

        /* Pagination dots */
        .elv5-dots {
          display: flex;
          gap: 8px;
        }

        .elv5-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .elv5-dot.active {
          background: #6366f1;
          width: 24px;
          border-radius: 100px;
        }

        /* Glow orbs */
        .elv5-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.18;
        }
        .elv5-orb-1 { width: 320px; height: 320px; background: #6366f1; top: -60px; right: -60px; }
        .elv5-orb-2 { width: 250px; height: 250px; background: #a21caf; bottom: 20px; left: 30px; }
        .elv5-orb-3 { width: 180px; height: 180px; background: #0ea5e9; bottom: 100px; right: 80px; }

        /* Keyframes */
        @keyframes elv5Spin    { to { transform: rotate(360deg); } }
        @keyframes elv5Shake  {
          0%,100%{ transform:translateX(0) }
          20%{ transform:translateX(-8px) }
          40%{ transform:translateX(8px) }
          60%{ transform:translateX(-5px) }
          80%{ transform:translateX(5px) }
        }
        @keyframes elv5FadeIn  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes elv5FloatIn { from { opacity:0; transform:scale(0.85) translateY(20px) } to { opacity:1; transform:none } }
        @keyframes elv5Twinkle { from { opacity: 0.1; } to { opacity: 0.8; } }

        @media (max-width: 900px) {
          .elv5-right { display: none; }
          .elv5-left  { width: 100%; min-width: 0; padding: 40px 28px; }
        }
      `}</style>

      <div className="elv5-root">
        {/* ── LEFT: Sign-In Form ── */}
        <div className="elv5-left">
          {/* Brand */}
          <div className="elv5-brand">
            <div className="elv5-brand-logo" style={{ padding: 0, overflow: 'hidden', background: 'none', border: '1.5px solid rgba(99,102,241,0.3)' }}>
              <img src="https://i.ibb.co/sJkxWCZx/images.jpg" alt="ATCL Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
            </div>
            <div className="elv5-brand-text">
              <span className="elv5-brand-name">ATCL HRMS</span>
              <span className="elv5-brand-sub">Advance Technology Consortium Ltd.</span>
            </div>
          </div>

          {/* Heading */}
          {!isResetMode ? (
            <>
              <h1 className="elv5-greeting">Welcome back 👋</h1>
              <p className="elv5-greeting-sub">Sign in to your ATCL HR account to continue</p>
            </>
          ) : (
            <>
              <h1 className="elv5-greeting">Reset password 🔑</h1>
              <p className="elv5-greeting-sub">Enter your email to receive a reset link</p>
            </>
          )}

          {/* Alerts */}
          {errorMsg   && <div className="elv5-alert error">{errorMsg}</div>}
          {successMsg && <div className="elv5-alert success">{successMsg}</div>}

          {!isResetMode ? (
            <>
              {/* Social auth */}
              <div className="elv5-social-row">
                <button
                  type="button"
                  className="elv5-social-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="elv5-social-btn"
                  disabled={loading}
                  onClick={() => {
                    triggerShake();
                    setErrorMsg('Microsoft SSO is disabled for this enterprise demo. Please login using email and password.');
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="9" height="9" fill="#F25022"/>
                    <rect x="13" y="2" width="9" height="9" fill="#7FBA00"/>
                    <rect x="2" y="13" width="9" height="9" fill="#00A4EF"/>
                    <rect x="13" y="13" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  Microsoft
                </button>
              </div>

              {/* Divider */}
              <div className="elv5-divider">
                <div className="elv5-divider-line" />
                <span className="elv5-divider-text">or email</span>
                <div className="elv5-divider-line" />
              </div>

              {/* Email + Password form */}
              <form onSubmit={handleLoginSubmit} className={shake ? 'elv5-shake' : ''}>
                <div className="elv5-field-group">
                  <label className="elv5-field-label">Email or User ID</label>
                  <div className="elv5-field-input-wrap">
                    <svg className="elv5-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      type="text"
                      className="elv5-field-input"
                      placeholder="User ID, Employee Code, or Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="elv5-field-group">
                  <label className="elv5-field-label">Password</label>
                  <div className="elv5-field-input-wrap">
                    <svg className="elv5-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="elv5-field-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="elv5-pw-toggle"
                      onClick={() => setShowPassword(p => !p)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="elv5-meta-row">
                  <label className="elv5-remember">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="elv5-forgot"
                    onClick={() => { setIsResetMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="elv5-submit-btn" disabled={loading}>
                  {loading ? <span className="elv5-spinner" /> : <>Sign in <span>→</span></>}
                </button>
              </form>

              <div className="elv5-footer-note">
                Access issues? &nbsp;
                <button type="button" onClick={() => { setEmail('atc@dhaka.net'); }}>
                  Contact IT Support
                </button>
              </div>
            </>
          ) : (
            /* Reset password form */
            <form onSubmit={handleResetPassword} className={shake ? 'elv5-shake' : ''}>
              <div className="elv5-field-group">
                <label className="elv5-field-label">Email</label>
                <div className="elv5-field-input-wrap">
                  <svg className="elv5-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    className="elv5-field-input"
                    placeholder="your-email@atcbd.net"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={handleEmailFocus}
                    onClick={handleEmailFocus}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 0 }}>
                <button
                  type="button"
                  className="elv5-submit-btn"
                  style={{ background: '#1e2533', color: '#94a3b8', flex: 1 }}
                  onClick={() => { setIsResetMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="elv5-submit-btn" style={{ flex: 1.5 }} disabled={loading}>
                  {loading ? <span className="elv5-spinner" /> : 'Send Link'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── RIGHT: Graphic Panel ── */}
        <div className="elv5-right">
          {/* Glow orbs */}
          <div className="elv5-orb elv5-orb-1" />
          <div className="elv5-orb elv5-orb-2" />
          <div className="elv5-orb elv5-orb-3" />

          {/* Stars */}
          <div className="elv5-stars">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className="elv5-star"
                style={{
                  width:  `${Math.random() * 2.5 + 1}px`,
                  height: `${Math.random() * 2.5 + 1}px`,
                  top:    `${Math.random() * 100}%`,
                  left:   `${Math.random() * 100}%`,
                  '--dur': `${(Math.random() * 3 + 2).toFixed(1)}s`,
                }}
              />
            ))}
          </div>

          <div className="elv5-right-inner">
            {/* Logo frame */}
            <div className="elv5-logo-frame" style={{ padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
              <img src="https://i.ibb.co/sJkxWCZx/images.jpg" alt="ATCL Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
            </div>

            {/* Slide content */}
            <h2 className="elv5-slide-title" key={slideIdx}>
              {slide.title}
              <span className="elv5-slide-highlight">{slide.highlight}</span>
            </h2>
            <p className="elv5-slide-sub" key={`sub-${slideIdx}`}>{slide.subtitle}</p>

            {/* Feature pills */}
            <div className="elv5-pills">
              {FEATURES.map(f => (
                <div key={f.label} className="elv5-pill">
                  <span>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>

            {/* Pagination dots */}
            <div className="elv5-dots">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`elv5-dot ${i === slideIdx ? 'active' : ''}`}
                  onClick={() => setSlideIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
