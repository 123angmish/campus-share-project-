import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import ImageUploader from '../components/ImageUploader';
import './Marketplace.css';

const categories = [
  'ELECTRONICS',
  'CALCULATOR',
  'BOOKS',
  'LAB_EQUIPMENT',
  'SPORTS',
  'CAMERA',
  'LAPTOP_ACCESSORIES',
  'CYCLE',
  'PROJECT_COMPONENTS',
  'MUSICAL_INSTRUMENTS',
  'HOSTEL_ESSENTIALS',
  'STATIONERY',
  'CLOTHING',
  'FURNITURE',
  'OTHER'
];

export default function CreateItem() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'GOOD',
    campusLocation: '',
    pickupLocation: '',
    availStartDate: '',
    availEndDate: '',
    minRentalDays: '1',
    maxRentalDays: '30',
    brand: '',
    model: '',
    replacementValue: '',
    listingType: 'RENT',
    dailyPrice: '',
    weeklyPrice: '',
    buyPrice: '',
    depositAmount: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      const isRent = form.listingType === 'RENT' || form.listingType === 'BOTH';
      const isBuy = form.listingType === 'BUY' || form.listingType === 'BOTH';

      await api.post('/items', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        campusLocation: form.campusLocation.trim() || null,
        pickupLocation: form.pickupLocation.trim() || null,
        availStartDate: form.availStartDate || null,
        availEndDate: form.availEndDate || null,
        minRentalDays: form.minRentalDays ? Number(form.minRentalDays) : 1,
        maxRentalDays: form.maxRentalDays ? Number(form.maxRentalDays) : 30,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        replacementValue: form.replacementValue ? Number(form.replacementValue) : null,
        listingType: form.listingType,
        dailyPrice: isRent ? Number(form.dailyPrice || 0) : 0,
        weeklyPrice: isRent && form.weeklyPrice ? Number(form.weeklyPrice) : null,
        buyPrice: isBuy && form.buyPrice ? Number(form.buyPrice) : null,
        depositAmount: isRent && form.depositAmount ? Number(form.depositAmount) : 0,
        imageUrls: images
      });
      navigate('/my-items');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.message || 'Could not create listing');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const showRentFields = form.listingType === 'RENT' || form.listingType === 'BOTH';
  const showBuyFields = form.listingType === 'BUY' || form.listingType === 'BOTH';

  return (
    <main className="page-shell">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <span className="eyebrow dark">CAMPUS LENDER & SELLER PORTAL</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0' }}>+ List an Item on CampusShare</h1>
          <p className="muted" style={{ margin: 0 }}>
            List your electronics, calculators, books, or essentials for verified campus peers to borrow or buy safely.
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submit}>
          {/* SECTION 1: Listing Type */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">1</div>
              <div className="section-title-wrap">
                <h3>Listing Type</h3>
                <p>Choose whether you want to lend for rent, sell permanently, or offer both options.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: form.listingType === 'RENT' ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                  background: form.listingType === 'RENT' ? '#f5f7ff' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: form.listingType === 'RENT' ? '#4338ca' : '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="RENT"
                  checked={form.listingType === 'RENT'}
                  onChange={ch}
                />
                <span>🔄 For Rent Only</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: form.listingType === 'BUY' ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                  background: form.listingType === 'BUY' ? '#f5f7ff' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: form.listingType === 'BUY' ? '#4338ca' : '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="BUY"
                  checked={form.listingType === 'BUY'}
                  onChange={ch}
                />
                <span>🏷️ Direct Sale (Buy)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: form.listingType === 'BOTH' ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                  background: form.listingType === 'BOTH' ? '#f5f7ff' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: form.listingType === 'BOTH' ? '#4338ca' : '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="BOTH"
                  checked={form.listingType === 'BOTH'}
                  onChange={ch}
                />
                <span>✨ Rent & Buy (Both)</span>
              </label>
            </div>
          </div>

          {/* SECTION 2: Item Information */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">2</div>
              <div className="section-title-wrap">
                <h3>Item Information</h3>
                <p>Provide a descriptive title, category, condition, and full item details.</p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div className="form-field-header">
                <label className="label">
                  Item Title <span className="required-star">*</span>
                </label>
                <span className={`char-counter ${form.title.length > 110 ? 'warning' : ''} ${form.title.length > 120 ? 'danger' : ''}`}>
                  {form.title.length} / 120
                </span>
              </div>
              <input
                className="input"
                name="title"
                value={form.title}
                onChange={ch}
                maxLength={120}
                placeholder="e.g. Casio fx-991ES Plus 2nd Gen Scientific Calculator"
                required
              />
              <div className="field-hint">Include key identifiers like model number, color, or edition.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="label">
                  Category <span className="required-star">*</span>
                </label>
                <select className="select" name="category" value={form.category} onChange={ch} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">
                  Item Condition <span className="required-star">*</span>
                </label>
                <select className="select" name="condition" value={form.condition} onChange={ch} required>
                  <option value="NEW">✨ New (Unused / Box Pack)</option>
                  <option value="LIKE_NEW">🌟 Like New (Mint Condition)</option>
                  <option value="GOOD">👍 Good (Lightly Used)</option>
                  <option value="FAIR">👌 Fair (Shows Cosmetic Wear)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="form-field-header">
                <label className="label">
                  Item Description <span className="required-star">*</span>
                </label>
                <span className={`char-counter ${form.description.length > 1900 ? 'warning' : ''}`}>
                  {form.description.length} / 2000
                </span>
              </div>
              <textarea
                className="textarea"
                rows="4"
                name="description"
                value={form.description}
                onChange={ch}
                maxLength={2000}
                placeholder="Condition details, included cables/accessories, working status, battery health, pickup instructions…"
                required
              />
            </div>
          </div>

          {/* SECTION 3: Pricing & Deposit */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">3</div>
              <div className="section-title-wrap">
                <h3>Pricing & Security Deposit</h3>
                <p>Set transparent daily/weekly rental rates, direct sale price, and refundable deposit.</p>
              </div>
            </div>

            {showRentFields && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: showBuyFields ? '16px' : '0' }}>
                <div className="form-group">
                  <label className="label">
                    Daily Rental Rate (₹) <span className="required-star">*</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    name="dailyPrice"
                    value={form.dailyPrice}
                    onChange={ch}
                    placeholder="e.g. 50"
                    required={showRentFields}
                  />
                  <div className="field-hint">Per day charge for short-term rentals.</div>
                </div>

                <div className="form-group">
                  <label className="label">Weekly Rate (₹ optional)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    name="weeklyPrice"
                    value={form.weeklyPrice}
                    onChange={ch}
                    placeholder="e.g. 250"
                  />
                  <div className="field-hint">Discounted rate for 7+ day bookings.</div>
                </div>

                <div className="form-group">
                  <label className="label">Refundable Deposit (₹)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    name="depositAmount"
                    value={form.depositAmount}
                    onChange={ch}
                    placeholder="e.g. 300"
                  />
                  <div className="field-hint">Returned to borrower upon safe handover.</div>
                </div>
              </div>
            )}

            {showBuyFields && (
              <div className="form-group">
                <label className="label">
                  Direct Buy / Sale Price (₹) <span className="required-star">*</span>
                </label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  name="buyPrice"
                  value={form.buyPrice}
                  onChange={ch}
                  placeholder="e.g. 850"
                  required={showBuyFields}
                />
                <div className="field-hint">One-time purchase price for direct ownership transfer.</div>
              </div>
            )}
          </div>

          {/* SECTION 4: Rental Rules & Duration */}
          {showRentFields && (
            <div className="form-section-card">
              <div className="form-section-header">
                <div className="section-number-badge">4</div>
                <div className="section-title-wrap">
                  <h3>Rental Rules & Duration Limits</h3>
                  <p>Define minimum and maximum rental days allowed for bookings.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="label">Min Rental Days</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="30"
                    name="minRentalDays"
                    value={form.minRentalDays}
                    onChange={ch}
                  />
                  <div className="field-hint">Shortest booking allowed (e.g. 1 day).</div>
                </div>

                <div className="form-group">
                  <label className="label">Max Rental Days</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="365"
                    name="maxRentalDays"
                    value={form.maxRentalDays}
                    onChange={ch}
                  />
                  <div className="field-hint">Longest booking allowed (e.g. 30 days).</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Pickup Information */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">{showRentFields ? '5' : '4'}</div>
              <div className="section-title-wrap">
                <h3>Campus & Pickup Location</h3>
                <p>Help peer students know where on campus handovers happen.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="label">Banasthali Department / Block (optional)</label>
                <input
                  className="input"
                  name="campusLocation"
                  value={form.campusLocation}
                  onChange={ch}
                  maxLength={150}
                  placeholder="e.g. AIM & ACT, WISDOM, Vani Mandir, Biotech Dept"
                />
              </div>

              <div className="form-group">
                <label className="label">Campus Pickup Spot / Hostel (optional)</label>
                <input
                  className="input"
                  name="pickupLocation"
                  value={form.pickupLocation}
                  onChange={ch}
                  maxLength={200}
                  placeholder="e.g. Central Library Gate, Shakuntala Canteen, Gargi Hostel"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Product Details & Specs */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">{showRentFields ? '6' : '5'}</div>
              <div className="section-title-wrap">
                <h3>Product Details & Specifications</h3>
                <p>Add technical brand, model, and item valuation details.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="label">Brand (optional)</label>
                <input
                  className="input"
                  name="brand"
                  value={form.brand}
                  onChange={ch}
                  maxLength={80}
                  placeholder="e.g. Casio, Canon, Sony"
                />
              </div>

              <div className="form-group">
                <label className="label">Model (optional)</label>
                <input
                  className="input"
                  name="model"
                  value={form.model}
                  onChange={ch}
                  maxLength={100}
                  placeholder="e.g. FX-991ES Plus, EOS 1500D"
                />
              </div>

              <div className="form-group">
                <label className="label">Replacement Value (₹ optional)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  name="replacementValue"
                  value={form.replacementValue}
                  onChange={ch}
                  placeholder="e.g. 1500"
                />
                <div className="field-hint">Estimated market value of the item.</div>
              </div>
            </div>
          </div>

          {/* SECTION 7: Photos & Images */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="section-number-badge">{showRentFields ? '7' : '6'}</div>
              <div className="section-title-wrap">
                <h3>Photos & Images (Up to 6)</h3>
                <p>Upload clear photos of the actual item showing condition and accessories.</p>
              </div>
            </div>

            <ImageUploader images={images} onChange={setImages} maxImages={6} />
          </div>

          {/* Submit Action */}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              marginBottom: '40px'
            }}
          >
            {saving ? 'Publishing to Campus Marketplace…' : '✓ Publish Listing to Campus'}
          </button>
        </form>
      </div>
    </main>
  );
}
