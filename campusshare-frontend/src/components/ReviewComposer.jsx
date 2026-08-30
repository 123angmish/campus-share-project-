import { useState } from 'react';
import api from '../config/api';

const message = (error) => error.response?.data?.message || error.message || 'Could not publish review';

export default function ReviewComposer({ rental, onDone }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await api.post('/reviews', { transactionId: rental.id, rating, comment: comment.trim() || null });
      setOpen(false);
      setComment('');
      onDone?.();
    } catch (error) {
      alert(message(error));
    } finally {
      setSaving(false);
    }
  };

  if (rental.status !== 'COMPLETED' || rental.reviewedByCurrentUser) {
    return rental.reviewedByCurrentUser ? <span className="badge success">✓ Review sent</span> : null;
  }

  return <>
    <button className="btn btn-secondary" onClick={() => setOpen(true)}>Leave review</button>
    {open && <div className="modal-backdrop" onMouseDown={() => !saving && setOpen(false)}>
      <div className="surface review-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div><span className="eyebrow dark">TRUST SIGNAL</span><h3>Rate this rental</h3></div>
          <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <p className="muted">Your review becomes part of the other student&apos;s CampusTrust reputation.</p>
        <div className="star-picker" aria-label="Rating out of five">
          {[1,2,3,4,5].map((value) => <button type="button" key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)}>★</button>)}
        </div>
        <textarea className="input review-textarea" maxLength="1000" rows="4" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Was the handover smooth? Was the item/user reliable?" />
        <div className="modal-actions"><button className="btn btn-secondary" disabled={saving} onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={submit}>{saving ? 'Publishing…' : `Publish ${rating}-star review`}</button></div>
      </div>
    </div>}
  </>;
}
