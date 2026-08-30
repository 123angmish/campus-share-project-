import { useEffect, useState } from 'react';
import api from '../config/api';
import ReviewComposer from '../components/ReviewComposer';
import './Marketplace.css';

const apiMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export default function MyListings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState({});

  const load = async () => {
    try { const response = await api.get('/rentals/my-listings'); setData(response.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    try { await api.post(`/rentals/${id}/accept`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not accept request')); }
  };
  const decline = async (id) => {
    const reason = prompt('Reason for declining');
    if (!reason?.trim()) return;
    try { await api.post(`/rentals/${id}/decline?reason=${encodeURIComponent(reason.trim())}`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not decline request')); }
  };
  const cancel = async (id) => {
    if (!confirm('Cancel this accepted but unpaid rental?')) return;
    try { await api.post(`/rentals/${id}/cancel`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not cancel rental')); }
  };
  const reveal = async (id) => {
    try {
      const response = await api.get(`/rentals/${id}/handover-pin`);
      setPins((current) => ({ ...current, [id]: response.data.pin }));
    } catch (error) { alert(apiMessage(error, 'PIN not available yet')); }
  };
  const received = async (id) => {
    if (!confirm('Confirm that the item has physically been returned to you?')) return;
    try { await api.post(`/rentals/${id}/confirm-return`); await load(); }
    catch (error) { alert(apiMessage(error, 'Could not confirm return')); }
  };
  const refund = async (id) => {
    if (!confirm('Release the refundable security deposit back to the borrower?')) return;
    try {
      const response = await api.post(`/payments/rentals/${id}/refund-deposit`);
      alert(`Refund ${response.data.status}: ₹${response.data.amount}`);
      await load();
    } catch (error) { alert(apiMessage(error, 'Refund failed')); }
  };

  return <main className="page-shell">
    <div className="page-heading"><div><span className="eyebrow dark">OWNER DESK</span><h1>Rental requests</h1><p>Approve borrowers, verify captured payment, exchange by PIN and release deposits.</p></div></div>

    {loading ? <div className="loading-state">Loading…</div> : data.length === 0 ?
      <div className="surface empty-state"><div className="empty-icon">☷</div><h3>No requests yet</h3><p>New borrower requests will appear here.</p></div> :
      <div className="cards-list">{data.map((r) => <div className="surface list-card owner-request" key={r.id}>
        <div className="list-thumb">☷</div>
        <div>
          <div className="rental-badges">
            <span className={`badge ${r.status === 'PENDING' ? 'warn' : ['DECLINED', 'CANCELLED'].includes(r.status) ? 'danger' : r.status === 'COMPLETED' ? 'success' : ''}`}>{r.status}</span>
            <span className={`badge ${r.paymentStatus === 'PAID' ? 'success' : r.paymentStatus === 'FAILED' ? 'danger' : 'neutral'}`}>{r.paymentStatus === 'PAID' ? 'CAPTURED' : r.paymentStatus}</span>
          </div>
          <h3>{r.item?.title}</h3>
          <p>{r.borrower?.name} · {r.startDate} → {r.endDate} · ₹{r.totalAmount} + ₹{r.depositAmount || 0} deposit</p>
          {pins[r.id] && <div className="owner-pin"><small>HANDOVER PIN</small><strong>{pins[r.id]}</strong><span>Share only during the physical handover.</span></div>}
        </div>
        <div className="list-actions">
          {r.status === 'PENDING' && <><button className="btn btn-primary" onClick={() => accept(r.id)}>Accept</button><button className="btn btn-danger" onClick={() => decline(r.id)}>Decline</button></>}
          {r.status === 'ACCEPTED' && r.paymentStatus !== 'PAID' && <button className="btn btn-secondary" onClick={() => cancel(r.id)}>Cancel unpaid rental</button>}
          {r.status === 'ACCEPTED' && r.paymentStatus === 'PAID' && <button className="btn btn-secondary" onClick={() => reveal(r.id)}>{pins[r.id] ? 'PIN shown' : 'Reveal handover PIN'}</button>}
          {r.status === 'ACTIVE' && !r.ownerConfirmedReturn && <button className="btn btn-secondary" onClick={() => received(r.id)}>Confirm item returned</button>}
          {r.status === 'ACTIVE' && r.ownerConfirmedReturn && <span className="badge success">Return confirmed</span>}
          {r.status === 'COMPLETED' && r.paymentStatus === 'PAID' && Number(r.depositAmount) > 0 && r.depositRefundStatus !== 'PROCESSING' && r.depositRefundStatus !== 'REFUNDED' && <button className="btn btn-primary" onClick={() => refund(r.id)}>Refund deposit</button>}
          {r.depositRefundStatus === 'PROCESSING' && <span className="badge warn">Refund processing</span>}
          {r.depositRefundStatus === 'REFUNDED' && <span className="badge success">Deposit refunded</span>}
          {r.depositRefundStatus === 'FAILED' && <span className="badge danger">Refund failed · retry available</span>}
          <ReviewComposer rental={r} onDone={load} />
        </div>
      </div>)}</div>}
  </main>;
}
