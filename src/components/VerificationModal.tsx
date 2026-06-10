import React, { useState } from 'react';
import useConfirmSignup from '../hooks/useConfirmSignup';
import useResendCode from '../hooks/useResendCode';

interface VerificationModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  email,
  isOpen,
  onClose,
  onVerificationSuccess,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const confirmSignupMutation = useConfirmSignup();
  const resendCodeMutation = useResendCode();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim()) {
      setErrorMsg('Please enter the verification code');
      return;
    }

    try {
      await confirmSignupMutation.mutateAsync({
        email,
        code: code.trim(),
      });
      setSuccessMsg('Account verified successfully!');
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Invalid code. Please try again.';
      setErrorMsg(msg);
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resendCodeMutation.mutateAsync({ email });
      setSuccessMsg('OTP code has been resent to your email!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to resend code.';
      setErrorMsg(msg);
    }
  };

  const isPending = confirmSignupMutation.isPending || resendCodeMutation.isPending;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" disabled={isPending}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div className="auth-brand" style={{ fontSize: '1.5rem' }}>Verify Account</div>
          <h2 className="auth-title" style={{ fontSize: '1.15rem' }}>Enter OTP</h2>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem' }}>
            We've sent a 6-digit verification code to <strong>{email}</strong>.
          </p>
        </div>

        {successMsg && (
          <div className="auth-alert auth-alert-success" style={{ fontSize: '0.8rem', padding: '0.65rem 0.85rem' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert auth-alert-danger" style={{ fontSize: '0.8rem', padding: '0.65rem 0.85rem' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="modal-otp-input" style={{ fontSize: '0.8rem' }}>Verification Code</label>
            <div className="auth-input-wrapper">
              <input
                id="modal-otp-input"
                type="text"
                className={`auth-input ${errorMsg ? 'error' : ''}`}
                placeholder="Enter OTP code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={isPending}
                autoComplete="one-time-code"
                style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.9rem' }}
              />
              <span className="auth-input-icon" style={{ left: '0.85rem' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-auth"
            disabled={isPending}
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
          >
            {confirmSignupMutation.isPending ? <span className="spinner" style={{ width: '16px', height: '16px' }}></span> : 'Verify Code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <button
            type="button"
            className="auth-link"
            onClick={handleResend}
            disabled={isPending}
          >
            {resendCodeMutation.isPending ? 'Resending...' : 'Resend OTP Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
