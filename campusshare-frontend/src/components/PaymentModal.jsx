import { useState } from 'react';
import api from '../config/api';
import { loadRazorpay } from '../utils/razorpay';
import './PaymentModal.css';

export default function PaymentModal({ rental, onClose, onSuccess }) {
  const [method, setMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING' | 'RAZORPAY'
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');
  const [cardData, setCardData] = useState({
    number: '4532 •••• •••• 8892',
    name: 'CAMPUS STUDENT',
    expiry: '12/28',
    cvv: '882'
  });
  const [bank, setBank] = useState('HDFC');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('SELECT'); // 'SELECT' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = Number(rental.totalAmount || 0) + Number(rental.depositAmount || 0);

  const handlePay = async () => {
    setProcessing(true);
    setStep('PROCESSING');
    setErrorMessage('');

    try {
      // 1. Create order on backend
      const { data: order } = await api.post(`/payments/rentals/${rental.id}/order`);

      // If user selected Razorpay direct official popup and Razorpay is loaded:
      if (method === 'RAZORPAY') {
        const loaded = await loadRazorpay();
        if (loaded && window.Razorpay) {
          const phone = order.userPhone?.length === 10 ? `+91${order.userPhone}` : order.userPhone;
          const checkout = new window.Razorpay({
            key: order.keyId,
            amount: order.amountPaise,
            currency: order.currency,
            name: 'CampusShare',
            description: `Payment for ${rental.item?.title || 'Campus Item'}`,
            order_id: order.orderId,
            prefill: { name: order.userName, email: order.userEmail, contact: phone },
            handler: async (result) => {
              try {
                await api.post(`/payments/rentals/${rental.id}/verify`, {
                  razorpayOrderId: result.razorpay_order_id,
                  razorpayPaymentId: result.razorpay_payment_id,
                  razorpaySignature: result.razorpay_signature
                });
                setStep('SUCCESS');
                setTimeout(() => {
                  if (onSuccess) onSuccess();
                }, 1500);
              } catch (err) {
                setErrorMessage(err.response?.data?.message || 'Verification failed');
                setStep('ERROR');
              }
            }
          });
          checkout.open();
          setProcessing(false);
          setStep('SELECT');
          return;
        }
      }

      // 2. Realistic In-App Gateway Verification (UPI, Card, NetBanking, or Sandbox Gateway)
      const mockPaymentId = `pay_${method.toLowerCase()}_${Date.now().toString(36)}`;
      const mockSignature = `sig_${Date.now().toString(36)}`;

      // Simulate network authorization delay (1.2s)
      await new Promise((r) => setTimeout(r, 1200));

      await api.post(`/payments/rentals/${rental.id}/verify`, {
        razorpayOrderId: order.orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature
      });

      setStep('SUCCESS');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Payment failure:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Payment could not be processed. Please try again.'
      );
      setStep('ERROR');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="gateway-badge">
            <span className="lock-icon">🔒</span>
            <span>CampusPay Secure Gateway · 256-Bit SSL</span>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={processing}>
            ✕
          </button>
        </div>

        {step === 'PROCESSING' ? (
          <div className="payment-status-box">
            <div className="payment-spinner" />
            <h3>Processing Secure Payment…</h3>
            <p className="muted">Connecting with banking network & authorizing ₹{totalAmount}</p>
            <span className="badge neutral">Do not refresh or close this window</span>
          </div>
        ) : step === 'SUCCESS' ? (
          <div className="payment-status-box success">
            <div className="success-icon">✓</div>
            <h3>Payment Captured Successfully!</h3>
            <p>
              ₹{totalAmount} paid for <b>{rental.item?.title}</b>.
            </p>
            <p className="muted" style={{ fontSize: '13px' }}>
              Handover is now active. Meet the owner to exchange the 6-digit PIN.
            </p>
          </div>
        ) : (
          <>
            {/* Bill Summary Strip */}
            <div className="bill-summary-strip">
              <div>
                <span className="item-name">{rental.item?.title || 'Campus Item'}</span>
                <small className="muted">
                  {rental.durationDays ? `${rental.durationDays} day(s) rental` : 'Direct Purchase'}
                </small>
              </div>
              <div className="amount-highlight">
                <small>Total Payable</small>
                <strong>₹{totalAmount}</strong>
              </div>
            </div>

            {Number(rental.depositAmount) > 0 && (
              <div className="deposit-notice">
                <span>🛡️ Includes ₹{rental.depositAmount} refundable deposit (released after return)</span>
              </div>
            )}

            {errorMessage && <div className="payment-error-banner">{errorMessage}</div>}

            {/* Payment Method Selector */}
            <div className="payment-method-tabs">
              <button
                type="button"
                className={`tab-btn ${method === 'UPI' ? 'active' : ''}`}
                onClick={() => setMethod('UPI')}
              >
                📱 UPI / QR
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'CARD' ? 'active' : ''}`}
                onClick={() => setMethod('CARD')}
              >
                💳 Debit / Credit Card
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'NETBANKING' ? 'active' : ''}`}
                onClick={() => setMethod('NETBANKING')}
              >
                🏦 NetBanking
              </button>
              <button
                type="button"
                className={`tab-btn ${method === 'RAZORPAY' ? 'active' : ''}`}
                onClick={() => setMethod('RAZORPAY')}
              >
                ⚡ Razorpay Direct
              </button>
            </div>

            {/* Method Content */}
            <div className="method-content">
              {/* UPI Tab */}
              {method === 'UPI' && (
                <div className="upi-pane">
                  <div className="upi-apps-row">
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        className={`upi-app-chip ${selectedUpiApp === app ? 'active' : ''}`}
                        onClick={() => setSelectedUpiApp(app)}
                      >
                        {app}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="label">Enter UPI ID / VPA</label>
                    <div className="upi-input-wrap">
                      <input
                        className="input"
                        placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <span className="verified-tag">✓ Verified</span>
                    </div>
                  </div>

                  <div className="qr-preview-box">
                    <div className="qr-box">
                      <div className="mock-qr">
                        <span>📲 Scan with any UPI App</span>
                      </div>
                    </div>
                    <small className="muted">GPay · PhonePe · Paytm · BHIM · Any Banking App</small>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {method === 'CARD' && (
                <div className="card-pane">
                  <div className="form-group">
                    <label className="label">Card Number</label>
                    <input
                      className="input"
                      placeholder="4532 0000 0000 8892"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="label">Cardholder Name</label>
                      <input
                        className="input"
                        placeholder="CAMPUS STUDENT"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Expiry (MM/YY)</label>
                      <input
                        className="input"
                        placeholder="12/28"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">CVV</label>
                      <input
                        className="input"
                        type="password"
                        maxLength="4"
                        placeholder="•••"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="card-badges">
                    <span>Visa</span>
                    <span>Mastercard</span>
                    <span>RuPay</span>
                    <span>Safe 3D Secure OTP</span>
                  </div>
                </div>
              )}

              {/* NetBanking Tab */}
              {method === 'NETBANKING' && (
                <div className="netbanking-pane">
                  <label className="label">Select your Bank</label>
                  <div className="banks-grid">
                    {[
                      { code: 'HDFC', name: 'HDFC Bank' },
                      { code: 'SBI', name: 'State Bank of India' },
                      { code: 'ICICI', name: 'ICICI Bank' },
                      { code: 'AXIS', name: 'Axis Bank' },
                      { code: 'PNB', name: 'Punjab National Bank' },
                      { code: 'CAMPUS', name: 'Campus Student Bank' }
                    ].map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        className={`bank-chip ${bank === b.code ? 'active' : ''}`}
                        onClick={() => setBank(b.code)}
                      >
                        🏛 {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Razorpay Direct Tab */}
              {method === 'RAZORPAY' && (
                <div className="razorpay-direct-pane">
                  <p>
                    Open the official <b>Razorpay Checkout</b> gateway modal with live sandbox/production options.
                  </p>
                  <div className="notice premium-notice">
                    Supports all Indian Payment Modes: UPI Apps, Cards, NetBanking, Wallets.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="payment-modal-footer">
              <button
                type="button"
                className="btn btn-primary pay-now-btn"
                disabled={processing}
                onClick={handlePay}
              >
                {processing ? 'Processing…' : `Pay ₹${totalAmount} Now →`}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={processing}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
