import React, { useState } from 'react';
import useSignup from '../hooks/useSignup';
import useResendCode from '../hooks/useResendCode';
import VerificationModal from './VerificationModal';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigateToLogin }) => {
  // Registration States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Modal Verification States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState('');

  // UI status messages
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Mutations
  const signupMutation = useSignup();
  const resendCodeMutation = useResendCode();

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    if (type === 'error') {
      setTimeout(() => setStatusMsg(null), 6000);
    }
  };

  const validateSignupForm = () => {
    const tempErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      tempErrors.name = 'Full name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      tempErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    if (!email) {
      tempErrors.email = 'Email address is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        tempErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    if (!password) {
      tempErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm password is required';
      isValid = false;
    } else if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!validateSignupForm()) return;

    try {
      await signupMutation.mutateAsync({
        name,
        email,
        password,
      });
      
      // Open modal first to ensure it's displayed immediately
      setModalEmail(email);
      setIsModalOpen(true);
      showStatus('Registration successful! Please verify your email with the OTP code.', 'success');
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = 
        (typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error) || 
        err?.message || 
        '';
      
      // Check if email already registered (conflict or bad request)
      const isConflict = 
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('exist') ||
        errMsg.toLowerCase().includes('taken') ||
        err?.response?.status === 409 ||
        err?.response?.status === 400;

      if (isConflict) {
        // Open the modal component immediately so the user can enter the OTP
        setModalEmail(email);
        setIsModalOpen(true);
        showStatus('This email is already registered. Opening verification panel and requesting new OTP...', 'success');

        try {
          // Trigger OTP resend code request in the background
          await resendCodeMutation.mutateAsync({ email });
        } catch (resendErr: any) {
          const resendResponseData = resendErr?.response?.data;
          const resendErrMsg = 
            (typeof resendResponseData === 'string' ? resendResponseData : resendResponseData?.message || resendResponseData?.error) || 
            resendErr?.message || 
            '';
          // Show error but keep modal open
          showStatus(`Verification panel opened, but sending OTP failed: ${resendErrMsg}`, 'error');
        }
      } else {
        showStatus(errMsg || 'Failed to register. Please try again.', 'error');
      }
    }
  };

  const handleVerifyExistingRequest = async () => {
    setStatusMsg(null);
    setErrors({});

    if (!email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    // Open modal immediately
    setModalEmail(email);
    setIsModalOpen(true);
    showStatus('Requesting verification OTP code for your email...', 'success');

    try {
      await resendCodeMutation.mutateAsync({ email });
      showStatus('Verification OTP code sent to your email!', 'success');
    } catch (err: any) {
      const responseData = err?.response?.data;
      const errMsg = 
        (typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error) || 
        err?.message || 
        '';
      showStatus(`Verification panel opened, but requesting OTP failed: ${errMsg}`, 'error');
    }
  };

  const isSubmitting = signupMutation.isPending || resendCodeMutation.isPending;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">Duo Configurator</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register to manage your administrator tools</p>
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

        <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name-input">Full Name</label>
            <div className="auth-input-wrapper">
              <input
                id="name-input"
                type="text"
                className={`auth-input ${errors.name ? 'error' : ''}`}
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                disabled={isSubmitting}
                autoComplete="name"
              />
              <span className="auth-input-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </div>
            {errors.name && <span className="auth-error-text">{errors.name}</span>}
          </div>

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
            <label className="form-label" htmlFor="password-input">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password-input"
                type="password"
                className={`auth-input ${errors.password ? 'error' : ''}`}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
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
            {errors.password && <span className="auth-error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password-input">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="confirm-password-input"
                type="password"
                className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <span className="auth-input-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
              </span>
            </div>
            {errors.confirmPassword && <span className="auth-error-text">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-auth"
            disabled={isSubmitting}
          >
            {signupMutation.isPending ? <span className="spinner"></span> : 'Register'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.85rem' }}>
            Already signed up but haven't verified?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={handleVerifyExistingRequest}
              disabled={isSubmitting}
            >
              Verify now
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Already have an account?
          <button 
            type="button" 
            className="auth-link" 
            onClick={onNavigateToLogin}
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </div>
      </div>

      <VerificationModal
        email={modalEmail}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerificationSuccess={() => {
          setIsModalOpen(false);
          onSignupSuccess();
        }}
      />
    </div>
  );
};

export default SignupPage;
