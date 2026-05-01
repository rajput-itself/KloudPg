'use client';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';
import { LogIn, UserPlus, LogOut, Menu, X, Bell, MessageSquare, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout, loading, authFetch } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread notifications every 30 seconds
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchCount = () => {
      authFetch('/api/notifications')
        .then(r => r.json())
        .then(d => setUnreadCount(d.unreadCount || 0))
        .catch(() => { });
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="nav-logo">
          <img src="/logo.png" alt="KloudPg" style={{ height: '60px', width: 'auto' }} />
        </Link>

        <ul className={`nav-links${mobileOpen ? ' mobile-open' : ''}`}>
          <li><Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setMobileOpen(false)}>Home</Link></li>
          <li><Link href="/pgs" className={pathname.startsWith('/pgs') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Browse PGs</Link></li>
          {user && user.role === 'owner' && (
            <li><Link href="/owner/dashboard" className={pathname.startsWith('/owner') ? 'active' : ''} onClick={() => setMobileOpen(false)}>My Listings</Link></li>
          )}
          {user && user.role === 'admin' && (
            <li><Link href="/admin/dashboard" className={pathname.startsWith('/admin') ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Admin
            </Link></li>
          )}
          {user && (
            <li><Link href="/chat" className={pathname.startsWith('/chat') ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              <MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Messages
            </Link></li>
          )}
        </ul>

        <div className="nav-actions">
          {loading ? null : user ? (
            <>
              {/* Notification Bell */}
              <Link href="/notifications" className="btn btn-ghost btn-sm" style={{ position: 'relative' }} title="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff', borderRadius: '999px',
                    fontSize: '0.65rem', fontWeight: 700, minWidth: '16px', height: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link href="/profile" className="nav-user">
                <div className="nav-user-avatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.name?.charAt(0).toUpperCase()}
                </div>
                <span>{user.name?.split(' ')[0]}</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                <LogIn size={16} />
                <span className="icon-label">Login</span>
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                <span className="icon-label">Sign Up</span>
              </Link>
            </>
          )}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
