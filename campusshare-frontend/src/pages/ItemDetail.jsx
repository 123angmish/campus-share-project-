import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './ItemDetail.css';

const categoryMeta = {
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

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('rent'); // 'rent' | 'buy'
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [rentalData, setRentalData] = useState({ startDate: today, endDate: tomorrow, message: '' });
  const [buyMessage, setBuyMessage] = useState('');
  const [pickupSpot, setPickupSpot] = useState('');
  const [meetingTime, setMeetingTime] = useState('2:30 PM');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('ITEM');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/items/${id}`);
        if (isMounted) {
          setItem(res.data);
          if (res.data.pickupLocation) {
            setPickupSpot(res.data.pickupLocation);
          }
          if (res.data.listingType === 'BUY') {
            setActiveTab('buy');
          } else {
            setActiveTab('rent');
          }

          // Smart default rental end date within allowed max rental days
          const maxAllowed = res.data.maxRentalDays || 30;
          const defaultDuration = Math.min(3, maxAllowed);
          const defaultEndDate = new Date(Date.now() + defaultDuration * 86400000).toISOString().split('T')[0];
          setRentalData(prev => ({
            ...prev,
            startDate: today,
            endDate: defaultEndDate
          }));
        }
        try {
          const wish = await api.get(`/wishlist/${id}/status`);
          if (isMounted) {
            setSaved(Boolean(wish.data?.saved));
          }
        } catch {
          if (isMounted) setSaved(false);
        }
      } catch (err) {
        console.error('Failed to load item:', err);
        if (isMounted) {
          setError(err.response?.data?.message || 'Item could not be found or has been removed.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchListing();
    return () => {
      isMounted = false;
    };
  }, [id, today]);

  const days = useMemo(() => {
    if (!rentalData.startDate || !rentalData.endDate) return 0;
    const start = new Date(rentalData.startDate);
    const end = new Date(rentalData.endDate);
    if (end < start) return 0;
    const diff = end - start;
    const calcDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return calcDays === 0 ? 1 : calcDays;
  }, [rentalData]);

  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostDays, setBoostDays] = useState(3);
  const [boostPaymentMethod, setBoostPaymentMethod] = useState(user?.freeBoostsAvailable > 0 ? 'FREE_PRO_BOOST' : 'UPI');
  const [boosting, setBoosting] = useState(false);

  const isPro = Boolean(user?.isProMember);

  const rentEstimate = useMemo(() => {
    if (!item || days <= 0) return 0;
    if (days >= 7 && item.weeklyPrice) {
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      return weeks * Number(item.weeklyPrice) + remDays * Number(item.dailyPrice || 0);
    }
    return days * Number(item.dailyPrice || 0);
  }, [days, item]);

  const platformFeeRent = useMemo(() => {
    if (isPro) return 0;
    if (rentEstimate <= 0) return 0;
    const raw = Math.round(rentEstimate * 0.05);
    return Math.max(10, Math.min(150, raw));
  }, [rentEstimate, isPro]);

  const platformFeeBuy = useMemo(() => {
    if (isPro) return 0;
    if (!item?.buyPrice) return 0;
    const raw = Math.round(Number(item.buyPrice) * 0.05);
    return Math.max(10, Math.min(150, raw));
  }, [item, isPro]);

  const handleBoostListing = async () => {
    try {
      setBoosting(true);
      const res = await api.post(`/items/${item.id}/boost`, null, {
        params: {
          days: boostDays,
          paymentMethod: boostPaymentMethod
        }
      });
      setItem(res.data);
      setBoostModalOpen(false);
      alert(`⚡ Awesome! "${item.title}" is now featured on the top of campus for ${boostDays} days!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not boost listing');
    } finally {
      setBoosting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-state" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h3>Loading item details…</h3>
          <p className="muted">Retrieving verified campus listing</p>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="page-shell">
        <div className="surface empty-state" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
          <div className="empty-icon">⚠️</div>
          <h2>{error || 'Listing not found'}</h2>
          <p className="muted">This listing may have been removed or is no longer available.</p>
          <Link className="btn btn-primary" to="/" style={{ marginTop: '16px', display: 'inline-block' }}>
            ← Return to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  // Owner detection check: strictly match logged-in user ID with listing owner ID
  const currentUserId = user?.id || user?.userId;
  const ownerId = item?.owner?.id || item?.ownerId;
  const isOwner = Boolean(
    currentUserId && ownerId && Number(currentUserId) === Number(ownerId)
  );

  const canRent = item.listingType !== 'BUY';
  const canBuy = item.listingType === 'BUY' || item.listingType === 'BOTH';

  const toggleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/wishlist/${id}`);
        setSaved(false);
      } else {
        await api.post(`/wishlist/${id}`);
        setSaved(true);
      }
    } catch (e) {
      console.error('Wishlist toggle error:', e);
    }
  };

  const submitReport = async () => {
    if (reportReason.trim().length < 10) {
      alert('Please provide at least 10 characters of context for the moderation team.');
      return;
    }
    try {
      setReporting(true);
      await api.post('/reports', {
        reportType,
        targetId: reportType === 'ITEM' ? item.id : item.owner.id,
        reason: reportReason.trim()
      });
      setReportOpen(false);
      setReportReason('');
      alert('Report submitted to campus moderation.');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit report');
    } finally {
      setReporting(false);
    }
  };

  const submitRental = async (e) => {
    e.preventDefault();
    setRequestError('');
    if (days < 1) {
      setRequestError('Rental duration must be at least 1 day.');
      return;
    }
    if (item.minRentalDays && days < item.minRentalDays) {
      setRequestError(`Minimum rental duration is ${item.minRentalDays} day(s).`);
      return;
    }
    if (item.maxRentalDays && days > item.maxRentalDays) {
      setRequestError(`Maximum rental duration is ${item.maxRentalDays} day(s).`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/rentals/request', {
        itemId: item.id,
        startDate: rentalData.startDate,
        endDate: rentalData.endDate,
        pickupLocation: pickupSpot || item.pickupLocation || 'Campus Point',
        meetingTime: meetingTime || 'Flexible',
        message: rentalData.message || null
      });
      navigate('/activity');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.message || 'Could not send rental request');
      setRequestError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const submitPurchase = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setRequestError('');
      await api.post('/rentals/purchase-request', {
        itemId: item.id,
        pickupLocation: pickupSpot || item.pickupLocation || 'Campus Point',
        meetingTime: meetingTime || 'Flexible',
        message: buyMessage || null
      });
      navigate('/activity');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.message || 'Could not send purchase request');
      setRequestError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const photos = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [];

  const getConditionLabel = () => {
    switch (item.condition) {
      case 'NEW':
        return 'Brand New (Unused)';
      case 'LIKE_NEW':
        return 'Like New (Mint)';
      case 'FAIR':
        return 'Fair (Minor Wear)';
      default:
        return 'Good Condition';
    }
  };

  return (
    <main className="page-shell">
      <div className="item-detail-container">
        {/* Breadcrumb Navigation */}
        <div className="item-detail-breadcrumb">
          <Link to="/">Marketplace</Link>
          <span className="sep">›</span>
          <span>{item.category ? item.category.replaceAll('_', ' ') : 'All Items'}</span>
          <span className="sep">›</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.title}</span>
        </div>

        {/* 2-Column Main Layout */}
        <div className="item-detail-layout">
          {/* Left Column: Visuals, Specs, Owner Info */}
          <div className="item-detail-main">
            {/* Gallery Card */}
            <div className="gallery-card">
              <div className="gallery-viewport">
                {/* Badges on Top Left */}
                <div className="gallery-badge-overlay">
                  {item.isFeatured && (
                    <span
                      className="gallery-badge"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
                      }}
                    >
                      ⚡ CAMPUS SPOTLIGHT
                    </span>
                  )}

                  <span
                    className={`gallery-badge ${
                      item.listingType === 'BUY'
                        ? 'type-buy'
                        : item.listingType === 'BOTH'
                        ? 'type-both'
                        : 'type-rent'
                    }`}
                  >
                    {item.listingType === 'BUY'
                      ? 'FOR SALE'
                      : item.listingType === 'BOTH'
                      ? 'RENT & BUY'
                      : 'FOR RENT'}
                  </span>

                  <span
                    className={`gallery-badge ${
                      item.availabilityStatus === 'AVAILABLE' ? 'status-avail' : 'status-other'
                    }`}
                  >
                    ● {item.availabilityStatus}
                  </span>
                </div>

                {/* Save Heart Button */}
                <button
                  type="button"
                  className={`gallery-save-btn ${saved ? 'saved' : ''}`}
                  onClick={toggleSave}
                >
                  {saved ? '❤️ Saved' : '♡ Save'}
                </button>

                {/* Main Photo or Placeholder */}
                {photos.length > 0 && photos[selectedImage] ? (
                  <img
                    src={photos[selectedImage]}
                    alt={item.title}
                    className="gallery-main-img"
                  />
                ) : (
                  <div className="gallery-placeholder">
                    <span className="placeholder-icon">📦</span>
                    <strong>{categoryMeta[item.category] || 'Campus Item'}</strong>
                    <small>No image uploaded by student</small>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="gallery-thumbs">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`gallery-thumb-btn ${selectedImage === i ? 'active' : ''}`}
                      onClick={() => setSelectedImage(i)}
                    >
                      <img src={url} alt={`Thumbnail ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details & Specifications Card */}
            <div className="product-info-card">
              <div className="product-meta-row">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="category-pill">{item.category?.replaceAll('_', ' ')}</span>
                  <span className="condition-pill">🏷️ {getConditionLabel()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700 }}>
                  ★ {(item.owner?.reputationScore ?? 5.0).toFixed(1)} Campus Reputation
                </div>
              </div>

              <h1 className="product-title">{item.title}</h1>

              <p className="product-description">
                {item.description || 'Verified student item available on campus.'}
              </p>

              {/* Specifications Bento Grid */}
              <div className="specs-grid">
                {(item.brand || item.model) && (
                  <div className="spec-box">
                    <span className="label">Brand / Model</span>
                    <span className="value">
                      {item.brand ? item.brand : ''}
                      {item.model ? ` (${item.model})` : ''}
                    </span>
                  </div>
                )}

                {item.campusLocation && (
                  <div className="spec-box">
                    <span className="label">Campus Area</span>
                    <span className="value">📍 {item.campusLocation}</span>
                  </div>
                )}

                {item.pickupLocation && (
                  <div className="spec-box">
                    <span className="label">Pickup Spot</span>
                    <span className="value">🏫 {item.pickupLocation}</span>
                  </div>
                )}

                {canRent && (
                  <div className="spec-box">
                    <span className="label">Rental Period</span>
                    <span className="value">
                      {item.minRentalDays || 1} to {item.maxRentalDays || 30} days
                    </span>
                  </div>
                )}

                {item.replacementValue && (
                  <div className="spec-box">
                    <span className="label">Replacement Value</span>
                    <span className="value">₹{item.replacementValue}</span>
                  </div>
                )}
              </div>

              {/* Verified Owner Card */}
              <div className="owner-card-preview">
                <div className="owner-avatar-circle">
                  {item.owner?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="owner-info">
                  <div className="owner-name-line">
                    <h4>{item.owner?.name || 'Campus Student'}</h4>
                    {item.owner?.emailVerified && (
                      <span className="verified-badge">✓ Verified Student</span>
                    )}
                  </div>
                  <p className="owner-details-sub">
                    {item.owner?.department ? `${item.owner.department} · ` : ''}
                    {item.owner?.year ? `Year ${item.owner.year}` : 'Student'}
                  </p>
                  <div className="owner-reputation">
                    <span>★ {(item.owner?.reputationScore ?? 5.0).toFixed(1)} Rating</span>
                    <span className="rev-count">({item.owner?.totalReviews || 0} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Trust Guarantee Banner */}
              <div className="trust-guarantee-card" style={{ marginTop: '20px' }}>
                <span className="trust-icon">🛡️</span>
                <div>
                  <strong>CampusTrust Handover Protection</strong>
                  <p style={{ margin: '2px 0 0', opacity: 0.9 }}>
                    Meet safely on campus, inspect the item in person, verify through double-confirmation, and pay directly via UPI/Cash.
                  </p>
                </div>
              </div>

              {/* Report button */}
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="text-btn report-trigger"
                  onClick={() => setReportOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  🚩 Report this listing or student
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking & Action Sidebar */}
          <div className="item-detail-sidebar">
            {isOwner ? (
              /* Owner Mode Management Card */
              <div className="owner-action-card">
                <div className="owner-badge-header">
                  <span>👤</span>
                  <span>YOUR LISTING</span>
                </div>
                <h3 className="owner-mgmt-title">You Own This Listing</h3>
                <p className="owner-mgmt-desc">
                  This item is published under your account. You can update the price, photos, or check incoming requests.
                </p>

                <div className="owner-buttons-stack">
                  {item.isFeatured ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#92400e',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>⚡</span>
                      <div>
                        <div>CAMPUS SPOTLIGHT ACTIVE</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#b45309' }}>
                          Featured until {item.featuredUntil ? new Date(item.featuredUntil).toLocaleDateString() : 'Active'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBoostModalOpen(true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>⚡</span>
                      <span>Boost Listing to Top (From ₹29)</span>
                    </button>
                  )}
                  <Link to={`/items/${item.id}/edit`} className="btn-owner-edit">
                    ✎ Edit Listing Details
                  </Link>
                  <Link to="/activity" className="btn-owner-activity">
                    📋 View Requests & Activity Hub
                  </Link>
                </div>

                <div className="pricing-breakdown-box" style={{ marginTop: '20px' }}>
                  <div className="pricing-row">
                    <span>Listing Type:</span>
                    <strong>{item.listingType}</strong>
                  </div>
                  {canRent && (
                    <div className="pricing-row">
                      <span>Daily Rental Rate:</span>
                      <strong>₹{item.dailyPrice} / day</strong>
                    </div>
                  )}
                  {canBuy && (
                    <div className="pricing-row">
                      <span>Sale Price:</span>
                      <strong>₹{item.buyPrice}</strong>
                    </div>
                  )}
                  <div className="pricing-row">
                    <span>Current Status:</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{item.availabilityStatus}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Buyer / Renter Booking Card */
              <div className="action-booking-card">
                {/* Segmented Switcher for BOTH items */}
                {item.listingType === 'BOTH' && (
                  <div className="action-mode-switcher">
                    <button
                      type="button"
                      className={`mode-tab-btn ${activeTab === 'rent' ? 'active' : ''}`}
                      onClick={() => setActiveTab('rent')}
                    >
                      🔄 Rent Item
                    </button>
                    <button
                      type="button"
                      className={`mode-tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
                      onClick={() => setActiveTab('buy')}
                    >
                      🏷 Buy Item
                    </button>
                  </div>
                )}

                {requestError && (
                  <div className="auth-error" style={{ marginBottom: '16px' }}>
                    {requestError}
                  </div>
                )}

                {/* Rental Flow Form */}
                {activeTab === 'rent' && canRent && (
                  <form onSubmit={submitRental}>
                    <div className="sidebar-price-header">
                      <span className="main-price">₹{item.dailyPrice}</span>
                      <span className="price-suffix">/ day</span>
                      {item.weeklyPrice && (
                        <span className="weekly-deal-tag">
                          · ₹{item.weeklyPrice}/wk
                        </span>
                      )}
                    </div>

                    <div className="date-inputs-grid" style={{ marginTop: '12px' }}>
                      <div className="booking-form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={rentalData.startDate}
                          min={today}
                          max={item.availEndDate || undefined}
                          onChange={(e) => setRentalData({ ...rentalData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="booking-form-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          value={rentalData.endDate}
                          min={rentalData.startDate || today}
                          max={
                            item.availEndDate ||
                            (rentalData.startDate && item.maxRentalDays
                              ? new Date(new Date(rentalData.startDate).getTime() + (item.maxRentalDays - 1) * 86400000).toISOString().split('T')[0]
                              : undefined)
                          }
                          onChange={(e) => setRentalData({ ...rentalData, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="date-inputs-grid" style={{ marginTop: '8px' }}>
                      <div className="booking-form-group">
                        <label>📍 Preferred Pickup Spot</label>
                        <input
                          type="text"
                          placeholder="e.g. Library / Canteen / Hostel"
                          value={pickupSpot}
                          onChange={(e) => setPickupSpot(e.target.value)}
                          required
                        />
                      </div>
                      <div className="booking-form-group">
                        <label>⏰ Preferred Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 2:30 PM / Evening"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="booking-form-group">
                      <label>Optional Note to {item.owner?.name?.split(' ')[0] || 'Owner'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Need for lab exam on Thursday"
                        value={rentalData.message}
                        onChange={(e) => setRentalData({ ...rentalData, message: e.target.value })}
                      />
                    </div>

                    <div className="pricing-breakdown-box">
                      <div className="pricing-row">
                        <span>Rent Duration ({days} day{days > 1 ? 's' : ''})</span>
                        <span>₹{rentEstimate}</span>
                      </div>
                      <div className="pricing-row">
                        <span>
                          🛡️ Platform Fee
                          {isPro && <span style={{ color: '#059669', fontWeight: 700, marginLeft: '4px' }}> (👑 Pro 0%)</span>}
                        </span>
                        <span style={{ color: isPro ? '#059669' : '#4f46e5', fontWeight: 600 }}>
                          {isPro ? '₹0' : `+ ₹${platformFeeRent}`}
                        </span>
                      </div>
                      {Number(item.depositAmount || 0) > 0 && (
                        <div className="pricing-row">
                          <span>Security Deposit (Refundable)</span>
                          <span>+ ₹{item.depositAmount}</span>
                        </div>
                      )}
                      <div className="pricing-row total-row">
                        <span>Total Payable Amount</span>
                        <span className="total-price-val">
                          ₹{rentEstimate + (isPro ? 0 : platformFeeRent) + Number(item.depositAmount || 0)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-action"
                      disabled={submitting || item.availabilityStatus !== 'AVAILABLE'}
                    >
                      {submitting ? 'Sending Request…' : 'Request to Rent →'}
                    </button>

                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginTop: '12px',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        lineHeight: '1.4'
                      }}
                    >
                      🔒 <strong>Authoritative Backend Pricing:</strong> Final amount is calculated securely by CampusShare backend. Payment is completed directly between students after the handover is confirmed.
                    </div>

                    <p className="booking-hint-text">
                      🤝 Handover spot & time are shared upfront. Once owner accepts, chat in-app and confirm deal with 1 click!
                    </p>
                  </form>
                )}

                {/* Purchase Flow Form */}
                {activeTab === 'buy' && canBuy && (
                  <form onSubmit={submitPurchase}>
                    <div className="sidebar-price-header">
                      <span className="main-price">₹{item.buyPrice}</span>
                      <span className="price-suffix">(Direct Ownership)</span>
                    </div>

                    <div className="date-inputs-grid" style={{ marginTop: '12px' }}>
                      <div className="booking-form-group">
                        <label>📍 Preferred Handover Spot</label>
                        <input
                          type="text"
                          placeholder="e.g. Central Library / Canteen"
                          value={pickupSpot}
                          onChange={(e) => setPickupSpot(e.target.value)}
                          required
                        />
                      </div>
                      <div className="booking-form-group">
                        <label>⏰ Preferred Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 2:30 PM / Today"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="booking-form-group">
                      <label>Optional Note to Seller</label>
                      <input
                        type="text"
                        placeholder="e.g. Looking forward to meeting on campus!"
                        value={buyMessage}
                        onChange={(e) => setBuyMessage(e.target.value)}
                      />
                    </div>

                    <div className="pricing-breakdown-box">
                      <div className="pricing-row">
                        <span>Item Purchase Price</span>
                        <span>₹{item.buyPrice}</span>
                      </div>
                      <div className="pricing-row">
                        <span>
                          🛡️ Platform Fee
                          {isPro && <span style={{ color: '#059669', fontWeight: 700, marginLeft: '4px' }}> (👑 Pro 0%)</span>}
                        </span>
                        <span style={{ color: isPro ? '#059669' : '#4f46e5', fontWeight: 600 }}>
                          {isPro ? '₹0' : `+ ₹${platformFeeBuy}`}
                        </span>
                      </div>
                      <div className="pricing-row total-row">
                        <span>Total Payable Amount</span>
                        <span className="total-price-val">₹{Number(item.buyPrice) + (isPro ? 0 : platformFeeBuy)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-action"
                      disabled={submitting || item.availabilityStatus !== 'AVAILABLE'}
                    >
                      {submitting ? 'Sending Request…' : 'Request to Buy →'}
                    </button>

                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginTop: '12px',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        lineHeight: '1.4'
                      }}
                    >
                      🔒 <strong>Authoritative Backend Pricing:</strong> Final amount is calculated securely by CampusShare backend. Payment is completed directly between students after the handover is confirmed.
                    </div>

                    <p className="booking-hint-text">
                      🤝 Handover spot & time are shared upfront. Once seller accepts, chat in-app and confirm deal with 1 click!
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boost Listing Modal */}
      {boostModalOpen && (
        <div className="modal-overlay" onClick={() => setBoostModalOpen(false)}>
          <div
            className="surface modal-card"
            style={{ maxWidth: '520px', borderRadius: '16px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>⚡</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Campus Spotlight Boost</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Pin your listing to the top of Discover & Category searches
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>⚡ What You Get:</div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Pinned at the <strong>very top</strong> of search results</li>
                <li>Eye-catching <strong>⚡ SPOTLIGHT</strong> badge & glowing border</li>
                <li><strong>3x–5x more requests</strong> and faster deals</li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Select Boost Duration:
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
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick Sale</div>
                </div>

                <div
                  onClick={() => setBoostDays(7)}
                  style={{
                    border: boostDays === 7 ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: boostDays === 7 ? '#fffbeb' : '#ffffff',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    POPULAR
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>🔥 7 Days Mega Boost</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>₹49</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Maximum Leads</div>
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
                    name="boostPayment"
                    checked={boostPaymentMethod === 'FREE_PRO_BOOST'}
                    onChange={() => setBoostPaymentMethod('FREE_PRO_BOOST')}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                    👑 Use 1 Free Pro Boost ({user.freeBoostsAvailable} remaining)
                  </span>
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="boostPayment"
                  checked={boostPaymentMethod === 'UPI'}
                  onChange={() => setBoostPaymentMethod('UPI')}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  📱 UPI / QR Code (Google Pay, PhonePe, Paytm)
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="boostPayment"
                  checked={boostPaymentMethod === 'CARD'}
                  onChange={() => setBoostPaymentMethod('CARD')}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  💳 Debit / Credit Card / Net Banking
                </span>
              </label>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setBoostModalOpen(false)}
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
                  padding: '12px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                }}
                onClick={handleBoostListing}
                disabled={boosting}
              >
                {boosting
                  ? 'Activating Boost…'
                  : boostPaymentMethod === 'FREE_PRO_BOOST'
                  ? 'Activate Free Boost ⚡'
                  : `Pay ₹${boostDays === 3 ? 29 : 49} & Activate ⚡`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="modal-overlay" onClick={() => setReportOpen(false)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>🚩 Report to Campus Moderation</h3>
            <p className="muted">Help keep CampusShare a safe peer-to-peer student community.</p>

            <div className="booking-form-group" style={{ marginTop: '16px' }}>
              <label>Report Target</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="ITEM">Listing: "{item.title}"</option>
                <option value="USER">User: {item.owner?.name}</option>
              </select>
            </div>

            <div className="booking-form-group">
              <label>Reason & Context</label>
              <textarea
                rows="4"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                placeholder="Explain the issue (e.g., fraudulent listing, damaged goods, inappropriate communication)…"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setReportOpen(false)}
                disabled={reporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitReport}
                disabled={reporting}
              >
                {reporting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
