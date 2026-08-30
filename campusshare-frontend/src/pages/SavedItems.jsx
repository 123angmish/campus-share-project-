import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import './Home.css';

const categoryLabels = {
  ELECTRONICS: '⌁ Tech & Gadgets',
  CALCULATOR: '🔢 Scientific Calculator',
  BOOKS: '▤ Books & Notes',
  LAB_EQUIPMENT: '⌬ Lab & Engineering Gear',
  SPORTS: '◉ Sports & Fitness',
  CAMERA: '📷 Camera & Photography',
  LAPTOP_ACCESSORIES: '💻 Laptop Accessories',
  CYCLE: '🚲 Campus Cycles',
  PROJECT_COMPONENTS: '⚙️ Project Components',
  MUSICAL_INSTRUMENTS: '♫ Musical Instruments',
  HOSTEL_ESSENTIALS: '🏠 Hostel Essentials',
  STATIONERY: '✎ Stationery & Supplies',
  CLOTHING: '◇ Fashion & Formals',
  FURNITURE: '⌂ Furniture',
  OTHER: '✦ Other Finds'
};

export default function SavedItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/wishlist');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
      setError(err.response?.data?.message || 'Could not load your saved items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedItems();
  }, []);

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/wishlist/${itemId}`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Could not remove item from wishlist.');
    }
  };

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div>
          <span className="eyebrow dark">YOUR SHORTLIST</span>
          <h1>Saved for Later</h1>
          <p>Keep track of campus items you want to rent or buy.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state" style={{ padding: '60px 0', textAlign: 'center' }}>
          <h3>Loading saved items…</h3>
          <p className="muted">Retrieving your shortlist</p>
        </div>
      ) : error ? (
        <div className="surface empty-state" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="empty-icon">⚠️</div>
          <h3>{error}</h3>
          <button className="btn btn-primary" onClick={loadSavedItems} style={{ marginTop: '16px' }}>
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="surface empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="empty-icon">♡</div>
          <h3>Your wishlist is empty</h3>
          <p className="muted" style={{ maxWidth: '400px', margin: '8px auto 20px' }}>
            Browse the campus marketplace and tap the <strong>♡ Save</strong> button to keep items here for easy comparison.
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Marketplace →
          </Link>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div className="item-card" key={item.id} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <div className="item-image" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="placeholder-art" style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#f1f5f9' }}>
                      <span style={{ fontSize: '2.5rem' }}>📦</span>
                    </div>
                  )}
                  <span
                    className={`availability ${item.availabilityStatus === 'AVAILABLE' ? 'avail-yes' : 'avail-no'}`}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: item.availabilityStatus === 'AVAILABLE' ? '#ecfdf5' : '#fef3c7',
                      color: item.availabilityStatus === 'AVAILABLE' ? '#059669' : '#b45309'
                    }}
                  >
                    ● {item.availabilityStatus}
                  </span>
                </div>

                <div className="item-content" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="item-category" style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700 }}>
                      {categoryLabels[item.category] || item.category?.replaceAll('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.listingType}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px', fontWeight: 700 }}>{item.title}</h3>

                  {item.campusLocation && (
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px' }}>
                      📍 {item.campusLocation}
                    </p>
                  )}

                  <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto' }}>
                    <div>
                      {item.listingType === 'BUY' ? (
                        <>
                          <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{item.buyPrice}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>(Buy)</span>
                        </>
                      ) : item.listingType === 'BOTH' ? (
                        <>
                          <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{item.dailyPrice}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>/ day · or ₹{item.buyPrice} buy</span>
                        </>
                      ) : (
                        <>
                          <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>₹{item.dailyPrice}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>/ day</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>

              <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
                <Link
                  to={`/items/${item.id}`}
                  className="btn btn-outline"
                  style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '8px' }}
                >
                  View Item
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="btn btn-outline"
                  style={{ color: '#e11d48', borderColor: '#fecdd3', fontSize: '0.85rem', padding: '8px 12px' }}
                  title="Remove from saved"
                >
                  ♡ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
