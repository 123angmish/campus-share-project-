import { useEffect, useState } from 'react';
import api from '../config/api';
import { loadRazorpay } from '../utils/razorpay';
import ReviewComposer from '../components/ReviewComposer';
import './Marketplace.css';

const apiMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export default function MyRentals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/rentals/my-rentals');
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pay = async (rental) => {
    try {
      if (!(await loadRazorpay())) throw new Error('Razorpay Checkout could not load. Check your internet connection.');
      const { data: order } = await api.post(`/payments/rentals/${rental.id}/order`);
      const phone = order.userPhone?.length === 10 ? `+91${order.userPhone}` : order.userPhone;

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'CampusShare',
        description: `Rental · ${order.itemTitle}`,
        order_id: order.orderId,
        prefill: { name: order.userName, email: order.userEmail, contact: phone },
        notes: { rentalId: String(rental.id), paymentAttemptId: String(order.paymentAttemptId) },
        retry: { enabled: true },
        modal: { ondismiss: () => load() },
        handler: async (result) => {
          try {
            await api.post(`/payments/rentals/${rental.id}/verify`, {
              razorpayOrderId: result.razorpay_order_id,
              razorpayPaymentId: result.razorpay_payment_id,
              razorpaySignature: result.razorpay_signature
            });
            await load();
          } catch (error) {
            alert(apiMessage(error, 'Payment reached Razorpay but verification is still pending. Refresh this page before paying again.'));
            await load();
          }
        }
      });

      checkout.on('payment.failed', (result) => {
        alert(result.error?.description || 'Payment failed. No rental handover will be allowed until a captured payment is confirmed.');
        load();
      });
      checkout.open();
    } catch (error) {
      alert(apiMessage(error, 'Could not start payment'));
    }
  };

  const collect = async (id) => {
    try {
      await api.post(`/rentals/${id}/confirm-collection`, { pin });
      setPinFor(null); setPin(''); await load();
    } catch (error) { alert(apiMessage(error, 'Could not confirm handover')); }
  };

  const returned = async (id) => {
    if (!confirm('Confirm that you physically returned this item to the owner?')) return;
    try { await api.post(`/rentals/${id}/confirm-return`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not confirm return')); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this unpaid rental request?')) return;
    try { await api.post(`/rentals/${id}/cancel`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not cancel rental')); }
  };

  return <main className="page-shell">
    <div className="page-heading">
      <div><span className="eyebrow dark">RENTAL WALLET</span><h1>My rentals</h1><p>Requests, captured payments and handovers in one timeline.</p></div>
      <div className="secure-pill">⌾ Server-verified Razorpay checkout</div>
    </div>

    {loading ? <div className="loading-state">Loading…</div> : data.length === 0 ?
      <div className="surface empty-state"><div className="empty-icon">↔</div><h3>No rentals yet</h3><p>Browse the marketplace and request something useful.</p></div> :
      <div className="cards-list">{data.map((r) => <div className="surface rental-card-v2" key={r.id}>
        <div className="rental-icon">↔</div>
        <div className="rental-main">
          <div className="rental-badges">
            <span className={`badge ${r.status === 'COMPLETED' ? 'success' : ['DECLINED', 'CANCELLED'].includes(r.status) ? 'danger' : 'warn'}`}>{r.status}</span>
            <span className={`badge ${r.paymentStatus === 'PAID' ? 'success' : r.paymentStatus === 'FAILED' ? 'danger' : 'neutral'}`}>
              {r.paymentStatus === 'PAID' ? '✓ CAPTURED' : `PAYMENT ${r.paymentStatus}`}
            </span>
          </div>
          <h3>{r.item?.title || 'Rental'}</h3>
          <p>{r.startDate} → {r.endDate} · Owner: {r.owner?.name}</p>
          <div className="rental-timeline">
            <span className="done">Requested</span>
            <span className={['ACCEPTED', 'ACTIVE', 'COMPLETED'].includes(r.status) ? 'done' : ''}>Accepted</span>
            <span className={r.paymentStatus === 'PAID' ? 'done' : ''}>Captured</span>
            <span className={['ACTIVE', 'COMPLETED'].includes(r.status) ? 'done' : ''}>Collected</span>
            <span className={r.status === 'COMPLETED' ? 'done' : ''}>Returned</span>
          </div>
        </div>
        <div className="rental-side">
          <strong>₹{Number(r.totalAmount || 0) + Number(r.depositAmount || 0)}</strong>
          <small>rent + refundable deposit</small>
          {r.status === 'ACCEPTED' && r.paymentStatus !== 'PAID' && <button className="btn btn-primary" onClick={() => pay(r)}>Pay securely</button>}
          {r.status === 'ACCEPTED' && r.paymentStatus === 'PAID' && <button className="btn btn-secondary" onClick={() => setPinFor(r.id)}>Enter handover PIN</button>}
          {['PENDING', 'ACCEPTED'].includes(r.status) && r.paymentStatus !== 'PAID' && <button className="btn btn-secondary" onClick={() => cancel(r.id)}>Cancel request</button>}
          {r.status === 'ACTIVE' && !r.borrowerConfirmedReturn && <button className="btn btn-secondary" onClick={() => returned(r.id)}>I returned the item</button>}
          {r.status === 'ACTIVE' && r.borrowerConfirmedReturn && <span className="badge success">Waiting for owner</span>}
          {r.depositRefundStatus === 'PROCESSING' && <span className="badge warn">Deposit refund processing</span>}
          {r.depositRefundStatus === 'REFUNDED' && <span className="badge success">Deposit refunded</span>}
          <ReviewComposer rental={r} onDone={load} />
        </div>

        {pinFor === r.id && <div className="pin-panel">
          <div><b>Secure handover</b><small>Ask the owner for the 6-digit PIN only while the item is physically being handed over.</small></div>
          <input maxLength="6" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          <button className="btn btn-primary" disabled={pin.length !== 6} onClick={() => collect(r.id)}>Confirm collection</button>
        </div>}
      </div>)}</div>}
  </main>;
}
