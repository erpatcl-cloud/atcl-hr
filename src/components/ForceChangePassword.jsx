import React, { useState, useContext } from 'react';
import { HRMSContext } from '../context/HRMSContext';

export default function ForceChangePassword() {
  const { currentUser, changePassword, logout } = useContext(HRMSContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (newPassword === '123456') {
      setErrorMsg('New password cannot be the temporary OTP password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await changePassword(currentUser.employeeCode, newPassword);
      setSuccessMsg('Password changed successfully! Redirecting...');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .force-pw-root {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0d1b3e 0%, #0d1117 40%, #1a0a3d 100%);
          color: #f1f5f9;
          padding: 24px;
        }

        .force-pw-card {
          width: 100%;
          max-width: 440px;
          background: rgba(22, 27, 34, 0.8);
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 40px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: forceFadeIn 0.5s ease both;
        }

        .force-pw-logo {
          width: 56px;
          height: 56px;
          margin: 0 auto 24px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.1);
          border: 1.5px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
        }

        .force-pw-title {
          font-size: 1.5rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 8px;
          color: #fff;
        }

        .force-pw-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .force-pw-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }

        .force-pw-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .force-pw-input-wrap {
          position: relative;
        }

        .force-pw-input {
          width: 100%;
          padding: 12px 40px 12px 14px;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #e2e8f0;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .force-pw-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .force-pw-toggle {
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
        }
        .force-pw-toggle:hover { color: #94a3b8; }

        .force-pw-btn {
          width: 100%;
          padding: 13px;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }

        .force-pw-btn:hover:not(:disabled) {
          background: #4f46e5;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .force-pw-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .force-pw-logout {
          display: block;
          margin: 24px auto 0 auto;
          background: none;
          border: none;
          color: #f87171;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s;
        }
        .force-pw-logout:hover {
          color: #fca5a5;
          text-decoration: underline;
        }

        .force-pw-alert {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .force-pw-alert.error { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
        .force-pw-alert.success { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399; }

        .force-pw-shake { animation: forceShake 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes forceFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }

        @keyframes forceShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="force-pw-root">
        <div className={`force-pw-card ${shake ? 'force-pw-shake' : ''}`}>
          <div className="force-pw-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="force-pw-title">Reset Temporary Password</h1>
          <p className="force-pw-subtitle">
            Welcome, <strong>{currentUser.name}</strong>. You logged in using a one-time temporary password. Please choose a new secure password to activate your account.
          </p>

          {errorMsg && <div className="force-pw-alert error">{errorMsg}</div>}
          {successMsg && <div className="force-pw-alert success">{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className="force-pw-field">
              <label className="force-pw-label">New Password</label>
              <div className="force-pw-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="force-pw-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="force-pw-field">
              <label className="force-pw-label">Confirm Password</label>
              <div className="force-pw-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="force-pw-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="force-pw-toggle"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="force-pw-btn" disabled={loading}>
              {loading ? 'Updating password...' : 'Activate Account & Sign In'}
            </button>
          </form>

          <button className="force-pw-logout" onClick={logout} disabled={loading}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
