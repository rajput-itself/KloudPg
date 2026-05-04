'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { BarChart2, Download, FileText, Star, Banknote, CreditCard, Building2 } from 'lucide-react';

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function AdminReportsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState('30d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.push('/login'); return; }
    if (user) fetchReport(range);
  }, [user, authLoading, range]);

  const fetchReport = async (nextRange) => {
    setLoading(true);
    const res = await authFetch(`/api/admin/reports?range=${nextRange}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  const bookingTotal = useMemo(() => (report?.bookingStatus || []).reduce((sum, item) => sum + item.count, 0), [report]);
  const complaintTotal = useMemo(() => (report?.complaintStatus || []).reduce((sum, item) => sum + item.count, 0), [report]);

  const downloadReport = () => {
    if (!report) return;
    const rows = [
      ['Section', 'Label', 'Value', 'Extra'],
      ['Summary', 'Revenue', report.summary.revenue, `Range ${report.range}`],
      ['Summary', 'Payments', report.summary.payments, ''],
      ['Summary', 'Reviews', report.summary.reviews, `Average ${report.summary.avgRating}`],
      ...report.usersByRole.map((item) => ['Users by role', item.label, item.count, '']),
      ...report.pgsByCity.map((item) => ['PGs by city', item.city, item.count, `${item.approved} approved`]),
      ...report.bookingStatus.map((item) => ['Booking status', item.label, item.count, '']),
      ...report.complaintStatus.map((item) => ['Complaint status', item.label, item.count, '']),
      ...report.topPgs.map((item) => ['Top PGs', item.name, item.booking_count, item.city]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `kloudpg-admin-report-${report.range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1><BarChart2 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Reports</h1>
          <p className="dashboard-welcome">Track platform performance and export admin reports</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">Back</Link>
          <button className="btn btn-primary btn-sm" onClick={downloadReport}><Download size={15} /> Export CSV</button>
        </div>
      </div>

      <div className="module-tabs">
        {[['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']].map(([value, label]) => (
          <button key={value} className={`btn btn-sm ${range === value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRange(value)}>{label}</button>
        ))}
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat"><Banknote size={20} color="var(--primary)" /><div className="dashboard-stat-value">₹{(report?.summary?.revenue || 0).toLocaleString('en-IN')}</div><div className="dashboard-stat-label">Revenue in range</div></div>
        <div className="dashboard-stat"><CreditCard size={20} color="var(--success)" /><div className="dashboard-stat-value">{report?.summary?.payments ?? 0}</div><div className="dashboard-stat-label">Completed payments</div></div>
        <div className="dashboard-stat"><FileText size={20} color="var(--warning)" /><div className="dashboard-stat-value">{bookingTotal}</div><div className="dashboard-stat-label">Total bookings</div></div>
        <div className="dashboard-stat"><Star size={20} color="#f59e0b" /><div className="dashboard-stat-value">{report?.summary?.avgRating ?? 0}</div><div className="dashboard-stat-label">Average rating</div></div>
      </div>

      <div className="admin-report-grid">
        <section className="admin-report-panel">
          <h2>Booking Status</h2>
          {(report?.bookingStatus || []).map((item) => (
            <div key={item.label} className="admin-report-row">
              <span>{item.label || 'unknown'}</span>
              <strong>{item.count}</strong>
              <div className="admin-report-bar"><span style={{ width: `${percent(item.count, bookingTotal)}%` }} /></div>
            </div>
          ))}
        </section>

        <section className="admin-report-panel">
          <h2>Complaint Status</h2>
          {(report?.complaintStatus || []).map((item) => (
            <div key={item.label} className="admin-report-row">
              <span>{item.label || 'unknown'}</span>
              <strong>{item.count}</strong>
              <div className="admin-report-bar danger"><span style={{ width: `${percent(item.count, complaintTotal)}%` }} /></div>
            </div>
          ))}
        </section>
      </div>

      <div className="admin-report-grid">
        <section className="admin-report-panel">
          <h2>PGs by City</h2>
          <div className="responsive-table">
            <table className="rooms-table">
              <thead><tr><th>City</th><th>Total PGs</th><th>Approved</th></tr></thead>
              <tbody>{(report?.pgsByCity || []).map((item) => <tr key={item.city}><td>{item.city}</td><td>{item.count}</td><td>{item.approved}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="admin-report-panel">
          <h2>Top PGs</h2>
          {(report?.topPgs || []).length === 0 ? (
            <div className="empty-state"><Building2 size={36} /><h3>No booking data</h3></div>
          ) : (
            (report?.topPgs || []).map((pg) => (
              <Link key={pg.pg_id} href={`/pgs/${pg.pg_id}`} className="admin-report-list-item">
                <span><strong>{pg.name}</strong><small>{pg.city}</small></span>
                <b>{pg.booking_count}</b>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
