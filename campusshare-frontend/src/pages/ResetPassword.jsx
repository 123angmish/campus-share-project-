import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import './Auth.css';

export default function ResetPassword() {
  const [q] = useSearchParams();
  const tokenFromUrl = q.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const activeToken = (token || tokenFromUrl).trim();
    if (!activeToken) {
      setError('Please provide a valid reset token');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: activeToken,
        newPassword: password
      });
      setDone(true);
    } catch (x) {
      setError(x.response?.data?.message || 'Password reset failed. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-logo">
          <span>C</span> CampusShare
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">NEW CREDENTIALS</span>
          <h1>
            Choose strong.
            <br />
            Stay secure.
          </h1>
          <p>
            Choose a strong password with at least 10 characters, an uppercase letter, lowercase letter, and a number.
          </p>
        </div>
        <small>CampusShare Security</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-icon">🔑</div>
          <h2>Create new password</h2>
          <p className="auth-subtitle">Set a fresh, secure password for your account.</p>

          {error && <div className="auth-error">{error}</div>}

          {done ? (
            <div>
              <div className="auth-success" style={{ marginBottom: '16px' }}>
                ✓ Password changed successfully! You can now sign in with your new password.
              </div>
              <Link
                className="auth-button"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  padding: '10px'
                }}
                to="/login"
              >
                Sign in now →
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              {!tokenFromUrl && (
                <div className="form-group">
                  <label>Reset Token</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token here"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  minLength="10"
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{10,}"
                  placeholder="Min 10 chars (e.g. Campus@123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                  Must contain uppercase, lowercase, and a number (10+ characters).
                </small>
              </div>

              <button className="auth-button" disabled={loading}>
                {loading ? 'Updating password…' : 'Update password'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link to="/login">← Back to sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
