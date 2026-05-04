'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

const STATUS_COLOR = { pending: 'var(--warning)', confirmed: 'var(--success)', cancelled: '#ef4444', rejected: '#ef4444', visited: 'var(--text-muted)' };

export default function AdminBookingsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) fetchData(searchParams.get('status') || '');
  }, [user, authLoading, searchParams]);

  const fetchData = async (s) => {
    setFilter(s);
    const params = s ? `?status=${s}` : '';
    const res = await authFetch(`/api/admin/bookings${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setStats(data.stats || {});
    setLoading(false);
  };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div><h1><ClipboardList size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Booking Monitor</h1><p className="dashboard-welcome">Track all platform bookings</p></div>
        <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </div>

      <div className="dashboard-stats">
        {[['Total', stats.total], ['Pending', stats.pending], ['Confirmed', stats.confirmed], ['Cancelled', stats.cancelled]].map(([l, v]) => (
          <div key={l} className="dashboard-stat"><div className="dashboard-stat-value">{v ?? '-'}</div><div className="dashboard-stat-label">{l}</div></div>
        ))}
      </div>

      <div className="module-tabs">
        {[['', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['cancelled', 'Cancelled']].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => fetchData(v)}>{l}</button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><ClipboardList size={48} /></div><h3>No Bookings Found</h3></div>
      ) : (
        <div className="responsive-table">
          <table className="rooms-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>#</th><th>PG</th><th>Customer</th><th>Owner</th><th>Room</th><th>Visit Date</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{b.id}</td>
                  <td>
                    <Link href={`/pgs/${b.pg_id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>{b.pg_name}</Link>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.city}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.user_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{b.owner_name}</td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{b.room_type || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{b.visit_date || '—'}</td>
                  <td>
                    <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLOR[b.status]}20`, color: STATUS_COLOR[b.status], fontWeight: 700 }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
