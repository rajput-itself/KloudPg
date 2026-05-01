'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Bell, Check, ClipboardList, CreditCard, Star, X, Banknote, MessageSquare, Info } from 'lucide-react';
import Link from 'next/link';

const TYPE_ICONS = {
  booking: <ClipboardList size={20} />,
  payment: <CreditCard size={20} />,
  review: <Star size={20} />,
  cancellation: <X size={20} />,
  refund: <Banknote size={20} />,
  chat: <MessageSquare size={20} />,
  info: <Info size={20} />,
};

export default function NotificationsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchNotifications();
  }, [user, authLoading]);

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {} finally { setLoading(false); }
  };

  const markAllRead = async () => {
    await authFetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const markRead = async (id) => {
    await authFetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container dashboard">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1>Notifications</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{unread} unread</p>
          </div>
          {unread > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAllRead} id="mark-all-read">
              <Check size={16} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={48} /></div>
            <h3>No Notifications</h3>
            <p>You&apos;ll see booking updates, payment alerts, and more here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  display: 'flex', gap: '14px', padding: '16px',
                  background: n.is_read ? 'var(--bg-card)' : 'rgba(var(--primary-rgb),0.07)',
                  borderRadius: 'var(--radius-md)', border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(10,102,194,0.25)'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                }}>
                  {TYPE_ICONS[n.type] || <Bell size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 500 : 700, marginBottom: '3px' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: '6px' }}>{n.message}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </span>
                    {n.link && (
                      <Link href={n.link} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem', padding: '3px 8px' }}
                        onClick={e => e.stopPropagation()}>
                        View →
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '5px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
