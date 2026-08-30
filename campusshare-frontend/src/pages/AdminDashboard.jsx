import { useEffect, useState } from 'react';
import api from '../config/api';
import './Marketplace.css';

const apiMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  // Admin Payout State
  const [adminPayoutOpen, setAdminPayoutOpen] = useState(false);
  const [adminUpi, setAdminUpi] = useState('');
  const [adminAmount, setAdminAmount] = useState('');
  const [payoutBusy, setPayoutBusy] = useState(false);

  const load = async () => {
    try {
      const [dashboardResponse, reportResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/reports')
      ]);
      setDashboard(dashboardResponse.data);
      setReports(reportResponse.data.filter((report) => ['PENDING', 'INVESTIGATING'].includes(report.status)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moderate = async (report, status, action = 'NONE') => {
    const notes = status === 'DISMISSED'
      ? prompt('Optional note explaining why this report is being dismissed')
      : prompt('Add a short moderator note', action === 'NONE' ? 'Reviewed by admin' : `Reviewed and actioned: ${action.replaceAll('_', ' ').toLowerCase()}`);
    try {
      setBusy(report.id);
      await api.patch(`/admin/reports/${report.id}`, { status, action, adminNotes: notes || null });
      await load();
    } catch (error) {
      alert(apiMessage(error, 'Could not update moderation case'));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="loading-state">Loading admin console…</div>;

  const stats = [
    ['Users', dashboard?.totalUsers, `${dashboard?.verificationRate ?? 0}% verified · ${dashboard?.proUsersCount ?? 0} Pro`],
    ['Active rentals', dashboard?.activeRentals, `${dashboard?.completedRentals ?? 0} completed`],
    ['Captured GMV', `₹${Math.round(dashboard?.capturedRentalGmv ?? 0)}`, `${dashboard?.capturedPayments ?? 0} paid deals`],
    ['Platform Net Revenue', `₹${Math.round(dashboard?.totalPlatformRevenue ?? dashboard?.platformEarnings ?? 0)}`, `Fees + Boosts + Pro`]
  ];

  return <main className="page-shell">
    <div className="page-heading">
      <div>
        <span className="eyebrow dark">MONETIZATION & OPERATIONS</span>
        <h1>Admin console</h1>
        <p>Marketplace health, platform revenue breakdown, and Trust & Safety actions.</p>
      </div>
      <span className="badge danger">ADMIN ACCESS</span>
    </div>

    <div className="stat-grid">
      {stats.map(([label, value, note], index) => (
        <div className={`surface stat-card ${index === 3 ? 'metric-accent' : ''}`} key={label}>
          <small>{label}</small>
          <strong>{value ?? 0}</strong>
          <span>{note}</span>
        </div>
      ))}
    </div>

    {/* Platform Revenue Intelligence Box */}
    <div className="surface" style={{ padding: 22, marginBottom: 22, borderRadius: 14, border: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>💰</span> Platform Revenue & Monetization Channels
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
        <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>🛡️ Platform Transaction Fees (5%)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
            ₹{Math.round(dashboard?.platformFeeEarnings ?? 0)}
          </div>
        </div>

        <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>⚡ Spotlight Boost Sales (₹29-₹49)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            ₹{Math.round(dashboard?.boostEarnings ?? 0)}
          </div>
        </div>

        <div style={{ background: '#fdf2f8', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fce7f3' }}>
          <div style={{ fontSize: '0.8rem', color: '#9d174d', fontWeight: 600 }}>👑 CampusShare Pro Subscriptions</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#db2777', marginTop: '4px' }}>
            ₹{Math.round(dashboard?.proEarnings ?? 0)}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700 }}>Total Net Platform Earnings</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '4px' }}>
              ₹{Math.round(dashboard?.totalPlatformRevenue ?? dashboard?.platformEarnings ?? 0)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdminAmount(String(Math.round(dashboard?.totalPlatformRevenue ?? dashboard?.platformEarnings ?? 0) || ''));
              setAdminPayoutOpen(true);
            }}
            style={{
              marginTop: '10px',
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <span>💸</span>
            <span>Withdraw to Admin UPI</span>
          </button>
        </div>
      </div>
    </div>

    <div className="surface" style={{ padding: 18, marginBottom: 22 }}>
      <div className="rental-badges">
        <span className="badge success">{dashboard?.completionRate ?? 0}% lifecycle completion</span>
        <span className="badge">{dashboard?.flaggedReviews ?? 0} flagged reviews</span>
        <span className={`badge ${(dashboard?.webhookBacklog ?? 0) === 0 ? 'success' : 'warn'}`}>
          {(dashboard?.webhookBacklog ?? 0) === 0 ? 'Payment event queue healthy' : `${dashboard?.webhookBacklog} payment events need attention`}
        </span>
      </div>
    </div>

    <div className="page-heading"><div><h2>Moderation queue</h2><p>Community reports awaiting an admin decision.</p></div></div>
    {reports.length === 0 ? <div className="surface empty-state"><div className="empty-icon">✓</div><h3>Queue cleared</h3><p>No pending Trust & Safety cases.</p></div> : <div className="cards-list">
      {reports.map((report) => <div className="surface admin-report" key={report.id}>
        <div className="admin-report-top">
          <div><span className="badge warn">{report.reportType}</span><h3 style={{ marginTop: 10 }}>Case #{report.id}</h3></div>
          <span className="badge">{report.status}</span>
        </div>
        <p>{report.reason}</p>
        <small className="muted">Reported by {report.reporter?.name || 'Student'} · {new Date(report.createdAt).toLocaleString()}</small>
        {report.reportedItem && <p className="muted"><b>Listing:</b> {report.reportedItem.title} · owner {report.reportedItem.owner?.name}</p>}
        {report.reportedUser && <p className="muted"><b>User:</b> {report.reportedUser.name} · ★ {(report.reportedUser.reputationScore ?? 5).toFixed(1)}</p>}
        <div className="admin-actions">
          <button className="btn btn-secondary" disabled={busy === report.id} onClick={() => moderate(report, 'INVESTIGATING')}>Mark investigating</button>
          {report.reportType === 'ITEM' && <button className="btn btn-danger" disabled={busy === report.id} onClick={() => moderate(report, 'RESOLVED', 'FLAG_ITEM')}>Resolve + hide listing</button>}
          {report.reportType === 'USER' && <button className="btn btn-danger" disabled={busy === report.id} onClick={() => moderate(report, 'RESOLVED', 'DEACTIVATE_USER')}>Resolve + deactivate</button>}
          <button className="btn btn-secondary" disabled={busy === report.id} onClick={() => moderate(report, 'DISMISSED')}>Dismiss</button>
        </div>
      </div>)}
    </div>}

    {/* Admin Payout Modal */}
    {adminPayoutOpen && (
      <div className="modal-overlay" onClick={() => setAdminPayoutOpen(false)}>
        <div
          className="surface modal-card"
          style={{ maxWidth: '480px', borderRadius: '16px', padding: '28px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>💰</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Platform Revenue Settlement</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Transfer platform fees, boost sales, and Pro earnings to your admin bank account
              </p>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '12px', margin: '16px 0' }}>
            <div style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>TOTAL NET PLATFORM REVENUE:</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
              ₹{Math.round(dashboard?.totalPlatformRevenue ?? dashboard?.platformEarnings ?? 0)}
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!adminAmount || Number(adminAmount) <= 0) {
              alert('Please enter a valid payout amount');
              return;
            }
            if (!adminUpi.includes('@')) {
              alert('Please enter a valid UPI ID (e.g. founder@okaxis)');
              return;
            }

            try {
              setPayoutBusy(true);
              const res = await api.post('/users/withdraw-earnings', null, {
                params: {
                  amount: adminAmount,
                  upiId: adminUpi.trim()
                }
              });
              setAdminPayoutOpen(false);
              setAdminAmount('');
              alert(`💰 Admin Settlement Successful!\n\n${res.data.message}\nRef: ${res.data.payoutReference}`);
              await load();
            } catch (err) {
              alert(err.response?.data?.message || 'Could not process admin payout');
            } finally {
              setPayoutBusy(false);
            }
          }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, Math.round(dashboard?.totalPlatformRevenue ?? dashboard?.platformEarnings ?? 0))}
                value={adminAmount}
                onChange={(e) => setAdminAmount(e.target.value)}
                placeholder="e.g. 1000"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Admin UPI ID (Google Pay, PhonePe, Paytm, BHIM)
              </label>
              <input
                type="text"
                value={adminUpi}
                onChange={(e) => setAdminUpi(e.target.value)}
                placeholder="e.g. angel@okaxis or 9876543210@paytm"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                🔒 Direct founder IMPS settlement to your linked bank account
              </small>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setAdminPayoutOpen(false)}
                disabled={payoutBusy}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
                }}
                disabled={payoutBusy}
              >
                {payoutBusy ? 'Settling…' : `Settle ₹${adminAmount || '0'} to UPI 💰`}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </main>;
}
