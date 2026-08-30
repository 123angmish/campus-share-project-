import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import ReviewComposer from '../components/ReviewComposer';
import './Marketplace.css';
import './History.css';

const apiMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Timeline / Audit Modal
  const [timelineModalTx, setTimelineModalTx] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Receipt Modal
  const [receiptModalTx, setReceiptModalTx] = useState(null);

  // Meeting Proposal Modal
  const [meetingModalTx, setMeetingModalTx] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    location: 'College Library',
    date: new Date().toISOString().split('T')[0],
    time: '2:30 PM',
    notes: ''
  });
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  // Return Modal (for owner deposit return/deduction)
  const [returnModalTx, setReturnModalTx] = useState(null);
  const [returnForm, setReturnForm] = useState({
    depositDeductionAmount: '',
    depositDeductionReason: ''
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Dispute Modal
  const [disputeModalTx, setDisputeModalTx] = useState(null);
  const [disputeForm, setDisputeForm] = useState({
    reason: "User didn't show up",
    description: ''
  });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Embedded Chat State (transactionId -> { open, messages, input, sending })
  const [activeChatTxId, setActiveChatTxId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rentals/all-activity');
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to load activity transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll chat messages if chat is open
  useEffect(() => {
    if (!activeChatTxId) return;
    let isMounted = true;

    const fetchChat = async () => {
      try {
        const res = await api.get(`/chats/transaction/${activeChatTxId}`);
        if (isMounted) {
          setChatMessages(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeChatTxId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const openChat = (txId) => {
    if (activeChatTxId === txId) {
      setActiveChatTxId(null);
    } else {
      setActiveChatTxId(txId);
      setChatMessages([]);
      setChatLoading(true);
      api
        .get(`/chats/transaction/${txId}`)
        .then((res) => setChatMessages(res.data || []))
        .catch((err) => console.error(err))
        .finally(() => setChatLoading(false));
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatTxId) return;
    try {
      setChatSending(true);
      const text = chatInput.trim();
      setChatInput('');
      const res = await api.post(`/chats/transaction/${activeChatTxId}`, { content: text });
      setChatMessages((prev) => [...prev, res.data]);
    } catch (err) {
      alert(apiMessage(err, 'Could not send message'));
    } finally {
      setChatSending(false);
    }
  };

  const openTimeline = async (tx) => {
    setTimelineModalTx(tx);
    setTimelineLoading(true);
    try {
      const res = await api.get(`/rentals/${tx.id}/history`);
      setTimelineEvents(res.data || []);
    } catch (err) {
      alert(apiMessage(err, 'Could not load audit timeline'));
    } finally {
      setTimelineLoading(false);
    }
  };

  // Transaction Actions
  const handleAccept = async (id) => {
    try {
      await api.post(`/rentals/${id}/accept`);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not accept request'));
    }
  };

  const handleDecline = async (id) => {
    const reason = window.prompt('Reason for declining this request (optional):');
    if (reason === null) return;
    try {
      await api.post(`/rentals/${id}/decline`, null, { params: { reason: reason || 'Not available' } });
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not decline request'));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.post(`/rentals/${id}/cancel`);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not cancel request'));
    }
  };

  const handleShareContact = async (id) => {
    try {
      await api.post(`/rentals/${id}/share-contact`);
      alert('📱 Your contact details were shared with the other student!');
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not share contact details'));
    }
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    try {
      setSubmittingMeeting(true);
      await api.post(`/rentals/${meetingModalTx.id}/propose-meeting`, meetingForm);
      setMeetingModalTx(null);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not propose meeting'));
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleConfirmMeeting = async (id) => {
    try {
      await api.post(`/rentals/${id}/confirm-meeting`);
      alert('🤝 Meeting confirmed!');
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not confirm meeting'));
    }
  };

  const handleMarkPaid = async (id, method) => {
    try {
      await api.post(`/rentals/${id}/mark-paid`, { paymentMethod: method });
      alert(`💰 Marked as paid via ${method}. The seller will verify and confirm.`);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not record payment'));
    }
  };

  const handleConfirmPayment = async (id) => {
    if (!window.confirm('Confirm that you have received the payment from the student?')) return;
    try {
      await api.post(`/rentals/${id}/confirm-payment`);
      alert('✅ Payment verified! You can now proceed to handover.');
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not confirm payment'));
    }
  };

  const handleConfirmHandover = async (id, isBorrower) => {
    const confirmMsg = isBorrower
      ? 'Confirm that you have physically received and inspected this item?'
      : 'Confirm that you have handed over this item to the student?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/rentals/${id}/confirm-handover`);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not confirm handover'));
    }
  };

  const handleConfirmReturnBorrower = async (id) => {
    if (!window.confirm('Confirm that you have returned the item to the owner?')) return;
    try {
      await api.post(`/rentals/${id}/confirm-return`, {});
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not confirm return'));
    }
  };

  const submitOwnerReturn = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReturn(true);
      const deduction = returnForm.depositDeductionAmount
        ? Number(returnForm.depositDeductionAmount)
        : null;
      await api.post(`/rentals/${returnModalTx.id}/confirm-return`, {
        depositDeductionAmount: deduction,
        depositDeductionReason: returnForm.depositDeductionReason || null
      });
      setReturnModalTx(null);
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not confirm return'));
    } finally {
      setSubmittingReturn(false);
    }
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    try {
      setSubmittingDispute(true);
      await api.post(`/rentals/${disputeModalTx.id}/dispute`, disputeForm);
      setDisputeModalTx(null);
      alert('⚠️ Issue reported to campus moderation. Both parties have been notified.');
      await load();
    } catch (err) {
      alert(apiMessage(err, 'Could not submit dispute'));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return transactions;
    if (activeTab === 'RENTALS_BORROWED') {
      return transactions.filter((t) => t.transactionType === 'RENTAL' && t.isBorrower);
    }
    if (activeTab === 'RENTALS_LENT') {
      return transactions.filter((t) => t.transactionType === 'RENTAL' && t.isOwner);
    }
    if (activeTab === 'PURCHASES') {
      return transactions.filter((t) => t.transactionType === 'PURCHASE' && t.isBorrower);
    }
    if (activeTab === 'SALES') {
      return transactions.filter((t) => t.transactionType === 'PURCHASE' && t.isOwner);
    }
    if (activeTab === 'REQUESTS') {
      return transactions.filter((t) => t.status === 'PENDING');
    }
    if (activeTab === 'ACTIVE') {
      return transactions.filter(
        (t) => t.status === 'ACTIVE' || (t.status === 'ACCEPTED' && t.status !== 'COMPLETED')
      );
    }
    if (activeTab === 'COMPLETED') {
      return transactions.filter((t) => t.status === 'COMPLETED');
    }
    if (activeTab === 'CANCELLED') {
      return transactions.filter((t) => t.status === 'CANCELLED' || t.status === 'DECLINED');
    }
    return transactions;
  }, [transactions, activeTab]);

  return (
    <main className="page-shell">
      <div className="surface activity-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="activity-header">
          <div>
            <span className="eyebrow">CAMPUS TRANSACTIONS & ACTIVITY</span>
            <h2>Peer-to-Peer Marketplace Hub</h2>
            <p className="muted">Track rentals, purchases, meetings, handovers, and in-app chats.</p>
          </div>
          <Link to="/create-item" className="btn btn-primary">
            + List Another Item
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="marketplace-tabs" style={{ marginTop: '20px', flexWrap: 'wrap', gap: '6px' }}>
          <button
            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            📋 All ({transactions.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'RENTALS_BORROWED' ? 'active' : ''}`}
            onClick={() => setActiveTab('RENTALS_BORROWED')}
          >
            🔄 Items I Rented ({transactions.filter((t) => t.transactionType === 'RENTAL' && t.isBorrower).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'RENTALS_LENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('RENTALS_LENT')}
          >
            📦 Items I Lent ({transactions.filter((t) => t.transactionType === 'RENTAL' && t.isOwner).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'PURCHASES' ? 'active' : ''}`}
            onClick={() => setActiveTab('PURCHASES')}
          >
            🛒 My Purchases ({transactions.filter((t) => t.transactionType === 'PURCHASE' && t.isBorrower).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'SALES' ? 'active' : ''}`}
            onClick={() => setActiveTab('SALES')}
          >
            🏷️ My Sales ({transactions.filter((t) => t.transactionType === 'PURCHASE' && t.isOwner).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'REQUESTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('REQUESTS')}
          >
            ⏳ Requests ({transactions.filter((t) => t.status === 'PENDING').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            ⚡ In Progress ({transactions.filter((t) => t.status === 'ACTIVE' || (t.status === 'ACCEPTED' && t.status !== 'COMPLETED')).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            ✨ Completed ({transactions.filter((t) => t.status === 'COMPLETED').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CANCELLED')}
          >
            ✕ Cancelled ({transactions.filter((t) => t.status === 'CANCELLED' || t.status === 'DECLINED').length})
          </button>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="loading-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <h3>Loading campus activity…</h3>
            <p className="muted">Fetching real-time transactions</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface empty-state" style={{ padding: '40px', textAlign: 'center', marginTop: '24px' }}>
            <div className="empty-icon">📦</div>
            <h3>No transactions in this section</h3>
            <p className="muted">Explore listings on CampusShare or list an item to get started.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '14px', display: 'inline-block' }}>
              Explore Marketplace →
            </Link>
          </div>
        ) : (
          <div className="activity-cards-list" style={{ marginTop: '20px' }}>
            {filtered.map((tx) => {
              const isOwner = tx.isOwner;
              const peer = isOwner ? tx.borrower : tx.owner;
              const isRent = tx.transactionType === 'RENTAL';
              const displayTitle = tx.itemTitleSnapshot || tx.item?.title || 'Campus Item';
              const chatOpen = activeChatTxId === tx.id;

              return (
                <div key={tx.id} className="surface transaction-card" style={{ marginBottom: '24px' }}>
                  {/* Card Header */}
                  <div className="tx-card-header">
                    <div className="tx-item-preview">
                      <img
                        src={tx.item?.imageUrls?.[0] || '/placeholder.png'}
                        alt={displayTitle}
                        className="tx-item-thumb"
                      />
                      <div>
                        <div className="tx-type-tags">
                          <span className="badge type-badge">{isRent ? 'RENTAL' : 'PURCHASE'}</span>
                          <span className={`badge status-badge ${tx.status.toLowerCase()}`}>
                            ● {tx.status}
                          </span>
                          <span className="badge role-badge">
                            {isOwner ? '👤 Owner / Seller' : '🛒 Buyer / Renter'}
                          </span>
                        </div>
                        <h3 className="tx-item-title">
                          <Link to={`/items/${tx.item?.id}`}>{displayTitle}</Link>
                        </h3>
                        <p className="tx-peer-sub">
                          With <strong>{peer?.name}</strong> ({peer?.department} · Year {peer?.year}) · Tx #{tx.id}
                        </p>
                      </div>
                    </div>

                    <div className="tx-price-box">
                      <span className="tx-amount">₹{tx.totalAmount}</span>
                      <div className="tx-fee-breakdown">
                        {tx.platformFee > 0 ? (
                          <span className="fee-text" style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
                            (Item: ₹{tx.itemAmount || (tx.totalAmount - tx.platformFee)} + Platform Fee: ₹{tx.platformFee})
                          </span>
                        ) : null}
                        {isRent && tx.durationDays && (
                          <span className="tx-duration" style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>
                            {tx.durationDays} day{tx.durationDays > 1 ? 's' : ''} ({tx.startDate} → {tx.endDate})
                          </span>
                        )}
                        {Number(tx.depositAmount || 0) > 0 && (
                          <span className="tx-deposit" style={{ display: 'block', fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                            + ₹{tx.depositAmount} deposit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unified Handover & Contact Banner */}
                  <div className="tx-unified-handover-bar">
                    <div className="handover-chip">
                      <strong>📍 Pickup Spot:</strong> 🏫 {tx.meetingLocation || 'Campus Point'}
                    </div>
                    <div className="handover-chip">
                      <strong>⏰ Handover Time:</strong> 🕒 {tx.meetingTime || 'Flexible / In Chat'}
                    </div>
                    {(isOwner ? tx.borrowerContactPhone : tx.ownerContactPhone) && (
                      <div className="handover-chip">
                        <strong>📞 Contact:</strong> {isOwner ? tx.borrowerContactPhone : tx.ownerContactPhone}
                        <a
                          href={`https://wa.me/91${isOwner ? tx.borrowerContactPhone : tx.ownerContactPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="wa-link-btn"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    )}
                    {tx.requestMessage && (
                      <div className="handover-chip note-chip">
                        <strong>💬 Note:</strong> "{tx.requestMessage}"
                      </div>
                    )}
                  </div>

                  {/* PENDING Request State */}
                  {tx.status === 'PENDING' && (
                    <div className="tx-pending-action-card">
                      {isOwner ? (
                        <div className="pending-owner-box">
                          <p className="pending-msg">
                            🔔 <strong>{peer?.name}</strong> requested this item for ₹{tx.totalAmount}.
                          </p>
                          <div className="pending-buttons-row">
                            <button className="btn btn-primary btn-sm" onClick={() => handleAccept(tx.id)}>
                              ✓ Accept Request & Open Chat
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDecline(tx.id)}>
                              ✕ Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pending-waiting-box">
                          <span>⏳ Waiting for <strong>{peer?.name}</strong> to accept your request. You will be notified instantly!</span>
                          <button className="btn btn-outline btn-sm" onClick={() => handleCancel(tx.id)}>
                            Cancel Request
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACCEPTED State: Streamlined 1-Click Double Approval */}
                  {tx.status === 'ACCEPTED' && (
                    <div className="tx-approval-card">
                      <div className="approval-header">
                        <span className="approval-title">🤝 Handover & Mutual Confirmation</span>
                        <div className="confirm-pills-row">
                          <span className={`confirm-pill ${tx.borrowerConfirmedHandover ? 'done' : 'pending'}`}>
                            {tx.borrowerConfirmedHandover ? '✓ Buyer Approved' : '○ Buyer Pending'}
                          </span>
                          <span className={`confirm-pill ${tx.ownerConfirmedHandover ? 'done' : 'pending'}`}>
                            {tx.ownerConfirmedHandover ? '✓ Seller Approved' : '○ Seller Pending'}
                          </span>
                        </div>
                      </div>

                      <p className="approval-hint">
                        Coordinate at <strong>{tx.meetingLocation || 'Campus'}</strong> ({tx.meetingTime || 'agreed time'}). Once both parties click confirm, this transaction is marked completed automatically!
                      </p>

                      <div className="approval-action-buttons">
                        {!isOwner && (
                          <button
                            className={`btn ${tx.borrowerConfirmedHandover ? 'btn-outline' : 'btn-primary'} btn-sm`}
                            disabled={tx.borrowerConfirmedHandover}
                            onClick={() => handleConfirmHandover(tx.id, true)}
                          >
                            {tx.borrowerConfirmedHandover ? '✓ You Confirmed Item Received' : '📦 I Received the Item / Deal Done'}
                          </button>
                        )}
                        {isOwner && (
                          <button
                            className={`btn ${tx.ownerConfirmedHandover ? 'btn-outline' : 'btn-primary'} btn-sm`}
                            disabled={tx.ownerConfirmedHandover}
                            onClick={() => handleConfirmHandover(tx.id, false)}
                          >
                            {tx.ownerConfirmedHandover ? '✓ You Confirmed Handover' : '🤝 I Handed Over Item & Received Payment'}
                          </button>
                        )}
                        <button
                          className={`btn ${chatOpen ? 'btn-primary' : 'btn-outline'} btn-sm chat-trigger-btn`}
                          onClick={() => openChat(tx.id)}
                        >
                          💬 {chatOpen ? 'Close Chat' : `Chat with ${peer?.name?.split(' ')[0] || 'Peer'}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE Rental State (Return Double Approval) */}
                  {tx.status === 'ACTIVE' && isRent && (
                    <div className="tx-approval-card">
                      <div className="approval-header">
                        <span className="approval-title">📦 Active Rental — Scheduled Return by {tx.endDate}</span>
                        <div className="confirm-pills-row">
                          <span className={`confirm-pill ${tx.borrowerConfirmedReturn ? 'done' : 'pending'}`}>
                            {tx.borrowerConfirmedReturn ? '✓ Renter Returned' : '○ Renter Pending'}
                          </span>
                          <span className={`confirm-pill ${tx.ownerConfirmedReturn ? 'done' : 'pending'}`}>
                            {tx.ownerConfirmedReturn ? '✓ Owner Confirmed' : '○ Owner Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="approval-action-buttons">
                        {!isOwner && (
                          <button
                            className={`btn ${tx.borrowerConfirmedReturn ? 'btn-outline' : 'btn-primary'} btn-sm`}
                            disabled={tx.borrowerConfirmedReturn}
                            onClick={() => handleConfirmReturnBorrower(tx.id)}
                          >
                            {tx.borrowerConfirmedReturn ? '✓ You Confirmed Return' : '↩️ I Returned the Item to Owner'}
                          </button>
                        )}
                        {isOwner && (
                          <button
                            className={`btn ${tx.ownerConfirmedReturn ? 'btn-outline' : 'btn-primary'} btn-sm`}
                            disabled={tx.ownerConfirmedReturn}
                            onClick={() => {
                              setReturnModalTx(tx);
                              setReturnForm({ depositDeductionAmount: '', depositDeductionReason: '' });
                            }}
                          >
                            {tx.ownerConfirmedReturn ? '✓ You Confirmed Return' : '✅ Confirm Return & Refund Deposit'}
                          </button>
                        )}
                        <button
                          className={`btn ${chatOpen ? 'btn-primary' : 'btn-outline'} btn-sm chat-trigger-btn`}
                          onClick={() => openChat(tx.id)}
                        >
                          💬 {chatOpen ? 'Close Chat' : `Chat with ${peer?.name?.split(' ')[0] || 'Peer'}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED State Banner */}
                  {tx.status === 'COMPLETED' && (
                    <div className="tx-completed-banner">
                      <div className="completed-info">
                        <span>✨ <strong>Deal Completed!</strong> Both parties mutually confirmed.</span>
                      </div>
                      <div className="completed-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setReceiptModalTx(tx)}>
                          🧾 View Receipt
                        </button>
                        <ReviewComposer rental={tx} onDone={load} />
                      </div>
                    </div>
                  )}

                  {/* Actions & Chat Toolbar */}
                  <div className="tx-card-footer">
                    <div className="footer-left-actions">
                      <button
                        className={`btn ${chatOpen ? 'btn-primary' : 'btn-outline'} btn-sm chat-toggle-btn`}
                        onClick={() => openChat(tx.id)}
                      >
                        💬 {chatOpen ? 'Close Chat' : 'In-App Chat'}
                      </button>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openTimeline(tx)}
                      >
                        ⏱️ Audit Timeline
                      </button>
                    </div>

                    <div className="footer-right-actions">
                      {tx.status !== 'COMPLETED' && tx.status !== 'DECLINED' && tx.status !== 'CANCELLED' && (
                        <button
                          className="text-btn report-trigger"
                          onClick={() => {
                            setDisputeModalTx(tx);
                            setDisputeForm({ reason: "User didn't show up", description: '' });
                          }}
                        >
                          🚩 Report Issue
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Embedded Chat Panel */}
                  {chatOpen && (
                    <div className="embedded-chat-panel">
                      <div className="chat-header">
                        <h4>💬 Direct Chat with {peer?.name}</h4>
                        <span className="muted-tag">Private to Transaction #{tx.id}</span>
                      </div>

                      <div className="chat-messages-container">
                        {chatLoading ? (
                          <div style={{ textAlign: 'center', padding: '20px' }}>Loading messages…</div>
                        ) : chatMessages.length === 0 ? (
                          <div className="empty-chat-state">
                            👋 Start the conversation! Coordinate meeting spot, handover timing, or item details.
                          </div>
                        ) : (
                          chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`chat-bubble-row ${msg.isOwnMessage ? 'own-row' : 'peer-row'}`}
                            >
                              <div className={`chat-bubble ${msg.isOwnMessage ? 'own' : 'peer'}`}>
                                <span className="bubble-sender">{msg.senderName}</span>
                                <p className="bubble-text">{msg.content}</p>
                                <span className="bubble-time">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      <form onSubmit={sendChatMessage} className="chat-input-row">
                        <input
                          type="text"
                          placeholder={`Message ${peer?.name}…`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={chatSending}>
                          {chatSending ? '…' : 'Send →'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit Timeline Modal */}
      {timelineModalTx && (
        <div className="modal-overlay" onClick={() => setTimelineModalTx(null)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="eyebrow">TRANSACTION AUDIT LOG</span>
                <h3>Audit Timeline (Tx #{timelineModalTx.id})</h3>
              </div>
              <button className="icon-button" onClick={() => setTimelineModalTx(null)}>✕</button>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Immutable server-side recorded events for "{timelineModalTx.itemTitleSnapshot || timelineModalTx.item?.title}".
            </p>

            <div style={{ marginTop: '20px', maxHeight: '340px', overflowY: 'auto' }}>
              {timelineLoading ? (
                <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>Loading timeline events…</p>
              ) : timelineEvents.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No timeline events recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timelineEvents.map((evt, idx) => (
                    <div key={evt.id || idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>
                          {evt.statusTo || evt.newStatus || 'EVENT'}
                        </span>
                        <span>{new Date(evt.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{evt.notes || 'Status updated'}</p>
                      {evt.changedBy && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>By: {evt.changedBy.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button className="btn btn-outline" onClick={() => setTimelineModalTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModalTx && (
        <div className="modal-overlay" onClick={() => setReceiptModalTx(null)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '16px' }}>
              <span className="eyebrow">CAMPUSSHARE VERIFIED RECEIPT</span>
              <h3 style={{ margin: '4px 0' }}>Transaction #{receiptModalTx.id}</h3>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Completed on {new Date(receiptModalTx.completedAt || receiptModalTx.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Item:</span>
                <strong>{receiptModalTx.itemTitleSnapshot || receiptModalTx.item?.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Transaction Type:</span>
                <span>{receiptModalTx.transactionType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Owner / Seller:</span>
                <span>{receiptModalTx.owner?.name} ({receiptModalTx.owner?.department})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Buyer / Renter:</span>
                <span>{receiptModalTx.borrower?.name} ({receiptModalTx.borrower?.department})</span>
              </div>
              {receiptModalTx.transactionType === 'RENTAL' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Rental Duration:</span>
                    <span>{receiptModalTx.durationDays} day(s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Security Deposit:</span>
                    <span>₹{receiptModalTx.depositAmount || 0}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Item Price:</span>
                <span>₹{receiptModalTx.itemAmount || (receiptModalTx.totalAmount - (receiptModalTx.platformFee || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Platform Guarantee & Trust Fee (5%):</span>
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>₹{receiptModalTx.platformFee || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Payment Method:</span>
                <span>{receiptModalTx.paymentMethod || 'UPI / Cash'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '1.1rem' }}>
                <strong>Total Amount Paid:</strong>
                <strong style={{ color: '#059669' }}>₹{receiptModalTx.totalAmount}</strong>
              </div>
            </div>

            <div className="modal-actions-row">
              <button className="btn btn-primary btn-block" onClick={() => setReceiptModalTx(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Proposal Modal */}
      {meetingModalTx && (
        <div className="modal-overlay" onClick={() => setMeetingModalTx(null)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>📍 Propose Campus Meeting Spot</h3>
            <p className="muted">Choose a safe public place on campus to meet and hand over the item.</p>

            <form onSubmit={submitMeeting} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Meeting Location Spot</label>
                <select
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                >
                  <option value="College Library">College Library</option>
                  <option value="Central Canteen / Food Court">Central Canteen / Food Court</option>
                  <option value="Main College Gate">Main College Gate</option>
                  <option value="Hostel Block A / Reception">Hostel Block A / Reception</option>
                  <option value="Department Block">Department Block</option>
                  <option value="Sports Complex">Sports Complex</option>
                  <option value="Custom Spot">Custom Spot</option>
                </select>
              </div>

              {meetingForm.location === 'Custom Spot' && (
                <div className="form-group">
                  <label>Custom Location Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Nescafe stall by Audi"
                    required
                    onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 2:30 PM"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Optional Note</label>
                <input
                  type="text"
                  placeholder="e.g. I will be wearing a blue jacket"
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMeetingModalTx(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingMeeting}>
                  {submittingMeeting ? 'Sending…' : 'Send Proposal →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Deposit Modal */}
      {returnModalTx && (
        <div className="modal-overlay" onClick={() => setReturnModalTx(null)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>✅ Confirm Item Return & Deposit</h3>
            <p className="muted">Confirm physical return of "{returnModalTx.itemTitleSnapshot || returnModalTx.item?.title}".</p>

            <form onSubmit={submitOwnerReturn} style={{ marginTop: '16px' }}>
              <div className="deposit-summary-box" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
                <p>
                  <strong>Total Security Deposit Collected:</strong> ₹{returnModalTx.depositAmount || 0}
                </p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  If the item is intact, leave deduction blank to return 100% deposit to the student.
                </p>
              </div>

              {Number(returnModalTx.depositAmount || 0) > 0 && (
                <>
                  <div className="form-group">
                    <label>Deposit Deduction Amount (if item damaged/late, optional)</label>
                    <input
                      type="number"
                      max={returnModalTx.depositAmount}
                      min="0"
                      placeholder="0"
                      value={returnForm.depositDeductionAmount}
                      onChange={(e) =>
                        setReturnForm({ ...returnForm, depositDeductionAmount: e.target.value })
                      }
                    />
                  </div>
                  {returnForm.depositDeductionAmount > 0 && (
                    <div className="form-group">
                      <label>Deduction Reason (required if deducting)</label>
                      <input
                        type="text"
                        placeholder="e.g. Minor screen scratch, missing cable"
                        required
                        value={returnForm.depositDeductionReason}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, depositDeductionReason: e.target.value })
                        }
                      />
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setReturnModalTx(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingReturn}>
                  {submittingReturn ? 'Processing…' : 'Confirm Return & Complete →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalTx && (
        <div className="modal-overlay" onClick={() => setDisputeModalTx(null)}>
          <div className="surface modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>🚩 Report an Issue on Transaction</h3>
            <p className="muted">Submit a report to campus moderation for mediation.</p>

            <form onSubmit={submitDispute} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Reason</label>
                <select
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                >
                  <option value="User didn't show up">User didn't show up</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Item damaged">Item damaged</option>
                  <option value="Item not returned">Item not returned</option>
                  <option value="Harassment / Inappropriate behavior">
                    Harassment / Inappropriate behavior
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description of Issue</label>
                <textarea
                  rows="4"
                  placeholder="Please provide details about what went wrong…"
                  required
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDisputeModalTx(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingDispute}>
                  {submittingDispute ? 'Submitting…' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
