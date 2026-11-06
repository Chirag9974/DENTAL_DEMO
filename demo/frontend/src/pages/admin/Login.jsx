import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { Icon, Blob } from '../../components/Icon';
import { useToast } from '../../components/Toast';

/** Staff sign-in → HttpOnly admin_token cookie set by the backend. */
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  if (signedIn) return <Navigate to="/admin/appointments" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSending(true);
    try {
      await api.login(email.trim(), password);
      setSignedIn(true);
      toast('Signed in — welcome back', 'success');
      navigate('/admin/appointments', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.');
      if (err?.status === 429) setError('Too many attempts — wait a few minutes before trying again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__side">
        <Blob className="auth__blob" tone="mint" />
        <div className="auth__side-inner">
          <Link to="/" className="brand brand--light">
            <span className="brand__mark">
              <Icon name="tooth" size={22} />
            </span>
            <span className="brand__text">
              Tooth&nbsp;Care
              <small>Staff console</small>
            </span>
          </Link>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 3.4vw, 2.8rem)' }}>
            Appointment
            <br />
            requests, in one place.
          </h1>
          <p style={{ color: '#a9c8d6', maxWidth: '38ch' }}>
            Confirm, cancel, complete and annotate patient requests. Staff-only notes never leave this console.
          </p>
          <ul className="ticks ticks--light">
            <li>
              <span className="tick tick--dark">
                <Icon name="check" size={14} />
              </span>
              Filter by status, date or patient
            </li>
            <li>
              <span className="tick tick--dark">
                <Icon name="check" size={14} />
              </span>
              Validated status transitions only
            </li>
            <li>
              <span className="tick tick--dark">
                <Icon name="check" size={14} />
              </span>
              HttpOnly session cookie — no token storage
            </li>
          </ul>
        </div>
      </div>

      <div className="auth__main">
        <form className="auth__card" onSubmit={onSubmit} noValidate>
          <span className="eyebrow">Secure sign-in</span>
          <h2 style={{ marginTop: 14 }}>Welcome back</h2>
          <p className="field-hint" style={{ marginTop: -4, marginBottom: 20 }}>
            Use your clinic staff credentials. Sessions last 8 hours.
          </p>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
              <Icon name="close" size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="ad-email">Email</label>
            <input
              id="ad-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: 22 }}>
            <label htmlFor="ad-pass">Password</label>
            <input
              id="ad-pass"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-brand btn-lg btn-block" disabled={sending}>
            {sending ? (
              <>
                <span className="spinner" /> Checking…
              </>
            ) : (
              <>
                Sign in <span className="arr">→</span>
              </>
            )}
          </button>

          <Link className="link-arrow" to="/" style={{ marginTop: 18, justifyContent: 'center' }}>
            ← Back to the public site
          </Link>
        </form>
      </div>
    </div>
  );
}
