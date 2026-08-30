import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import './Marketplace.css';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="verify-wrap">
      <div className="surface verify-card">
        <div className="verify-icon">{status === 'verifying' ? '◌' : status === 'success' ? '✓' : '!'}</div>
        <h2>{status === 'verifying' ? 'Verifying your email…' : status === 'success' ? 'Email verified' : 'Verification failed'}</h2>
        <p className="muted">
          {status === 'verifying'
            ? 'Securely checking your verification token.'
            : status === 'success'
              ? 'Your campus identity is now verified.'
              : 'The link is invalid or may have expired.'}
        </p>
        <Link className="btn btn-primary" to={status === 'success' ? '/login' : '/signup'}>
          {status === 'success' ? 'Continue to login' : 'Back to signup'}
        </Link>
      </div>
    </div>
  );
}
