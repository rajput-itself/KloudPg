'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Building2, Calendar, Smartphone, Banknote, Home } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard size={24} /> },
  { id: 'upi', label: 'UPI', icon: <Smartphone size={24} /> },
  { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={24} /> },
];

export default function PaymentPage() {
  const { booking_id } = useParams();
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [error, setError] = useState('');
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchBooking();
  }, [user, authLoading]);

  const fetchBooking = async () => {
    try {
      const res = await authFetch(`/api/bookings/${booking_id}`);
      const data = await res.json();
      if (data.booking?.payment_status === 'completed') {
        router.push('/dashboard');
        return;
      }
      setBooking(data.booking);
    } catch { setError('Could not load booking'); }
    finally { setLoading(false); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!booking) return;
    setProcessing(true);
    setError('');

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2200));

    try {
      const res = await authFetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: parseInt(booking_id),
          amount: booking.price_min || 8000,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Payment failed'); }
      else { setTxnId(data.transaction_id); setSuccess(true); }
    } catch { setError('Network error. Please try again.'); }
    finally { setProcessing(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="auth-page">
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ color: 'var(--success)', marginBottom: '16px' }}><CheckCircle size={64} /></div>
          <h1 style={{ color: 'var(--success)', marginBottom: '12px' }}>Payment Successful!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Your booking for <strong>{booking?.pg_name}</strong> is confirmed.
          </p>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            padding: '16px', margin: '20px 0', textAlign: 'left', fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{txnId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{(booking?.price_min || 8000).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Method</span>
              <span style={{ textTransform: 'uppercase' }}>{method}</span>
            </div>
          </div>
          <Link href="/dashboard" className="btn btn-primary btn-full btn-lg">
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ padding: '40px 16px' }}>
      <div className="payment-layout">
        {/* Payment Form */}
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px', display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Complete Payment</h1>
          <p className="auth-subtitle" style={{ marginBottom: '24px' }}>Secure payment powered by StayEasy Pay</p>

          {error && (
            <div className="form-error" style={{ padding: '12px', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Payment methods */}
          <div className="payment-methods">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setMethod(pm.id)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${method === pm.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: method === pm.id ? 'rgba(var(--primary-rgb),0.07)' : 'var(--bg-card)',
                  cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem',
                  color: method === pm.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: method === pm.id ? 700 : 400, transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{pm.icon}</div>
                {pm.label}
              </button>
            ))}
          </div>

          <form onSubmit={handlePay}>
            {method === 'card' && (
              <>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    className="form-input"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardForm.number}
                    onChange={e => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim() })}
                    required
                    id="card-number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input className="form-input" placeholder="Name on card" value={cardForm.name}
                    onChange={e => setCardForm({ ...cardForm, name: e.target.value })} required id="card-name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input className="form-input" placeholder="MM / YY" maxLength={7} value={cardForm.expiry}
                      onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })} required id="card-expiry" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="form-input" placeholder="•••" type="password" maxLength={4} value={cardForm.cvv}
                      onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })} required id="card-cvv" />
                  </div>
                </div>
              </>
            )}
            {method === 'upi' && (
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input className="form-input" placeholder="yourname@upi" required id="upi-id" />
              </div>
            )}
            {method === 'netbanking' && (
              <div className="form-group">
                <label className="form-label">Select Bank</label>
                <select className="form-select" defaultValue="" required id="bank-select">
                  <option value="" disabled>Choose your bank</option>
                  {['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'Kotak', 'PNB'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', margin: '16px 0' }}>
              <Lock size={14} /> 256-bit SSL encrypted. Your payment info is secure.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={processing}
              id="pay-now-btn"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {processing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  Processing Payment...
                </span>
              ) : (
                <><CreditCard size={18} /> Pay ₹{(booking?.price_min || 8000).toLocaleString('en-IN')}</>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="booking-card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={24} color="#fff" /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{booking?.pg_name || '...'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{booking?.locality}, {booking?.city}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              {[
                ['Room Type', booking?.room_type ? `${booking.room_type} occupancy` : '—'],
                ['Visit Date', booking?.visit_date || '—'],
                ['Booking #', `#${booking_id}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.87rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: '1rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{(booking?.price_min || 8000).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
