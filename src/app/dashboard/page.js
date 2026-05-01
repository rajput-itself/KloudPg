'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Calendar, MapPin, Clock, ExternalLink, X, CreditCard, Star, AlertTriangle, Home, ClipboardList, CheckCircle, RotateCcw } from 'lucide-react';

function GradientBG({ url }) {
  if (url && url.startsWith('gradient:')) {
    const parts = url.split(':');
    return <div className="gradient-bg" style={{ background: `linear-gradient(135deg, ${parts[1] || '#0A66C2'}, ${parts[2] || '#38BDF8'})` }}><Home size={24} color="rgba(255,255,255,0.72)" /></div>;
  }
  return <div className="gradient-bg" style={{ background: 'linear-gradient(135deg, #0A66C2, #38BDF8)' }}><Home size={24} color="rgba(255,255,255,0.72)" /></div>;
}

const STATUS_COLOR = { pending: 'var(--warning)', confirmed: 'var(--success)', cancelled: '#ef4444', rejected: '#ef4444', visited: 'var(--text-muted)' };

export default function DashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState('bookings'); // bookings | payments | complaints
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', booking_id: '' });
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ pg_id: null, pg_name: '', rating: 5, comment: '', booking_id: null });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) { fetchAll(); }
  }, [user, authLoading]);

  const fetchAll = async () => {
    const [bRes, pRes, cRes] = await Promise.all([
      authFetch('/api/bookings'),
      authFetch('/api/payments'),
      authFetch('/api/complaints'),
    ]);
    const [bData, pData, cData] = await Promise.all([bRes.json(), pRes.json(), cRes.json()]);
    setBookings(bData.bookings || []);
    setPayments(pData.payments || []);
    setComplaints(cData.complaints || []);
    setLoading(false);
  };

  const handleCancel = async () => {
    setActionLoading(true);
    await authFetch(`/api/bookings/${cancelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', refund_reason: refundReason }),
    });
    setCancelId(null);
    setRefundReason('');
    fetchAll();
    setActionLoading(false);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    const res = await authFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewForm),
    });
    const data = await res.json();
    if (!res.ok) { setReviewError(data.error || 'Failed'); return; }
    setShowReviewForm(false);
    setReviewForm({ pg_id: null, pg_name: '', rating: 5, comment: '', booking_id: null });
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    await authFetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintForm),
    });
    setShowComplaintForm(false);
    setComplaintForm({ subject: '', description: '', booking_id: '' });
    fetchAll();
  };

  if (authLoading || !user) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    totalPaid: payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="container dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p className="dashboard-welcome">Welcome back, {user.name}!</p>
        </div>
        <Link href="/pgs" className="btn btn-primary">Browse PGs</Link>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {[
          { label: 'Total Bookings', value: stats.total },
          { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
          { label: 'Confirmed', value: stats.confirmed, color: 'var(--success)' },
          { label: 'Total Paid', value: `₹${stats.totalPaid.toLocaleString('en-IN')}`, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="dashboard-stat">
            <div className="dashboard-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['bookings', <><ClipboardList size={14} /> My Bookings</>], ['payments', <><CreditCard size={14} /> Payments</>], ['complaints', <><AlertTriangle size={14} /> Complaints</>]].map(([key, label]) => (
      <button key={key} onClick={() => setTab(key)}
        className={`btn btn-ghost btn-sm`}
        style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '10px', fontWeight: tab === key ? 700 : 400, color: tab === key ? 'var(--primary)' : 'var(--text-muted)' }}>
        {label}
      </button>
    ))
  }
      </div >

    { loading?<div className = "loading-spinner">< div className = "spinner" /></div > : (
      <>
        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          bookings.length === 0 ? (
            <div className="empty-state">
                <div className="empty-state-icon"><ClipboardList size={48} /></div>
                <h3>No Bookings Yet</h3>
                <p>Browse PGs and book a visit!</p>
                <Link href="/pgs" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse PGs</Link>
              </div >
            ) : (
    <div className="booking-list">
      {bookings.map(booking => (
        <div key={booking.id} className="booking-item">
          <div className="booking-item-image"><GradientBG url={booking.image_url} /></div>
          <div className="booking-item-info">
            <h3>{booking.pg_name}</h3>
            <p><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {booking.locality}, {booking.city}</p>
            <p style={{ marginTop: '4px' }}>
              {booking.room_type && <span style={{ textTransform: 'capitalize' }}>{booking.room_type} room</span>}
              {booking.visit_date && <> · <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {booking.visit_date}</>}
            </p>
            {booking.payment_status === 'completed' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}><CheckCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Paid ₹{booking.payment_amount?.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="booking-item-status">
            <span className={`badge badge-status-${booking.status}`} style={{ color: STATUS_COLOR[booking.status] }}>{booking.status}</span>
            <div className="booking-item-date"><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {new Date(booking.created_at).toLocaleDateString('en-IN')}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Link href={`/pgs/${booking.pg_id}`} className="btn btn-ghost btn-sm"><ExternalLink size={14} /> View</Link>
              {booking.status === 'confirmed' && booking.payment_status !== 'completed' && (
                <Link href={`/payment/${booking.id}`} className="btn btn-primary btn-sm"><CreditCard size={14} /> Pay</Link>
              )}
              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => setCancelId(booking.id)}>
                  <X size={14} /> Cancel
                </button>
              )}
              {booking.status === 'visited' && !booking.payment_status && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }}
                  onClick={() => { setReviewForm({ pg_id: booking.pg_id, pg_name: booking.pg_name, rating: 5, comment: '', booking_id: booking.id }); setShowReviewForm(true); }}>
                  <Star size={14} /> Review
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => { setComplaintForm({ subject: '', description: '', booking_id: booking.id }); setShowComplaintForm(true); }}>
                <AlertTriangle size={14} /> Complain
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
          )
}

{/* PAYMENTS TAB */ }
{
  tab === 'payments' && (
    payments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><CreditCard size={48} /></div><h3>No Payments Yet</h3><p>Payments appear here after you pay for a booking.</p></div>
    ) : (
      <div className="booking-list">
        {payments.map(p => (
          <div key={p.id} className="booking-item">
            <div className="booking-item-info">
              <h3>{p.pg_name}</h3>
              <p><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.locality}, {p.city}</p>
              <p style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>TXN: {p.transaction_id}</p>
            </div>
            <div className="booking-item-status">
              <span className={`badge badge-status-${p.status}`}>{p.status}</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: p.status === 'refunded' ? 'var(--warning)' : 'var(--success)', marginTop: '4px' }}>
                {p.status === 'refunded' ? <RotateCcw size={14} /> : <CheckCircle size={14} />} ₹{p.amount?.toLocaleString('en-IN')}
              </div>
              <div className="booking-item-date">{new Date(p.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          </div>
        ))}
      </div>
    )
  )
}

{/* COMPLAINTS TAB */ }
{
  tab === 'complaints' && (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowComplaintForm(true)}>+ New Complaint</button>
      </div>
      {complaints.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><AlertTriangle size={48} /></div><h3>No Complaints</h3><p>Submit a complaint if you face any issue.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complaints.map(c => (
            <div key={c.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong>{c.subject}</strong>
                <span className={`badge badge-status-${c.status}`}>{c.status}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: '8px' }}>{c.description}</p>
              {c.admin_response && (
                <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', borderLeft: '3px solid var(--primary)' }}>
                  <strong>Admin Response:</strong> {c.admin_response}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
        </>
      )}

{/* Cancel Booking Modal */ }
{
  cancelId && (
    <div className="modal-overlay" onClick={() => setCancelId(null)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header"><h2>Cancel Booking</h2><button className="modal-close" onClick={() => setCancelId(null)}>×</button></div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Are you sure you want to cancel booking #{cancelId}? If you&apos;ve paid, a refund will be initiated.</p>
        <div className="form-group">
          <label className="form-label">Reason (optional)</label>
          <textarea className="form-input" value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={2} placeholder="Reason for cancellation..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setCancelId(null)}>Keep Booking</button>
          <button className="btn btn-primary" style={{ background: '#ef4444' }} disabled={actionLoading} onClick={handleCancel}>
            {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

{/* Review Modal */ }
{
  showReviewForm && (
    <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header"><h2><Star size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Write a Review</h2><button className="modal-close" onClick={() => setShowReviewForm(false)}>×</button></div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Share your experience at <strong>{reviewForm.pg_name}</strong></p>
        {reviewError && <div className="form-error" style={{ padding: '10px', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>{reviewError}</div>}
        <form onSubmit={handleReview}>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                  style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer', opacity: n <= reviewForm.rating ? 1 : 0.3, transition: 'opacity 0.15s' }}><Star size={24} fill={n <= reviewForm.rating ? '#F59E0B' : 'none'} color={n <= reviewForm.rating ? '#F59E0B' : '#94A3B8'} /></button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea className="form-input" rows={3} placeholder="Tell others about your experience..." value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Submit Review</button>
        </form>
      </div>
    </div>
  )
}

{/* Complaint Modal */ }
{
  showComplaintForm && (
    <div className="modal-overlay" onClick={() => setShowComplaintForm(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header"><h2><AlertTriangle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Submit Complaint</h2><button className="modal-close" onClick={() => setShowComplaintForm(false)}>×</button></div>
        <form onSubmit={handleComplaint}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={complaintForm.subject} onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })} placeholder="Brief subject" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} placeholder="Describe the issue in detail..." required />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Submit Complaint</button>
        </form>
      </div>
    </div>
  )
}
    </div >
  );
}
