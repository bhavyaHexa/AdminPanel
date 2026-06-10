import React, { useState } from 'react';
import useLogin from '../hooks/useLogin';
import useForgotPassword from '../hooks/useForgotPassword';
import useConfirmForgotPassword from '../hooks/useConfirmForgotPassword';
import useResendCode from '../hooks/useResendCode';
import VerificationModal from './VerificationModal';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
  onNavigateToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  // Modes: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password / Reset states
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Modal Verification States (for unverified login attempt redirect)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState('');

  // Status message state
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Validation errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    otp?: string;
    newPassword?: string;
  }>({});

  // Mutations
  const loginMutation = useLogin();
  const forgotPasswordMutation = useForgotPassword();
  const confirmForgotPasswordMutation = useConfirmForgotPassword();
  const resendCodeMutation = useResendCode();

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    if (type === 'error') {
      setTimeout(() => setStatusMsg(null), 6000);
    }
  };

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrors({});

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      
      const token = response?.accessToken || response?.token || response?.jwtToken;
      
      if (token) {
        localStorage.setItem('jwtToken', token);
        showStatus('Logged in successfully!', 'success');
        onLoginSuccess(token);
      } else {
        throw new Error('No access token received from login request');
      }
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = 
        (typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error) || 
        err?.message || 
        'Login failed. Please verify credentials.';

      // Check if this error is because account is not verified
      const isUnverified = 
        errMsg.toLowerCase().includes('not verified') || 
        errMsg.toLowerCase().includes('confirm the otp') ||
        errMsg.toLowerCase().includes('confirm otp');

      if (isUnverified) {
        // Open verification modal immediately
        setModalEmail(email);
        setIsModalOpen(true);
        showStatus('Account not verified. Opening verification panel and requesting new OTP...', 'success');

        try {
          // Attempt to trigger resend OTP in background
          await resendCodeMutation.mutateAsync({ email });
        } catch (resendErr: any) {
          const resendResponseData = resendErr?.response?.data;
          const resendErrMsg = 
            (typeof resendResponseData === 'string' ? resendResponseData : resendResponseData?.message || resendResponseData?.error) || 
            resendErr?.message || 
            '';
          showStatus(`Verification panel opened, but sending OTP failed: ${resendErrMsg}`, 'error');
        }
      } else {
        showStatus(errMsg, 'error');
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrors({});

    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      showStatus('Verification OTP code sent to your email!', 'success');
      setMode('reset');
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = 
        (typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error) || 
        err?.message || 
        'Failed to send OTP code. Try again.';
      showStatus(errMsg, 'error');
    }
  };

  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrors({});

    const emailErr = validateEmail(email);
    const otpErr = !otpCode.trim() ? 'Verification OTP code is required' : '';
    const newPasswordErr = validatePassword(newPassword);

    if (emailErr || otpErr || newPasswordErr) {
      setErrors({ email: emailErr, otp: otpErr, newPassword: newPasswordErr });
      return;
    }

    try {
      await confirmForgotPasswordMutation.mutateAsync({
        email,
        code: otpCode.trim(),
        newPassword,
      });
      showStatus('Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setOtpCode('');
        setNewPassword('');
        setStatusMsg(null);
      }, 1500);
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = 
        (typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error) || 
        err?.message || 
        'Failed to reset password. Try again.';
      showStatus(errMsg, 'error');
    }
  };

  const isSubmitting = loginMutation.isPending || forgotPasswordMutation.isPending || confirmForgotPasswordMutation.isPending || resendCodeMutation.isPending;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">Duo Configurator</div>
          <h1 className="auth-title">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Confirm Reset'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' && 'Sign in to manage your 3D assets & collections'}
            {mode === 'forgot' && 'Enter your email to receive a password reset OTP'}
            {mode === 'reset' && `Enter the OTP sent to ${email} to set a new password`}
          </p>
        </div>

        {statusMsg && (
          <div className={`auth-alert ${statusMsg.type === 'success' ? 'auth-alert-success' : 'auth-alert-danger'}`}>
            {statusMsg.type === 'success' ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="email-input"
                  type="email"
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
              </div>
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password-input">Password</label>
                <button
                  type="button"
                  className="auth-link"
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                  onClick={() => {
                    setMode('forgot');
                    setErrors({});
                    setStatusMsg(null);
                  }}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="password-input"
                  type="password"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              </div>
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={isSubmitting}
            >
              {loginMutation.isPending ? <span className="spinner"></span> : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email-input">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="forgot-email-input"
                  type="email"
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
              </div>
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={isSubmitting}
            >
              {forgotPasswordMutation.isPending ? <span className="spinner"></span> : 'Send OTP Code'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="auth-link"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => {
                  setMode('login');
                  setErrors({});
                  setStatusMsg(null);
                }}
                disabled={isSubmitting}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleConfirmResetSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email-input">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-email-input"
                  type="email"
                  className="auth-input"
                  value={email}
                  disabled
                  readOnly
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp-input">OTP Code</label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-otp-input"
                  type="text"
                  className={`auth-input ${errors.otp ? 'error' : ''}`}
                  placeholder="Enter 6-digit OTP code"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  disabled={isSubmitting}
                  autoComplete="one-time-code"
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </div>
              {errors.otp && <span className="auth-error-text">{errors.otp}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password-input">New Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-password-input"
                  type="password"
                  className={`auth-input ${errors.newPassword ? 'error' : ''}`}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <span className="auth-input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              </div>
              {errors.newPassword && <span className="auth-error-text">{errors.newPassword}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={isSubmitting}
            >
              {confirmForgotPasswordMutation.isPending ? <span className="spinner"></span> : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="auth-link"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => {
                  setMode('forgot');
                  setErrors({});
                  setStatusMsg(null);
                }}
                disabled={isSubmitting}
              >
                Back to Request OTP
              </button>
            </div>
          </form>
        )}

        {mode === 'login' && (
          <div className="auth-footer">
            Don't have an account?
            <button 
              type="button" 
              className="auth-link" 
              onClick={onNavigateToSignup}
              disabled={isSubmitting}
            >
              Create an account
            </button>
          </div>
        )}
      </div>

      <VerificationModal
        email={modalEmail}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerificationSuccess={() => {
          setIsModalOpen(false);
          showStatus('Account verified successfully! You can now sign in.', 'success');
        }}
      />
    </div>
  );
};

export default LoginPage;
