import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './Home.css';

const categories = [
  '',
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

const categoryMeta = {
  ELECTRONICS: ['⌁', 'Tech'],
  CALCULATOR: ['🔢', 'Calculators'],
  BOOKS: ['▤', 'Books'],
  LAB_EQUIPMENT: ['⌬', 'Lab Gear'],
  SPORTS: ['◉', 'Sports'],
  CAMERA: ['📷', 'Cameras'],
  LAPTOP_ACCESSORIES: ['💻', 'Accessories'],
  CYCLE: ['🚲', 'Cycles'],
  PROJECT_COMPONENTS: ['⚙️', 'Projects'],
  MUSICAL_INSTRUMENTS: ['♫', 'Music'],
  HOSTEL_ESSENTIALS: ['🏠', 'Hostel'],
  STATIONERY: ['✎', 'Stationery'],
  CLOTHING: ['◇', 'Fashion'],
  FURNITURE: ['⌂', 'Furniture'],
  OTHER: ['✦', 'Other']
};

function ListingCard({ item, recommendation, currentUserId }) {
  const isOwner = currentUserId && item.owner?.id && Number(currentUserId) === Number(item.owner.id);
  const [imgError, setImgError] = useState(false);

  const getListingTypeBadge = () => {
    if (item.listingType === 'BUY') return 'FOR SALE';
    if (item.listingType === 'BOTH') return 'RENT & BUY';
    return 'FOR RENT';
  };

  const getConditionLabel = () => {
    switch (item.condition) {
      case 'NEW':
        return 'Brand New';
      case 'LIKE_NEW':
        return 'Like New';
      case 'FAIR':
        return 'Fair Condition';
      default:
        return 'Good Condition';
    }
  };

  const photo = !imgError && item.imageUrls?.[0] ? item.imageUrls[0] : null;

  return (
    <Link
      to={`/items/${item.id}`}
      className="item-card"
      style={{
        position: 'relative',
        border: item.isFeatured ? '2px solid #f59e0b' : '1px solid #e2e8f0',
        boxShadow: item.isFeatured ? '0 8px 24px rgba(245, 158, 11, 0.18)' : undefined
      }}
    >
      {item.isFeatured && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            zIndex: 10,
            boxShadow: '0 2px 10px rgba(217, 119, 6, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ⚡ SPOTLIGHT
        </div>
      )}
      {isOwner && !item.isFeatured && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(79, 70, 229, 0.95)',
            color: '#ffffff',
            padding: '4px 9px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          👤 YOUR LISTING
        </div>
      )}

      <div className="item-image">
        {photo ? (
          <img
            src={photo}
            alt={item.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="placeholder-art">
            <span>{categoryMeta[item.category]?.[0] || '✦'}</span>
            <small>{categoryMeta[item.category]?.[1] || 'Campus Find'}</small>
          </div>
        )}
        <span className="availability">
          <i /> {item.availabilityStatus === 'SOLD' ? 'Sold' : 'Available'}
        </span>
        {recommendation ? (
          <span className="match-chip">{recommendation.matchScore}% match</span>
        ) : (
          <span className="quick-save">♡</span>
        )}
      </div>

      <div className="item-content">
        <div className="item-topline">
          <span className="item-category">{item.category?.replaceAll('_', ' ')}</span>
          <span
            className="badge"
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: item.listingType === 'BUY' ? '#ecfdf5' : '#eef2ff',
              color: item.listingType === 'BUY' ? '#065f46' : '#4338ca'
            }}
          >
            {getListingTypeBadge()}
          </span>
          <span className="rating">★ {(item.owner?.reputationScore ?? 5).toFixed(1)}</span>
        </div>

        <h3>{item.title}</h3>

        <div style={{ display: 'flex', gap: '6px', margin: '4px 0 8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
            🏷 {getConditionLabel()}
          </span>
          {(item.campusLocation || item.pickupLocation) && (
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
              📍 {item.campusLocation || item.pickupLocation}
            </span>
          )}
        </div>

        <p className="item-description">
          {item.description || 'Student-owned item available on campus.'}
        </p>

        {recommendation && <div className="recommend-reason">✦ {recommendation.reason}</div>}

        <div className="price-row">
          <div>
            {item.listingType === 'BUY' ? (
              <>
                <strong style={{ color: '#059669' }}>₹{item.buyPrice}</strong>
                <span> to buy</span>
              </>
            ) : item.listingType === 'BOTH' ? (
              <>
                <strong>₹{item.dailyPrice}</strong>
                <span>/day</span>
                <span style={{ fontSize: '12px', color: '#059669', marginLeft: '6px' }}>
                  · ₹{item.buyPrice} buy
                </span>
              </>
            ) : (
              <>
                <strong>₹{item.dailyPrice}</strong>
                <span>/day</span>
                {Number(item.depositAmount || 0) > 0 && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                    (+₹{item.depositAmount} dep)
                  </span>
                )}
              </>
            )}
          </div>
          <span className="owner-avatar">{item.owner?.name?.[0] || 'S'}</span>
        </div>

        <div className="owner-line">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {item.owner?.name || 'Verified student'}
            {item.owner?.isProMember && (
              <span
                style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  color: '#92400e',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid #fcd34d'
                }}
              >
                👑 PRO
              </span>
            )}
          </span>
          <span>✓ campus verified</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [listingType, setListingType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
  const [sortDir, setSortDir] = useState(searchParams.get('dir') || 'DESC');

  const [items, setItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // Sync state to URL params
  const updateUrl = useCallback(
    (paramsObj) => {
      const sp = new URLSearchParams();
      if (paramsObj.q) sp.set('q', paramsObj.q);
      if (paramsObj.category) sp.set('category', paramsObj.category);
      if (paramsObj.condition) sp.set('condition', paramsObj.condition);
      if (paramsObj.location) sp.set('location', paramsObj.location);
      if (paramsObj.type) sp.set('type', paramsObj.type);
      if (paramsObj.minPrice) sp.set('minPrice', paramsObj.minPrice);
      if (paramsObj.maxPrice) sp.set('maxPrice', paramsObj.maxPrice);
      if (paramsObj.sort && paramsObj.sort !== 'createdAt') sp.set('sort', paramsObj.sort);
      if (paramsObj.dir && paramsObj.dir !== 'DESC') sp.set('dir', paramsObj.dir);
      setSearchParams(sp, { replace: true });
    },
    [setSearchParams]
  );

  const fetchItems = useCallback(
    async (pageToLoad = 0, isAppend = false) => {
      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        setPriceError('Min price cannot be greater than Max price');
        return;
      }
      setPriceError('');
      setError('');

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('searchTerm', searchTerm.trim());
        if (category) params.append('category', category);
        if (condition) params.append('condition', condition);
        if (location.trim()) params.append('location', location.trim());
        if (listingType) params.append('listingType', listingType);
        if (minPrice !== '' && !isNaN(minPrice)) params.append('minPrice', minPrice);
        if (maxPrice !== '' && !isNaN(maxPrice)) params.append('maxPrice', maxPrice);
        params.append('sortBy', sortBy);
        params.append('sortDir', sortDir);
        params.append('page', pageToLoad);
        params.append('size', 16);

        const res = await api.get(`/items/search?${params.toString()}`);
        const data = res.data;

        if (isAppend) {
          setItems((prev) => [...prev, ...(data.content || [])]);
        } else {
          setItems(data.content || []);
        }

        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(pageToLoad);

        // Update URL
        updateUrl({
          q: searchTerm.trim(),
          category,
          condition,
          location: location.trim(),
          type: listingType,
          minPrice,
          maxPrice,
          sort: sortBy,
          dir: sortDir
        });
      } catch (err) {
        console.error('Marketplace search error:', err);
        setError(err.response?.data?.message || 'Unable to load marketplace listings. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchTerm, category, condition, location, listingType, minPrice, maxPrice, sortBy, sortDir, updateUrl]
  );

  useEffect(() => {
    fetchItems(0, false);
  }, [category, condition, listingType, sortBy, sortDir]);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      return;
    }
    api
      .get('/items/recommendations?limit=4')
      .then((res) => setRecommendations(res.data || []))
      .catch(() => setRecommendations([]));
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems(0, false);
  };

  const chooseCategory = (cat) => {
    const next = category === cat ? '' : cat;
    setCategory(next);
  };

  const chooseListingType = (type) => {
    const next = listingType === type ? '' : type;
    setListingType(next);
  };

  const handleSortChange = (e) => {
    const [sb, sd] = e.target.value.split(':');
    setSortBy(sb);
    setSortDir(sd);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('');
    setCondition('');
    setLocation('');
    setListingType('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortDir('DESC');
    setPriceError('');
    setSearchParams(new URLSearchParams(), { replace: true });
    // Refetch with cleared state
    api.get('/items/search?page=0&size=16&sortBy=createdAt&sortDir=DESC').then((res) => {
      setItems(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
      setPage(0);
    });
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      category ||
      condition ||
      location.trim() ||
      listingType ||
      minPrice ||
      maxPrice ||
      sortBy !== 'createdAt'
  );

  return (
    <main className="page-shell home-page">
      <section className="hero-v2">
        <div className="hero-copy">
          <span className="eyebrow" style={{ color: '#4f46e5', fontWeight: 800 }}>🌸 BANASTHALI VIDYAPITH · EXCLUSIVE STUDENT MARKETPLACE</span>
          <h1>
            Borrow or buy essentials
            <br />
            from <em>Banasthali Vidyapith students.</em>
          </h1>
          <p>
            Rent scientific calculators for AIM & ACT lab exams, cycles for campus commutes, lab aprons & gear, or buy second-hand hostel essentials safely across Gargi, Maitreyi, Shakuntala and all campus hostels.
          </p>
          <div className="hero-actions">
            <a href="#discover" className="btn hero-primary">
              Explore BV Marketplace →
            </a>
            <Link to="/create-item" className="btn hero-secondary">
              ＋ List an item on Campus
            </Link>
          </div>
          <div className="micro-proof">
            <span>
              <b>01</b> @banasthali.in Verified
            </span>
            <span>
              <b>02</b> Instant UPI & Direct Handover
            </span>
            <span>
              <b>03</b> Verified Hostels & Spots
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="float-card card-a">
            <small>BANASTHALI NETWORK</small>
            <strong>Campus P2P Sharing</strong>
            <div>
              <b>100%</b> <span>Vidyapith Verified</span>
            </div>
          </div>
          <div className="float-card card-b">
            <span className="shield">✓</span>
            <div>
              <strong>BanasthaliTrust</strong>
              <small>{user?.emailVerified ? 'Identity verified' : 'Campus community'}</small>
            </div>
          </div>
          <div className="float-card card-c">
            <small>SAFE HANDOVER</small>
            <strong>Campus Spots</strong>
            <span>Library, AIM & ACT, Hostels</span>
          </div>
        </div>
      </section>

      <section className="market-intro" id="discover">
        <div>
          <span className="eyebrow dark">DISCOVER</span>
          <h2>Your campus, one useful shelf.</h2>
          <p>Search what you need to borrow or buy directly from fellow students.</p>
        </div>
        <div className="live-chip">
          <i /> Marketplace live
        </div>
      </section>

      {/* Discover & Filtering Panel */}
      <form className="discover-v2 surface" onSubmit={handleSearchSubmit}>
        <div className="search-box">
          <span>⌕</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Try “calculator”, “lab coat”, “cycle”, “camera”, “notes”…"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>

        <div className="filter-row" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat ? cat.replaceAll('_', ' ') : 'All categories'}
              </option>
            ))}
          </select>

          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="">All conditions</option>
            <option value="NEW">Brand New</option>
            <option value="LIKE_NEW">Like New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>

          <input
            type="text"
            placeholder="Location / Block"
            style={{ width: '130px' }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`btn ${listingType === 'RENT' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '6px 10px' }}
              onClick={() => chooseListingType('RENT')}
            >
              For Rent
            </button>
            <button
              type="button"
              className={`btn ${listingType === 'BUY' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '6px 10px' }}
              onClick={() => chooseListingType('BUY')}
            >
              For Sale
            </button>
          </div>

          <input
            type="number"
            min="0"
            placeholder="Min ₹"
            style={{ width: '80px' }}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="Max ₹"
            style={{ width: '80px' }}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={handleSortChange}
            style={{ fontSize: '12px' }}
          >
            <option value="createdAt:DESC">Sort: Newest First</option>
            <option value="createdAt:ASC">Sort: Oldest First</option>
            <option value="dailyPrice:ASC">Price: Low to High</option>
            <option value="dailyPrice:DESC">Price: High to Low</option>
            <option value="viewCount:DESC">Most Popular</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Apply
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '12px', color: '#ef4444', border: '1px solid #fee2e2' }}
              onClick={clearFilters}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {priceError && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{priceError}</div>
        )}
      </form>

      {/* Category Bento Navigation */}
      <div className="category-bento">
        {categories.slice(1, 9).map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? 'active' : ''}
            onClick={() => chooseCategory(cat)}
          >
            <span>{categoryMeta[cat]?.[0] || '✦'}</span>
            <b>{categoryMeta[cat]?.[1] || cat}</b>
            <small>{category === cat ? 'Selected ✓' : 'Browse →'}</small>
          </button>
        ))}
      </div>

      {recommendations.length > 0 && (
        <>
          <div className="section-title recommendation-heading">
            <div>
              <span className="eyebrow dark">RECOMMENDED</span>
              <h2>Picked for you</h2>
              <p>Personalized based on your campus department and activity.</p>
            </div>
          </div>
          <div className="items-grid recommendation-grid">
            {recommendations.map((rec) => (
              <ListingCard
                key={rec.item.id}
                item={rec.item}
                recommendation={rec}
                currentUserId={user?.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Results Header */}
      <div className="section-title">
        <div>
          <h2>Available on Campus</h2>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            {loading ? (
              'Searching listings…'
            ) : totalElements > 0 ? (
              <span>
                <strong>{totalElements}</strong> {totalElements === 1 ? 'item' : 'items'} available{' '}
                {category ? `in ${categoryMeta[category]?.[1] || category}` : ''}
              </span>
            ) : (
              '0 items match your search criteria'
            )}
          </p>
        </div>
        <Link to="/saved" className="text-link">
          View saved ♡
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="surface empty-state" style={{ padding: '30px', textAlign: 'center', borderColor: '#fca5a5' }}>
          <div className="empty-icon">⚠️</div>
          <h3>{error}</h3>
          <button className="btn btn-primary" onClick={() => fetchItems(0, false)} style={{ marginTop: '12px' }}>
            🔄 Retry Search
          </button>
        </div>
      )}

      {/* Loading Skeleton / State */}
      {loading && !error ? (
        <div className="loading-state" style={{ padding: '60px 0', textAlign: 'center' }}>
          <h3>Scanning campus listings…</h3>
          <p className="muted">Fetching real verified listings from database</p>
        </div>
      ) : !loading && items.length === 0 && !error ? (
        <div className="surface empty-state" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="empty-icon">⌕</div>
          <h3>No items match your filters</h3>
          <p className="muted">Try adjusting your keywords, price limits, or category selection.</p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {hasActiveFilters && (
              <button className="btn btn-outline" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
            <Link className="btn btn-primary" to="/create-item">
              + List an Item
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map((item) => (
              <ListingCard item={item} key={item.id} currentUserId={user?.id} />
            ))}
          </div>

          {/* Load More Pagination */}
          {page < totalPages - 1 && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                disabled={loadingMore}
                onClick={() => fetchItems(page + 1, true)}
                style={{ padding: '10px 24px' }}
              >
                {loadingMore ? 'Loading more listings…' : 'Load More Items ↓'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
