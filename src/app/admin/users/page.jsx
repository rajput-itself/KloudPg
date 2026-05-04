'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ShieldOff, ShieldCheck, Search, Users } from 'lucide-react';
import Link from 'next/link';

const ROLE_COLORS = { student: '#0A66C2', owner: '#16A34A', admin: '#DC2626' };

export default function AdminUsersPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) fetch();
  }, [user, authLoading]);

  const fetch = async (s = search, r = role) => {
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (r) params.set('role', r);
    const res = await authFetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setStats(data.stats || {});
    setLoading(false);
  };

  const toggleBlock = async (uid, blocked) => {
    setActionId(uid);
    await authFetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, is_blocked: !blocked }) });
    setActionId(null);
    fetch();
  };

  const handleSearch = (e) => { e.preventDefault(); fetch(search, role); };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div><h1><Users size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> User Management</h1><p className="dashboard-welcome">View and manage all registered users</p></div>
        <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">← Admin Dashboard</Link>
      </div>

      <div className="dashboard-stats">
        {[['Total Users', stats.total], ['Students', stats.students], ['Owners', stats.owners], ['Blocked', stats.blocked]].map(([l, v]) => (
          <div key={l} className="dashboard-stat"><div className="dashboard-stat-value">{v ?? '-'}</div><div className="dashboard-stat-label">{l}</div></div>
        ))}
      </div>

      <form onSubmit={handleSearch} className="admin-toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} id="user-search" />
        </div>
        <select className="form-select" style={{ width: '140px' }} value={role} onChange={e => { setRole(e.target.value); fetch(search, e.target.value); }}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="owner">Owner</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="responsive-table">
        <table className="rooms-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Bookings</th><th>Reviews</th><th>Joined</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ opacity: u.is_blocked ? 0.55 : 1 }}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '999px', background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role], fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span></td>
                <td>{u.city || '—'}</td>
                <td style={{ textAlign: 'center' }}>{u.booking_count}</td>
                <td style={{ textAlign: 'center' }}>{u.review_count}</td>
                <td style={{ fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td><span style={{ fontSize: '0.78rem', color: u.is_blocked ? '#ef4444' : 'var(--success)', fontWeight: 700 }}>{u.is_blocked ? 'Blocked' : 'Active'}</span></td>
                <td>
                  <button
                    className={`btn btn-sm ${u.is_blocked ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ color: u.is_blocked ? undefined : '#ef4444', fontSize: '0.8rem' }}
                    disabled={actionId === u.id || u.role === 'admin'}
                    onClick={() => toggleBlock(u.id, u.is_blocked)}
                    id={`block-user-${u.id}`}
                  >
                    {u.is_blocked ? <><ShieldCheck size={13} /> Unblock</> : <><ShieldOff size={13} /> Block</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
