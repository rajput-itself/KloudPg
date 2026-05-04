'use client';
import { useState } from 'react';
import { X, Calendar, MessageSquare, Phone, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function BookingModal({ pg, onClose }) {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ room_type: 'double', visit_date: '', message: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pg_id: pg.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit booking'); }
      else { setBookingId(data.id); setSuccess(true); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ color: 'var(--success)', marginBottom: '16px' }}>
              <CheckCircle size={64} />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Booking Request Sent!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Your visit request for <strong>{pg.name}</strong> has been submitted.
              The owner will review and confirm your visit soon.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>View My Bookings</button>
              {bookingId && (
                <button className="btn btn-primary" style={{ background: 'var(--success)' }}
                  onClick={() => { onClose(); router.push(`/payment/${bookingId}`); }}>
                  <CreditCard size={14} /> Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Calendar size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Book a Visit</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Schedule a visit to <strong>{pg.name}</strong> in {pg.locality}, {pg.city}
        </p>
        {error && <div className="form-error" style={{ marginBottom: '16px', padding: '12px', background: '#FFF5F5', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Type</label>
            <select className="form-select" value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })}>
              <option value="single">Single Occupancy</option>
              <option value="double">Double Sharing</option>
              <option value="triple">Triple Sharing</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label"><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Preferred Visit Date</label>
            <input type="date" className="form-input" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label className="form-label"><Phone size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Phone Number</label>
            <input type="tel" className="form-input" placeholder="Your phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label"><MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Message (optional)</label>
            <textarea className="form-input" placeholder="Tell the owner about yourself, when you plan to move in, etc." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Submitting...' : user ? 'Submit Booking Request' : 'Login to Book'}
          </button>
        </form>
      </div>
    </div>
  );
}
