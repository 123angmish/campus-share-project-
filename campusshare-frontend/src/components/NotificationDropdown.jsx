import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Navbar.css';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'RENTAL_REQUEST':
    case 'RENTAL':
      return '🔄';
    case 'PURCHASE_REQUEST':
    case 'PURCHASE':
      return '🛒';
    case 'PAYMENT':
    case 'PAYMENT_RECEIVED':
      return '💳';
    case 'HANDOVER':
      return '🤝';
    case 'RETURN':
      return '📦';
    case 'CHAT':
      return '💬';
    case 'DISPUTE':
      return '⚠️';
    default:
      return '🔔';
  }
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (_err) {
      // ignore unread fetch error when offline
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    if (!open) {
      fetchList();
      fetchUnread();
    }
    setOpen((prev) => !prev);
  };

  const handleClickNotification = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (_err) {
        // ignore read status error
      }
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_err) {
      // ignore mark all read error
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn-ghost notif-bell"
        onClick={toggleDropdown}
        title="Notifications"
        style={{
          position: 'relative',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          background: '#ffffff',
          fontSize: '17px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 800,
              lineHeight: 1,
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="surface notif-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '46px',
            width: '360px',
            maxHeight: '480px',
            overflowY: 'auto',
            background: '#ffffff',
            boxShadow: '0 15px 35px -5px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.06)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            zIndex: 1100,
            padding: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-ghost"
                style={{
                  fontSize: '12px',
                  color: '#4f46e5',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: 0
                }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '28px 10px', color: '#64748b', fontSize: '13px' }}>
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', fontSize: '13px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔕</div>
              <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>No notifications yet</strong>
              <span>You're all caught up! Updates about your rentals, purchases, and handovers will appear here.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n) => {
                const icon = getNotificationIcon(n.type);
                const timeAgo = formatTimeAgo(n.createdAt);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: n.read ? '#ffffff' : '#f5f7ff',
                      border: n.read ? '1px solid #f1f5f9' : '1px solid #c7d2fe',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1, marginTop: '2px' }}>{icon}</span>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <strong style={{ color: n.read ? '#334155' : '#1e1b4b', fontSize: '13px', fontWeight: 700 }}>
                          {n.title}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {timeAgo && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{timeAgo}</span>}
                          {!n.read && (
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#4f46e5',
                                display: 'inline-block'
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <p style={{ margin: 0, color: '#475569', fontSize: '12px', lineHeight: 1.45 }}>
                        {n.message}
                      </p>

                      {n.link && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '11px',
                            color: '#4f46e5',
                            fontWeight: 700,
                            display: 'inline-block'
                          }}
                        >
                          View details →
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
