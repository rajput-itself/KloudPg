'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Check, AlertTriangle, CheckCircle, User, Building2, Calendar } from 'lucide-react';

const STATUS_COLOR = { open: '#ef4444', in_progress: 'var(--warning)', resolved: 'var(--success)', closed: 'var(--text-muted)' };

export default function AdminComplaintsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) fetchComplaints();
  }, [user, authLoading]);

  const fetchComplaints = async () => {
    const res = await authFetch('/api/admin/complaints');
    const data = await res.json();
    setComplaints(data.complaints || []);
    setLoading(false);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSaving(true);
    await authFetch('/api/admin/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id: selected.id, status: newStatus, admin_response: responseText }),
    });
    setSelected(null);
    setResponseText('');
    setSaving(false);
    fetchComplaints();
  };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div><h1><AlertTriangle size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Complaint Handling</h1><p className="dashboard-welcome">{complaints.filter(c => c.status === 'open').length} open complaints</p></div>
        <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
      </div>

      {complaints.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><CheckCircle size={48} /></div><h3>No Complaints</h3><p>All clear!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complaints.map(c => (
            <div key={c.id} style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: `1px solid ${c.status === 'open' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700 }}>{c.subject}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLOR[c.status]}20`, color: STATUS_COLOR[c.status], fontWeight: 700 }}>{c.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', marginBottom: '6px' }}>{c.description}</p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span><User size={12} /> {c.user_name} ({c.user_email})</span>
                    {c.pg_name && <span><Building2 size={12} /> {c.pg_name}</span>}
                    <span><Calendar size={12} /> {new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                {c.status === 'open' || c.status === 'in_progress' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => { setSelected(c); setResponseText(c.admin_response || ''); setNewStatus('resolved'); }}>
                    <Check size={14} /> Respond
                  </button>
                ) : null}
              </div>
              {c.admin_response && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', borderLeft: '3px solid var(--primary)', marginTop: '8px' }}>
                  <strong>Your response:</strong> {c.admin_response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header"><h2>Respond to Complaint</h2><button className="modal-close" onClick={() => setSelected(null)}>×</button></div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontStyle: 'italic' }}>"{selected.description}"</p>
            <form onSubmit={handleResolve}>
              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Response</label>
                <textarea className="form-input" rows={4} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Your response to the user..." required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Saving...' : 'Save Response'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
