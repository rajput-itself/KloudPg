'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { MessageSquare, Home } from 'lucide-react';

export default function ChatInboxPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      authFetch('/api/messages').then(r => r.json()).then(d => { setThreads(d.threads || []); setLoading(false); });
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="chat-shell">
        <h1 style={{ marginBottom: '24px' }}>Messages</h1>
        {threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MessageSquare size={48} /></div>
            <h3>No Conversations Yet</h3>
            <p>Start a conversation by visiting a PG and clicking &quot;Chat with Owner&quot;.</p>
            <Link href="/pgs" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse PGs</Link>
          </div>
        ) : (
          <div className="chat-thread-list">
            {threads.map((t, i) => (
              <Link
                key={`${t.pg_id}-${i}`}
                href={`/chat/${t.pg_id}`}
                className="chat-thread-card"
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0
                }}>
                  <Home size={24} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{t.pg_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2px' }}>{t.other_user_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {t.last_message || 'No messages yet'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {new Date(t.last_message_time).toLocaleDateString('en-IN')}
                  </div>
                  {t.unread_count > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff', borderRadius: '999px',
                      padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700
                    }}>{t.unread_count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
