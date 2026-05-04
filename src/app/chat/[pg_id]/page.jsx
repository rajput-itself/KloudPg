'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const { pg_id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pgName, setPgName] = useState('');
  const [pgOwnerId, setPgOwnerId] = useState(null);
  const [otherUserId, setOtherUserId] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user, authLoading, pg_id, searchParams.toString()]);

  const fetchMessages = async () => {
    try {
      const otherId = searchParams.get('other_user_id');
      setOtherUserId(otherId ? parseInt(otherId, 10) : null);
      const query = `/api/messages?pg_id=${pg_id}${otherId ? `&other_user_id=${otherId}` : ''}`;
      const res = await authFetch(query);
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.pg_name) setPgName(data.pg_name);
      if (data.pg_owner_id) setPgOwnerId(data.pg_owner_id);
      if (data.other_user_id) setOtherUserId(data.other_user_id);
      if (data.other_user_name) setOtherUserName(data.other_user_name);
    } catch {} 
    finally { setLoading(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const payload = { pg_id: parseInt(pg_id, 10), content: input };
      if (otherUserId && otherUserId !== user.id) {
        payload.receiver_id = otherUserId;
      }
      await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setInput('');
      fetchMessages();
    } catch {} 
    finally { setSending(false); }
  };

  if (authLoading || loading) {
    return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;
  }

  return (
    <div className="container dashboard">
      <div className="chat-shell">
        <div className="chat-header">
          <Link href="/chat" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1 style={{ fontSize: '1.3rem', margin: 0 }}>{pgName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Chat with {user?.id === pgOwnerId ? 'Tenant' : 'PG Owner'}{otherUserName ? ` · ${otherUserName}` : ''}
            </p>
          </div>
        </div>

        {/* Message thread */}
        <div className="chat-messages" id="chat-messages">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '8px' }}><MessageSquare size={48} /></div>
              <p>No messages yet.<br />Send the first message to start the conversation!</p>
            </div>
          ) : messages.map(msg => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`chat-message-row ${isMine ? 'is-mine' : ''}`}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: isMine ? '#fff' : 'var(--text-primary)',
                }}>
                  {!isMine && <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', opacity: 0.7 }}>{msg.sender_name}</div>}
                  <div style={{ fontSize: '0.9rem' }}>{msg.content}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: '4px', textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="chat-compose">
          <input
            className="form-input"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            id="chat-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()} id="chat-send">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
