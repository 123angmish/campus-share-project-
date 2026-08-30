import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    year: '',
    contactNumber: '',
    hostelBlock: '',
    roomNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const change = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    const { confirmPassword, ...payload } = formData;
    const r = await signup({ ...payload, year: Number(formData.year) });
    setLoading(false);
    if (r.success) {
      if (r.requiresVerification) {
        navigate(`/login?verify=${encodeURIComponent(r.email)}`);
      } else {
        navigate('/');
      }
    } else {
      setError(r.error);
    }
  };

  const hasMinLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-logo">
          <span>C</span> CampusShare
        </div>
        <div className="auth-pitch">
          <span className="eyebrow">JOIN YOUR CAMPUS</span>
          <h1>
            Turn idle stuff
            <br />
            into shared value.
          </h1>
          <p>List what you own, rent what you need and build a trusted student reputation over time.</p>
          <div className="trust-row">
            <span>✓ College identity</span>
            <span>₹ Earn from listings</span>
            <span>♻ Less waste</span>
          </div>
        </div>
        <small>Students helping students</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="auth-subtitle">Use your details to join the campus sharing community.</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
              {error.toLowerCase().includes('already') && (
                <div style={{ marginTop: '6px' }}>
                  <Link to="/login" style={{ color: '#6366f1', fontWeight: 'bold', textDecoration: 'underline' }}>
                    Click here to Sign In →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-name">Full name *</label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={change}
                  placeholder="e.g. Angel Mishra"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-department">Department / Branch *</label>
                <input
                  id="signup-department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={change}
                  placeholder="e.g. AIM & ACT, ECE, Biotech, WISDOM…"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Banasthali or Personal Email *</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={change}
                placeholder="you@banasthali.in or gmail"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-year">Year *</label>
                <select id="signup-year" name="year" value={formData.year} onChange={change} required>
                  <option value="">Select year</option>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option value={y} key={y}>
                      {y}
                      {y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} year
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="signup-contact">Mobile (10 digits) *</label>
                <input
                  id="signup-contact"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={change}
                  pattern="[0-9]{10}"
                  placeholder="9876543210"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="signup-hostel">Banasthali Hostel (optional)</label>
                <select
                  id="signup-hostel"
                  name="hostelBlock"
                  value={formData.hostelBlock}
                  onChange={change}
                >
                  <option value="">Select Hostel</option>
                  <option value="Shakuntala">Shakuntala</option>
                  <option value="Gargi">Gargi</option>
                  <option value="Maitreyi">Maitreyi</option>
                  <option value="Kasturba">Kasturba</option>
                  <option value="Yashoda">Yashoda</option>
                  <option value="Sharda">Sharda</option>
                  <option value="Vani Mandir">Vani Mandir</option>
                  <option value="Pragya">Pragya</option>
                  <option value="Anuradha">Anuradha</option>
                  <option value="Ahilya">Ahilya</option>
                  <option value="Ganga">Ganga</option>
                  <option value="Yamuna">Yamuna</option>
                  <option value="Saraswati">Saraswati</option>
                  <option value="Gayatri">Gayatri</option>
                  <option value="Lavanya">Lavanya</option>
                  <option value="Meera">Meera</option>
                  <option value="Navanidhi">Navanidhi</option>
                  <option value="Priyamvada">Priyamvada</option>
                  <option value="Day Scholar">Day Scholar / Off-Campus</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="signup-room">Room Number (optional)</label>
                <input
                  id="signup-room"
                  name="roomNumber"
                  type="text"
                  value={formData.roomNumber}
                  onChange={change}
                  placeholder="e.g. 204"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={change}
                  minLength="8"
                  placeholder="8+ chars, uppercase & number"
                  autoComplete="new-password"
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

              {/* Password strength indicators */}
              {formData.password && (
                <div className="password-hints">
                  <span className={hasMinLength ? 'valid' : 'invalid'}>
                    {hasMinLength ? '✓' : '○'} 8+ characters
                  </span>
                  <span className={hasUpper ? 'valid' : 'invalid'}>
                    {hasUpper ? '✓' : '○'} 1 uppercase
                  </span>
                  <span className={hasNumber ? 'valid' : 'invalid'}>
                    {hasNumber ? '✓' : '○'} 1 number
                  </span>
                </div>
              )}
            </div>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
