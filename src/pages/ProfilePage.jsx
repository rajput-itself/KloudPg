import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Home,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const tabs = [
  { id: 'details', label: 'Profile', icon: User },
  { id: 'bookings', label: 'My Bookings', icon: Calendar },
  { id: 'saved', label: 'Saved PGs', icon: Bookmark },
  { id: 'password', label: 'Change Password', icon: Lock },
];

const statusColor = {
  pending: 'var(--warning)',
  confirmed: 'var(--success)',
  cancelled: 'var(--danger)',
  rejected: 'var(--danger)',
  visited: 'var(--text-muted)',
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
}

function PgImage({ src }) {
  if (src && !src.startsWith('gradient:')) {
    return <img src={src} alt="" />;
  }

  return (
    <div className="gradient-bg" style={{ background: 'linear-gradient(135deg, #0A66C2, #38BDF8)' }}>
      <Home size={24} color="rgba(255,255,255,0.72)" />
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const hasLoadedProfileRef = useRef(false);
  const { user, loading: authLoading, authFetch, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [savedPgs, setSavedPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar_url: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && !hasLoadedProfileRef.current) {
      hasLoadedProfileRef.current = true;
      fetchProfileData();
    }
  }, [user, authLoading]);

  const stats = useMemo(() => ({
    bookings: bookings.length,
    saved: savedPgs.length,
    confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
  }), [bookings, savedPgs]);

  async function fetchProfileData() {
    setLoading(true);
    setError('');

    try {
      const [profileRes, bookingsRes, savedRes] = await Promise.all([
        authFetch('/api/profile'),
        authFetch('/api/bookings'),
        authFetch('/api/saved-pgs'),
      ]);

      if (profileRes.status === 401) {
        navigate('/login');
        return;
      }

      const [profileData, bookingsData, savedData] = await Promise.all([
        profileRes.json(),
        bookingsRes.json(),
        savedRes.json(),
      ]);

      if (!profileRes.ok || !bookingsRes.ok || !savedRes.ok) {
        setError(profileData.error || bookingsData.error || savedData.error || 'Could not load your profile right now.');
        return;
      }

      const nextProfile = profileData.user || user;
      setProfile(nextProfile);
      setProfileForm({
        name: nextProfile.name || '',
        phone: nextProfile.phone || '',
        avatar_url: nextProfile.avatar_url || '',
      });
      setBookings(bookingsData.bookings || []);
      setSavedPgs(savedData.savedPgs || []);
      updateUser(nextProfile);
    } catch (err) {
      setError('Could not load your profile right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Profile update failed.');
        return;
      }

      const updatedProfile = { ...(profile || user), ...profileForm };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError('Profile update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('images', file);
      const uploadRes = await authFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error || 'Image upload failed.');
        return;
      }

      const avatarUrl = uploadData.urls?.[0];
      const nextForm = { ...profileForm, avatar_url: avatarUrl };
      setProfileForm(nextForm);

      const saveRes = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        setError(saveData.error || 'Could not save profile picture.');
        return;
      }

      const updatedProfile = { ...(profile || user), avatar_url: avatarUrl };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setMessage('Profile picture updated.');
    } catch (err) {
      setError('Image upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      setSaving(false);
      return;
    }

    try {
      const res = await authFetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Password change failed.');
        return;
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(data.message || 'Password changed successfully.');
    } catch (err) {
      setError('Password change failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSaved(pgId) {
    setError('');
    const previous = savedPgs;
    setSavedPgs((items) => items.filter((pg) => pg.pg_id !== pgId));

    try {
      const res = await authFetch(`/api/saved-pgs/${pgId}`, { method: 'DELETE' });
      if (!res.ok) {
        setSavedPgs(previous);
        setError('Could not remove the saved PG.');
      }
    } catch (err) {
      setSavedPgs(previous);
      setError('Could not remove the saved PG.');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (authLoading || loading || !user) {
    return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;
  }

  const displayProfile = profile || user;

  return (
    <div className="container dashboard profile-page">
      <div className="dashboard-header">
        <div>
          <h1>My Profile</h1>
          <p className="dashboard-welcome">Manage your account, bookings, and saved PGs.</p>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-summary">
            <button className="profile-avatar-button" type="button" onClick={() => fileInputRef.current?.click()}>
              {profileForm.avatar_url ? (
                <img src={profileForm.avatar_url} alt="" />
              ) : (
                <span>{initials(displayProfile.name)}</span>
              )}
              <span className="profile-avatar-camera"><Camera size={16} /></span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatarChange} />
            <h2>{displayProfile.name}</h2>
            <p>{displayProfile.email}</p>
            <button className="btn btn-secondary btn-sm" type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Camera size={14} /> {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div className="profile-stats">
            <div><strong>{stats.bookings}</strong><span>Bookings</span></div>
            <div><strong>{stats.saved}</strong><span>Saved</span></div>
            <div><strong>{stats.confirmed}</strong><span>Confirmed</span></div>
          </div>

          <nav className="profile-tabs" aria-label="Profile sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => { setActiveTab(id); setMessage(''); setError(''); }}>
                <Icon size={16} /> {label}
              </button>
            ))}
            <button type="button" className="danger" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        <section className="profile-content">
          {(message || error) && (
            <div className={`profile-alert ${error ? 'error' : 'success'}`}>
              {error || message}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2>Account Details</h2>
                  <p>Name, profile picture, phone, and email.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-name">Name</label>
                    <div className="profile-input-icon"><User size={16} /><input id="profile-name" className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required /></div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-phone">Phone</label>
                    <div className="profile-input-icon"><Phone size={16} /><input id="profile-phone" className="form-input" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Add phone number" /></div>
                  </div>
                  <div className="form-group profile-form-full">
                    <label className="form-label" htmlFor="profile-email">Email</label>
                    <div className="profile-input-icon"><Mail size={16} /><input id="profile-email" className="form-input" value={displayProfile.email || ''} disabled /></div>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2>My Bookings</h2>
                  <p>All visit requests and booking activity.</p>
                </div>
                <Link to="/pgs" className="btn btn-primary btn-sm">Browse PGs</Link>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><Calendar size={48} /></div><h3>No Bookings Yet</h3><p>Book a visit from a PG listing and it will appear here.</p></div>
              ) : (
                <div className="profile-list">
                  {bookings.map((booking) => (
                    <article key={booking.id} className="profile-list-item">
                      <div className="booking-item-image"><PgImage src={booking.image_url} /></div>
                      <div className="profile-list-info">
                        <h3>{booking.pg_name || 'PG Booking'}</h3>
                        <p><MapPin size={14} /> {[booking.locality, booking.city].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                        <p><Clock size={14} /> {booking.visit_date ? `Visit on ${booking.visit_date}` : `Requested ${new Date(booking.created_at).toLocaleDateString('en-IN')}`}</p>
                      </div>
                      <div className="profile-list-actions">
                        <span className="badge" style={{ color: statusColor[booking.status] || 'var(--text-muted)' }}>{booking.status}</span>
                        <Link to={`/pgs/${booking.pg_id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2>Saved PGs</h2>
                  <p>Shortlisted PGs you want to revisit.</p>
                </div>
                <Link to="/pgs" className="btn btn-primary btn-sm">Find More</Link>
              </div>

              {savedPgs.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><Bookmark size={48} /></div><h3>No Saved PGs</h3><p>Save PGs while browsing to build your shortlist.</p></div>
              ) : (
                <div className="profile-list">
                  {savedPgs.map((pg) => (
                    <article key={pg.saved_id || pg.pg_id} className="profile-list-item">
                      <div className="booking-item-image"><PgImage src={pg.image_url} /></div>
                      <div className="profile-list-info">
                        <h3>{pg.pg_name}</h3>
                        <p><MapPin size={14} /> {[pg.locality, pg.city].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                        <p><CheckCircle size={14} /> {pg.gender_type ? `${pg.gender_type} PG` : 'Saved PG'}</p>
                      </div>
                      <div className="profile-list-actions">
                        <Link to={`/pgs/${pg.pg_id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                        <button className="btn btn-ghost btn-sm danger-text" type="button" onClick={() => handleRemoveSaved(pg.pg_id)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2>Change Password</h2>
                  <p>Update the password used to sign in.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="profile-password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="current-password">Current Password</label>
                  <input id="current-password" className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <input id="new-password" className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} minLength={6} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input id="confirm-password" className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} minLength={6} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  <Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
