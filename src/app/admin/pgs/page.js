'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle, XCircle, Building2, Hourglass, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminPGsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pgs, setPgs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) fetch('all');
  }, [user, authLoading]);

  const fetch = async (f) => {
    setFilter(f);
    const params = f === 'pending' ? '?approved=0' : f === 'approved' ? '?approved=1' : '';
    const res = await authFetch(`/api/admin/pgs${params}`);
    const data = await res.json();
    setPgs(data.pgs || []);
    setLoading(false);
  };

  const approve = async (id, val) => {
    setActionId(id);
    await authFetch(`/api/pgs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_approved: val }) });
    setActionId(null);
    fetch(filter);
  };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div><h1><Building2 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> PG Listings Control</h1><p className="dashboard-welcome">Approve or reject PG listings submitted by owners</p></div>
        <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </div>

      <div className="module-tabs">
        {[['all', 'All'], ['pending', <><Hourglass size={14} /> Pending</>], ['approved', <><CheckCircle size={14} /> Approved</>]].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => fetch(v)}>{l}</button>
        ))}
      </div>

      {pgs.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><Building2 size={48} /></div><h3>No PGs Found</h3></div>
      ) : (
        <div className="responsive-table">
          <table className="rooms-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>PG Name</th><th>Owner</th><th>City</th><th>Price</th><th>Bookings</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pgs.map(pg => (
                <tr key={pg.id}>
                  <td>
                    <Link href={`/pgs/${pg.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>{pg.name}</Link>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pg.locality}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{pg.owner_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pg.owner_email}</div>
                  </td>
                  <td>{pg.city}</td>
                  <td style={{ fontSize: '0.85rem' }}>₹{pg.price_min?.toLocaleString('en-IN')}–{pg.price_max?.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'center' }}>{pg.booking_count}</td>
                  <td style={{ textAlign: 'center' }}><Star size={14} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle' }} /> {pg.rating?.toFixed(1)}</td>
                  <td>
                    <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '999px', background: pg.is_approved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: pg.is_approved ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                      {pg.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!pg.is_approved && (
                        <button className="btn btn-primary btn-sm" disabled={actionId === pg.id} onClick={() => approve(pg.id, 1)} id={`approve-pg-${pg.id}`}>
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {pg.is_approved && (
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} disabled={actionId === pg.id} onClick={() => approve(pg.id, 0)}>
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
