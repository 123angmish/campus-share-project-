import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import './Marketplace.css';

export default function MyItems() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Boost Modal State
  const [selectedItemForBoost, setSelectedItemForBoost] = useState(null);
  const [boostDays, setBoostDays] = useState(3);
  const [boostPaymentMethod, setBoostPaymentMethod] = useState(user?.freeBoostsAvailable > 0 ? 'FREE_PRO_BOOST' : 'UPI');
  const [boosting, setBoosting] = useState(false);

  const load = () =>
    api
      .get('/items/my-items')
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const del = async (id) => {
    if (!confirm('Archive this listing? It will stop appearing in the marketplace.')) return;
    await api.delete(`/items/${id}`);
    setItems(items.filter((i) => i.id !== id));
  };

  const handleBoost = async () => {
    if (!selectedItemForBoost) return;
    try {
      setBoosting(true);
      await api.post(`/items/${selectedItemForBoost.id}/boost`, null, {
        params: {
          days: boostDays,
          paymentMethod: boostPaymentMethod
        }
      });
      setSelectedItemForBoost(null);
      alert(`⚡ Awesome! "${selectedItemForBoost.title}" is now boosted on top of campus!`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not boost listing');
    } finally {
      setBoosting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'SOLD':
        return 'danger';
      case 'RENTED':
        return 'warn';
      default:
        return 'neutral';
    }
  };

  const getListingTypeLabel = (type) => {
    switch (type) {
      case 'BUY':
        return 'FOR SALE';
      case 'BOTH':
        return 'RENT & BUY';
      default:
        return 'FOR RENT';
    }
  };

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div>
          <span className="eyebrow dark">SELLER & LENDER HUB</span>
          <h1>My items</h1>
          <p>Manage, edit prices/photos, or boost visibility of your listed campus items.</p>
        </div>
        <Link className="btn btn-primary" to="/create-item">
          ＋ New listing
        </Link>
      </div>

      {loading ? (
        <div className="loading-state">Loading your listings…</div>
      ) : items.length === 0 ? (
        <div className="surface empty-state">
          <div className="empty-icon">＋</div>
          <h3>No listings yet</h3>
          <p>List something useful for rent or direct sale to start earning on campus.</p>
          <Link className="btn btn-primary" to="/create-item" style={{ marginTop: '12px' }}>
            List an item
          </Link>
        </div>
      ) : (
        <div className="cards-list">
          {items.map((i) => (
            <div
              className="surface list-card"
              key={i.id}
              style={{
                border: i.isFeatured ? '2px solid #f59e0b' : '1px solid var(--border)',
                position: 'relative'
              }}
            >
              <div className="list-thumb">
                {i.imageUrls?.length ? (
                  <img
                    src={i.imageUrls[0]}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  '⌁'
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="rental-badges">
                  {i.isFeatured && (
                    <span
                      className="badge"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        border: 'none'
                      }}
                    >
                      ⚡ SPOTLIGHT (Top of Campus)
                    </span>
                  )}
                  <span className={`badge ${getStatusBadgeClass(i.availabilityStatus)}`}>
                    ● {i.availabilityStatus}
                  </span>
                  <span className="badge">{getListingTypeLabel(i.listingType)}</span>
                  {i.flagged && <span className="badge danger">UNDER REVIEW</span>}
                </div>
                <h3>{i.title}</h3>
                <p>
                  {i.category?.replaceAll('_', ' ')} ·{' '}
                  {i.listingType === 'BUY'
                    ? `₹${i.buyPrice} (Buy)`
                    : i.listingType === 'BOTH'
                    ? `₹${i.dailyPrice}/day · ₹${i.buyPrice} (Buy)`
                    : `₹${i.dailyPrice}/day`}
                  {' '}· {i.viewCount || 0} views
                </p>
                {i.flagged && (
                  <p className="muted">Moderation: {i.flagReason || 'Listing is being reviewed'}</p>
                )}
              </div>
              <div className="list-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!i.isFeatured && i.availabilityStatus === 'AVAILABLE' && (
                  <button
                    type="button"
                    onClick={() => setSelectedItemForBoost(i)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>⚡</span>
                    <span>Boost (₹29)</span>
                  </button>
                )}
                <Link className="btn btn-primary" to={`/items/${i.id}/edit`}>
                  ✎ Edit
                </Link>
                {!i.flagged && (
                  <Link className="btn btn-ghost" to={`/items/${i.id}`}>
                    View
                  </Link>
                )}
                <button className="btn btn-danger" onClick={() => del(i.id)}>
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Boost Modal */}
      {selectedItemForBoost && (
        <div className="modal-overlay" onClick={() => setSelectedItemForBoost(null)}>
          <div
            className="surface modal-card"
            style={{ maxWidth: '500px', borderRadius: '16px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>⚡</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  Boost "{selectedItemForBoost.title}"
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Pin to top of search results for maximum views
                </p>
              </div>
            </div>

            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Select Duration:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setBoostDays(3)}
                  style={{
                    border: boostDays === 3 ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: boostDays === 3 ? '#fffbeb' : '#ffffff',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>⚡ 3 Days Spotlight</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>₹29</div>
                </div>

                <div
                  onClick={() => setBoostDays(7)}
                  style={{
                    border: boostDays === 7 ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: boostDays === 7 ? '#fffbeb' : '#ffffff',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>🔥 7 Days Mega Boost</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>₹49</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Payment Method:
              </label>
              {user?.freeBoostsAvailable > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="boostPaymentMyItems"
                    checked={boostPaymentMethod === 'FREE_PRO_BOOST'}
                    onChange={() => setBoostPaymentMethod('FREE_PRO_BOOST')}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                    👑 Use Free Pro Boost ({user.freeBoostsAvailable} remaining)
                  </span>
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="boostPaymentMyItems"
                  checked={boostPaymentMethod === 'UPI'}
                  onChange={() => setBoostPaymentMethod('UPI')}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  📱 UPI (Google Pay, PhonePe, Paytm)
                </span>
              </label>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedItemForBoost(null)}
                disabled={boosting}
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
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={handleBoost}
                disabled={boosting}
              >
                {boosting ? 'Boosting…' : `Pay ₹${boostDays === 3 ? 29 : 49} & Boost ⚡`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
