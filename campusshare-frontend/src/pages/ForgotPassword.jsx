import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setResult(res.data);
    } catch (x) {
      setError(x.response?.data?.message || 'Could not process password reset request');
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
          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h1>
            Back in.
            <br />
            Without the drama.
          </h1>
          <p>
            Supports all email providers (Gmail, Yahoo, Outlook, Banasthali, University emails, etc.).
          </p>
        </div>
        <small>CampusShare Security</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-icon">↺</div>
          <h2>Reset password</h2>
          <p className="auth-subtitle">Enter any email address (e.g. your Gmail or college email).</p>

          {error && <div className="auth-error">{error}</div>}

          {result ? (
            <div>
              <div className="auth-success" style={{ marginBottom: '14px' }}>
                ✓ {result.message || 'Password reset link generated successfully.'}
              </div>

              {result.devResetUrl && (
                <div
                  style={{
                    background: '#eef2ff',
                    border: '2px solid #6366f1',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#312e81', fontWeight: 600 }}>
                    🔑 Reset Link Ready for {email}:
                  </p>
                  <Link
                    to={result.devResetUrl}
                    className="auth-button"
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      padding: '10px',
                      background: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontWeight: 600
                    }}
                  >
                    Proceed to Reset Password Page →
                  </Link>
                </div>
              )}

              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: '12px' }}
                onClick={() => {
                  setResult(null);
                  setEmail('');
                }}
              >
                ← Try another email
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <div className="form-group">
                <label>Your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com or college email"
                  required
                />
                <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                  Works with any email: Gmail, Yahoo, Outlook, college domains, etc.
                </small>
              </div>
              <button className="auth-button" disabled={loading}>
                {loading ? 'Generating reset link…' : 'Send reset link'}
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
