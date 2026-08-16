import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, EnvelopeSimple, CheckCircle, ArrowLeft, User, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import Logo from './Logo';
import { AppContext } from '../context/AppContext';

export default function AuthModal() {
  const { toggleAuthModal, authMode, setAuthMode, loginUser, signupUser, googleLogin, resetPassword, resendVerification } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') toggleAuthModal(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [toggleAuthModal]);

  const isLogin = authMode === 'login';
  const isReset = authMode === 'reset';

  const getErrorMessage = (errorCode) => {
    const code = errorCode?.code || errorCode?.message || String(errorCode);
    if (code.includes('auth/configuration-not-found') || code.includes('auth/operation-not-allowed'))
      return 'Email/Password sign-in is not enabled. Please enable it in your Firebase Console → Authentication → Sign-in method.';
    if (code.includes('auth/email-already-in-use'))
      return 'This email is already registered. Try logging in instead.';
    if (code.includes('auth/invalid-email'))
      return 'Please enter a valid email address.';
    if (code.includes('auth/weak-password'))
      return 'Password must be at least 6 characters long.';
    if (code.includes('auth/user-not-found'))
      return 'No account found with that email.';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential'))
      return 'Invalid email or password. Please try again.';
    if (code.includes('auth/too-many-requests'))
      return 'Too many attempts. Please try again later.';
    if (code.includes('auth/network-request-failed'))
      return 'Network error. Please check your internet connection.';
    return code.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'An unexpected error occurred.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResend(false);
    try {
      if (isReset) {
        if (!formData.email) { setError('Please enter your email address.'); setLoading(false); return; }
        await resetPassword(formData.email);
        setResetSent(true);
      } else if (isLogin) {
        await loginUser(formData.email, formData.password);
      } else {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await signupUser(formData.name || 'User', formData.email, formData.password);
        setVerifyEmail(formData.email);
      }
    } catch (err) {
      if (err?.code === 'auth/email-not-verified') {
        setError('Your email isn\'t verified yet. Check your inbox for the verification link.');
        setShowResend(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification(formData.email, formData.password);
      setError('Verification email re-sent. Please check your inbox.');
      setShowResend(false);
    } catch {
      setError('Could not resend. Double-check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await googleLogin();
    } catch (err) {
      const code = err?.code || err?.message || '';
      console.error('Google sign-in failed:', code, err);
      if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        // User closed the popup — ignore.
      } else if (code.includes('popup-blocked')) {
        setError('Your browser blocked the sign-in popup. Allow popups for this site and try again.');
      } else if (code.includes('unauthorized-domain')) {
        setError(`This domain (${window.location.hostname}) is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.`);
      } else if (code.includes('operation-not-allowed')) {
        setError('Google provider is disabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      } else {
        setError(`Google sign-in error: ${code.replace('Firebase: ', '')}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode) => {
    setError(null);
    setResetSent(false);
    setVerifyEmail(null);
    setShowResend(false);
    setAuthMode(mode);
  };

  // --- Email verification sent view ---
  if (verifyEmail) {
    return (
      <div className="modal-overlay active" onClick={() => toggleAuthModal()}>
        <div className="modal-content auth-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Verify your email">
          <button className="close-modal" onClick={() => toggleAuthModal()} aria-label="Close"><X /></button>
          <div className="auth-header">
            <div className="logo success-logo"><CheckCircle weight="fill" /></div>
            <h3>Verify your email</h3>
            <p>We sent a verification link to <strong>{verifyEmail}</strong>. Click it to activate your account, then log in.</p>
            <button className="btn-primary w-100" style={{ marginTop: '20px' }} onClick={() => switchMode('login')}>
              Go to log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Reset password view ---
  if (isReset) {
    return (
      <div className="modal-overlay active" onClick={() => toggleAuthModal()}>
        <div className="modal-content auth-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Reset your password">
          <button className="close-modal" onClick={() => toggleAuthModal()} aria-label="Close"><X /></button>

          {resetSent ? (
            <div className="auth-header">
              <div className="logo success-logo"><CheckCircle weight="fill" /></div>
              <h3>Check your inbox</h3>
              <p>We sent a password reset link to <strong>{formData.email}</strong>. Follow it to set a new password.</p>
              <button className="btn-primary w-100" style={{ marginTop: '20px' }} onClick={() => switchMode('login')}>
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <div className="logo"><EnvelopeSimple weight="fill" /></div>
                <h3>Reset your password</h3>
                <p>Enter your account email and we'll send you a secure reset link.</p>
              </div>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <EnvelopeSimple className="field-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com" autoComplete="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="btn-primary w-100" disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div> : 'Send reset link'}
                </button>
              </form>
              <div className="auth-toggle">
                <button className="btn-text-accent" onClick={() => switchMode('login')}>
                  <ArrowLeft /> Back to log in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- Login / Signup view ---
  return (
    <div className="modal-overlay active" onClick={() => toggleAuthModal()}>
      <div className="modal-content auth-modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={isLogin ? 'Log in to PikFinder' : 'Create your PikFinder account'}>
        <button className="close-modal" onClick={() => toggleAuthModal()} aria-label="Close"><X /></button>

        <div className="auth-header">
          <div className="logo">
            <Logo size={40} showText={false} />
          </div>
          <h3>{isLogin ? 'Welcome back 👋' : 'Create your account ✨'}</h3>
          <p>{isLogin ? 'Login to your PikFinder account.' : 'Join millions of creators.'}</p>
        </div>

        <button type="button" className="btn-google w-100" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.2 5.3C41.4 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or {isLogin ? 'continue' : 'sign up'} with email</span></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User className="field-icon" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <EnvelopeSimple className="field-icon" />
              <input
                type="email"
                placeholder="you@example.com" autoComplete="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              {isLogin && (
                <button type="button" className="forgot-link" onClick={() => switchMode('reset')}>
                  Forgot password?
                </button>
              )}
            </div>
            <div className="input-with-icon">
              <LockKey className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? '••••••••' : 'Create a strong password'} autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <label className="auth-terms">
              <input type="checkbox" required />
              <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {showResend && (
            <button type="button" className="btn-text-accent" style={{ margin: '0 auto' }} onClick={handleResend} disabled={loading}>
              Resend verification email
            </button>
          )}

          <button type="submit" className="btn-primary w-100" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'} </span>
          <button className="btn-text-accent" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
