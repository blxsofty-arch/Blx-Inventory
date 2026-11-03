import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lock, Mail, ArrowRight, AlertCircle, UserCheck, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Login({ onBrowseAsGuest }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@theblxrealty.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset Passcode State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your staff access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsLoading(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const data = await api.forgotPasscode(resetEmail);
      setRecoverySent(true);
      if (data.verificationCode) {
        setGeneratedCode(data.verificationCode);
        setRecoveryCode(data.verificationCode); // auto-populate for ease of use
      }
      setSuccessMsg(data.message || 'Recovery code generated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to request recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Passcode must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passcodes do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.resetPasscode(resetEmail, recoveryCode, newPassword, confirmPassword);
      setSuccessMsg(data.message || 'Passcode reset successfully! Signing in...');

      // Automatically sign in with the new passcode
      setTimeout(async () => {
        try {
          await login(resetEmail, newPassword);
        } catch (loginErr) {
          setIsResetMode(false);
          setEmail(resetEmail);
          setPassword(newPassword);
          setSuccessMsg('Passcode updated. Please sign in with your new passcode.');
        }
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed to reset passcode. Please check your recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="brand-logo-box" style={{ width: '56px', height: '56px', margin: '0 auto 1rem' }}>
            <img 
              src="/blx-logo.png" 
              alt="BLX Realty" 
              className="brand-logo-img"
              style={{ maxHeight: '42px' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: 700 }}>
            BLX REALTY
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            Property Inventory &amp; Sales Portal
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {isResetMode ? 'Secure Staff Passcode Recovery' : 'Bengaluru - London Exchange Staff Access'}
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            color: '#059669',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-color)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* CONDITIONAL: RESET PASSCODE MODE */}
        {isResetMode ? (
          <div>
            {!recoverySent ? (
              /* Step 1: Request Recovery Code */
              <form onSubmit={handleRequestRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label">Registered Staff Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                      placeholder="admin@theblxrealty.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Enter the email associated with your portal administrator or employee account.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? <span>Generating Recovery Code...</span> : (
                    <>
                      <span>Generate Recovery Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter Verification Code & Set New Passcode */
              <form onSubmit={handlePerformReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {generatedCode && (
                  <div style={{
                    background: 'rgba(183, 146, 67, 0.08)',
                    border: '1px solid rgba(183, 146, 67, 0.3)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <KeyRound size={15} />
                      <span>One-Time Recovery Verification Code</span>
                    </div>
                    <div>Your 6-digit recovery code is: <strong style={{ fontSize: '1.05rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>{generatedCode}</strong></div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Valid for 15 minutes. Enter this code below.</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">6-Digit Recovery Code</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem', letterSpacing: '0.15em', fontWeight: 600 }}
                      placeholder="123456"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Passcode</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Passcode</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                      placeholder="Re-enter new passcode"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? <span>Updating Passcode...</span> : (
                    <>
                      <span>Update Passcode &amp; Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.65rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => {
                setIsResetMode(false);
                setRecoverySent(false);
                setError('');
                setSuccessMsg('');
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Staff Sign In</span>
            </button>
          </div>
        ) : (
          /* STANDARD SIGN-IN MODE */
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label">Staff Work Email</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    placeholder="name@theblxrealty.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Passcode / Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setResetEmail(email || 'admin@theblxrealty.com');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot passcode?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
                disabled={isLoading}
              >
                {isLoading ? <span>Verifying Session...</span> : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* 1-Click Demo Profiles */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>
                Instant Demo Sign-In by Role:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 0.5rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleQuickLogin('sales@theblxrealty.com', '[REDACTED]')}
                >
                  <UserCheck size={16} style={{ color: '#059669' }} />
                  <strong style={{ fontSize: '0.82rem' }}>EMPLOYEE</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Read-Only Access</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 0.5rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleQuickLogin('admin@theblxrealty.com', '[REDACTED]')}
                >
                  <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                  <strong style={{ fontSize: '0.82rem' }}>ADMIN</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Full Access</span>
                </button>
              </div>

              <div style={{
                marginTop: '1.15rem',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                🔒 <strong>Strict Staff Access:</strong> Public registration is disabled. You can reset your forgotten passcode anytime using the link above.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
