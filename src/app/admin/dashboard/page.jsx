'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Users, Building2, BookOpen, BarChart2, AlertTriangle, Hourglass, ClipboardList, Banknote, ShieldAlert, Star, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) {
      authFetch('/api/admin/stats').then(r => r.json()).then(d => {
        setStats(d.stats);
        setRecentBookings(d.recentBookings || []);
        setLoading(false);
      });
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;
  if (!user || user.role !== 'admin') return null;

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.users, icon: <Users size={24} />, color: 'var(--primary)', link: '/admin/users' },
    { label: 'Total PGs', value: stats?.pgs, icon: <Building2 size={24} />, color: '#10b981', link: '/admin/pgs' },
    { label: 'Pending Approval', value: stats?.pgsPending, icon: <Hourglass size={24} />, color: 'var(--warning)', link: '/admin/pgs?approved=0' },
    { label: 'Total Bookings', value: stats?.bookings, icon: <ClipboardList size={24} />, color: '#0284C7', link: '/admin/bookings' },
    { label: 'Pending Bookings', value: stats?.bookingsPending, icon: <AlertTriangle size={24} />, color: '#D97706', link: '/admin/bookings?status=pending' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <Banknote size={24} />, color: '#0891B2', link: '/admin/bookings' },
    { label: 'Open Complaints', value: stats?.openComplaints, icon: <ShieldAlert size={24} />, color: '#DC2626', link: '/admin/complaints' },
    { label: 'Avg Rating', value: stats?.avgRating, icon: <Star size={24} />, color: '#F59E0B', link: '/admin/pgs' },
  ];

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-welcome">System overview, {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/users" className="btn btn-ghost btn-sm"><Users size={16} /> Users</Link>
          <Link href="/admin/pgs" className="btn btn-ghost btn-sm"><Building2 size={16} /> PGs</Link>
          <Link href="/admin/bookings" className="btn btn-ghost btn-sm"><BookOpen size={16} /> Bookings</Link>
          <Link href="/admin/complaints" className="btn btn-primary btn-sm"><AlertTriangle size={16} /> Complaints</Link>
          <Link href="/admin/reports" className="btn btn-ghost btn-sm"><BarChart2 size={16} /> Reports</Link>
        </div>
      </div>

      {/* Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {STAT_CARDS.map(card => (
          <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, marginBottom: '4px' }}>{card.value ?? '-'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Approve PG Listings', href: '/admin/pgs', icon: <CheckCircle size={20} />, desc: `${stats?.pgsPending || 0} pending` },
          { label: 'Manage Users', href: '/admin/users', icon: <Users size={20} />, desc: `${stats?.users || 0} total users` },
          { label: 'Resolve Complaints', href: '/admin/complaints', icon: <AlertTriangle size={20} />, desc: `${stats?.openComplaints || 0} open` },
          { label: 'Monitor Bookings', href: '/admin/bookings', icon: <ClipboardList size={20} />, desc: `${stats?.bookingsPending || 0} pending` },
          { label: 'Generate Reports', href: '/admin/reports', icon: <BarChart2 size={20} />, desc: 'Export performance CSV' },
        ].map(a => (
          <Link key={a.label} href={a.href} style={{
            display: 'block', padding: '16px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{a.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>{a.label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent booking activity */}
      {recentBookings.length > 0 && (
        <>
          <h2 style={{ marginBottom: '16px' }}>Bookings (Last 7 Days)</h2>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
              {recentBookings.map(r => {
                const max = Math.max(...recentBookings.map(x => x.count));
                const pct = max > 0 ? (r.count / max) * 100 : 0;
                return (
                  <div key={r.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.count}</div>
                    <div style={{ width: '100%', height: `${Math.max(pct, 8)}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s' }} />
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{r.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
