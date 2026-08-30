import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const cls = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className="topbar">
      <div className="nav-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark" style={{ background: 'linear-gradient(145deg, #1e1b4b, #4338ca 60%, #ec4899)' }}>BV</span>
          <span>
            <b>CampusShare</b>
            <small>Banasthali Vidyapith student hub</small>
          </span>
        </Link>
        <nav className="desktop-nav">
          <NavLink to="/" end className={cls}>
            Discover
          </NavLink>
          <NavLink to="/dashboard" className={cls}>
            Dashboard
          </NavLink>
          <NavLink to="/activity" className={cls}>
            My Activity
          </NavLink>
          <NavLink to="/my-items" className={cls}>
            My Items
          </NavLink>
          <NavLink to="/saved" className={cls}>
            Saved
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={cls}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationDropdown />
          <Link to="/create-item" className="list-btn">
            <span>＋</span> List an Item
          </Link>
          <Link to="/profile" className="user-chip" style={{ position: 'relative' }}>
            <span className="avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
              {user?.isProMember && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    fontSize: '11px'
                  }}
                  title="CampusShare Pro Member"
                >
                  👑
                </span>
              )}
            </span>
            <span className="user-copy">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <b>{user?.name?.split(' ')[0] || 'Student'}</b>
                {user?.isProMember && (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    PRO
                  </span>
                )}
              </span>
              <small>
                <i /> {user?.isProMember ? '0% Fee Pass' : `Trust ${(user?.reputationScore ?? 5).toFixed(1)}`}
              </small>
            </span>
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            onClick={logout}
            title="Sign out from account"
            style={{
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#dc2626',
              borderColor: '#fca5a5',
              background: '#fff'
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
