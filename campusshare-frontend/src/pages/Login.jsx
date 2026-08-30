import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const r = await login(email, password, rememberMe);
    setLoading(false);
    if (r.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setError(r.error);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-logo">
          <span style={{ background: 'linear-gradient(145deg, #1e1b4b, #4338ca 60%, #ec4899)' }}>BV</span> CampusShare
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">🌸 BANASTHALI VIDYAPITH EXCLUSIVE</span>
          <h1>
            Borrow, lend & buy
            <br />
            on campus.
          </h1>
          <p>
            Exclusive peer-to-peer sharing network for Banasthali Vidyapith students across all departments and campus hostels.
          </p>
          <div className="trust-row">
            <span>✓ @banasthali.in Verified</span>
            <span>★ Campus Reputation</span>
            <span>↔ Hostel Handover</span>
          </div>
        </div>
        <small>Banasthali Vidyapith Student Community</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to explore your Banasthali campus marketplace.</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={submit} noValidate={false}>
            <div className="form-group">
              <label htmlFor="login-email">Banasthali or Personal Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@banasthali.in or gmail"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="auth-options-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me & stay logged in</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="auth-note">🔒 Passwords securely hashed with BCrypt & JWT token protection.</p>
          <p className="auth-switch">
            New to CampusShare? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
