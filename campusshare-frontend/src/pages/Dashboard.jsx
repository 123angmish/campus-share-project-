import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './Marketplace.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // UPI Payout / Withdrawal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }
    if (!withdrawUpi.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. yourname@upi).');
      return;
    }

    try {
      setWithdrawing(true);
      const res = await api.post('/users/withdraw-earnings', null, {
        params: {
          amount: withdrawAmount,
          upiId: withdrawUpi.trim()
        }
      });
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      alert(`💸 Payout Successful!\n\n${res.data.message}\nRef: ${res.data.payoutReference}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not process payout');
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .get('/dashboard/stats')
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h3>Loading your dashboard…</h3>
          <p className="muted">Retrieving your listings, rentals, and peer transactions</p>
        </div>
      </main>
    );
  }

  const stats = data || {};
  const activities = stats.recentActivity || [];
  const earnings = stats.monthlyEarnings || [];

  return (
    <main className="page-shell">
      {/* Welcome Banner */}
      <div className="surface profile-hero profile-v2" style={{ marginBottom: '24px' }}>
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        <div className="profile-copy">
          <span className="eyebrow dark">CAMPUS PEER-TO-PEER DASHBOARD</span>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
          <p>
            You can lend your idle essentials, borrow items for exams and projects, and track everything right here.
          </p>
          <div className="profile-badges" style={{ marginTop: '10px' }}>
            <span className="badge success">✓ Dual-Sided Member</span>
            <span className="badge">★ {(user?.reputationScore ?? 5.0).toFixed(1)} Reputation</span>
            <span className="badge neutral">{user?.department || 'Campus Student'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
          <Link to="/create-item" className="btn btn-primary" style={{ textAlign: 'center' }}>
            ＋ List an Item
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ textAlign: 'center' }}>
            Explore Marketplace →
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              textAlign: 'center',
              color: '#dc2626',
              borderColor: '#fca5a5',
              background: '#fff',
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
            onClick={logout}
          >
            🚪 Logout Account
          </button>
        </div>
      </div>

      {/* 8 Metric Summary Cards */}
      <div className="section-title">
        <div>
          <span className="eyebrow dark">METRICS & OVERVIEW</span>
          <h2>Marketplace Summary</h2>
        </div>
        <Link to="/activity" className="text-link">
          View Detailed Activity →
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="surface stat-card" style={{ padding: '20px' }}>
          <small style={{ color: '#6366f1', fontWeight: 600 }}>ITEMS I LISTED</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.itemsListedCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>active / available listings</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <small style={{ color: '#d97706', fontWeight: 600 }}>CURRENTLY RENTED OUT</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.currentlyRentedOutCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>lent out to other students</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <small style={{ color: '#2563eb', fontWeight: 600 }}>ITEMS I AM RENTING</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.itemsRentingCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>currently with you</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #ec4899' }}>
          <small style={{ color: '#db2777', fontWeight: 600 }}>PENDING REQUESTS</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.pendingRequestsCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>requiring your approval</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <small style={{ color: '#059669', fontWeight: 600 }}>COMPLETED RENTALS</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.completedRentalsCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>successful handovers & returns</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <small style={{ color: '#7c3aed', fontWeight: 600 }}>TOTAL SPENDING</small>
          <strong style={{ fontSize: '28px', margin: '4px 0', color: '#7c3aed' }}>₹{Math.round(stats.totalRentalSpending ?? 0)}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>spent borrowing essentials</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #059669' }}>
          <small style={{ color: '#059669', fontWeight: 600 }}>TOTAL EARNINGS</small>
          <strong style={{ fontSize: '28px', margin: '4px 0', color: '#059669' }}>₹{Math.round(stats.totalRentalEarnings ?? 0)}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>earned from idle items</span>
        </div>

        <div className="surface stat-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <small style={{ color: '#dc2626', fontWeight: 600 }}>WISHLIST ITEMS</small>
          <strong style={{ fontSize: '28px', margin: '4px 0' }}>{stats.wishlistCount ?? 0}</strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>saved campus finds</span>
        </div>
      </div>

      {/* Grid: Earnings Breakdown & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        
        {/* Monthly Earnings Chart */}
        <section className="surface detail-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="eyebrow dark">LENDER REVENUE</span>
              <h3 style={{ margin: '4px 0 0' }}>Monthly Earnings</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <strong style={{ fontSize: '20px', color: '#059669' }}>
                ₹{Math.round(stats.totalRentalEarnings ?? 0)} Total
              </strong>
              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount(String(Math.round(stats.totalRentalEarnings ?? 0) || ''));
                  setWithdrawModalOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>💸</span>
                <span>Withdraw to UPI</span>
              </button>
            </div>
          </div>

          <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
            Revenue generated by lending your items to fellow students (security deposits excluded).
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '10px 0', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
            {earnings.map((m) => {
              const maxAmount = Math.max(...earnings.map((e) => Number(e.amount || 0)), 500);
              const heightPct = Math.max(10, Math.round((Number(m.amount || 0) / maxAmount) * 100));

              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                    {Number(m.amount) > 0 ? `₹${m.amount}` : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      background: Number(m.amount) > 0 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${m.month}: ₹${m.amount} (${m.count} rentals)`}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{m.month.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>♻ Turn idle campus assets into steady side income</span>
            <Link to="/create-item" style={{ color: '#6366f1', fontWeight: 600 }}>+ List another item</Link>
          </div>
        </section>

        {/* Live Recent Activity Feed */}
        <section className="surface detail-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="eyebrow dark">TIMELINE</span>
              <h3 style={{ margin: '4px 0 0' }}>Recent Activity</h3>
            </div>
            <Link to="/activity" className="text-link" style={{ fontSize: '13px' }}>
              Full History →
            </Link>
          </div>

          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
              <p style={{ margin: 0 }}>No recent activities yet. Start by listing an item or exploring listings!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: item.type?.includes('PAYMENT')
                        ? '#ecfdf5'
                        : item.type?.includes('RENTAL')
                        ? '#eef2ff'
                        : '#fef3c7',
                      color: item.type?.includes('PAYMENT')
                        ? '#059669'
                        : item.type?.includes('RENTAL')
                        ? '#4f46e5'
                        : '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}
                  >
                    {item.type?.includes('PAYMENT') ? '₹' : item.type?.includes('SOLD') ? '🛍️' : '⏱️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.title}</strong>
                      <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
                      </small>
                    </div>
                    <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* UPI Withdrawal Modal */}
      {withdrawModalOpen && (
        <div className="modal-overlay" onClick={() => setWithdrawModalOpen(false)}>
          <div
            className="surface modal-card"
            style={{ maxWidth: '480px', borderRadius: '16px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>💸</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Instant UPI Payout</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Transfer your item rental & sale earnings directly to your bank account
                </p>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '12px', margin: '16px 0' }}>
              <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>AVAILABLE EARNED BALANCE:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                ₹{Math.round(stats.totalRentalEarnings ?? 0)}
              </div>
            </div>

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, Math.round(stats.totalRentalEarnings ?? 0))}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 500"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Your UPI ID (Google Pay, PhonePe, Paytm, BHIM)
                </label>
                <input
                  type="text"
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  🔒 Fast 2-5 min direct IMPS / UPI bank settlement
                </small>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setWithdrawModalOpen(false)}
                  disabled={withdrawing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Transferring…' : `Withdraw ₹${withdrawAmount || '0'} to UPI 💸`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
