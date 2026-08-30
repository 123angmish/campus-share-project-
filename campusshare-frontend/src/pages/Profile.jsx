import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './Marketplace.css';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pro Membership Modal State
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proPlan, setProPlan] = useState('MONTHLY');
  const [upgradingPro, setUpgradingPro] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    year: '1',
    contactNumber: '',
    hostelBlock: '',
    roomNumber: ''
  });

  useEffect(() => {
    if (!user?.id) return;
    setEditForm({
      name: user.name || '',
      department: user.department || '',
      year: String(user.year || 1),
      contactNumber: user.contactNumber || '',
      hostelBlock: user.hostelBlock || '',
      roomNumber: user.roomNumber || ''
    });

    Promise.all([
      api.get('/users/me/stats'),
      api.get(`/reviews/user/${user.id}`)
    ])
      .then(([statsResponse, reviewsResponse]) => {
        setStats(statsResponse.data);
        setReviews(reviewsResponse.data);
      })
      .catch(() => {});
  }, [user]);

  if (!user) return null;
  const trust = stats?.trustScore ?? 70;
  const tier = (stats?.trustTier || 'RELIABLE').replaceAll('_', ' ');

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      const res = await api.put('/users/me', {
        name: editForm.name.trim(),
        department: editForm.department.trim(),
        year: Number(editForm.year),
        contactNumber: editForm.contactNumber.trim(),
        hostelBlock: editForm.hostelBlock.trim() || null,
        roomNumber: editForm.roomNumber.trim() || null
      });
      updateUser(res.data);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.message || 'Could not update profile');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradePro = async () => {
    try {
      setUpgradingPro(true);
      const res = await api.post('/users/upgrade-pro', null, {
        params: { plan: proPlan }
      });
      updateUser(res.data);
      setProModalOpen(false);
      setSuccess(`👑 Welcome to CampusShare Pro! You now enjoy 0% platform fees and free listing boosts!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not activate Pro pass');
    } finally {
      setUpgradingPro(false);
    }
  };

  return (
    <main className="page-shell">
      {success && (
        <div className="surface" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px' }}>
          ✓ {success}
        </div>
      )}

      <div className="surface profile-hero profile-v2">
        <div className="profile-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
        <div className="profile-copy">
          <span className="eyebrow dark">CAMPUS IDENTITY</span>
          <h1>{user.name}</h1>
          <p>
            {user.department} · Year {user.year} · {user.email}
          </p>
          <div className="profile-badges">
            <span className={`badge ${user.emailVerified ? 'success' : 'warn'}`}>
              {user.emailVerified ? '✓ College verified' : 'Verification pending'}
            </span>
            <span className="badge">★ {(user.reputationScore ?? 5).toFixed(1)} reputation</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '13px' }}
              onClick={() => {
                setEditing(true);
                setError('');
              }}
            >
              ✎ Edit Profile
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                color: '#dc2626',
                borderColor: '#fca5a5',
                background: '#fff'
              }}
              onClick={logout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
        <div className="trust-score">
          <small>CampusTrust</small>
          <strong>{trust}</strong>
          <span>/100</span>
          <div>
            <i style={{ width: `${trust}%` }} />
          </div>
          <span className="trust-tier">{tier}</span>
        </div>
      </div>

      {/* CampusShare Pro Banner / Membership Card */}
      <div
        className="surface"
        style={{
          background: user.isProMember
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)'
            : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: user.isProMember ? '#78350f' : '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: user.isProMember ? '2px solid #f59e0b' : 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            <strong style={{ fontSize: '1.2rem', color: user.isProMember ? '#92400e' : '#fbbf24' }}>
              {user.isProMember ? 'CampusShare Pro Active Member' : 'Upgrade to CampusShare Pro'}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: user.isProMember ? '#854d0e' : '#cbd5e1', lineHeight: 1.5 }}>
            {user.isProMember
              ? `You enjoy 0% platform fees on all rentals/sales and have ${user.freeBoostsAvailable || 0} free listing boost(s) remaining.`
              : 'Save money on every deal with 0% platform fees, get 1 free spotlight boost/month, and stand out with a verified Pro Crown badge!'}
          </p>
          {user.isProMember && user.proExpiresAt && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
              Pass valid until: {new Date(user.proExpiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setProModalOpen(true)}
          style={{
            background: user.isProMember
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 22px',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
            whiteSpace: 'nowrap'
          }}
        >
          {user.isProMember ? '👑 Extend Pro Pass' : '👑 Get Pro Pass (₹49/mo)'}
        </button>
      </div>

      {editing && (
        <div className="surface form-card" style={{ marginBottom: '24px', border: '2px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Edit Student Profile</h3>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              ✕ Close
            </button>
          </div>
          {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Contact Phone (10 digits)</label>
                <input
                  className="input"
                  name="contactNumber"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  placeholder="9876543210"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="label">Department / Branch</label>
                <input
                  className="input"
                  name="department"
                  placeholder="e.g. AIM & ACT, ECE, Biotech, WISDOM"
                  value={editForm.department}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Academic Year</label>
                <select
                  className="select"
                  name="year"
                  value={editForm.year}
                  onChange={handleEditChange}
                  required
                >
                  <option value="1">Year 1 (Freshman)</option>
                  <option value="2">Year 2 (Sophomore)</option>
                  <option value="3">Year 3 (Junior)</option>
                  <option value="4">Year 4 (Senior)</option>
                  <option value="5">Year 5 (Dual/PG)</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="label">Banasthali Hostel</label>
                <select
                  className="select"
                  name="hostelBlock"
                  value={editForm.hostelBlock}
                  onChange={handleEditChange}
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
                <label className="label">Room Number (optional)</label>
                <input
                  className="input"
                  name="roomNumber"
                  placeholder="e.g. 204, B-12"
                  value={editForm.roomNumber}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving changes…' : '✓ Save Profile'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stat-grid">
        <div className="surface stat-card">
          <small>Borrowed / Bought</small>
          <strong>{stats?.completedAsBorrower ?? 0}</strong>
          <span>completed transactions</span>
        </div>
        <div className="surface stat-card">
          <small>Lent out / Sold</small>
          <strong>{stats?.completedAsOwner ?? 0}</strong>
          <span>successful handovers</span>
        </div>
        <div className="surface stat-card">
          <small>Earned</small>
          <strong>₹{Math.round(stats?.totalEarnings ?? 0)}</strong>
          <span>from campus sharing</span>
        </div>
        <div className="surface stat-card impact">
          <small>Kept in use</small>
          <strong>{stats?.itemsKeptInUse ?? 0}</strong>
          <span>circular campus impact</span>
        </div>
      </div>

      <div className="profile-grid">
        <section className="surface detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Student profile</h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '13px', padding: '4px 8px' }}
              onClick={() => {
                setEditing(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              ✎ Edit
            </button>
          </div>
          <div className="form-grid profile-fields">
            <p>
              <b>Contact</b>
              <span>{user.contactNumber || 'Not added'}</span>
            </p>
            <p>
              <b>Hostel / room</b>
              <span>
                {user.hostelBlock ? `${user.hostelBlock} ${user.roomNumber || ''}` : 'Not added'}
              </span>
            </p>
            <p>
              <b>Department</b>
              <span>{user.department || 'Not added'} (Year {user.year})</span>
            </p>
            <p>
              <b>Reviews</b>
              <span>{user.totalReviews || 0} received</span>
            </p>
            <p>
              <b>Account Role</b>
              <span>{user.role}</span>
            </p>
          </div>
          <div className="review-strip">
            {reviews.length === 0 ? (
              <p className="muted">
                Complete a rental or purchase to start building verified peer reviews.
              </p>
            ) : (
              reviews.slice(0, 4).map((review) => (
                <div className="review-row" key={review.id}>
                  <div className="review-row-head">
                    <b>{review.reviewer?.name || 'Campus student'}</b>
                    <span className="rating">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface detail-card impact-card">
          <span className="eyebrow dark">SMART SAVINGS</span>
          <h3>Rental & Campus Impact</h3>
          <strong>₹{Math.round(stats?.estimatedMoneySaved ?? 0)}</strong>
          <p>estimated purchase cost avoided by borrowing instead of buying new.</p>
          <div className="impact-note">
            ♻ Every completed rental and second-hand exchange keeps useful items circulating on campus.
          </div>
        </section>
      </div>

      {/* Pro Membership Modal */}
      {proModalOpen && (
        <div className="modal-overlay" onClick={() => setProModalOpen(false)}>
          <div
            className="surface modal-card"
            style={{ maxWidth: '520px', borderRadius: '16px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>👑</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>CampusShare Pro Pass</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Zero fees, verified status & premium seller perks
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>👑 Pro Pass Benefits:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>
                <li><strong>0% Platform & Guarantee Fees</strong> on all rentals & purchases</li>
                <li><strong>1 Free Spotlight Listing Boost</strong> per month (Worth ₹29)</li>
                <li>👑 <strong>Campus Verified Pro Crown Badge</strong> on profile & items</li>
                <li>Priority customer support & instant deal dispute assistance</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Select Subscription Plan:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setProPlan('MONTHLY')}
                  style={{
                    border: proPlan === 'MONTHLY' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: proPlan === 'MONTHLY' ? '#fffbeb' : '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>1 Month Pass</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>₹49</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>1 Free Boost included</div>
                </div>

                <div
                  onClick={() => setProPlan('SEMESTER')}
                  style={{
                    border: proPlan === 'SEMESTER' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: proPlan === 'SEMESTER' ? '#fffbeb' : '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '-9px',
                    right: '10px',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    BEST VALUE (6 MO)
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Semester Pass</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706', margin: '4px 0' }}>₹99</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>3 Free Boosts included</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.82rem', color: '#166534' }}>
              💡 <strong>Instant Activation:</strong> 0% fees apply immediately on all your ongoing and future deals.
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setProModalOpen(false)}
                disabled={upgradingPro}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 22px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)'
                }}
                onClick={handleUpgradePro}
                disabled={upgradingPro}
              >
                {upgradingPro ? 'Activating Pro…' : `Pay ₹${proPlan === 'MONTHLY' ? 49 : 99} & Activate Pro 👑`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
